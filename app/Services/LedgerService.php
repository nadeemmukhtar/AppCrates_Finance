<?php

namespace App\Services;

use App\Contracts\Repositories\LedgerRepositoryInterface;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class LedgerService
{
    public function __construct(
        protected LedgerRepositoryInterface $ledgerRepository
    ) {}

    public function recordEntry(
        Model $model,
        string $reference,
        string $transactionDate,
        ?int $accountId,
        float $debit,
        float $credit,
        string $transactionType,
        string $description,
        ?User $user = null
    ): LedgerEntry {
        return $this->ledgerRepository->recordTransaction([
            'reference' => $reference,
            'transaction_date' => $transactionDate,
            'account_id' => $accountId,
            'debit' => $debit,
            'credit' => $credit,
            'transaction_type' => $transactionType,
            'reference_type' => get_class($model),
            'reference_id' => $model->getKey(),
            'description' => $description,
            'created_by' => $user?->id,
        ]);
    }
}
