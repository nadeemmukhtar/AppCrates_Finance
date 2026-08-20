<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Contracts\Repositories\MoneyInRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Models\Employee;
use App\Models\ExpenseCategory;
use App\Models\MoneyInCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        protected ReportRepositoryInterface $reportRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected MoneyInRepositoryInterface $moneyInRepository,
        protected ExpenseRepositoryInterface $expenseRepository,
        protected EmployeeRepositoryInterface $employeeRepository,
        protected LenderRepositoryInterface $lenderRepository
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);

        $incomeData = $this->reportRepository->getIncomeReport($filters);
        $expenseData = $this->reportRepository->getExpenseReport($filters);
        $salaryData = $this->reportRepository->getSalaryReport($filters);
        $loanData = $this->reportRepository->getLoanReport($filters);
        $profitLossData = $this->reportRepository->getProfitLossReport($filters);

        return Inertia::render('reports/index', [
            'incomeStats' => [
                'total' => $incomeData['total_income'],
                'count' => $incomeData['total_count'],
            ],
            'expenseStats' => [
                'total' => $expenseData['total_expenses'],
                'count' => $expenseData['total_count'],
            ],
            'salaryStats' => [
                'total_paid' => $salaryData['total_paid'],
                'total_pending' => $salaryData['total_pending'],
            ],
            'loanStats' => [
                'total_outstanding' => $loanData['total_outstanding'],
                'active_count' => $loanData['active_count'],
            ],
            'profitLossStats' => [
                'net_profit_loss' => $profitLossData['net_profit_loss'],
                'is_profit' => $profitLossData['is_profit'],
            ],
            'filters' => $filters,
        ]);
    }

    public function income(Request $request): Response
    {
        $filters = $request->only(['search', 'account_id', 'category_id', 'payment_method', 'preset', 'start_date', 'end_date']);

        return Inertia::render('reports/income', [
            'report' => $this->reportRepository->getIncomeReport($filters),
            'accounts' => $this->accountRepository->allActive(),
            'categories' => MoneyInCategory::where('is_active', true)->get(),
            'filters' => $filters,
        ]);
    }

    public function expense(Request $request): Response
    {
        $filters = $request->only(['search', 'account_id', 'category_id', 'payment_method', 'preset', 'start_date', 'end_date']);

        return Inertia::render('reports/expense', [
            'report' => $this->reportRepository->getExpenseReport($filters),
            'accounts' => $this->accountRepository->allActive(),
            'categories' => ExpenseCategory::where('status', 'active')->get(),
            'filters' => $filters,
        ]);
    }

    public function salary(Request $request): Response
    {
        $filters = $request->only(['employee_id', 'status', 'year', 'month', 'preset', 'start_date', 'end_date']);

        return Inertia::render('reports/salary', [
            'report' => $this->reportRepository->getSalaryReport($filters),
            'employees' => Employee::where('status', 'active')->get(),
            'filters' => $filters,
        ]);
    }

    public function loans(Request $request): Response
    {
        $filters = $request->only(['lender_id', 'status', 'preset', 'start_date', 'end_date']);

        return Inertia::render('reports/loans', [
            'report' => $this->reportRepository->getLoanReport($filters),
            'lenders' => $this->lenderRepository->all(),
            'filters' => $filters,
        ]);
    }

    public function profitLoss(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);

        return Inertia::render('reports/profit-loss', [
            'report' => $this->reportRepository->getProfitLossReport($filters),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->input('type', 'income');
        $filters = $request->only(['search', 'account_id', 'category_id', 'payment_method', 'preset', 'start_date', 'end_date']);

        $data = $this->reportRepository->getExportData($type, $filters);
        $filename = ucfirst($type).'_Report_'.date('Y-m-d_H-i').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            if ($data->isNotEmpty()) {
                fputcsv($file, array_keys($data->first()));
                foreach ($data as $row) {
                    fputcsv($file, array_values($row));
                }
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
