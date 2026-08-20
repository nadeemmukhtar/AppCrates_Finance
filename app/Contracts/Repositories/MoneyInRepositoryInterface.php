<?php

namespace App\Contracts\Repositories;

use App\Models\Client;
use App\Models\MoneyInTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface MoneyInRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(array $filters = []): array;

    public function findWithRelations(int $id): ?MoneyInTransaction;

    public function create(array $data): MoneyInTransaction;

    public function update(MoneyInTransaction $moneyIn, array $data): bool;

    public function void(MoneyInTransaction $moneyIn, int $voidedBy, string $reason): bool;

    public function generateReference(): string;

    public function getAllActiveCategories(): Collection;

    public function getAllClients(): Collection;

    public function findOrCreateClientByName(string $name, string $type = 'client', ?int $userId = null): Client;
}
