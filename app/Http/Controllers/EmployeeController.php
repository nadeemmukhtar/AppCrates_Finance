<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Http\Requests\Employee\ReverseSalaryPaymentRequest;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\StoreSalaryPaymentRequest;
use App\Http\Requests\Employee\StoreSalaryPeriodRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Requests\Employee\UpdateSalaryRequest;
use App\Models\Employee;
use App\Models\SalaryPayment;
use App\Services\EmployeeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeRepositoryInterface $employeeRepository,
        protected FinancialAccountRepositoryInterface $accountRepository,
        protected EmployeeService $employeeService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'status',
            'start_date',
            'end_date',
            'sort_by',
        ]);

        return Inertia::render('employees/index', [
            'stats' => $this->employeeRepository->getSummaryStats(),
            'employees' => $this->employeeRepository->getPaginatedWithFilters($filters),
            'accounts' => $this->accountRepository->allActive(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $employee = $this->employeeService->createEmployee($request->validated(), $request->user());

        return redirect()->back()->with('success', "Employee {$employee->full_name} ({$employee->employee_id}) created successfully!");
    }

    public function show(Request $request, int $id): Response
    {
        $employee = $this->employeeRepository->findWithRelations($id);

        if (! $employee) {
            abort(404, 'Employee record not found.');
        }

        $activeTab = $request->query('tab', 'overview');

        return Inertia::render('employees/show', [
            'employee' => $employee,
            'accounts' => $this->accountRepository->allActive(),
            'activeTab' => $activeTab,
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $this->employeeRepository->updateEmployee($employee, $request->validated());

        return redirect()->back()->with('success', "Employee details for {$employee->full_name} updated successfully!");
    }

    public function toggleStatus(Employee $employee): RedirectResponse
    {
        $this->employeeRepository->toggleStatus($employee);
        $newStatus = ucfirst($employee->status);

        return redirect()->back()->with('success', "Employee {$employee->full_name} is now {$newStatus}.");
    }

    public function updateSalary(UpdateSalaryRequest $request, Employee $employee): RedirectResponse
    {
        $this->employeeService->updateSalary($employee, $request->validated(), $request->user());

        return redirect()->back()->with('success', "Salary structure updated for {$employee->full_name}. Historical records preserved.");
    }

    public function generatePeriod(StoreSalaryPeriodRequest $request, Employee $employee): RedirectResponse
    {
        $period = $this->employeeRepository->findOrCreateSalaryPeriod(
            $employee,
            (int) $request->input('salary_year'),
            (int) $request->input('salary_month')
        );

        $monthName = date('F', mktime(0, 0, 0, $period->salary_month, 10));

        return redirect()->back()->with('success', "Salary period {$monthName} {$period->salary_year} generated for {$employee->full_name}.");
    }

    public function storePayment(StoreSalaryPaymentRequest $request): RedirectResponse
    {
        try {
            $payment = $this->employeeService->processSalaryPayment($request->validated(), $request->user());

            return redirect()->back()->with('success', "Salary payment {$payment->reference} posted successfully!");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function reversePayment(ReverseSalaryPaymentRequest $request, SalaryPayment $payment): RedirectResponse
    {
        try {
            $reversed = $this->employeeService->reverseSalaryPayment($payment, $request->input('reason'), $request->user());

            return redirect()->back()->with('success', "Salary payment {$reversed->reference} has been reversed successfully.");
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
