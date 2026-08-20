<?php

namespace App\Contracts\Repositories;

use Illuminate\Support\Collection;

interface ReportRepositoryInterface
{
    public function getIncomeReport(array $filters): array;

    public function getExpenseReport(array $filters): array;

    public function getSalaryReport(array $filters): array;

    public function getLoanReport(array $filters): array;

    public function getProfitLossReport(array $filters): array;

    public function getExportData(string $reportType, array $filters): Collection;
}
