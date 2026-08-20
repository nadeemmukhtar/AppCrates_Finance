<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Expense;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use App\Models\Loan;
use App\Models\MoneyInTransaction;
use App\Models\SalaryPayment;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        // 1. Total Liquidity (Total Active Accounts Balance)
        $totalBalance = (float) FinancialAccount::where('is_active', true)
            ->where('is_deleted', false)
            ->sum('current_balance');

        // 2. This Month Income (Posted Money In)
        $thisMonthIncome = (float) MoneyInTransaction::where('status', 'posted')
            ->where('is_deleted', false)
            ->whereBetween('received_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 3. This Month Operating Expenses
        $thisMonthOpExpense = (float) Expense::where('status', 'posted')
            ->where('is_deleted', false)
            ->whereBetween('expense_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 4. This Month Salary Expenses
        $thisMonthSalary = (float) SalaryPayment::where('status', 'posted')
            ->where('is_deleted', false)
            ->whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $thisMonthTotalExpenses = round($thisMonthOpExpense + $thisMonthSalary, 2);
        $thisMonthNet = round($thisMonthIncome - $thisMonthTotalExpenses, 2);

        // 5. Total Outstanding Loan Liability
        $loans = Loan::where('is_deleted', false)
            ->whereIn('status', ['active', 'partially_paid', 'overdue'])
            ->get();
        $totalOutstandingLoans = (float) $loans->sum(fn ($loan) => $loan->remaining_balance);

        // 6. Active Financial Accounts List
        $accounts = FinancialAccount::where('is_active', true)
            ->where('is_deleted', false)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'type', 'account_number', 'bank_name', 'current_balance']);

        // 7. Recent Ledger Activity (Latest 8 entries)
        $recentLedger = LedgerEntry::with('account')
            ->where('is_deleted', false)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get();

        // 8. Overview Stats
        $activeEmployeesCount = Employee::where('status', 'active')->where('is_deleted', false)->count();

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_balance' => round($totalBalance, 2),
                'this_month_income' => round($thisMonthIncome, 2),
                'this_month_expenses' => $thisMonthTotalExpenses,
                'this_month_net' => $thisMonthNet,
                'outstanding_loans' => round($totalOutstandingLoans, 2),
                'active_employees' => $activeEmployeesCount,
            ],
            'accounts' => $accounts,
            'recent_ledger' => $recentLedger,
        ]);
    }
}
