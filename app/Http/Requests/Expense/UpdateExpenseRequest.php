<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expense_date' => ['required', 'date'],
            'category_id' => ['required', 'exists:expense_categories,id'],
            'account_id' => ['required', 'exists:financial_accounts,id'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,cheque,online_transfer,card,other'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'external_reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
