<?php

namespace App\Services;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LoanPaymentRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class LoanPaymentService
{
    public function __construct(
        protected LoanPaymentRepositoryInterface $paymentRepository,
        protected LoanRepositoryInterface $loanRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LedgerService $ledgerService
    ) {}

    public function generateReference(): string
    {
        $year = date('Y');
        $latest = LoanPayment::whereYear('created_at', $year)->latest('id')->first();
        $nextNumber = $latest ? ((int) substr($latest->reference, -4)) + 1 : 1;

        return sprintf('REP-%s-%04d', $year, $nextNumber);
    }

    public function recordRepayment(Loan $loan, array $data, User $user): LoanPayment
    {
        if ($loan->status === 'cancelled') {
            throw new \InvalidArgumentException('Cannot record repayment for a cancelled loan.');
        }

        $remaining = $loan->remaining_balance;
        $amount = (float) $data['amount'];

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Repayment amount must be greater than zero.');
        }

        if ($amount > ($remaining + 0.01)) { // Allow 1-cent rounding buffer
            throw new \InvalidArgumentException(sprintf('Repayment amount (PKR %s) exceeds outstanding balance (PKR %s).', number_format($amount, 2), number_format($remaining, 2)));
        }

        return DB::transaction(function () use ($loan, $data, $user, $amount) {
            $reference = $this->generateReference();
            $accountId = (int) $data['account_id'];

            $attachmentPath = null;
            $mediaId = null;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $payment = $this->paymentRepository->create([
                'loan_id' => $loan->id,
                'reference' => $reference,
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'payment_method' => $data['payment_method'] ?? 'bank_transfer',
                'account_id' => $accountId,
                'transaction_reference' => $data['transaction_reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachment_path' => $attachmentPath,
                'media_id' => $mediaId,
                'created_by' => $user->id,
            ]);

            // 1. Double-Entry Ledger: Debit Loan Liability (reduces debt), Credit Cash/Bank (reduces cash/bank asset)
            $this->ledgerService->recordEntry(
                model: $payment,
                reference: $reference,
                transactionDate: $data['payment_date'],
                accountId: $accountId,
                debit: 0.00,
                credit: $amount,
                transactionType: 'loan_repayment',
                description: "Loan repayment against Loan {$loan->reference} (Ref: {$reference}).",
                user: $user
            );

            // 2. Reduce company cash/bank balance
            $this->accountRepository->updateBalance($accountId, $amount, 'subtract');

            // 3. Update loan status dynamically
            $loan->refresh();
            $newStatus = $loan->remaining_balance <= 0 ? 'fully_paid' : 'partially_paid';
            $this->loanRepository->updateStatus($loan, $newStatus);

            return $payment;
        });
    }

    public function reverseRepayment(LoanPayment $payment, string $reason, User $user): bool
    {
        if ($payment->is_reversed) {
            throw new \InvalidArgumentException('This repayment has already been reversed.');
        }

        return DB::transaction(function () use ($payment, $reason, $user) {
            // 1. Mark repayment as reversed
            $this->paymentRepository->markAsReversed($payment, $user->id, $reason);

            // 2. Refund company cash/bank account
            $this->accountRepository->updateBalance($payment->account_id, (float) $payment->amount, 'add');

            // 3. Post reversing ledger entry
            $this->ledgerService->recordEntry(
                model: $payment,
                reference: "REV-{$payment->reference}",
                transactionDate: now()->toDateString(),
                accountId: $payment->account_id,
                debit: (float) $payment->amount,
                credit: 0.00,
                transactionType: 'repayment_reversal',
                description: "Repayment reversal for {$payment->reference}. Reason: {$reason}",
                user: $user
            );

            // 4. Recalculate loan status
            $loan = $payment->loan->fresh();
            $newStatus = $loan->remaining_balance <= 0 ? 'fully_paid' : ($loan->total_repaid > 0 ? 'partially_paid' : 'active');
            $this->loanRepository->updateStatus($loan, $newStatus);

            return true;
        });
    }
}
