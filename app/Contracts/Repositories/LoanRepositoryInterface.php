<?php

namespace App\Contracts\Repositories;

use App\Models\Loan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LoanRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(): array;

    public function findWithRelations(int $id): ?Loan;

    public function create(array $data): Loan;

    public function updateStatus(Loan $loan, string $status): bool;

    public function cancel(Loan $loan, int $userId, string $reason): bool;
}
