<?php

namespace Database\Seeders;

use App\Models\Lender;
use Illuminate\Database\Seeder;

class LenderSeeder extends Seeder
{
    public function run(): void
    {
        Lender::firstOrCreate(
            ['name' => 'Habib Bank Limited (Commercial Loan)'],
            [
                'type' => 'bank',
                'phone' => '+92 21 111-111-425',
                'email' => 'corporate@hbl.com',
                'address' => 'HBL Tower, I.I. Chundrigar Road, Karachi',
                'notes' => 'Commercial credit facility',
            ]
        );

        Lender::firstOrCreate(
            ['name' => 'TechVentures Pvt Ltd'],
            [
                'type' => 'company',
                'phone' => '+92 42 35710000',
                'email' => 'contact@techventures.pk',
                'address' => 'Gulberg III, Lahore',
                'notes' => 'Short term corporate loan',
            ]
        );

        Lender::firstOrCreate(
            ['name' => 'Sheikh Muhammad Ali'],
            [
                'type' => 'individual',
                'phone' => '+92 300 1234567',
                'email' => 'ali.sheikh@gmail.com',
                'address' => 'Defense Phase 5, Karachi',
                'notes' => 'Private investor loan',
            ]
        );
    }
}
