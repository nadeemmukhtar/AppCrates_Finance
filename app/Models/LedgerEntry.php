<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class LedgerEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'transaction_date',
        'account_id',
        'debit',
        'credit',
        'transaction_type',
        'reference_type',
        'reference_id',
        'description',
        'created_by',
        'is_deleted',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date:Y-m-d',
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'is_deleted' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinancialAccount::class, 'account_id');
    }

    public function referenceable(): MorphTo
    {
        return $this->morphTo('referenceable', 'reference_type', 'reference_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
