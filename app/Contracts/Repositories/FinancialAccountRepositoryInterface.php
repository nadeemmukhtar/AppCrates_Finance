<?php

namespace App\Contracts\Repositories;

use App\Models\FinancialAccount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface FinancialAccountRepositoryInterface
{
    public function allActive(): Collection;

    public function find(int $id): ?FinancialAccount;

    public function getPaginatedWithStats(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(): array;

    public function create(array $data): FinancialAccount;

    public function update(FinancialAccount $account, array $data): bool;

    public function toggleStatus(FinancialAccount $account): bool;

    public function delete(FinancialAccount $account): bool;

    public function updateBalance(int $id, float $amountChange, string $operation = 'add'): FinancialAccount;
}
