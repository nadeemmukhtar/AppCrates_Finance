<?php

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use App\Models\MoneyInCategory;
use App\Models\MoneyInTransaction;
use App\Models\SalaryPayment;
use App\Models\User;
use App\Services\EmployeeService;
use App\Services\ExpenseService;
use App\Services\MoneyInService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->account = FinancialAccount::create([
        'name' => 'Meezan Corporate Account',
        'account_number' => '9988776655',
        'bank_name' => 'Meezan Bank',
        'type' => 'bank',
        'opening_balance' => 500000.00,
        'current_balance' => 500000.00,
        'is_active' => true,
    ]);

    $this->category = ExpenseCategory::create([
        'name' => 'Software & SaaS',
        'status' => 'active',
    ]);

    $this->moneyInCat = MoneyInCategory::create([
        'name' => 'Client Payment',
        'slug' => 'client-payment',
        'is_active' => true,
    ]);
});

test('1. Money In transaction automatically creates double-entry ledger record', function () {
    $moneyInService = app(MoneyInService::class);
    $moneyIn = $moneyInService->createMoneyIn([
        'received_date' => '2026-08-18',
        'received_from' => 'Acme Corp',
        'category_id' => $this->moneyInCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 100000.00,
        'description' => 'Project Milestone Payment',
    ], $this->user);

    $ledger = LedgerEntry::where('reference_id', $moneyIn->id)
        ->where('reference_type', MoneyInTransaction::class)
        ->first();

    expect($ledger)->not->toBeNull();
    expect((float) $ledger->debit)->toEqual(100000.0);
    expect((float) $ledger->credit)->toEqual(0.0);
    expect($ledger->transaction_type)->toBe('money_in');
});

test('2. Operating Expense transaction automatically creates double-entry ledger record', function () {
    $expenseService = app(ExpenseService::class);
    $expense = $expenseService->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 25000.00,
        'description' => 'AWS Servers',
    ], $this->user);

    $ledger = LedgerEntry::where('reference_id', $expense->id)
        ->where('reference_type', Expense::class)
        ->first();

    expect($ledger)->not->toBeNull();
    expect((float) $ledger->debit)->toEqual(25000.0);
    expect((float) $ledger->credit)->toEqual(0.0);
    expect($ledger->transaction_type)->toBe('expense');
});

test('3. Salary payment transaction automatically creates double-entry ledger record', function () {
    $empService = app(EmployeeService::class);
    $emp = $empService->createEmployee([
        'full_name' => 'Zainab Ahmed',
        'joining_date' => '2026-01-01',
        'basic_salary' => 80000.00,
    ], $this->user);

    $period = app(EmployeeRepositoryInterface::class)->findOrCreateSalaryPeriod($emp, 2026, 8);

    $payment = $empService->processSalaryPayment([
        'salary_period_id' => $period->id,
        'amount' => 80000.00,
        'payment_date' => '2026-08-18',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ], $this->user);

    $ledger = LedgerEntry::where('reference_id', $payment->id)
        ->where('reference_type', SalaryPayment::class)
        ->first();

    expect($ledger)->not->toBeNull();
    expect((float) $ledger->debit)->toEqual(80000.0);
    expect((float) $ledger->credit)->toEqual(0.0);
    expect($ledger->transaction_type)->toBe('salary_payment');
});

test('4. voiding an expense creates reversing ledger entry without deleting original entry', function () {
    $expenseService = app(ExpenseService::class);
    $expense = $expenseService->createExpense([
        'expense_date' => '2026-08-18',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 50000.00,
    ], $this->user);

    expect(LedgerEntry::count())->toBe(1);

    $expenseService->voidExpense($expense, 'Wrong invoice', $this->user);

    expect(LedgerEntry::count())->toBe(2);

    $reversal = LedgerEntry::where('transaction_type', 'expense_reversal')->first();
    expect($reversal)->not->toBeNull();
    expect((float) $reversal->credit)->toEqual(50000.0);
});

test('5. ledger list page loads with summary stats, running balances, and account filters', function () {
    $response = $this->actingAs($this->user)->get('/ledger?account_id='.$this->account->id);

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('ledger/index')
        ->has('stats')
        ->has('accountStats')
        ->has('ledgerEntries')
        ->has('accounts')
    );
});

test('6. can export filtered ledger CSV statement', function () {
    $response = $this->actingAs($this->user)->get('/ledger/export');

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
});
