<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\Loan;
use App\Models\LoanPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanReportController extends Controller
{
    public function __construct(
        protected LoanRepositoryInterface $loanRepository,
        protected LenderRepositoryInterface $lenderRepository
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'lender_id', 'start_date', 'end_date', 'report_type']);
        $reportType = $filters['report_type'] ?? 'summary';

        $stats = $this->loanRepository->getSummaryStats();
        $lenders = $this->lenderRepository->all();

        $loansQuery = Loan::with(['lender', 'destinationAccount', 'payments' => function ($q) {
            $q->where('is_reversed', false);
        }]);

        if (! empty($filters['lender_id'])) {
            $loansQuery->where('lender_id', $filters['lender_id']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $loansQuery->where('status', $filters['status']);
        }

        if (! empty($filters['start_date'])) {
            $loansQuery->whereDate('loan_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $loansQuery->whereDate('loan_date', '<=', $filters['end_date']);
        }

        $loansList = $loansQuery->latest('loan_date')->get();

        $repaymentsQuery = LoanPayment::with(['loan.lender', 'account'])->where('is_reversed', false);
        if (! empty($filters['start_date'])) {
            $repaymentsQuery->whereDate('payment_date', '>=', $filters['start_date']);
        }
        if (! empty($filters['end_date'])) {
            $repaymentsQuery->whereDate('payment_date', '<=', $filters['end_date']);
        }
        $repaymentsList = $repaymentsQuery->latest('payment_date')->get();

        return Inertia::render('reports/loans', [
            'stats' => $stats,
            'loans' => $loansList,
            'repayments' => $repaymentsList,
            'lenders' => $lenders,
            'filters' => $filters,
            'reportType' => $reportType,
        ]);
    }
}
