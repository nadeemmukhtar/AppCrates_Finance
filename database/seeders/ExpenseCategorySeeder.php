<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();

        $categories = [
            ['name' => 'Office Rent', 'description' => 'Monthly building/office rental expenses.'],
            ['name' => 'Utilities', 'description' => 'Electricity, water, gas, and trash services.'],
            ['name' => 'Internet', 'description' => 'Broadband, ISP, and fiber optics subscriptions.'],
            ['name' => 'Software', 'description' => 'Cloud software, SaaS licenses, and digital tools.'],
            ['name' => 'Marketing', 'description' => 'Digital ads, printing, PR, and promotional campaigns.'],
            ['name' => 'Travel', 'description' => 'Flight, hotel, fuel, and transport expenses.'],
            ['name' => 'Equipment', 'description' => 'Hardware, laptops, monitors, and office machinery.'],
            ['name' => 'Maintenance', 'description' => 'Office repairs, plumbing, HVAC, and generator service.'],
            ['name' => 'Office Supplies', 'description' => 'Stationery, tea, coffee, paper, and kitchen items.'],
            ['name' => 'Professional Services', 'description' => 'Legal, audit, tax consulting, and accounting fees.'],
            ['name' => 'Other', 'description' => 'Miscellaneous operating expenses.'],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(
                ['name' => $cat['name']],
                [
                    'description' => $cat['description'],
                    'status' => 'active',
                    'created_by' => $user->id,
                ]
            );
        }
    }
}
