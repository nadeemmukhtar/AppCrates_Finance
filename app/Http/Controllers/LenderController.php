<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\Lender;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LenderController extends Controller
{
    public function __construct(
        protected LenderRepositoryInterface $lenderRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LoanRepositoryInterface $loanRepository
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'type']);

        return Inertia::render('lenders/index', [
            'stats' => $this->loanRepository->getSummaryStats(),
            'lenders' => $this->lenderRepository->getPaginatedWithStats($filters),
            'allLenders' => $this->lenderRepository->all(),
            'accounts' => $this->accountRepository->allActive(),
            'filters' => $filters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:individual,company,bank,other'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $lender = $this->lenderRepository->create($validated);

        return redirect()->back()->with('success', "Lender '{$lender->name}' added successfully.");
    }

    public function update(Request $request, Lender $lender): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:individual,company,bank,other'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $this->lenderRepository->update($lender, $validated);

        return redirect()->back()->with('success', "Lender '{$lender->name}' updated successfully.");
    }

    public function destroy(Lender $lender): RedirectResponse
    {
        try {
            $name = $lender->name;
            $this->lenderRepository->delete($lender);

            return redirect()->back()->with('success', "Lender '{$name}' deleted successfully.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
