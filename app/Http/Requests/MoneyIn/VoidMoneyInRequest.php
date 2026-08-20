<?php

namespace App\Http\Requests\MoneyIn;

use Illuminate\Foundation\Http\FormRequest;

class VoidMoneyInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }
}
