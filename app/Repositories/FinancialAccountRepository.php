<?php

namespace App\Repositories;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Models\FinancialAccount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class FinancialAccountRepository implements FinancialAccountRepositoryInterface
{
    public function allActive(): Collection
    {
        return FinancialAccount::where('is_active', true)
            ->where('is_deleted', false)
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): ?FinancialAccount
    {
        return FinancialAccount::where('is_deleted', false)->find($id);
    }

    public function getPaginatedWithStats(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = FinancialAccount::query()->where('is_deleted', false);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('account_number', 'like', "%{$search}%")
                    ->orWhere('bank_name', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== 'all') {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('name')->paginate($perPage)->withQueryString();
    }

    public function getSummaryStats(): array
    {
        $accounts = FinancialAccount::where('is_deleted', false)->get();

        $totalCash = $accounts->where('type', 'cash')->where('is_active', true)->sum('current_balance');
        $totalBank = $accounts->where('type', 'bank')->where('is_active', true)->sum('current_balance');
        $totalOther = $accounts->where('type', 'other')->where('is_active', true)->sum('current_balance');
        $totalLiquidity = $accounts->where('is_active', true)->sum('current_balance');

        return [
            'total_cash' => round((float) $totalCash, 2),
            'total_bank' => round((float) $totalBank, 2),
            'total_other' => round((float) $totalOther, 2),
            'total_liquidity' => round((float) $totalLiquidity, 2),
            'total_accounts' => $accounts->count(),
            'active_accounts' => $accounts->where('is_active', true)->count(),
        ];
    }

    public function create(array $data): FinancialAccount
    {
        $openingBalance = (float) ($data['opening_balance'] ?? 0);
        $data['current_balance'] = $openingBalance;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_deleted'] = false;

        return FinancialAccount::create($data);
    }

    public function update(FinancialAccount $account, array $data): bool
    {
        return $account->update($data);
    }

    public function toggleStatus(FinancialAccount $account): bool
    {
        $account->is_active = ! $account->is_active;

        return $account->save();
    }

    public function delete(FinancialAccount $account): bool
    {
        $account->is_deleted = true;

        return $account->save();
    }

    public function updateBalance(int $id, float $amountChange, string $operation = 'add'): FinancialAccount
    {
        $account = FinancialAccount::findOrFail($id);

        if ($operation === 'add') {
            $account->current_balance += $amountChange;
        } else {
            $account->current_balance -= $amountChange;
        }

        $account->save();

        return $account;
    }
}
