<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\MoneyInRepositoryInterface;
use App\Http\Requests\MoneyIn\StoreMoneyInRequest;
use App\Http\Requests\MoneyIn\UpdateMoneyInRequest;
use App\Http\Requests\MoneyIn\VoidMoneyInRequest;
use App\Models\MoneyInTransaction;
use App\Services\MoneyInService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyInController extends Controller
{
    public function __construct(
        protected MoneyInRepositoryInterface $moneyInRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected MoneyInService $moneyInService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'category_id',
            'account_id',
            'payment_method',
            'status',
            'start_date',
            'end_date',
            'min_amount',
            'max_amount',
        ]);

        return Inertia::render('money-in/index', [
            'stats' => $this->moneyInRepository->getSummaryStats($filters),
            'transactions' => $this->moneyInRepository->getPaginatedWithFilters($filters),
            'categories' => $this->moneyInRepository->getAllActiveCategories(),
            'accounts' => $this->accountRepository->allActive(),
            'clients' => $this->moneyInRepository->getAllClients(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreMoneyInRequest $request): RedirectResponse
    {
        $moneyIn = $this->moneyInService->createMoneyIn($request->validated(), $request->user());

        return redirect()->back()->with('success', "Money In record {$moneyIn->reference} created successfully!");
    }

    public function show(int $id): Response
    {
        $transaction = $this->moneyInRepository->findWithRelations($id);

        if (! $transaction) {
            abort(404, 'Money In transaction not found.');
        }

        return Inertia::render('money-in/show', [
            'transaction' => $transaction,
        ]);
    }

    public function update(UpdateMoneyInRequest $request, MoneyInTransaction $moneyIn): RedirectResponse
    {
        try {
            $this->moneyInService->updateMoneyIn($moneyIn, $request->validated(), $request->user());

            return redirect()->back()->with('success', "Money In record {$moneyIn->reference} updated successfully!");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(VoidMoneyInRequest $request, MoneyInTransaction $moneyIn): RedirectResponse
    {
        try {
            $this->moneyInService->voidMoneyIn($moneyIn, $request->input('reason'), $request->user());

            return redirect()->back()->with('success', "Money In transaction {$moneyIn->reference} has been voided.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
