<?php

use App\Models\Lender;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('user can view lenders list', function () {
    Lender::create([
        'name' => 'Habib Bank Ltd',
        'type' => 'bank',
        'phone' => '+92 300 1111111',
    ]);

    $response = $this->actingAs($this->user)->get(route('lenders.index'));

    $response->assertOk();
});

test('user can create a lender', function () {
    $response = $this->actingAs($this->user)->post(route('lenders.store'), [
        'name' => 'TechVentures Pvt Ltd',
        'type' => 'company',
        'phone' => '+92 42 35710000',
        'email' => 'info@techventures.pk',
        'address' => 'Gulberg III, Lahore',
    ]);

    $response->assertRedirect();

    $lender = Lender::where('name', 'TechVentures Pvt Ltd')->first();
    expect($lender)->not->toBeNull();
    expect($lender->type)->toBe('company');
    expect($lender->phone)->toBe('+92 42 35710000');
});

test('user can update a lender', function () {
    $lender = Lender::create([
        'name' => 'Original Name',
        'type' => 'individual',
        'phone' => '12345',
    ]);

    $response = $this->actingAs($this->user)->put(route('lenders.update', $lender->id), [
        'name' => 'Updated Name',
        'type' => 'company',
        'phone' => '99999',
    ]);

    $response->assertRedirect();

    $lender->refresh();
    expect($lender->name)->toBe('Updated Name');
    expect($lender->type)->toBe('company');
});

test('user can delete a lender without loans', function () {
    $lender = Lender::create([
        'name' => 'Deletable Lender',
        'type' => 'other',
    ]);

    $response = $this->actingAs($this->user)->delete(route('lenders.destroy', $lender->id));

    $response->assertRedirect();
    expect(Lender::find($lender->id))->toBeNull();
});

test('user cannot delete a lender with active loans', function () {
    $lender = Lender::create([
        'name' => 'Active Lender',
        'type' => 'bank',
    ]);

    Loan::create([
        'reference' => 'LN-TEST-001',
        'user_id' => $this->user->id,
        'lender_id' => $lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 100000.00,
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->user)->delete(route('lenders.destroy', $lender->id));

    $response->assertSessionHasErrors('error');
    expect(Lender::find($lender->id))->not->toBeNull();
});
