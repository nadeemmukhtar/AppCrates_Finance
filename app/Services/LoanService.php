<?php

namespace App\Services;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class LoanService
{
    public function __construct(
        protected LoanRepositoryInterface $loanRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LedgerService $ledgerService
    ) {}

    public function generateReference(): string
    {
        $year = date('Y');
        $latest = Loan::whereYear('created_at', $year)->latest('id')->first();
        $nextNumber = $latest ? ((int) substr($latest->reference, -4)) + 1 : 1;

        return sprintf('LN-%s-%04d', $year, $nextNumber);
    }

    public function createLoan(array $data, User $user): Loan
    {
        return DB::transaction(function () use ($data, $user) {
            $reference = $this->generateReference();
            $originalAmount = (float) $data['original_amount'];
            $interestRate = (float) ($data['interest_rate'] ?? 0);
            $interestAmount = (float) ($data['interest_amount'] ?? 0);

            if ($interestRate > 0 && $interestAmount <= 0) {
                $interestAmount = round(($originalAmount * $interestRate) / 100, 2);
            }

            $attachmentPath = null;
            $mediaId = null;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $loan = $this->loanRepository->create([
                'reference' => $reference,
                'user_id' => $user->id,
                'lender_id' => $data['lender_id'],
                'loan_date' => $data['loan_date'],
                'original_amount' => $originalAmount,
                'interest_rate' => $interestRate,
                'interest_amount' => $interestAmount,
                'due_date' => $data['due_date'] ?? null,
                'payment_frequency' => $data['payment_frequency'] ?? 'one_time',
                'purpose' => $data['purpose'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachment_path' => $attachmentPath,
                'media_id' => $mediaId,
                'destination_account_id' => $data['destination_account_id'] ?? null,
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            if (! empty($data['destination_account_id'])) {
                $accountId = (int) $data['destination_account_id'];

                // 1. Double-Entry Ledger: Debit Cash/Bank Account, Credit Loan Liability
                $this->ledgerService->recordEntry(
                    model: $loan,
                    reference: $reference,
                    transactionDate: $data['loan_date'],
                    accountId: $accountId,
                    debit: $originalAmount,
                    credit: 0.00,
                    transactionType: 'loan_received',
                    description: "Loan received from lender (Ref: {$reference}). Added to cash/bank liability.",
                    user: $user
                );

                // 2. Company Balance Integration: Increase Cash/Bank balance
                $this->accountRepository->updateBalance($accountId, $originalAmount, 'add');
            }

            return $loan;
        });
    }

    public function cancelLoan(Loan $loan, string $reason, User $user): bool
    {
        if ($loan->activePayments()->count() > 0) {
            throw new \InvalidArgumentException('Cannot cancel a loan that has active repayments recorded.');
        }

        return DB::transaction(function () use ($loan, $reason, $user) {
            if ($loan->destination_account_id) {
                // Reverse account balance addition
                $this->accountRepository->updateBalance($loan->destination_account_id, (float) $loan->original_amount, 'subtract');

                // Record cancellation ledger entry
                $this->ledgerService->recordEntry(
                    model: $loan,
                    reference: "CNL-{$loan->reference}",
                    transactionDate: now()->toDateString(),
                    accountId: $loan->destination_account_id,
                    debit: 0.00,
                    credit: (float) $loan->original_amount,
                    transactionType: 'loan_cancellation',
                    description: "Loan cancellation (Ref: {$loan->reference}). Reason: {$reason}",
                    user: $user
                );
            }

            return $this->loanRepository->cancel($loan, $user->id, $reason);
        });
    }
}
