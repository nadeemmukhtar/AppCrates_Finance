<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'salary_year',
        'salary_month',
        'salary_amount',
        'status',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'salary_year' => 'integer',
        'salary_month' => 'integer',
        'salary_amount' => 'float',
        'is_deleted' => 'boolean',
    ];

    protected $appends = [
        'total_paid',
        'remaining_amount',
        'computed_status',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class)->orderBy('payment_date', 'desc')->orderBy('id', 'desc');
    }

    public function postedPayments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class)->where('status', 'posted');
    }

    public function getTotalPaidAttribute(): float
    {
        if ($this->relationLoaded('postedPayments')) {
            return (float) $this->postedPayments->sum('amount');
        }

        return (float) $this->postedPayments()->sum('amount');
    }

    public function getRemainingAmountAttribute(): float
    {
        $remaining = (float) $this->salary_amount - $this->total_paid;

        return max(0.00, round($remaining, 2));
    }

    public function getComputedStatusAttribute(): string
    {
        $paid = $this->total_paid;
        $total = (float) $this->salary_amount;

        if ($paid <= 0) {
            return 'pending';
        }

        if ($paid >= $total - 0.01) {
            return 'paid';
        }

        return 'partial';
    }
}
