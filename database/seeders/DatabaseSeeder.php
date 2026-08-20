<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            // FinancialAccountSeeder::class,
            // LenderSeeder::class,
            // MoneyInCategorySeeder::class,
            // MoneyInSeeder::class,
            // EmployeeSeeder::class,
            ExpenseCategorySeeder::class,
            // ExpenseSeeder::class,
        ]);
    }
}
