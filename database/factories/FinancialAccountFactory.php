<?php

namespace Database\Factories;

use App\Models\FinancialAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinancialAccount>
 */
class FinancialAccountFactory extends Factory
{
    protected $model = FinancialAccount::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company().' Account',
            'type' => fake()->randomElement(['cash', 'bank', 'other']),
            'account_number' => fake()->bankAccountNumber(),
            'bank_name' => fake()->company().' Bank',
            'opening_balance' => fake()->randomFloat(2, 1000, 100000),
            'current_balance' => fake()->randomFloat(2, 1000, 100000),
            'is_active' => true,
        ];
    }
}
