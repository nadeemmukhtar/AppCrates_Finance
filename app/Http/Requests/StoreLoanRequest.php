<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lender_id' => ['required', 'exists:lenders,id'],
            'loan_date' => ['required', 'date'],
            'original_amount' => ['required', 'numeric', 'min:0.01'],
            'interest_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'interest_amount' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'payment_frequency' => ['nullable', 'in:one_time,monthly,quarterly,yearly,custom'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'destination_account_id' => ['required', 'exists:financial_accounts,id'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
