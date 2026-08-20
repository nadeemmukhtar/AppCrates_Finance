<?php

namespace App\Contracts\Repositories;

use App\Models\LedgerEntry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface LedgerRepositoryInterface
{
    public function recordTransaction(array $data): LedgerEntry;

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(array $filters): array;

    public function getAccountBalanceStats(int $accountId, array $filters): array;

    public function findWithRelations(int $id): ?LedgerEntry;

    public function getExportData(array $filters): Collection;
}
