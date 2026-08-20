<?php

use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\FinancialAccount;
use App\Models\LedgerEntry;
use App\Models\Lender;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use App\Repositories\LoanRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->account = FinancialAccount::create([
        'name' => 'Main Cash Account',
        'type' => 'cash',
        'opening_balance' => 1000000.00,
        'current_balance' => 1000000.00,
        'is_active' => true,
    ]);

    $this->lender = Lender::create([
        'name' => 'Habib Bank Limited',
        'type' => 'bank',
        'phone' => '+92 300 0000000',
    ]);
});

test('repository interface correctly binds to repository implementation', function () {
    $instance = app(LoanRepositoryInterface::class);
    expect($instance)->toBeInstanceOf(LoanRepository::class);
});

test('user can create a loan and ledger entry is posted', function () {
    $response = $this->actingAs($this->user)->post(route('loans.store'), [
        'lender_id' => $this->lender->id,
        'destination_account_id' => $this->account->id,
        'original_amount' => 500000.00,
        'loan_date' => now()->toDateString(),
        'purpose' => 'Business Expansion',
    ]);

    $response->assertRedirect();

    $loan = Loan::where('lender_id', $this->lender->id)->first();
    expect($loan)->not->toBeNull();
    expect((float) $loan->original_amount)->toBe(500000.00);
    expect($loan->status)->toBe('active');
    expect($loan->reference)->toStartWith('LN-');

    // Account balance should increase by 500,000 (1,000,000 + 500,000 = 1,500,000)
    $this->account->refresh();
    expect((float) $this->account->current_balance)->toBe(1500000.00);

    // Ledger entry should be posted
    $ledger = LedgerEntry::where('reference_id', $loan->id)
        ->where('transaction_type', 'loan_received')
        ->first();
    expect($ledger)->not->toBeNull();
    expect((float) $ledger->debit)->toBe(500000.00);
});

test('user can record repayment and loan balance decreases', function () {
    $loan = Loan::create([
        'reference' => 'LN-2026-0001',
        'user_id' => $this->user->id,
        'lender_id' => $this->lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 500000.00,
        'destination_account_id' => $this->account->id,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->post(route('loans.repayments.store', $loan->id), [
        'payment_date' => now()->toDateString(),
        'amount' => 200000.00,
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
        'transaction_reference' => 'TRX-1001',
    ]);

    $response->assertRedirect();

    $loan->refresh();
    expect($loan->total_repaid)->toBe(200000.00);
    expect($loan->remaining_balance)->toBe(300000.00);
    expect($loan->status)->toBe('partially_paid');

    $payment = LoanPayment::where('loan_id', $loan->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->reference)->toStartWith('REP-');

    // Account balance should decrease by repayment amount (1,000,000 - 200,000 = 800,000)
    $this->account->refresh();
    expect((float) $this->account->current_balance)->toBe(800000.00);
});

test('loan status automatically updates to fully paid when completely repaid', function () {
    $loan = Loan::create([
        'reference' => 'LN-2026-0002',
        'user_id' => $this->user->id,
        'lender_id' => $this->lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 300000.00,
        'destination_account_id' => $this->account->id,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $this->actingAs($this->user)->post(route('loans.repayments.store', $loan->id), [
        'payment_date' => now()->toDateString(),
        'amount' => 300000.00,
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
    ]);

    $loan->refresh();
    expect($loan->remaining_balance)->toBe(0.0);
    expect($loan->status)->toBe('fully_paid');
});

test('user cannot repay more than remaining balance', function () {
    $loan = Loan::create([
        'reference' => 'LN-2026-0003',
        'user_id' => $this->user->id,
        'lender_id' => $this->lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 100000.00,
        'destination_account_id' => $this->account->id,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->post(route('loans.repayments.store', $loan->id), [
        'payment_date' => now()->toDateString(),
        'amount' => 150000.00,
        'payment_method' => 'cash',
        'account_id' => $this->account->id,
    ]);

    $response->assertSessionHasErrors('amount');
});

test('user can reverse repayment and account balance is restored', function () {
    $loan = Loan::create([
        'reference' => 'LN-2026-0004',
        'user_id' => $this->user->id,
        'lender_id' => $this->lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 200000.00,
        'destination_account_id' => $this->account->id,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $payment = LoanPayment::create([
        'loan_id' => $loan->id,
        'reference' => 'REP-2026-0001',
        'payment_date' => now()->toDateString(),
        'amount' => 100000.00,
        'payment_method' => 'bank_transfer',
        'account_id' => $this->account->id,
        'created_by' => $this->user->id,
    ]);

    $this->account->update(['current_balance' => 900000.00]);

    $response = $this->actingAs($this->user)->post(route('repayments.reverse', $payment->id), [
        'reason' => 'Duplicate payment entry error',
    ]);

    $response->assertRedirect();

    $payment->refresh();
    expect($payment->is_reversed)->toBeTrue();
    expect($payment->reversal_reason)->toBe('Duplicate payment entry error');

    // Account balance should be restored (+ 100,000)
    $this->account->refresh();
    expect((float) $this->account->current_balance)->toBe(1000000.00);

    $loan->refresh();
    expect($loan->total_repaid)->toBe(0.0);
});

test('user can cancel loan if no active repayments exist', function () {
    $loan = Loan::create([
        'reference' => 'LN-2026-0005',
        'user_id' => $this->user->id,
        'lender_id' => $this->lender->id,
        'loan_date' => now()->toDateString(),
        'original_amount' => 100000.00,
        'destination_account_id' => $this->account->id,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $this->account->update(['current_balance' => 1100000.00]);

    $response = $this->actingAs($this->user)->post(route('loans.cancel', $loan->id), [
        'reason' => 'Agreement revoked',
    ]);

    $response->assertRedirect();

    $loan->refresh();
    expect($loan->status)->toBe('cancelled');

    // Cash balance addition should be reversed (- 100,000)
    $this->account->refresh();
    expect((float) $this->account->current_balance)->toBe(1000000.00);
});
