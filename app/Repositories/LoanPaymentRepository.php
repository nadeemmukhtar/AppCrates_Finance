<?php

namespace App\Repositories;

use App\Contracts\Repositories\LoanPaymentRepositoryInterface;
use App\Models\LoanPayment;

class LoanPaymentRepository implements LoanPaymentRepositoryInterface
{
    public function create(array $data): LoanPayment
    {
        return LoanPayment::create($data);
    }

    public function markAsReversed(LoanPayment $payment, int $userId, string $reason): bool
    {
        return $payment->update([
            'is_reversed' => true,
            'reversed_at' => now(),
            'reversed_by' => $userId,
            'reversal_reason' => $reason,
        ]);
    }
}
