<?php

namespace App\Repositories;

use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class ExpenseRepository implements ExpenseRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Expense::query()->with(['category', 'account', 'creator', 'media']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('external_reference', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('expense_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('expense_date', '<=', $filters['end_date']);
        }

        if (isset($filters['min_amount']) && $filters['min_amount'] !== '') {
            $query->where('amount', '>=', (float) $filters['min_amount']);
        }

        if (isset($filters['max_amount']) && $filters['max_amount'] !== '') {
            $query->where('amount', '<=', (float) $filters['max_amount']);
        }

        return $query->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->paginate($perPage)->withQueryString();
    }

    public function getSummaryStats(): array
    {
        $today = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $postedExpenses = Expense::where('status', 'posted');

        $totalExpenses = (float) (clone $postedExpenses)->sum('amount');
        $expensesToday = (float) (clone $postedExpenses)->whereDate('expense_date', $today)->sum('amount');
        $expensesThisMonth = (float) (clone $postedExpenses)->whereBetween('expense_date', [$startOfMonth, $endOfMonth])->sum('amount');
        $totalCount = (clone $postedExpenses)->count();

        return [
            'total_expenses' => round($totalExpenses, 2),
            'expenses_today' => round($expensesToday, 2),
            'expenses_this_month' => round($expensesThisMonth, 2),
            'total_count' => $totalCount,
        ];
    }

    public function generateReference(): string
    {
        $lastExpense = Expense::orderBy('id', 'desc')->first();

        if (! $lastExpense) {
            return 'EXP-00001';
        }

        preg_match('/EXP-(\d+)/i', $lastExpense->reference, $matches);

        if (isset($matches[1])) {
            $nextNum = (int) $matches[1] + 1;
        } else {
            $nextNum = $lastExpense->id + 1;
        }

        return sprintf('EXP-%05d', $nextNum);
    }

    public function getAllActiveCategories(): Collection
    {
        return ExpenseCategory::where('status', 'active')->orderBy('name')->get();
    }

    public function createCategory(array $data): ExpenseCategory
    {
        return ExpenseCategory::create($data);
    }

    public function findCategoryByName(string $name): ?ExpenseCategory
    {
        return ExpenseCategory::where('name', $name)->first();
    }

    public function createExpense(array $data): Expense
    {
        return Expense::create($data);
    }

    public function updateExpense(Expense $expense, array $data): bool
    {
        return $expense->update($data);
    }

    public function voidExpense(Expense $expense, string $reason, int $userId): Expense
    {
        $expense->update([
            'status' => 'voided',
            'voided_by' => $userId,
            'voided_at' => now(),
            'void_reason' => $reason,
        ]);

        return $expense;
    }

    public function findWithRelations(int $id): ?Expense
    {
        return Expense::with(['category', 'account', 'creator', 'updater', 'voider', 'ledgerEntries', 'media'])->find($id);
    }
}
