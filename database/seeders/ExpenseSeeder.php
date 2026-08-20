<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\User;
use App\Services\ExpenseService;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();
        $account = FinancialAccount::first() ?? FinancialAccount::create([
            'name' => 'HBL Main Account',
            'type' => 'bank',
            'opening_balance' => 1000000.00,
            'current_balance' => 1000000.00,
            'is_active' => true,
        ]);

        if (Expense::count() === 0) {
            /** @var ExpenseService $service */
            $service = app(ExpenseService::class);

            $rentCat = ExpenseCategory::where('name', 'Office Rent')->first();
            $utilCat = ExpenseCategory::where('name', 'Utilities')->first();
            $swCat = ExpenseCategory::where('name', 'Software')->first();

            if ($rentCat) {
                $service->createExpense([
                    'expense_date' => '2026-08-01',
                    'category_id' => $rentCat->id,
                    'account_id' => $account->id,
                    'payment_method' => 'bank_transfer',
                    'amount' => 200000.00,
                    'external_reference' => 'RENT-AUG-2026',
                    'description' => 'August Office Building Rent Payment',
                    'notes' => 'Transferred via HBL Corporate Netbanking',
                ], $user);
            }

            if ($utilCat) {
                $service->createExpense([
                    'expense_date' => '2026-08-05',
                    'category_id' => $utilCat->id,
                    'account_id' => $account->id,
                    'payment_method' => 'bank_transfer',
                    'amount' => 45000.00,
                    'external_reference' => 'KE-BILL-9901',
                    'description' => 'K-Electric Commercial Power Bill',
                ], $user);
            }

            if ($swCat) {
                $service->createExpense([
                    'expense_date' => '2026-08-10',
                    'category_id' => $swCat->id,
                    'account_id' => $account->id,
                    'payment_method' => 'card',
                    'amount' => 15000.00,
                    'external_reference' => 'AWS-INV-882',
                    'description' => 'Cloud Hosting & Servers Subscription',
                ], $user);
            }
        }
    }
}
