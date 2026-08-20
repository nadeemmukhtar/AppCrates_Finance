<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Http\Requests\CancelLoanRequest;
use App\Http\Requests\StoreLoanRequest;
use App\Models\Loan;
use App\Services\LoanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    public function __construct(
        protected LoanRepositoryInterface $loanRepository,
        protected LenderRepositoryInterface $lenderRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LoanService $loanService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'lender_type', 'lender_id', 'start_date', 'end_date']);

        return Inertia::render('loans/index', [
            'stats' => $this->loanRepository->getSummaryStats(),
            'loans' => $this->loanRepository->getPaginatedWithFilters($filters),
            'lenders' => $this->lenderRepository->all(),
            'accounts' => $this->accountRepository->allActive(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreLoanRequest $request): RedirectResponse
    {
        $loan = $this->loanService->createLoan($request->validated(), $request->user());

        return redirect()->back()->with('success', "Loan {$loan->reference} created successfully.");
    }

    public function show(int $id): Response
    {
        $loan = $this->loanRepository->findWithRelations($id);

        if (! $loan) {
            abort(404, 'Loan not found.');
        }

        return Inertia::render('loans/show', [
            'loan' => $loan,
            'accounts' => $this->accountRepository->allActive(),
        ]);
    }

    public function cancel(CancelLoanRequest $request, Loan $loan): RedirectResponse
    {
        try {
            $this->loanService->cancelLoan($loan, $request->input('reason'), $request->user());

            return redirect()->back()->with('success', "Loan {$loan->reference} has been cancelled.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
