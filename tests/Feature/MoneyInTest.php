<?php

use App\Models\FinancialAccount;
use App\Models\MoneyInCategory;
use App\Models\MoneyInTransaction;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->category = MoneyInCategory::create([
        'name' => 'Client Payment',
        'slug' => 'client-payment',
        'is_active' => true,
    ]);
    $this->account = FinancialAccount::create([
        'name' => 'Meezan Bank Account',
        'type' => 'bank',
        'bank_name' => 'Meezan Bank',
        'account_number' => 'PK99MEZN000111222',
        'opening_balance' => 100000.00,
        'current_balance' => 100000.00,
        'is_active' => true,
    ]);
});

test('user can view money in list page', function () {
    $response = $this->actingAs($this->user)->get('/money-in');

    $response->assertStatus(200);
});

test('user can create a new money in transaction', function () {
    $response = $this->actingAs($this->user)->post('/money-in', [
        'received_date' => now()->toDateString(),
        'received_from' => 'Acme Corporation',
        'received_from_type' => 'client',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 500000.00,
        'description' => 'Milestone 1 Payment',
    ]);

    $response->assertRedirect();

    // 1. Transaction record created with auto reference and linked client
    $this->assertDatabaseHas('money_in_transactions', [
        'received_from' => 'Acme Corporation',
        'amount' => 500000.00,
        'status' => 'posted',
    ]);

    // 2. Client record created in clients table
    $this->assertDatabaseHas('clients', [
        'name' => 'Acme Corporation',
        'type' => 'client',
    ]);

    // 3. Financial account balance updated (100,000 + 500,000 = 600,000)
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $this->account->id,
        'current_balance' => 600000.00,
    ]);

    // 4. Double-entry ledger record created
    $this->assertDatabaseHas('ledger_entries', [
        'account_id' => $this->account->id,
        'debit' => 500000.00,
        'transaction_type' => 'money_in',
    ]);
});

test('editing a money in transaction recalculates financial account balance correctly', function () {
    // Create initial transaction of 500,000
    $transaction = MoneyInTransaction::create([
        'reference' => 'MI-2026-00001',
        'received_date' => now()->toDateString(),
        'received_from' => 'Acme Corp',
        'received_from_type' => 'client',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 500000.00,
        'status' => 'posted',
        'created_by' => $this->user->id,
    ]);
    $this->account->update(['current_balance' => 600000.00]);

    // Update transaction to 550,000
    $response = $this->actingAs($this->user)->put("/money-in/{$transaction->id}", [
        'received_date' => now()->toDateString(),
        'received_from' => 'Acme Corp Updated',
        'received_from_type' => 'client',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'bank_transfer',
        'amount' => 550000.00,
    ]);

    $response->assertRedirect();

    // Balance should now be 650,000 (600,000 - 500,000 + 550,000)
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $this->account->id,
        'current_balance' => 650000.00,
    ]);

    $this->assertDatabaseHas('money_in_transactions', [
        'id' => $transaction->id,
        'amount' => 550000.00,
        'received_from' => 'Acme Corp Updated',
    ]);
});

test('voiding a money in transaction reverses account balance and posts reversing ledger entry', function () {
    // Create transaction of 300,000
    $transaction = MoneyInTransaction::create([
        'reference' => 'MI-2026-00002',
        'received_date' => now()->toDateString(),
        'received_from' => 'Stark Industries',
        'received_from_type' => 'company',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'online_transfer',
        'amount' => 300000.00,
        'status' => 'posted',
        'created_by' => $this->user->id,
    ]);
    $this->account->update(['current_balance' => 400000.00]);

    // Void transaction
    $response = $this->actingAs($this->user)->post("/money-in/{$transaction->id}/void", [
        'reason' => 'Cheque returned due to signature mismatch.',
    ]);

    $response->assertRedirect();

    // Transaction status should be voided
    $this->assertDatabaseHas('money_in_transactions', [
        'id' => $transaction->id,
        'status' => 'voided',
        'void_reason' => 'Cheque returned due to signature mismatch.',
    ]);

    // Account balance should be reversed back to 100,000
    $this->assertDatabaseHas('financial_accounts', [
        'id' => $this->account->id,
        'current_balance' => 100000.00,
    ]);

    // Reversing ledger entry should be posted
    $this->assertDatabaseHas('ledger_entries', [
        'account_id' => $this->account->id,
        'credit' => 300000.00,
        'transaction_type' => 'money_in_void',
    ]);
});

test('voided transaction cannot be edited or voided twice', function () {
    $transaction = MoneyInTransaction::create([
        'reference' => 'MI-2026-00003',
        'received_date' => now()->toDateString(),
        'received_from' => 'Wayne Enterprises',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'cash',
        'amount' => 100000.00,
        'status' => 'voided',
        'void_reason' => 'Initial void reason',
    ]);

    // Attempting edit on voided transaction should fail
    $response = $this->actingAs($this->user)->put("/money-in/{$transaction->id}", [
        'received_date' => now()->toDateString(),
        'received_from' => 'Wayne Enterprises Modified',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'cash',
        'amount' => 200000.00,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['error']);

    // Attempting second void should fail
    $voidResponse = $this->actingAs($this->user)->post("/money-in/{$transaction->id}/void", [
        'reason' => 'Second void attempt',
    ]);

    $voidResponse->assertRedirect();
    $voidResponse->assertSessionHasErrors(['error']);
});

test('amount must be greater than zero when creating money in', function () {
    $response = $this->actingAs($this->user)->post('/money-in', [
        'received_date' => now()->toDateString(),
        'received_from' => 'Test',
        'category_id' => $this->category->id,
        'account_id' => $this->account->id,
        'payment_method' => 'cash',
        'amount' => -50.00,
    ]);

    $response->assertSessionHasErrors(['amount']);
});
