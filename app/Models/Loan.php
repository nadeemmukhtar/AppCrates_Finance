<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'user_id',
        'lender_id',
        'loan_date',
        'original_amount',
        'interest_rate',
        'interest_amount',
        'due_date',
        'payment_frequency',
        'purpose',
        'notes',
        'attachment_path',
        'media_id',
        'destination_account_id',
        'status',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
        'created_by',
        'updated_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $appends = [
        'total_repaid',
        'remaining_balance',
        'repayment_progress',
        'computed_status',
    ];

    protected function casts(): array
    {
        return [
            'loan_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'original_amount' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'interest_amount' => 'decimal:2',
            'cancelled_at' => 'datetime',
            'is_deleted' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lender(): BelongsTo
    {
        return $this->belongsTo(Lender::class);
    }

    public function destinationAccount(): BelongsTo
    {
        return $this->belongsTo(FinancialAccount::class, 'destination_account_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class);
    }

    public function activePayments(): HasMany
    {
        return $this->hasMany(LoanPayment::class)->where('is_reversed', false);
    }

    public function ledgerEntries(): MorphMany
    {
        return $this->morphMany(LedgerEntry::class, 'reference');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function getTotalRepaidAttribute(): float
    {
        return (float) $this->activePayments()->sum('amount');
    }

    public function getRemainingBalanceAttribute(): float
    {
        $totalPayable = (float) $this->original_amount + (float) $this->interest_amount;
        $remaining = $totalPayable - $this->total_repaid;

        return max(0, $remaining);
    }

    public function getRepaymentProgressAttribute(): float
    {
        $totalPayable = (float) $this->original_amount + (float) $this->interest_amount;

        if ($totalPayable <= 0) {
            return 100.0;
        }

        $progress = ($this->total_repaid / $totalPayable) * 100;

        return min(100.0, round($progress, 1));
    }

    public function getComputedStatusAttribute(): string
    {
        if ($this->status === 'cancelled') {
            return 'cancelled';
        }

        $remaining = $this->remaining_balance;
        $repaid = $this->total_repaid;

        if ($remaining <= 0) {
            return 'fully_paid';
        }

        if ($this->due_date && $this->due_date->isPast() && $remaining > 0) {
            return 'overdue';
        }

        if ($repaid > 0) {
            return 'partially_paid';
        }

        return 'active';
    }
}
