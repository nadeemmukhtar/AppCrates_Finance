<?php

namespace App\Repositories;

use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Models\Expense;
use App\Models\FinancialAccount;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\MoneyInTransaction;
use App\Models\SalaryPayment;
use App\Models\SalaryPeriod;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportRepository implements ReportRepositoryInterface
{
    protected function applyDateFilters($query, array $filters, string $dateColumn = 'created_at'): void
    {
        $preset = $filters['preset'] ?? null;

        if ($preset && $preset !== 'all' && $preset !== 'custom') {
            switch ($preset) {
                case 'today':
                    $query->whereDate($dateColumn, Carbon::today());
                    break;
                case 'this_week':
                    $query->whereBetween($dateColumn, [Carbon::now()->startOfWeek()->toDateString(), Carbon::now()->endOfWeek()->toDateString()]);
                    break;
                case 'this_month':
                    $query->whereBetween($dateColumn, [Carbon::now()->startOfMonth()->toDateString(), Carbon::now()->endOfMonth()->toDateString()]);
                    break;
                case 'last_month':
                    $query->whereBetween($dateColumn, [Carbon::now()->subMonth()->startOfMonth()->toDateString(), Carbon::now()->subMonth()->endOfMonth()->toDateString()]);
                    break;
                case 'this_year':
                    $query->whereBetween($dateColumn, [Carbon::now()->startOfYear()->toDateString(), Carbon::now()->endOfYear()->toDateString()]);
                    break;
                case 'last_year':
                    $query->whereBetween($dateColumn, [Carbon::now()->subYear()->startOfYear()->toDateString(), Carbon::now()->subYear()->endOfYear()->toDateString()]);
                    break;
            }
        } else {
            if (! empty($filters['start_date'])) {
                $query->whereDate($dateColumn, '>=', $filters['start_date']);
            }
            if (! empty($filters['end_date'])) {
                $query->whereDate($dateColumn, '<=', $filters['end_date']);
            }
        }
    }

    protected function getDateGroupExpression(string $column): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }

    public function getIncomeReport(array $filters): array
    {
        $query = MoneyInTransaction::with(['category', 'account', 'creator'])->where('status', 'posted');

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }
        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('received_from', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $this->applyDateFilters($query, $filters, 'received_date');

        $totalIncome = (float) (clone $query)->sum('amount');
        $totalCount = (clone $query)->count();
        $averageIncome = $totalCount > 0 ? round($totalIncome / $totalCount, 2) : 0.00;

        // Breakdown by Category
        $byCategory = (clone $query)
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->get()
            ->map(fn ($item) => [
                'category_name' => $item->category?->name ?? 'Uncategorized',
                'total' => (float) $item->total,
            ]);

        // Breakdown by Account
        $byAccount = (clone $query)
            ->select('account_id', DB::raw('SUM(amount) as total'))
            ->groupBy('account_id')
            ->get()
            ->map(fn ($item) => [
                'account_name' => $item->account?->name ?? 'Unassigned',
                'total' => (float) $item->total,
            ]);

        // Breakdown by Payment Method
        $byPaymentMethod = (clone $query)
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($item) => [
                'method' => ucwords(str_replace('_', ' ', $item->payment_method)),
                'total' => (float) $item->total,
            ]);

        // Monthly Trend
        $dateExpr = $this->getDateGroupExpression('received_date');
        $monthlyTrend = (clone $query)
            ->select(DB::raw("{$dateExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        $transactions = $query->orderBy('received_date', 'desc')->paginate(15)->withQueryString();

        return [
            'total_income' => round($totalIncome, 2),
            'total_count' => $totalCount,
            'average_income' => $averageIncome,
            'by_category' => $byCategory,
            'by_account' => $byAccount,
            'by_payment_method' => $byPaymentMethod,
            'monthly_trend' => $monthlyTrend,
            'transactions' => $transactions,
        ];
    }

    public function getExpenseReport(array $filters): array
    {
        $query = Expense::with(['category', 'account', 'creator'])->where('status', 'posted');

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }
        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $this->applyDateFilters($query, $filters, 'expense_date');

        $totalExpenses = (float) (clone $query)->sum('amount');
        $totalCount = (clone $query)->count();
        $averageExpense = $totalCount > 0 ? round($totalExpenses / $totalCount, 2) : 0.00;

        // Breakdown by Category
        $byCategory = (clone $query)
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->get()
            ->map(fn ($item) => [
                'category_name' => $item->category?->name ?? 'Uncategorized',
                'total' => (float) $item->total,
            ]);

        // Breakdown by Account
        $byAccount = (clone $query)
            ->select('account_id', DB::raw('SUM(amount) as total'))
            ->groupBy('account_id')
            ->get()
            ->map(fn ($item) => [
                'account_name' => $item->account?->name ?? 'Unassigned',
                'total' => (float) $item->total,
            ]);

        // Breakdown by Payment Method
        $byPaymentMethod = (clone $query)
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($item) => [
                'method' => ucwords(str_replace('_', ' ', $item->payment_method)),
                'total' => (float) $item->total,
            ]);

        // Monthly Trend
        $dateExpr = $this->getDateGroupExpression('expense_date');
        $monthlyTrend = (clone $query)
            ->select(DB::raw("{$dateExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        $expenses = $query->orderBy('expense_date', 'desc')->paginate(15)->withQueryString();

        return [
            'total_expenses' => round($totalExpenses, 2),
            'total_count' => $totalCount,
            'average_expense' => $averageExpense,
            'by_category' => $byCategory,
            'by_account' => $byAccount,
            'by_payment_method' => $byPaymentMethod,
            'monthly_trend' => $monthlyTrend,
            'expenses' => $expenses,
        ];
    }

    public function getSalaryReport(array $filters): array
    {
        $periodQuery = SalaryPeriod::with(['employee', 'postedPayments']);

        if (! empty($filters['employee_id']) && $filters['employee_id'] !== 'all') {
            $periodQuery->where('employee_id', $filters['employee_id']);
        }
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $periodQuery->where('status', $filters['status']);
        }

        if (! empty($filters['year'])) {
            $periodQuery->where('salary_year', $filters['year']);
        }
        if (! empty($filters['month'])) {
            $periodQuery->where('salary_month', $filters['month']);
        }

        $totalPayable = (float) (clone $periodQuery)->sum('salary_amount');

        // Total Paid from non-reversed payments (status = 'posted')
        $paymentQuery = SalaryPayment::where('status', 'posted');
        $this->applyDateFilters($paymentQuery, $filters, 'payment_date');
        $totalPaid = (float) $paymentQuery->sum('amount');

        $totalPending = max(0, round($totalPayable - $totalPaid, 2));

        $employeesPaidCount = (clone $periodQuery)->where('status', 'paid')->distinct('employee_id')->count('employee_id');
        $employeesPendingCount = (clone $periodQuery)->whereIn('status', ['pending', 'partial'])->distinct('employee_id')->count('employee_id');

        // Monthly Salary Trend
        $dateExpr = $this->getDateGroupExpression('payment_date');
        $monthlyTrend = SalaryPayment::where('status', 'posted')
            ->select(DB::raw("{$dateExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        $periods = $periodQuery->orderBy('salary_year', 'desc')->orderBy('salary_month', 'desc')->paginate(15)->withQueryString();

        return [
            'total_payable' => round($totalPayable, 2),
            'total_paid' => round($totalPaid, 2),
            'total_pending' => $totalPending,
            'employees_paid_count' => $employeesPaidCount,
            'employees_pending_count' => $employeesPendingCount,
            'monthly_trend' => $monthlyTrend,
            'periods' => $periods,
        ];
    }

    public function getLoanReport(array $filters): array
    {
        $loanQuery = Loan::with(['lender', 'destinationAccount', 'payments' => fn ($q) => $q->where('is_reversed', false)]);

        if (! empty($filters['lender_id']) && $filters['lender_id'] !== 'all') {
            $loanQuery->where('lender_id', $filters['lender_id']);
        }
        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $loanQuery->where('status', $filters['status']);
        }

        $this->applyDateFilters($loanQuery, $filters, 'loan_date');

        $totalBorrowed = (float) (clone $loanQuery)->sum('original_amount');

        $loanIds = (clone $loanQuery)->pluck('id');
        $totalRepaid = (float) LoanPayment::whereIn('loan_id', $loanIds)->where('is_reversed', false)->sum('amount');
        $totalOutstanding = max(0.00, round($totalBorrowed - $totalRepaid, 2));

        $activeCount = (clone $loanQuery)->where('status', 'active')->count();
        $clearedCount = (clone $loanQuery)->where('status', 'cleared')->count();
        $overdueCount = (clone $loanQuery)->where('status', 'overdue')->count();

        $loans = $loanQuery->orderBy('loan_date', 'desc')->paginate(15)->withQueryString();

        return [
            'total_borrowed' => round($totalBorrowed, 2),
            'total_repaid' => round($totalRepaid, 2),
            'total_outstanding' => $totalOutstanding,
            'active_count' => $activeCount,
            'cleared_count' => $clearedCount,
            'overdue_count' => $overdueCount,
            'loans' => $loans,
        ];
    }

    public function getProfitLossReport(array $filters): array
    {
        // 1. Operating Income (Posted Money In)
        $incomeQuery = MoneyInTransaction::where('status', 'posted');
        $this->applyDateFilters($incomeQuery, $filters, 'received_date');
        $revenue = (float) $incomeQuery->sum('amount');

        // 2. Operating Expenses (Posted Expenses)
        $expenseQuery = Expense::where('status', 'posted');
        $this->applyDateFilters($expenseQuery, $filters, 'expense_date');
        $operatingExpenses = (float) $expenseQuery->sum('amount');

        // 3. Salary Expenses (Posted Salary Payments)
        $salaryQuery = SalaryPayment::where('status', 'posted');
        $this->applyDateFilters($salaryQuery, $filters, 'payment_date');
        $salaryExpenses = (float) $salaryQuery->sum('amount');

        $totalExpenses = round($operatingExpenses + $salaryExpenses, 2);
        $netProfitLoss = round($revenue - $totalExpenses, 2);

        // Expense Category Breakdown
        $expenseCategories = Expense::where('status', 'posted')
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->with('category')
            ->get()
            ->map(fn ($item) => [
                'category_name' => $item->category?->name ?? 'Uncategorized',
                'total' => (float) $item->total,
            ])
            ->toArray();

        $expenseCategories[] = [
            'category_name' => 'Salary Expenses',
            'total' => round($salaryExpenses, 2),
        ];

        // Monthly Income vs Expenses Comparison Chart Data
        $incExpr = $this->getDateGroupExpression('received_date');
        $expExpr = $this->getDateGroupExpression('expense_date');

        $monthlyIncome = MoneyInTransaction::where('status', 'posted')
            ->select(DB::raw("{$incExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->get()
            ->pluck('total', 'month');

        $monthlyExp = Expense::where('status', 'posted')
            ->select(DB::raw("{$expExpr} as month"), DB::raw('SUM(amount) as total'))
            ->groupBy('month')
            ->get()
            ->pluck('total', 'month');

        $months = $monthlyIncome->keys()->merge($monthlyExp->keys())->unique()->sort()->values();

        $monthlyComparison = $months->map(function ($m) use ($monthlyIncome, $monthlyExp) {
            $inc = (float) ($monthlyIncome[$m] ?? 0);
            $exp = (float) ($monthlyExp[$m] ?? 0);

            return [
                'month' => $m,
                'income' => round($inc, 2),
                'expenses' => round($exp, 2),
                'net' => round($inc - $exp, 2),
            ];
        });

        // Money Movement Statement (Cash Flow)
        $totalOpeningBalance = (float) FinancialAccount::where('is_active', true)->sum('opening_balance');

        $loanReceivedQuery = Loan::query();
        $this->applyDateFilters($loanReceivedQuery, $filters, 'loan_date');
        $loanReceived = (float) $loanReceivedQuery->sum('original_amount');

        $loanRepaidQuery = LoanPayment::where('is_reversed', false);
        $this->applyDateFilters($loanRepaidQuery, $filters, 'payment_date');
        $loanRepaid = (float) $loanRepaidQuery->sum('amount');

        $closingCashBalance = round($totalOpeningBalance + $revenue - $operatingExpenses - $salaryExpenses + $loanReceived - $loanRepaid, 2);

        return [
            'revenue' => round($revenue, 2),
            'operating_expenses' => round($operatingExpenses, 2),
            'salary_expenses' => round($salaryExpenses, 2),
            'total_expenses' => $totalExpenses,
            'net_profit_loss' => $netProfitLoss,
            'is_profit' => $netProfitLoss >= 0,
            'expense_categories' => $expenseCategories,
            'monthly_comparison' => $monthlyComparison,
            'cash_movement' => [
                'opening_balance' => round($totalOpeningBalance, 2),
                'money_in' => round($revenue, 2),
                'operating_expenses' => round($operatingExpenses, 2),
                'salary_payments' => round($salaryExpenses, 2),
                'loan_received' => round($loanReceived, 2),
                'loan_repayments' => round($loanRepaid, 2),
                'closing_balance' => $closingCashBalance,
            ],
        ];
    }

    public function getExportData(string $reportType, array $filters): Collection
    {
        switch ($reportType) {
            case 'income':
                $query = MoneyInTransaction::with(['category', 'account'])->where('status', 'posted');
                $this->applyDateFilters($query, $filters, 'received_date');

                return $query->get()->map(fn ($i) => [
                    'Date' => $i->received_date,
                    'Reference' => $i->reference,
                    'Received From' => $i->received_from,
                    'Category' => $i->category?->name ?? 'Uncategorized',
                    'Account' => $i->account?->name ?? '—',
                    'Method' => ucwords(str_replace('_', ' ', $i->payment_method)),
                    'Amount' => $i->amount,
                ]);
            case 'expense':
                $query = Expense::with(['category', 'account'])->where('status', 'posted');
                $this->applyDateFilters($query, $filters, 'expense_date');

                return $query->get()->map(fn ($e) => [
                    'Date' => $e->expense_date,
                    'Reference' => $e->reference,
                    'Category' => $e->category?->name ?? 'Uncategorized',
                    'Description' => $e->description ?? '',
                    'Account' => $e->account?->name ?? '—',
                    'Method' => ucwords(str_replace('_', ' ', $e->payment_method)),
                    'Amount' => $e->amount,
                ]);
            default:
                return collect([]);
        }
    }
}
