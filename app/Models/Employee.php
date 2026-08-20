<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'full_name',
        'email',
        'phone',
        'joining_date',
        'status',
        'created_by',
        'updated_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'joining_date' => 'date:Y-m-d',
        'is_deleted' => 'boolean',
    ];

    public function salaries(): HasMany
    {
        return $this->hasMany(EmployeeSalary::class)->orderBy('effective_date', 'desc')->orderBy('id', 'desc');
    }

    public function currentSalary(): HasOne
    {
        return $this->hasOne(EmployeeSalary::class)->latestOfMany('effective_date');
    }

    public function salaryPeriods(): HasMany
    {
        return $this->hasMany(SalaryPeriod::class)->orderBy('salary_year', 'desc')->orderBy('salary_month', 'desc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
