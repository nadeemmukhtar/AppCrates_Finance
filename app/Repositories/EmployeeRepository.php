<?php

namespace App\Repositories;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\SalaryPayment;
use App\Models\SalaryPeriod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Employee::query()->with(['currentSalary', 'creator']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('joining_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('joining_date', '<=', $filters['end_date']);
        }

        // Sorting by salary or date
        if (! empty($filters['sort_by'])) {
            if ($filters['sort_by'] === 'salary_asc' || $filters['sort_by'] === 'salary_desc') {
                $direction = $filters['sort_by'] === 'salary_asc' ? 'asc' : 'desc';
                $query->select('employees.*')
                    ->leftJoin('employee_salaries', function ($join) {
                        $join->on('employees.id', '=', 'employee_salaries.employee_id')
                            ->whereRaw('employee_salaries.id = (SELECT id FROM employee_salaries WHERE employee_id = employees.id ORDER BY effective_date DESC, id DESC LIMIT 1)');
                    })
                    ->orderBy('employee_salaries.net_salary', $direction);
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function getSummaryStats(): array
    {
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();

        // Calculate current total monthly payroll
        $currentSalaries = Employee::where('status', 'active')
            ->get()
            ->map(fn ($emp) => $emp->currentSalary?->net_salary ?? 0);
        $totalMonthlyPayroll = (float) $currentSalaries->sum();

        // Total paid salary across all time from posted payments
        $totalSalaryPaid = (float) SalaryPayment::where('status', 'posted')->sum('amount');

        return [
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'inactive_employees' => $totalEmployees - $activeEmployees,
            'total_monthly_payroll' => round($totalMonthlyPayroll, 2),
            'total_salary_paid' => round($totalSalaryPaid, 2),
        ];
    }

    public function generateNextEmployeeId(): string
    {
        $lastEmployee = Employee::orderBy('id', 'desc')->first();

        if (! $lastEmployee) {
            return 'EMP-0001';
        }

        preg_match('/EMP-(\d+)/i', $lastEmployee->employee_id, $matches);

        if (isset($matches[1])) {
            $nextNum = (int) $matches[1] + 1;
        } else {
            $nextNum = $lastEmployee->id + 1;
        }

        return sprintf('EMP-%04d', $nextNum);
    }

    public function generateNextPaymentReference(): string
    {
        $lastPayment = SalaryPayment::orderBy('id', 'desc')->first();

        if (! $lastPayment) {
            return 'SALPAY-0001';
        }

        preg_match('/SALPAY-(\d+)/i', $lastPayment->reference, $matches);

        if (isset($matches[1])) {
            $nextNum = (int) $matches[1] + 1;
        } else {
            $nextNum = $lastPayment->id + 1;
        }

        return sprintf('SALPAY-%04d', $nextNum);
    }

    public function createEmployee(array $employeeData, array $salaryData): Employee
    {
        $employee = Employee::create($employeeData);

        $salaryData['employee_id'] = $employee->id;
        EmployeeSalary::create($salaryData);

        return $employee;
    }

    public function updateEmployee(Employee $employee, array $data): bool
    {
        return $employee->update($data);
    }

    public function toggleStatus(Employee $employee): bool
    {
        $employee->status = $employee->status === 'active' ? 'inactive' : 'active';

        return $employee->save();
    }

    public function findWithRelations(int $id): ?Employee
    {
        return Employee::with([
            'salaries' => fn ($q) => $q->with('creator'),
            'currentSalary',
            'salaryPeriods' => fn ($q) => $q->with(['postedPayments', 'payments.account', 'payments.creator', 'payments.reverser']),
            'creator',
            'updater',
        ])->find($id);
    }

    public function createSalaryRecord(Employee $employee, array $data): Employee
    {
        $data['employee_id'] = $employee->id;
        EmployeeSalary::create($data);

        return $employee->load('salaries', 'currentSalary');
    }

    public function findOrCreateSalaryPeriod(Employee $employee, int $year, int $month): SalaryPeriod
    {
        $period = SalaryPeriod::where('employee_id', $employee->id)
            ->where('salary_year', $year)
            ->where('salary_month', $month)
            ->first();

        if ($period) {
            return $period;
        }

        // Get applicable salary structure at that period
        $netSalary = $employee->currentSalary?->net_salary ?? 0.00;

        return SalaryPeriod::create([
            'employee_id' => $employee->id,
            'salary_year' => $year,
            'salary_month' => $month,
            'salary_amount' => $netSalary,
            'status' => 'pending',
        ]);
    }

    public function createSalaryPayment(array $data): SalaryPayment
    {
        return SalaryPayment::create($data);
    }

    public function reverseSalaryPayment(SalaryPayment $payment, string $reason, int $userId): SalaryPayment
    {
        $payment->update([
            'status' => 'reversed',
            'reversed_by' => $userId,
            'reversed_at' => now(),
            'reversal_reason' => $reason,
        ]);

        return $payment;
    }
}
