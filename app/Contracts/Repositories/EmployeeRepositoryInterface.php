<?php

namespace App\Contracts\Repositories;

use App\Models\Employee;
use App\Models\SalaryPayment;
use App\Models\SalaryPeriod;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface EmployeeRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function getSummaryStats(): array;

    public function generateNextEmployeeId(): string;

    public function generateNextPaymentReference(): string;

    public function createEmployee(array $employeeData, array $salaryData): Employee;

    public function updateEmployee(Employee $employee, array $data): bool;

    public function toggleStatus(Employee $employee): bool;

    public function findWithRelations(int $id): ?Employee;

    public function createSalaryRecord(Employee $employee, array $data): Employee;

    public function findOrCreateSalaryPeriod(Employee $employee, int $year, int $month): SalaryPeriod;

    public function createSalaryPayment(array $data): SalaryPayment;

    public function reverseSalaryPayment(SalaryPayment $payment, string $reason, int $userId): SalaryPayment;
}
