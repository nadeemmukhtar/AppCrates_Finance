<?php

namespace App\Http\Requests\MoneyIn;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoneyInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'received_date' => ['required', 'date'],
            'received_from' => ['required', 'string', 'max:255'],
            'received_from_type' => ['nullable', 'string', 'in:client,customer,company,individual,other'],
            'category_id' => ['required', 'exists:money_in_categories,id'],
            'account_id' => ['required', 'exists:financial_accounts,id'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,cheque,online_transfer,other'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'external_reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
