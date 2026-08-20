<?php

namespace Database\Seeders;

use App\Models\FinancialAccount;
use App\Models\MoneyInCategory;
use App\Models\MoneyInTransaction;
use App\Models\User;
use App\Services\MoneyInService;
use Illuminate\Database\Seeder;

class MoneyInSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();
        $account = FinancialAccount::first() ?? FinancialAccount::create([
            'name' => 'Main Cash Box',
            'type' => 'cash',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
            'is_active' => true,
        ]);

        $clientCategory = MoneyInCategory::where('slug', 'client-payment')->first();
        $serviceCategory = MoneyInCategory::where('slug', 'service-revenue')->first();
        $salesCategory = MoneyInCategory::where('slug', 'sales')->first();

        if (MoneyInTransaction::count() === 0) {
            /** @var MoneyInService $service */
            $service = app(MoneyInService::class);

            $service->createMoneyIn([
                'received_date' => now()->toDateString(),
                'received_from' => 'ABC Client Ltd',
                'received_from_type' => 'client',
                'category_id' => $clientCategory?->id ?? 1,
                'account_id' => $account->id,
                'payment_method' => 'bank_transfer',
                'amount' => 500000.00,
                'external_reference' => 'TXN-998822',
                'description' => 'Payment for Q3 software delivery milestone.',
                'notes' => 'Cleared via HBL online portal.',
            ], $user);

            $service->createMoneyIn([
                'received_date' => now()->subDays(2)->toDateString(),
                'received_from' => 'XYZ Retailers',
                'received_from_type' => 'customer',
                'category_id' => $salesCategory?->id ?? 1,
                'account_id' => $account->id,
                'payment_method' => 'cash',
                'amount' => 150000.00,
                'description' => 'Store front cash sales receipt.',
            ], $user);

            $service->createMoneyIn([
                'received_date' => now()->subDays(5)->toDateString(),
                'received_from' => 'Global Advisory Group',
                'received_from_type' => 'company',
                'category_id' => $serviceCategory?->id ?? 1,
                'account_id' => $account->id,
                'payment_method' => 'online_transfer',
                'amount' => 300000.00,
                'description' => 'Retainer fee for August 2026.',
            ], $user);
        }
    }
}
