<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReverseRepaymentRequest;
use App\Http\Requests\StoreRepaymentRequest;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Services\LoanPaymentService;
use Illuminate\Http\RedirectResponse;

class LoanPaymentController extends Controller
{
    public function __construct(
        protected LoanPaymentService $paymentService
    ) {}

    public function store(StoreRepaymentRequest $request, Loan $loan): RedirectResponse
    {
        try {
            $payment = $this->paymentService->recordRepayment($loan, $request->validated(), $request->user());

            return redirect()->back()->with('success', "Repayment {$payment->reference} of PKR ".number_format((float) $payment->amount, 2).' recorded successfully.');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['amount' => $e->getMessage()]);
        }
    }

    public function reverse(ReverseRepaymentRequest $request, LoanPayment $payment): RedirectResponse
    {
        try {
            $this->paymentService->reverseRepayment($payment, $request->input('reason'), $request->user());

            return redirect()->back()->with('success', "Repayment {$payment->reference} has been reversed successfully.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
