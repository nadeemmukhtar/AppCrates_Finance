<?php

namespace App\Repositories;

use App\Contracts\Repositories\LedgerRepositoryInterface;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class LedgerRepository implements LedgerRepositoryInterface
{
    public function recordTransaction(array $data): LedgerEntry
    {
        return LedgerEntry::create($data);
    }

    protected function applyDateFilters($query, array $filters): void
    {
        $preset = $filters['preset'] ?? null;

        if ($preset && $preset !== 'all' && $preset !== 'custom') {
            switch ($preset) {
                case 'today':
                    $query->whereDate('transaction_date', Carbon::today());
                    break;
                case 'this_week':
                    $query->whereBetween('transaction_date', [Carbon::now()->startOfWeek()->toDateString(), Carbon::now()->endOfWeek()->toDateString()]);
                    break;
                case 'this_month':
                    $query->whereBetween('transaction_date', [Carbon::now()->startOfMonth()->toDateString(), Carbon::now()->endOfMonth()->toDateString()]);
                    break;
                case 'last_month':
                    $query->whereBetween('transaction_date', [Carbon::now()->subMonth()->startOfMonth()->toDateString(), Carbon::now()->subMonth()->endOfMonth()->toDateString()]);
                    break;
                case 'this_year':
                    $query->whereBetween('transaction_date', [Carbon::now()->startOfYear()->toDateString(), Carbon::now()->endOfYear()->toDateString()]);
                    break;
                case 'last_year':
                    $query->whereBetween('transaction_date', [Carbon::now()->subYear()->startOfYear()->toDateString(), Carbon::now()->subYear()->endOfYear()->toDateString()]);
                    break;
            }
        } else {
            if (! empty($filters['start_date'])) {
                $query->whereDate('transaction_date', '>=', $filters['start_date']);
            }
            if (! empty($filters['end_date'])) {
                $query->whereDate('transaction_date', '<=', $filters['end_date']);
            }
        }
    }

    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = LedgerEntry::query()->with(['account', 'creator', 'referenceable']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('account', fn ($a) => $a->where('name', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['transaction_type']) && $filters['transaction_type'] !== 'all') {
            $query->where('transaction_type', $filters['transaction_type']);
        }

        if (isset($filters['min_amount']) && $filters['min_amount'] !== '') {
            $query->where(function ($q) use ($filters) {
                $min = (float) $filters['min_amount'];
                $q->where('debit', '>=', $min)->orWhere('credit', '>=', $min);
            });
        }

        if (isset($filters['max_amount']) && $filters['max_amount'] !== '') {
            $query->where(function ($q) use ($filters) {
                $max = (float) $filters['max_amount'];
                $q->where('debit', '<=', $max)->orWhere('credit', '<=', $max);
            });
        }

        $this->applyDateFilters($query, $filters);

        $paginator = $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc')->paginate($perPage)->withQueryString();

        // Calculate running balance for each row in current query context
        $this->attachRunningBalances($paginator, $filters);

        return $paginator;
    }

    protected function attachRunningBalances(LengthAwarePaginator $paginator, array $filters): void
    {
        $accountId = (! empty($filters['account_id']) && $filters['account_id'] !== 'all') ? (int) $filters['account_id'] : null;

        $accountOpeningBalance = 0.00;
        if ($accountId) {
            $account = FinancialAccount::find($accountId);
            $accountOpeningBalance = $account ? (float) $account->opening_balance : 0.00;
        }

        // Fetch all prior entries before current paginator set to calculate exact running balance
        foreach ($paginator->items() as $item) {
            $subQuery = LedgerEntry::where('id', '<=', $item->id);
            if ($accountId) {
                $subQuery->where('account_id', $accountId);
            }

            $priorDebits = (float) (clone $subQuery)->sum('debit');
            $priorCredits = (float) (clone $subQuery)->sum('credit');

            if ($accountId) {
                $running = $accountOpeningBalance + $priorDebits - $priorCredits;
            } else {
                $running = $priorDebits - $priorCredits;
            }

            $item->running_balance = round($running, 2);
        }
    }

    public function getSummaryStats(array $filters): array
    {
        $query = LedgerEntry::query();

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['transaction_type']) && $filters['transaction_type'] !== 'all') {
            $query->where('transaction_type', $filters['transaction_type']);
        }

        $this->applyDateFilters($query, $filters);

        $totalDebits = (float) (clone $query)->sum('debit');
        $totalCredits = (float) (clone $query)->sum('credit');
        $netMovement = round($totalDebits - $totalCredits, 2);
        $totalCount = (clone $query)->count();

        return [
            'total_debits' => round($totalDebits, 2),
            'total_credits' => round($totalCredits, 2),
            'net_movement' => $netMovement,
            'total_count' => $totalCount,
        ];
    }

    public function getAccountBalanceStats(int $accountId, array $filters): array
    {
        $account = FinancialAccount::find($accountId);
        if (! $account) {
            return [
                'opening_balance' => 0.00,
                'period_debits' => 0.00,
                'period_credits' => 0.00,
                'closing_balance' => 0.00,
            ];
        }

        $startDate = $filters['start_date'] ?? null;

        // Calculate opening balance prior to start date
        $priorDebits = 0.00;
        $priorCredits = 0.00;

        if ($startDate) {
            $priorDebits = (float) LedgerEntry::where('account_id', $accountId)->whereDate('transaction_date', '<', $startDate)->sum('debit');
            $priorCredits = (float) LedgerEntry::where('account_id', $accountId)->whereDate('transaction_date', '<', $startDate)->sum('credit');
        }

        $openingBalance = (float) $account->opening_balance + $priorDebits - $priorCredits;

        // Period calculations
        $periodQuery = LedgerEntry::where('account_id', $accountId);
        $this->applyDateFilters($periodQuery, $filters);

        $periodDebits = (float) (clone $periodQuery)->sum('debit');
        $periodCredits = (float) (clone $periodQuery)->sum('credit');
        $closingBalance = $openingBalance + $periodDebits - $periodCredits;

        return [
            'account_name' => $account->name,
            'account_type' => $account->type,
            'opening_balance' => round($openingBalance, 2),
            'period_debits' => round($periodDebits, 2),
            'period_credits' => round($periodCredits, 2),
            'closing_balance' => round($closingBalance, 2),
        ];
    }

    public function findWithRelations(int $id): ?LedgerEntry
    {
        return LedgerEntry::with(['account', 'creator', 'referenceable'])->find($id);
    }

    public function getExportData(array $filters): Collection
    {
        $query = LedgerEntry::query()->with(['account', 'creator']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['transaction_type']) && $filters['transaction_type'] !== 'all') {
            $query->where('transaction_type', $filters['transaction_type']);
        }

        $this->applyDateFilters($query, $filters);

        return $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc')->get();
    }
}
