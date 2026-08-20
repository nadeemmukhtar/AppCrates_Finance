<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FinancialAccountController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\LenderController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\LoanPaymentController;
use App\Http\Controllers\MoneyInController;
use App\Http\Controllers\ReportController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Money In Module
    Route::get('/money-in', [MoneyInController::class, 'index'])->name('money-in.index');
    Route::post('/money-in', [MoneyInController::class, 'store'])->name('money-in.store');
    Route::get('/money-in/{money_in}', [MoneyInController::class, 'show'])->name('money-in.show');
    Route::put('/money-in/{money_in}', [MoneyInController::class, 'update'])->name('money-in.update');
    Route::post('/money-in/{money_in}/void', [MoneyInController::class, 'void'])->name('money-in.void');

    // Client Creation
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');

    // Employees & Salary Management Module
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::post('/employees/{employee}/toggle-status', [EmployeeController::class, 'toggleStatus'])->name('employees.toggle-status');
    Route::post('/employees/{employee}/salary', [EmployeeController::class, 'updateSalary'])->name('employees.update-salary');
    Route::post('/employees/{employee}/periods', [EmployeeController::class, 'generatePeriod'])->name('employees.generate-period');
    Route::post('/employees/payments', [EmployeeController::class, 'storePayment'])->name('employees.store-payment');
    Route::post('/employees/payments/{payment}/reverse', [EmployeeController::class, 'reversePayment'])->name('employees.reverse-payment');

    // Expenses Management Module
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show'])->name('expenses.show');
    Route::put('/expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::post('/expenses/{expense}/void', [ExpenseController::class, 'void'])->name('expenses.void');
    Route::post('/expense-categories', [ExpenseController::class, 'storeCategory'])->name('expense-categories.store');

    // Ledger Module
    Route::get('/ledger', [LedgerController::class, 'index'])->name('ledger.index');
    Route::get('/ledger/export', [LedgerController::class, 'export'])->name('ledger.export');
    Route::get('/ledger/{ledger}', [LedgerController::class, 'show'])->name('ledger.show');

    // Reports Module
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/income', [ReportController::class, 'income'])->name('reports.income');
    Route::get('/reports/expense', [ReportController::class, 'expense'])->name('reports.expense');
    Route::get('/reports/salary', [ReportController::class, 'salary'])->name('reports.salary');
    Route::get('/reports/loans', [ReportController::class, 'loans'])->name('reports.loans');
    Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss'])->name('reports.profit-loss');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    // Cash & Bank Accounts Management
    Route::get('/accounts', [FinancialAccountController::class, 'index'])->name('accounts.index');
    Route::post('/accounts', [FinancialAccountController::class, 'store'])->name('accounts.store');
    Route::get('/accounts/{account}', [FinancialAccountController::class, 'show'])->name('accounts.show');
    Route::put('/accounts/{account}', [FinancialAccountController::class, 'update'])->name('accounts.update');
    Route::post('/accounts/{account}/toggle-status', [FinancialAccountController::class, 'toggleStatus'])->name('accounts.toggle-status');
    Route::delete('/accounts/{account}', [FinancialAccountController::class, 'destroy'])->name('accounts.destroy');

    // Loans & Debts Management
    Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
    Route::post('/loans', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');
    Route::post('/loans/{loan}/cancel', [LoanController::class, 'cancel'])->name('loans.cancel');

    // Repayments
    Route::post('/loans/{loan}/repayments', [LoanPaymentController::class, 'store'])->name('loans.repayments.store');
    Route::post('/repayments/{payment}/reverse', [LoanPaymentController::class, 'reverse'])->name('repayments.reverse');

    // Lenders CRUD
    Route::get('/lenders', [LenderController::class, 'index'])->name('lenders.index');
    Route::post('/lenders', [LenderController::class, 'store'])->name('lenders.store');
    Route::put('/lenders/{lender}', [LenderController::class, 'update'])->name('lenders.update');
    Route::delete('/lenders/{lender}', [LenderController::class, 'destroy'])->name('lenders.destroy');
});

require __DIR__.'/settings.php';
