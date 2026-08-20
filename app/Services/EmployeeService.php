<?php

namespace App\Services;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Models\Employee;
use App\Models\SalaryPayment;
use App\Models\SalaryPeriod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EmployeeService
{
    public function __construct(
        protected EmployeeRepositoryInterface $employeeRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected LedgerService $ledgerService
    ) {}

    public function createEmployee(array $data, ?User $user = null): Employee
    {
        return DB::transaction(function () use ($data, $user) {
            $employeeId = $this->employeeRepository->generateNextEmployeeId();

            $basic = (float) $data['basic_salary'];
            $allowances = (float) ($data['allowances'] ?? 0);
            $deductions = (float) ($data['deductions'] ?? 0);
            $netSalary = round($basic + $allowances - $deductions, 2);

            $employeeData = [
                'employee_id' => $employeeId,
                'full_name' => $data['full_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'joining_date' => $data['joining_date'],
                'status' => $data['status'] ?? 'active',
                'created_by' => $user?->id,
            ];

            $salaryData = [
                'effective_date' => $data['effective_date'] ?? $data['joining_date'],
                'basic_salary' => $basic,
                'allowances' => $allowances,
                'deductions' => $deductions,
                'net_salary' => $netSalary,
                'created_by' => $user?->id,
            ];

            return $this->employeeRepository->createEmployee($employeeData, $salaryData);
        });
    }

    public function updateSalary(Employee $employee, array $data, ?User $user = null): Employee
    {
        return DB::transaction(function () use ($employee, $data, $user) {
            $basic = (float) $data['basic_salary'];
            $allowances = (float) ($data['allowances'] ?? 0);
            $deductions = (float) ($data['deductions'] ?? 0);
            $netSalary = round($basic + $allowances - $deductions, 2);

            $salaryData = [
                'effective_date' => $data['effective_date'] ?? now()->toDateString(),
                'basic_salary' => $basic,
                'allowances' => $allowances,
                'deductions' => $deductions,
                'net_salary' => $netSalary,
                'created_by' => $user?->id,
            ];

            return $this->employeeRepository->createSalaryRecord($employee, $salaryData);
        });
    }

    public function processSalaryPayment(array $data, ?User $user = null): SalaryPayment
    {
        return DB::transaction(function () use ($data, $user) {
            /** @var SalaryPeriod $period */
            $period = SalaryPeriod::where('id', $data['salary_period_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $amount = round((float) $data['amount'], 2);

            if ($amount <= 0) {
                throw new InvalidArgumentException('Payment amount must be greater than zero.');
            }

            $remaining = $period->remaining_amount;

            if ($amount > $remaining + 0.01) {
                throw new InvalidArgumentException("Payment amount (PKR {$amount}) cannot exceed remaining payable salary (PKR {$remaining}).");
            }

            $account = $this->accountRepository->find($data['account_id']);

            if (! $account) {
                throw new InvalidArgumentException('Selected company financial account does not exist.');
            }

            if ($account->current_balance < $amount) {
                throw new InvalidArgumentException("Insufficient account balance. Account {$account->name} has PKR {$account->current_balance}, but PKR {$amount} is required.");
            }

            $reference = $this->employeeRepository->generateNextPaymentReference();

            $payment = $this->employeeRepository->createSalaryPayment([
                'salary_period_id' => $period->id,
                'reference' => $reference,
                'payment_date' => $data['payment_date'],
                'amount' => $amount,
                'payment_method' => $data['payment_method'],
                'account_id' => $account->id,
                'transaction_reference' => $data['transaction_reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'posted',
                'created_by' => $user?->id,
            ]);

            // Deduct balance from company financial account
            $this->accountRepository->updateBalance($account->id, $amount, 'subtract');

            // Record double-entry ledger entry (Debit: Salary Expense)
            $employeeName = $period->employee?->full_name ?? 'Employee';
            $monthYear = sprintf('%02d/%d', $period->salary_month, $period->salary_year);

            $this->ledgerService->recordEntry(
                $payment,
                $reference,
                $data['payment_date'],
                $account->id,
                $amount,
                0.00,
                'salary_payment',
                "Salary payment {$reference} for {$employeeName} ({$monthYear})",
                $user
            );

            // Update salary period status
            $period->refresh();
            $period->status = $period->computed_status;
            $period->save();

            return $payment;
        });
    }

    public function reverseSalaryPayment(SalaryPayment $payment, string $reason, ?User $user = null): SalaryPayment
    {
        return DB::transaction(function () use ($payment, $reason, $user) {
            if ($payment->status === 'reversed') {
                throw new InvalidArgumentException("Salary payment {$payment->reference} has already been reversed.");
            }

            /** @var SalaryPeriod $period */
            $period = SalaryPeriod::where('id', $payment->salary_period_id)
                ->lockForUpdate()
                ->firstOrFail();

            $amount = (float) $payment->amount;

            $updatedPayment = $this->employeeRepository->reverseSalaryPayment($payment, $reason, $user?->id ?? 0);

            // Restore financial account balance
            if ($payment->account_id) {
                $this->accountRepository->updateBalance($payment->account_id, $amount, 'add');
            }

            // Post reversing ledger entry (Credit: Cash/Bank Account)
            $employeeName = $period->employee?->full_name ?? 'Employee';

            $this->ledgerService->recordEntry(
                $updatedPayment,
                "REV-{$payment->reference}",
                now()->toDateString(),
                $payment->account_id,
                0.00,
                $amount,
                'salary_payment_reversal',
                "Reversal of salary payment {$payment->reference} for {$employeeName}. Reason: {$reason}",
                $user
            );

            // Recalculate salary period status
            $period->refresh();
            $period->status = $period->computed_status;
            $period->save();

            return $updatedPayment;
        });
    }
}
