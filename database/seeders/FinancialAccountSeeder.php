<?php

namespace Database\Seeders;

use App\Models\FinancialAccount;
use Illuminate\Database\Seeder;

class FinancialAccountSeeder extends Seeder
{
    public function run(): void
    {
        FinancialAccount::firstOrCreate(
            ['name' => 'Main Cash Account'],
            [
                'type' => 'cash',
                'account_number' => 'CASH-001',
                'bank_name' => 'Cash Box',
                'opening_balance' => 500000.00,
                'current_balance' => 500000.00,
                'is_active' => true,
            ]
        );

        FinancialAccount::firstOrCreate(
            ['name' => 'HBL Primary Account'],
            [
                'type' => 'bank',
                'account_number' => 'PK12HABB00012345678901',
                'bank_name' => 'Habib Bank Limited',
                'opening_balance' => 1500000.00,
                'current_balance' => 1500000.00,
                'is_active' => true,
            ]
        );

        FinancialAccount::firstOrCreate(
            ['name' => 'Meezan Islamic Account'],
            [
                'type' => 'bank',
                'account_number' => 'PK88MEZN00098765432101',
                'bank_name' => 'Meezan Bank',
                'opening_balance' => 1000000.00,
                'current_balance' => 1000000.00,
                'is_active' => true,
            ]
        );
    }
}
