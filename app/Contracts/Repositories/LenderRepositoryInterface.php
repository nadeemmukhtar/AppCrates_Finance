<?php

namespace App\Contracts\Repositories;

use App\Models\Lender;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface LenderRepositoryInterface
{
    public function all(): Collection;

    public function getPaginatedWithStats(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?Lender;

    public function create(array $data): Lender;

    public function update(Lender $lender, array $data): bool;

    public function delete(Lender $lender): bool;
}
