<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'effective_date',
        'basic_salary',
        'allowances',
        'deductions',
        'net_salary',
        'created_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'effective_date' => 'date:Y-m-d',
        'basic_salary' => 'float',
        'allowances' => 'float',
        'deductions' => 'float',
        'net_salary' => 'float',
        'is_deleted' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
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
