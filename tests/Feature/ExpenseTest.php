<?php

use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use App\Models\User;
use App\Services\ExpenseService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->account = FinancialAccount::create([
        'name' => 'HBL Main Operating Account',
        'account_number' => '1122334455',
        'bank_name' => 'Habib Bank Limited',
        'type' => 'bank',
        'opening_balance' => 2000000.00,
        'current_balance' => 2000000.00,
        'is_active' => true,
    ]);

    $this->rentCategory = ExpenseCategory::create([
        'name' => 'Office Rent',
        'description' => 'Building rental cost',
        'status' => 'active',
    ]);

    $this->utilityCategory = ExpenseCategory::create([
        'name' => 'Utilities',
        'description' => 'Power and water bills',
        'status' => 'active',
    ]);
});

test('1. can create an operating expense with auto-generated EXP-00001 reference', function () {
    $response = $this->actingAs($this->user)->post('/expenses', [
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
        'external_reference' => 'RENT-AUG-2026',
        'description' => 'August Office Building Rent',
    ]);

    $response->assertRedirect();

    $expense = Expense::where('external_reference', 'RENT-AUG-2026')->first();
    expect($expense)->not->toBeNull();
    expect($expense->reference)->toBe('EXP-00001');
    expect((float) $expense->amount)->toEqual(200000.0);
    expect($expense->status)->toBe('posted');
});

test('2. posting an expense decreases company financial account balance', function () {
    expect((float) $this->account->current_balance)->toEqual(2000000.0);

    $this->actingAs($this->user)->post('/expenses', [
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
    ]);

    expect((float) $this->account->fresh()->current_balance)->toEqual(1800000.0); // 2,000,000 - 200,000
});

test('3. posting an expense creates a double-entry ledger record', function () {
    $this->actingAs($this->user)->post('/expenses', [
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
        'description' => 'Office Rent Payout',
    ]);

    $expense = Expense::first();
    $ledger = LedgerEntry::where('reference_id', $expense->id)
        ->where('reference_type', Expense::class)
        ->first();

    expect($ledger)->not->toBeNull();
    expect((float) $ledger->debit)->toEqual(200000.0);
    expect((float) $ledger->credit)->toEqual(0.0);
    expect($ledger->transaction_type)->toBe('expense');
});

test('4. editing an expense adjusts account balance and ledger entries', function () {
    $expense = app(ExpenseService::class)->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 100000.00,
    ], $this->user);

    expect((float) $this->account->fresh()->current_balance)->toEqual(1900000.0); // 2M - 100k

    // Update expense amount to 150,000
    $response = $this->actingAs($this->user)->put("/expenses/{$expense->id}", [
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 150000.00,
        'description' => 'Adjusted rent payout',
    ]);

    $response->assertRedirect();
    expect((float) $expense->fresh()->amount)->toEqual(150000.0);
    expect((float) $this->account->fresh()->current_balance)->toEqual(1850000.0); // 2M - 150k
});

test('5. voiding an expense restores account balance and posts reversing ledger entry', function () {
    $expense = app(ExpenseService::class)->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
    ], $this->user);

    expect((float) $this->account->fresh()->current_balance)->toEqual(1800000.0);

    // Void Expense
    $response = $this->actingAs($this->user)->post("/expenses/{$expense->id}/void", [
        'reason' => 'Duplicate invoice entry',
    ]);

    $response->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe('voided');
    expect($expense->void_reason)->toBe('Duplicate invoice entry');

    // Financial balance restored
    expect((float) $this->account->fresh()->current_balance)->toEqual(2000000.0);

    // Reversing ledger entry exists
    $reversalLedger = LedgerEntry::where('reference_id', $expense->id)
        ->where('transaction_type', 'expense_reversal')
        ->first();

    expect($reversalLedger)->not->toBeNull();
    expect((float) $reversalLedger->credit)->toEqual(200000.0);
});

test('6. voided expenses are excluded from summary totals calculations', function () {
    $service = app(ExpenseService::class);

    $exp1 = $service->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 100000.00,
    ], $this->user);

    $exp2 = $service->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->utilityCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 50000.00,
    ], $this->user);

    $repo = app(ExpenseRepositoryInterface::class);
    expect($repo->getSummaryStats()['total_expenses'])->toEqual(150000.0);

    // Void exp2
    $service->voidExpense($exp2, 'Cancelled bill', $this->user);

    expect($repo->getSummaryStats()['total_expenses'])->toEqual(100000.0);
});

test('7. salary separation guardrail prevents recording salary in expenses module', function () {
    $salaryCategory = ExpenseCategory::create([
        'name' => 'Salary & Payroll',
        'description' => 'Employee salaries',
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->user)->post('/expenses', [
        'expense_date' => '2026-08-18',
        'category_id' => $salaryCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 50000.00,
    ]);

    $response->assertSessionHasErrors(['error']);
    expect(Expense::count())->toBe(0);
});

test('8. expense detail page loads profile with URL param tab navigation support', function () {
    $expense = app(ExpenseService::class)->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->rentCategory->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
    ], $this->user);

    $response = $this->actingAs($this->user)->get("/expenses/{$expense->id}?tab=audit");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('expenses/show')
        ->has('expense')
        ->has('accounts')
        ->has('categories')
        ->where('activeTab', 'audit')
    );
});

test('9. can create a new expense category via quick add category endpoint', function () {
    $response = $this->actingAs($this->user)->post('/expense-categories', [
        'name' => 'Vehicle Fuel & Petrol',
        'description' => 'Generator and company vehicle fuel costs',
    ]);

    $response->assertRedirect();
    $cat = ExpenseCategory::where('name', 'Vehicle Fuel & Petrol')->first();
    expect($cat)->not->toBeNull();
    expect($cat->status)->toBe('active');
});
