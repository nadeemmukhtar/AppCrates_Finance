<?php

namespace App\Contracts\Repositories;

use App\Models\LoanPayment;

interface LoanPaymentRepositoryInterface
{
    public function create(array $data): LoanPayment;

    public function markAsReversed(LoanPayment $payment, int $userId, string $reason): bool;
}
