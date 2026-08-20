<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'salary_year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'salary_month' => ['required', 'integer', 'min:1', 'max:12'],
        ];
    }
}
