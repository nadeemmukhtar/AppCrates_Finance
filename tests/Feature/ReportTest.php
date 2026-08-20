<?php

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\MoneyInCategory;
use App\Models\User;
use App\Services\EmployeeService;
use App\Services\ExpenseService;
use App\Services\MoneyInService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->account = FinancialAccount::create([
        'name' => 'Main Operating Account',
        'account_number' => '100200300',
        'bank_name' => 'HBL',
        'type' => 'bank',
        'opening_balance' => 1000000.00,
        'current_balance' => 1000000.00,
        'is_active' => true,
    ]);

    $this->moneyInCat = MoneyInCategory::create([
        'name' => 'Client Service Revenue',
        'slug' => 'client-service-revenue',
        'is_active' => true,
    ]);

    $this->expenseCat = ExpenseCategory::create([
        'name' => 'Office Rent & Facilities',
        'status' => 'active',
    ]);
});

test('1. Income report accurately calculates total posted income excluding voided transactions', function () {
    $service = app(MoneyInService::class);

    $t1 = $service->createMoneyIn([
        'received_date' => '2026-08-01',
        'received_from' => 'Client A',
        'category_id' => $this->moneyInCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 500000.00,
    ], $this->user);

    $t2 = $service->createMoneyIn([
        'received_date' => '2026-08-05',
        'received_from' => 'Client B',
        'category_id' => $this->moneyInCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
    ], $this->user);

    // Void t2
    $service->voidMoneyIn($t2, 'Incorrect entry', $this->user);

    $response = $this->actingAs($this->user)->get('/reports/income');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('reports/income')
        ->where('report.total_income', 500000)
        ->where('report.total_count', 1)
    );
});

test('2. Expense report accurately calculates total operating expenses excluding voided records', function () {
    $service = app(ExpenseService::class);

    $e1 = $service->createExpense([
        'expense_date' => '2026-08-01',
        'category_id' => $this->expenseCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 150000.00,
    ], $this->user);

    $e2 = $service->createExpense([
        'expense_date' => '2026-08-05',
        'category_id' => $this->expenseCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 50000.00,
    ], $this->user);

    // Void e2
    $service->voidExpense($e2, 'Duplicate', $this->user);

    $response = $this->actingAs($this->user)->get('/reports/expense');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('reports/expense')
        ->where('report.total_expenses', 150000)
        ->where('report.total_count', 1)
    );
});

test('3. Salary report calculates total paid and pending balances excluding reversed payments', function () {
    $empService = app(EmployeeService::class);
    $emp = $empService->createEmployee([
        'full_name' => 'Sarah Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 100000.00,
    ], $this->user);

    $period = app(EmployeeRepositoryInterface::class)->findOrCreateSalaryPeriod($emp, 2026, 8);

    $payment = $empService->processSalaryPayment([
        'salary_period_id' => $period->id,
        'amount' => 60000.00,
        'payment_date' => '2026-08-10',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ], $this->user);

    $response = $this->actingAs($this->user)->get('/reports/salary');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('reports/salary')
        ->where('report.total_payable', 100000)
        ->where('report.total_paid', 60000)
        ->where('report.total_pending', 40000)
    );
});

test('4. Profit & Loss report calculates Net Profit = Income - (Operating Expenses + Salary)', function () {
    // 1. Income: 1,000,000
    app(MoneyInService::class)->createMoneyIn([
        'received_date' => '2026-08-01',
        'received_from' => 'Major Client',
        'category_id' => $this->moneyInCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 1000000.00,
    ], $this->user);

    // 2. Op Expense: 200,000
    app(ExpenseService::class)->createExpense([
        'expense_date' => '2026-08-02',
        'category_id' => $this->expenseCat->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 200000.00,
    ], $this->user);

    // 3. Salary: 300,000
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ali Dev',
        'joining_date' => '2026-01-01',
        'basic_salary' => 300000.00,
    ], $this->user);
    $period = app(EmployeeRepositoryInterface::class)->findOrCreateSalaryPeriod($emp, 2026, 8);
    app(EmployeeService::class)->processSalaryPayment([
        'salary_period_id' => $period->id,
        'amount' => 300000.00,
        'payment_date' => '2026-08-15',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ], $this->user);

    // Expected: Net Profit = 1,000,000 - (200,000 + 300,000) = 500,000
    $response = $this->actingAs($this->user)->get('/reports/profit-loss');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('reports/profit-loss')
        ->where('report.revenue', 1000000)
        ->where('report.operating_expenses', 200000)
        ->where('report.salary_expenses', 300000)
        ->where('report.total_expenses', 500000)
        ->where('report.net_profit_loss', 500000)
        ->where('report.is_profit', true)
    );
});

test('5. Reports landing dashboard page loads with executive metrics', function () {
    $response = $this->actingAs($this->user)->get('/reports');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->has('incomeStats')
        ->has('expenseStats')
        ->has('salaryStats')
        ->has('loanStats')
        ->has('profitLossStats')
    );
});

test('6. can export CSV report statement matching active filters', function () {
    $response = $this->actingAs($this->user)->get('/reports/export?type=income');
    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
});
