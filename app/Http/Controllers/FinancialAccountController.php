<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Http\Requests\FinancialAccount\StoreFinancialAccountRequest;
use App\Http\Requests\FinancialAccount\UpdateFinancialAccountRequest;
use App\Models\FinancialAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialAccountController extends Controller
{
    public function __construct(
        protected FinancialAccountRepositoryInterface $accountRepository
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'type', 'is_active']);

        return Inertia::render('accounts/index', [
            'stats' => $this->accountRepository->getSummaryStats(),
            'accounts' => $this->accountRepository->getPaginatedWithStats($filters),
            'filters' => $filters,
        ]);
    }

    public function store(StoreFinancialAccountRequest $request): RedirectResponse
    {
        $this->accountRepository->create($request->validated());

        return redirect()->back()->with('success', 'Financial account created successfully!');
    }

    public function show(FinancialAccount $account): Response
    {
        $account->load(['ledgerEntries' => function ($query) {
            $query->orderBy('transaction_date', 'desc')->take(50);
        }]);

        return Inertia::render('accounts/show', [
            'account' => $account,
        ]);
    }

    public function update(UpdateFinancialAccountRequest $request, FinancialAccount $account): RedirectResponse
    {
        $this->accountRepository->update($account, $request->validated());

        return redirect()->back()->with('success', 'Financial account updated successfully!');
    }

    public function toggleStatus(FinancialAccount $account): RedirectResponse
    {
        $this->accountRepository->toggleStatus($account);

        return redirect()->back()->with('success', 'Account status updated successfully!');
    }

    public function destroy(FinancialAccount $account): RedirectResponse
    {
        try {
            $this->accountRepository->delete($account);

            return redirect()->back()->with('success', 'Financial account deleted successfully!');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
