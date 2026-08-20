<?php

use App\Models\FinancialAccount;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('user can view financial accounts page', function () {
    FinancialAccount::factory()->create(['name' => 'Main Cash Box', 'type' => 'cash']);

    $response = $this->actingAs($this->user)->get('/accounts');

    $response->assertStatus(200);
});

test('user can create a new financial account', function () {
    $response = $this->actingAs($this->user)->post('/accounts', [
        'name' => 'Meezan Islamic Account',
        'type' => 'bank',
        'bank_name' => 'Meezan Bank',
        'account_number' => 'PK99MEZN000111222',
        'opening_balance' => 250000.00,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('financial_accounts', [
        'name' => 'Meezan Islamic Account',
        'bank_name' => 'Meezan Bank',
        'current_balance' => 250000.00,
    ]);
});

test('user can update a financial account', function () {
    $account = FinancialAccount::factory()->create(['name' => 'Old Name', 'type' => 'cash']);

    $response = $this->actingAs($this->user)->put("/accounts/{$account->id}", [
        'name' => 'Updated Account Name',
        'type' => 'bank',
        'bank_name' => 'Updated Bank',
        'account_number' => '12345',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $account->id,
        'name' => 'Updated Account Name',
        'bank_name' => 'Updated Bank',
    ]);
});

test('user can toggle account active status', function () {
    $account = FinancialAccount::factory()->create(['is_active' => true]);

    $response = $this->actingAs($this->user)->post("/accounts/{$account->id}/toggle-status");

    $response->assertRedirect();
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $account->id,
        'is_active' => false,
    ]);
});

test('user can soft delete a financial account setting is_deleted to true', function () {
    $account = FinancialAccount::factory()->create(['is_deleted' => false]);

    $response = $this->actingAs($this->user)->delete("/accounts/{$account->id}");

    $response->assertRedirect();
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $account->id,
        'is_deleted' => true,
    ]);
});
