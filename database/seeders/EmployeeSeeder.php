<?php

namespace Database\Seeders;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\Employee;
use App\Models\FinancialAccount;
use App\Models\User;
use App\Services\EmployeeService;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();
        $account = FinancialAccount::first() ?? FinancialAccount::create([
            'name' => 'Main Cash Box',
            'type' => 'cash',
            'opening_balance' => 500000.00,
            'current_balance' => 500000.00,
            'is_active' => true,
        ]);

        if (Employee::count() === 0) {
            /** @var EmployeeService $service */
            $service = app(EmployeeService::class);

            // Employee 1: Ahmed Khan
            $emp1 = $service->createEmployee([
                'full_name' => 'Ahmed Khan',
                'email' => 'ahmed@company.com',
                'phone' => '03001234567',
                'joining_date' => '2026-01-01',
                'status' => 'active',
                'basic_salary' => 100000.00,
                'allowances' => 10000.00,
                'deductions' => 5000.00,
            ], $user);

            // Salary Period for August 2026
            $repository = app(EmployeeRepositoryInterface::class);
            $period1 = $repository->findOrCreateSalaryPeriod($emp1, 2026, 8);

            // Salary Payment 1 (Partial)
            $service->processSalaryPayment([
                'salary_period_id' => $period1->id,
                'amount' => 60000.00,
                'payment_date' => '2026-08-01',
                'payment_method' => 'bank_transfer',
                'account_id' => $account->id,
                'transaction_reference' => 'TXN-998112',
                'notes' => 'Partial advance salary disbursement.',
            ], $user);

            // Employee 2: Sara Malik
            $emp2 = $service->createEmployee([
                'full_name' => 'Sara Malik',
                'email' => 'sara@company.com',
                'phone' => '03219876543',
                'joining_date' => '2026-03-15',
                'status' => 'active',
                'basic_salary' => 140000.00,
                'allowances' => 15000.00,
                'deductions' => 5000.00,
            ], $user);

            $period2 = $repository->findOrCreateSalaryPeriod($emp2, 2026, 8);
            $service->processSalaryPayment([
                'salary_period_id' => $period2->id,
                'amount' => 150000.00,
                'payment_date' => '2026-08-05',
                'payment_method' => 'bank_transfer',
                'account_id' => $account->id,
                'transaction_reference' => 'TXN-998113',
                'notes' => 'Full salary payout for August 2026.',
            ], $user);

            // Employee 3: Usman Ali
            $service->createEmployee([
                'full_name' => 'Usman Ali',
                'email' => 'usman@company.com',
                'phone' => '03335554433',
                'joining_date' => '2026-06-01',
                'status' => 'active',
                'basic_salary' => 85000.00,
                'allowances' => 5000.00,
                'deductions' => 0.00,
            ], $user);
        }
    }
}
