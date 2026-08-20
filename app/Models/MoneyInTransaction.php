<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class MoneyInTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'received_date',
        'received_from',
        'received_from_type',
        'client_id',
        'category_id',
        'account_id',
        'payment_method',
        'amount',
        'external_reference',
        'description',
        'notes',
        'attachment_path',
        'media_id',
        'status',
        'created_by',
        'updated_by',
        'voided_by',
        'voided_at',
        'void_reason',
        'is_deleted',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'received_date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'voided_at' => 'datetime',
            'is_deleted' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyInCategory::class, 'category_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinancialAccount::class, 'account_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
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
