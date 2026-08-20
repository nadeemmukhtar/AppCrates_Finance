<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SalaryPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'salary_period_id',
        'reference',
        'payment_date',
        'amount',
        'payment_method',
        'account_id',
        'transaction_reference',
        'notes',
        'status',
        'created_by',
        'reversed_by',
        'reversed_at',
        'reversal_reason',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount' => 'float',
        'reversed_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    public function salaryPeriod(): BelongsTo
    {
        return $this->belongsTo(SalaryPeriod::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinancialAccount::class, 'account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reverser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function ledgerEntries(): MorphMany
    {
        return $this->morphMany(LedgerEntry::class, 'referenceable', 'reference_type', 'reference_id');
    }
}
