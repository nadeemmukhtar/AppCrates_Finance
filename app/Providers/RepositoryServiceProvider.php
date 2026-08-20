<?php

namespace App\Providers;

use App\Contracts\Repositories\EmployeeRepositoryInterface;
use App\Contracts\Repositories\ExpenseRepositoryInterface;
use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LedgerRepositoryInterface;
use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Contracts\Repositories\LoanPaymentRepositoryInterface;
use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Contracts\Repositories\MoneyInRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Repositories\EmployeeRepository;
use App\Repositories\ExpenseRepository;
use App\Repositories\FinancialAccountRepository;
use App\Repositories\LedgerRepository;
use App\Repositories\LenderRepository;
use App\Repositories\LoanPaymentRepository;
use App\Repositories\LoanRepository;
use App\Repositories\MoneyInRepository;
use App\Repositories\ReportRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(LenderRepositoryInterface::class, LenderRepository::class);
        $this->app->bind(FinancialAccountRepositoryInterface::class, FinancialAccountRepository::class);
        $this->app->bind(LoanRepositoryInterface::class, LoanRepository::class);
        $this->app->bind(LoanPaymentRepositoryInterface::class, LoanPaymentRepository::class);
        $this->app->bind(LedgerRepositoryInterface::class, LedgerRepository::class);
        $this->app->bind(MoneyInRepositoryInterface::class, MoneyInRepository::class);
        $this->app->bind(EmployeeRepositoryInterface::class, EmployeeRepository::class);
        $this->app->bind(ExpenseRepositoryInterface::class, ExpenseRepository::class);
        $this->app->bind(ReportRepositoryInterface::class, ReportRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
