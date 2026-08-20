<?php

namespace Database\Seeders;

use App\Models\MoneyInCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MoneyInCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Client Payment',
                'description' => 'Payments received directly from clients for invoices, contracts, or orders.',
            ],
            [
                'name' => 'Sales',
                'description' => 'Revenue generated from direct product sales or merchandise.',
            ],
            [
                'name' => 'Service Revenue',
                'description' => 'Income generated from professional services, consulting, or subscriptions.',
            ],
            [
                'name' => 'Other Income',
                'description' => 'Miscellaneous non-operating revenue such as rebates or asset sales.',
            ],
            [
                'name' => 'Investment',
                'description' => 'Capital injections or equity investments from shareholders.',
            ],
            [
                'name' => 'Other',
                'description' => 'Uncategorized incoming cash transactions.',
            ],
        ];

        foreach ($categories as $cat) {
            MoneyInCategory::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}
