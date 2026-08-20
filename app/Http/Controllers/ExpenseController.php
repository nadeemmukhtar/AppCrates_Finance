<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Http\Requests\Expense\StoreExpenseCategoryRequest;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Requests\Expense\VoidExpenseRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(
        protected ExpenseRepositoryInterface $expenseRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected ExpenseService $expenseService
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

        return Inertia::render('expenses/index', [
            'stats' => $this->expenseRepository->getSummaryStats(),
            'expenses' => $this->expenseRepository->getPaginatedWithFilters($filters),
            'categories' => $this->expenseRepository->getAllActiveCategories(),
            'accounts' => $this->accountRepository->allActive(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        try {
            $expense = $this->expenseService->createExpense($request->validated(), $request->user());

            return redirect()->back()->with('success', "Operating Expense {$expense->reference} posted successfully!");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Request $request, int $id): Response
    {
        $expense = $this->expenseRepository->findWithRelations($id);

        if (! $expense) {
            abort(404, 'Expense record not found.');
        }

        $activeTab = $request->query('tab', 'overview');

        return Inertia::render('expenses/show', [
            'expense' => $expense,
            'accounts' => $this->accountRepository->allActive(),
            'categories' => $this->expenseRepository->getAllActiveCategories(),
            'activeTab' => $activeTab,
        ]);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        try {
            $updated = $this->expenseService->updateExpense($expense, $request->validated(), $request->user());

            return redirect()->back()->with('success', "Expense {$updated->reference} updated successfully. Account balance and ledger updated.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(VoidExpenseRequest $request, Expense $expense): RedirectResponse
    {
        try {
            $voided = $this->expenseService->voidExpense($expense, $request->input('reason'), $request->user());

            return redirect()->back()->with('success', "Expense {$voided->reference} has been voided. Account balance restored.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function storeCategory(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        $category = $this->expenseRepository->createCategory([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'status' => 'active',
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', "Expense Category {$category->name} added successfully!");
    }
}
