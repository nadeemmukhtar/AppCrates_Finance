<?php

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use App\Models\SalaryPayment;
use App\Models\SalaryPeriod;
use App\Models\User;
use App\Services\EmployeeService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->account = FinancialAccount::create([
        'name' => 'HBL Main Bank Account',
        'account_number' => '1234567890',
        'bank_name' => 'Habib Bank Limited',
        'type' => 'bank',
        'opening_balance' => 1000000.00,
        'current_balance' => 1000000.00,
        'is_active' => true,
    ]);
});

test('1. can create an employee with auto-generated EMP-0001 ID and initial salary structure', function () {
    $response = $this->actingAs($this->user)->post('/employees', [
        'full_name' => 'Ahmed Khan',
        'email' => 'ahmed@company.com',
        'phone' => '03001234567',
        'joining_date' => '2026-08-01',
        'status' => 'active',
        'basic_salary' => 100000.00,
        'allowances' => 10000.00,
        'deductions' => 5000.00,
    ]);

    $response->assertRedirect();

    $employee = Employee::where('email', 'ahmed@company.com')->first();
    expect($employee)->not->toBeNull();
    expect($employee->employee_id)->toBe('EMP-0001');
    expect($employee->full_name)->toBe('Ahmed Khan');

    $salary = $employee->currentSalary;
    expect($salary)->not->toBeNull();
    expect((float) $salary->basic_salary)->toEqual(100000.0);
    expect((float) $salary->allowances)->toEqual(10000.0);
    expect((float) $salary->deductions)->toEqual(5000.0);
    expect((float) $salary->net_salary)->toEqual(105000.0); // 100k + 10k - 5k = 105k
});

test('2. sequential employee ID generation increments correctly and does not reuse IDs when deactivated', function () {
    $emp1 = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Employee One',
        'joining_date' => '2026-01-01',
        'basic_salary' => 50000,
    ], $this->user);

    $emp2 = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Employee Two',
        'joining_date' => '2026-01-01',
        'basic_salary' => 60000,
    ], $this->user);

    expect($emp1->employee_id)->toBe('EMP-0001');
    expect($emp2->employee_id)->toBe('EMP-0002');

    // Deactivate Employee Two
    $this->actingAs($this->user)->post("/employees/{$emp2->id}/toggle-status");
    expect($emp2->fresh()->status)->toBe('inactive');

    // Create Employee Three
    $emp3 = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Employee Three',
        'joining_date' => '2026-01-01',
        'basic_salary' => 70000,
    ], $this->user);

    expect($emp3->employee_id)->toBe('EMP-0003');
});

test('3. can update employee basic information', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Old Name',
        'joining_date' => '2026-01-01',
        'basic_salary' => 50000,
    ], $this->user);

    $response = $this->actingAs($this->user)->put("/employees/{$emp->id}", [
        'full_name' => 'New Name Updated',
        'email' => 'updated@company.com',
        'phone' => '03211112222',
        'joining_date' => '2026-01-01',
        'status' => 'active',
    ]);

    $response->assertRedirect();
    expect($emp->fresh()->full_name)->toBe('New Name Updated');
    expect($emp->fresh()->email)->toBe('updated@company.com');
});

test('4. updating salary creates a new history record and preserves historical records', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 80000.00,
        'allowances' => 5000.00,
        'deductions' => 0.00,
    ], $this->user);

    expect(EmployeeSalary::where('employee_id', $emp->id)->count())->toBe(1);
    expect((float) $emp->currentSalary->net_salary)->toEqual(85000.0);

    // Update Salary
    $response = $this->actingAs($this->user)->post("/employees/{$emp->id}/salary", [
        'basic_salary' => 100000.00,
        'allowances' => 10000.00,
        'deductions' => 5000.00,
        'effective_date' => '2026-08-01',
    ]);

    $response->assertRedirect();

    expect(EmployeeSalary::where('employee_id', $emp->id)->count())->toBe(2);

    $oldSalary = EmployeeSalary::where('employee_id', $emp->id)->orderBy('id', 'asc')->first();
    expect((float) $oldSalary->net_salary)->toEqual(85000.0);
});

test('5. can generate monthly salary period and prevents duplicate periods for same employee and month', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 100000.00,
    ], $this->user);

    $response1 = $this->actingAs($this->user)->post("/employees/{$emp->id}/periods", [
        'salary_year' => 2026,
        'salary_month' => 8,
    ]);

    $response1->assertRedirect();
    expect(SalaryPeriod::where('employee_id', $emp->id)->count())->toBe(1);

    // Second call for same year and month should return existing period without throwing duplicate error
    $response2 = $this->actingAs($this->user)->post("/employees/{$emp->id}/periods", [
        'salary_year' => 2026,
        'salary_month' => 8,
    ]);

    $response2->assertRedirect();
    expect(SalaryPeriod::where('employee_id', $emp->id)->count())->toBe(1);
});

test('6. supports partial salary payments and updates remaining balance and status correctly', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 100000.00, // Net 100,000
    ], $this->user);

    $repo = app(EmployeeRepositoryInterface::class);
    $period = $repo->findOrCreateSalaryPeriod($emp, 2026, 8);

    expect((float) $period->salary_amount)->toEqual(100000.0);
    expect((float) $period->total_paid)->toEqual(0.0);
    expect((float) $period->remaining_amount)->toEqual(100000.0);
    expect($period->computed_status)->toBe('pending');

    // Partial Payment 1: 60,000
    $response1 = $this->actingAs($this->user)->post('/employees/payments', [
        'salary_period_id' => $period->id,
        'amount' => 60000.00,
        'payment_date' => '2026-08-01',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $response1->assertRedirect();

    $period->refresh();
    expect((float) $period->total_paid)->toEqual(60000.0);
    expect((float) $period->remaining_amount)->toEqual(40000.0);
    expect($period->status)->toBe('partial');
    expect((float) $this->account->fresh()->current_balance)->toEqual(940000.0); // 1,000,000 - 60,000

    // Partial Payment 2: 40,000
    $response2 = $this->actingAs($this->user)->post('/employees/payments', [
        'salary_period_id' => $period->id,
        'amount' => 40000.00,
        'payment_date' => '2026-08-05',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $response2->assertRedirect();

    $period->refresh();
    expect((float) $period->total_paid)->toEqual(100000.0);
    expect((float) $period->remaining_amount)->toEqual(0.0);
    expect($period->status)->toBe('paid');
    expect((float) $this->account->fresh()->current_balance)->toEqual(900000.0); // 940,000 - 40,000
});

test('7. prevents salary payments exceeding remaining payable amount', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 50000.00,
    ], $this->user);

    $repo = app(EmployeeRepositoryInterface::class);
    $period = $repo->findOrCreateSalaryPeriod($emp, 2026, 8);

    // Try paying 60,000 when net salary is 50,000
    $response = $this->actingAs($this->user)->post('/employees/payments', [
        'salary_period_id' => $period->id,
        'amount' => 60000.00,
        'payment_date' => '2026-08-01',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $response->assertSessionHasErrors(['error']);
    expect((float) $period->fresh()->total_paid)->toEqual(0.0);
    expect((float) $this->account->fresh()->current_balance)->toEqual(1000000.0);
});

test('8. creates double-entry ledger record on salary payment', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 50000.00,
    ], $this->user);

    $repo = app(EmployeeRepositoryInterface::class);
    $period = $repo->findOrCreateSalaryPeriod($emp, 2026, 8);

    $this->actingAs($this->user)->post('/employees/payments', [
        'salary_period_id' => $period->id,
        'amount' => 50000.00,
        'payment_date' => '2026-08-01',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $payment = SalaryPayment::first();
    expect($payment)->not->toBeNull();
    expect($payment->reference)->toBe('SALPAY-0001');

    $ledgerEntry = LedgerEntry::where('reference_id', $payment->id)
        ->where('reference_type', SalaryPayment::class)
        ->first();

    expect($ledgerEntry)->not->toBeNull();
    expect((float) $ledgerEntry->debit)->toEqual(50000.0);
    expect((float) $ledgerEntry->credit)->toEqual(0.0);
    expect($ledgerEntry->transaction_type)->toBe('salary_payment');
});

test('9. payment reversal restores account balance, posts reversing ledger entry, and recalculates period status', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 100000.00,
    ], $this->user);

    $repo = app(EmployeeRepositoryInterface::class);
    $period = $repo->findOrCreateSalaryPeriod($emp, 2026, 8);

    // Pay full 100k
    $this->actingAs($this->user)->post('/employees/payments', [
        'salary_period_id' => $period->id,
        'amount' => 100000.00,
        'payment_date' => '2026-08-01',
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $payment = SalaryPayment::first();
    expect($period->fresh()->status)->toBe('paid');
    expect((float) $this->account->fresh()->current_balance)->toEqual(900000.0);

    // Reverse payment
    $response = $this->actingAs($this->user)->post("/employees/payments/{$payment->id}/reverse", [
        'reason' => 'Wrong bank account chosen during transfer',
    ]);

    $response->assertRedirect();

    $payment->refresh();
    expect($payment->status)->toBe('reversed');
    expect($payment->reversal_reason)->toBe('Wrong bank account chosen during transfer');

    // Account balance restored
    expect((float) $this->account->fresh()->current_balance)->toEqual(1000000.0);

    // Period status recalculated back to pending
    $period->refresh();
    expect((float) $period->total_paid)->toEqual(0.0);
    expect((float) $period->remaining_amount)->toEqual(100000.0);
    expect($period->status)->toBe('pending');

    // Reversing ledger entry exists
    $reversalLedger = LedgerEntry::where('reference_id', $payment->id)
        ->where('transaction_type', 'salary_payment_reversal')
        ->first();

    expect($reversalLedger)->not->toBeNull();
    expect((float) $reversalLedger->credit)->toEqual(100000.0);
});

test('10. employee details page loads profile with 6 tabs data', function () {
    $emp = app(EmployeeService::class)->createEmployee([
        'full_name' => 'Ahmed Khan',
        'joining_date' => '2026-01-01',
        'basic_salary' => 100000.00,
    ], $this->user);

    $response = $this->actingAs($this->user)->get("/employees/{$emp->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('employees/show')
        ->has('employee')
        ->has('accounts')
    );
});
