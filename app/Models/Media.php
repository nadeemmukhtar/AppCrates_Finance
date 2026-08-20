<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'file_name',
        'display_name',
        'file_path',
        'disk',
        'mime_type',
        'file_size',
        'created_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_deleted' => 'boolean',
    ];

    protected $appends = [
        'url',
    ];

    public function getUrlAttribute(): string
    {
        if (! $this->file_path) {
            return '';
        }

        return Storage::disk($this->disk ?? 'public')->url($this->file_path);
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
