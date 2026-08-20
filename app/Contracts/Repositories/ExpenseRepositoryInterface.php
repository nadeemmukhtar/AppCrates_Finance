<?php

namespace App\Contracts\Repositories;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ExpenseRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(): array;

    public function generateReference(): string;

    public function getAllActiveCategories(): Collection;

    public function createCategory(array $data): ExpenseCategory;

    public function findCategoryByName(string $name): ?ExpenseCategory;

    public function createExpense(array $data): Expense;

    public function updateExpense(Expense $expense, array $data): bool;

    public function voidExpense(Expense $expense, string $reason, int $userId): Expense;

    public function findWithRelations(int $id): ?Expense;
}
