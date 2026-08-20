<?php

namespace App\Services;

use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ExpenseService
{
    public function __construct(
        protected ExpenseRepositoryInterface $expenseRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LedgerService $ledgerService
    ) {}

    public function createExpense(array $data, User $user): Expense
    {
        return DB::transaction(function () use ($data, $user) {
            $amount = round((float) $data['amount'], 2);

            if ($amount <= 0) {
                throw new InvalidArgumentException('Expense amount must be greater than zero.');
            }

            /** @var FinancialAccount $account */
            $account = FinancialAccount::where('id', $data['account_id'])
                ->lockForUpdate()
                ->first();

            if (! $account || ! $account->is_active) {
                throw new InvalidArgumentException('Selected company financial account is inactive or invalid.');
            }

            if ($account->current_balance < $amount) {
                throw new InvalidArgumentException("Insufficient balance in {$account->name}. Current balance: PKR {$account->current_balance}, required: PKR {$amount}.");
            }

            /** @var ExpenseCategory $category */
            $category = ExpenseCategory::findOrFail($data['category_id']);

            // Salary Separation Guardrail
            if (str_contains(strtolower($category->name), 'salary') || str_contains(strtolower($category->name), 'payroll')) {
                throw new InvalidArgumentException('Salary & Payroll payments must be recorded through the Employees & Salary module to prevent double counting.');
            }

            $attachmentPath = null;
            $mediaId = null;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $reference = $this->expenseRepository->generateReference();

            $expense = $this->expenseRepository->createExpense([
                'reference' => $reference,
                'expense_date' => $data['expense_date'],
                'category_id' => $category->id,
                'account_id' => $account->id,
                'payment_method' => $data['payment_method'],
                'amount' => $amount,
                'external_reference' => $data['external_reference'] ?? null,
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachment_path' => $attachmentPath,
                'media_id' => $mediaId,
                'status' => 'posted',
                'created_by' => $user->id,
            ]);

            // 1. Account Balance Integration: Deduct balance from company financial account
            $this->accountRepository->updateBalance($account->id, $amount, 'subtract');

            // 2. Ledger Integration: Debit Expense, Credit Cash/Bank Account
            $this->ledgerService->recordEntry(
                model: $expense,
                reference: $reference,
                transactionDate: $data['expense_date'],
                accountId: $account->id,
                debit: $amount,
                credit: 0.00,
                transactionType: 'expense',
                description: "Operating Expense {$reference} ({$category->name}): ".($data['description'] ?? 'No description'),
                user: $user
            );

            return $expense;
        });
    }

    public function updateExpense(Expense $expense, array $data, User $user): Expense
    {
        return DB::transaction(function () use ($expense, $data, $user) {
            if ($expense->status === 'voided') {
                throw new InvalidArgumentException("Voided expense {$expense->reference} cannot be edited.");
            }

            $oldAmount = (float) $expense->amount;
            $oldAccountId = (int) $expense->account_id;

            $newAmount = round((float) $data['amount'], 2);

            if ($newAmount <= 0) {
                throw new InvalidArgumentException('Expense amount must be greater than zero.');
            }

            /** @var FinancialAccount $newAccount */
            $newAccount = FinancialAccount::where('id', $data['account_id'])
                ->lockForUpdate()
                ->first();

            if (! $newAccount || ! $newAccount->is_active) {
                throw new InvalidArgumentException('Selected company financial account is inactive or invalid.');
            }

            /** @var ExpenseCategory $category */
            $category = ExpenseCategory::findOrFail($data['category_id']);

            // Salary Separation Guardrail
            if (str_contains(strtolower($category->name), 'salary') || str_contains(strtolower($category->name), 'payroll')) {
                throw new InvalidArgumentException('Salary & Payroll payments must be recorded through the Employees & Salary module to prevent double counting.');
            }

            // 1. Reverse old financial impact: restore old account balance
            $this->accountRepository->updateBalance($oldAccountId, $oldAmount, 'add');

            // Check if new account has sufficient balance after restoring old balance
            $newAccount->refresh();
            if ($newAccount->current_balance < $newAmount) {
                // Re-apply old balance before throwing
                $this->accountRepository->updateBalance($oldAccountId, $oldAmount, 'subtract');
                throw new InvalidArgumentException("Insufficient balance in {$newAccount->name}. Available: PKR {$newAccount->current_balance}, required: PKR {$newAmount}.");
            }

            // Attachment handling
            $attachmentPath = $expense->attachment_path;
            $mediaId = $expense->media_id;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $this->expenseRepository->updateExpense($expense, [
                'expense_date' => $data['expense_date'],
                'category_id' => $category->id,
                'account_id' => $newAccount->id,
                'payment_method' => $data['payment_method'],
                'amount' => $newAmount,
                'external_reference' => $data['external_reference'] ?? null,
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachment_path' => $attachmentPath,
                'media_id' => $mediaId,
                'updated_by' => $user->id,
            ]);

            // 2. Apply new financial impact: deduct new account balance
            $this->accountRepository->updateBalance($newAccount->id, $newAmount, 'subtract');

            // 3. Update Ledger Entry
            $ledgerEntry = $expense->ledgerEntries()->where('transaction_type', 'expense')->first();

            if ($ledgerEntry) {
                $ledgerEntry->update([
                    'transaction_date' => $data['expense_date'],
                    'account_id' => $newAccount->id,
                    'debit' => $newAmount,
                    'description' => "Operating Expense {$expense->reference} ({$category->name}): ".($data['description'] ?? 'No description'),
                ]);
            } else {
                $this->ledgerService->recordEntry(
                    model: $expense,
                    reference: $expense->reference,
                    transactionDate: $data['expense_date'],
                    accountId: $newAccount->id,
                    debit: $newAmount,
                    credit: 0.00,
                    transactionType: 'expense',
                    description: "Operating Expense {$expense->reference} ({$category->name}): ".($data['description'] ?? 'No description'),
                    user: $user
                );
            }

            return $expense->fresh();
        });
    }

    public function voidExpense(Expense $expense, string $reason, User $user): Expense
    {
        return DB::transaction(function () use ($expense, $reason, $user) {
            if ($expense->status === 'voided') {
                throw new InvalidArgumentException("Expense {$expense->reference} is already voided.");
            }

            $amount = (float) $expense->amount;

            $voidedExpense = $this->expenseRepository->voidExpense($expense, $reason, $user->id);

            // 1. Account Balance Integration: Restore company account balance
            if ($expense->account_id) {
                $this->accountRepository->updateBalance($expense->account_id, $amount, 'add');
            }

            // 2. Ledger Integration: Post reversing Credit entry
            $categoryName = $expense->category?->name ?? 'Expense';

            $this->ledgerService->recordEntry(
                model: $voidedExpense,
                reference: "REV-{$expense->reference}",
                transactionDate: now()->toDateString(),
                accountId: $expense->account_id,
                debit: 0.00,
                credit: $amount,
                transactionType: 'expense_reversal',
                description: "Reversal of operating expense {$expense->reference} ({$categoryName}). Reason: {$reason}",
                user: $user
            );

            return $voidedExpense;
        });
    }
}
