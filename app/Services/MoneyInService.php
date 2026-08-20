<?php

namespace App\Services;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\MoneyInRepositoryInterface;
use App\Models\MoneyInTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class MoneyInService
{
    public function __construct(
        protected MoneyInRepositoryInterface $moneyInRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LedgerService $ledgerService
    ) {}

    public function createMoneyIn(array $data, User $user): MoneyInTransaction
    {
        return DB::transaction(function () use ($data, $user) {
            $reference = $this->moneyInRepository->generateReference();
            $amount = (float) $data['amount'];
            $accountId = (int) $data['account_id'];

            $attachmentPath = null;
            $mediaId = null;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $clientType = $data['received_from_type'] ?? 'client';
            $client = $this->moneyInRepository->findOrCreateClientByName($data['received_from'], $clientType, $user->id);

            $moneyIn = $this->moneyInRepository->create([
                'reference' => $reference,
                'received_date' => $data['received_date'],
                'received_from' => $client->name,
                'received_from_type' => $clientType,
                'client_id' => $client->id,
                'category_id' => $data['category_id'],
                'account_id' => $accountId,
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

            // 1. Account Balance Integration: Increase Cash/Bank balance
            $this->accountRepository->updateBalance($accountId, $amount, 'add');

            // 2. Ledger Integration: Debit Cash/Bank Account, Credit Income/Revenue
            $this->ledgerService->recordEntry(
                model: $moneyIn,
                reference: $reference,
                transactionDate: $data['received_date'],
                accountId: $accountId,
                debit: $amount,
                credit: 0.00,
                transactionType: 'money_in',
                description: "Money In received from {$client->name} (Ref: {$reference}).",
                user: $user
            );

            return $moneyIn;
        });
    }

    public function updateMoneyIn(MoneyInTransaction $moneyIn, array $data, User $user): bool
    {
        if ($moneyIn->status === 'voided') {
            throw new \InvalidArgumentException('Voided transactions cannot be edited.');
        }

        return DB::transaction(function () use ($moneyIn, $data, $user) {
            $oldAccountId = (int) $moneyIn->account_id;
            $oldAmount = (float) $moneyIn->amount;

            $newAccountId = (int) $data['account_id'];
            $newAmount = (float) $data['amount'];

            // 1. Reverse previous account impact
            $this->accountRepository->updateBalance($oldAccountId, $oldAmount, 'subtract');

            // 2. Apply new account impact
            $this->accountRepository->updateBalance($newAccountId, $newAmount, 'add');

            $attachmentPath = $moneyIn->attachment_path;
            $mediaId = $moneyIn->media_id;
            if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
                $media = app(MediaService::class)->upload($data['attachment'], $user, $data['display_name'] ?? null);
                $mediaId = $media->id;
                $attachmentPath = $media->file_path;
            }

            $clientType = $data['received_from_type'] ?? $moneyIn->received_from_type;
            $client = $this->moneyInRepository->findOrCreateClientByName($data['received_from'], $clientType, $user->id);

            $updateData = [
                'received_date' => $data['received_date'],
                'received_from' => $client->name,
                'received_from_type' => $clientType,
                'client_id' => $client->id,
                'category_id' => $data['category_id'],
                'account_id' => $newAccountId,
                'payment_method' => $data['payment_method'],
                'amount' => $newAmount,
                'external_reference' => $data['external_reference'] ?? null,
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachment_path' => $attachmentPath,
                'media_id' => $mediaId,
                'updated_by' => $user->id,
            ];

            $this->moneyInRepository->update($moneyIn, $updateData);

            // 3. Post updated ledger entry reflecting the edit
            $this->ledgerService->recordEntry(
                model: $moneyIn,
                reference: "UPD-{$moneyIn->reference}",
                transactionDate: $data['received_date'],
                accountId: $newAccountId,
                debit: $newAmount,
                credit: 0.00,
                transactionType: 'money_in_edit',
                description: "Updated Money In transaction {$moneyIn->reference} (New Amount: PKR {$newAmount}).",
                user: $user
            );

            return true;
        });
    }

    public function voidMoneyIn(MoneyInTransaction $moneyIn, string $reason, User $user): bool
    {
        if ($moneyIn->status === 'voided') {
            throw new \InvalidArgumentException('Transaction is already voided.');
        }

        return DB::transaction(function () use ($moneyIn, $reason, $user) {
            $amount = (float) $moneyIn->amount;
            $accountId = (int) $moneyIn->account_id;

            // 1. Mark transaction as voided
            $this->moneyInRepository->void($moneyIn, $user->id, $reason);

            // 2. Reverse company account balance
            $this->accountRepository->updateBalance($accountId, $amount, 'subtract');

            // 3. Post reversing ledger entry
            $this->ledgerService->recordEntry(
                model: $moneyIn,
                reference: "VOID-{$moneyIn->reference}",
                transactionDate: now()->toDateString(),
                accountId: $accountId,
                debit: 0.00,
                credit: $amount,
                transactionType: 'money_in_void',
                description: "Voided Money In {$moneyIn->reference}. Reason: {$reason}",
                user: $user
            );

            return true;
        });
    }
}
