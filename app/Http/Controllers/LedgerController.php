<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\FinancialAccountRepositoryInterface;
use App\Contracts\Repositories\LedgerRepositoryInterface;
use App\Models\LedgerEntry;
use App\Models\SalaryPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LedgerController extends Controller
{
    public function __construct(
        protected LedgerRepositoryInterface $ledgerRepository,
        protected FinancialAccountRepositoryInterface $accountRepository
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'account_id',
            'transaction_type',
            'preset',
            'start_date',
            'end_date',
            'min_amount',
            'max_amount',
        ]);

        $accountId = (! empty($filters['account_id']) && $filters['account_id'] !== 'all') ? (int) $filters['account_id'] : null;

        return Inertia::render('ledger/index', [
            'stats' => $this->ledgerRepository->getSummaryStats($filters),
            'accountStats' => $accountId ? $this->ledgerRepository->getAccountBalanceStats($accountId, $filters) : null,
            'ledgerEntries' => $this->ledgerRepository->getPaginatedWithFilters($filters),
            'accounts' => $this->accountRepository->allActive(),
            'filters' => $filters,
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $entry = $this->ledgerRepository->findWithRelations($id);

        if (! $entry) {
            abort(404, 'Ledger entry not found.');
        }

        $sourceUrl = $this->resolveSourceUrl($entry);

        return Inertia::render('ledger/show', [
            'ledgerEntry' => $entry,
            'sourceUrl' => $sourceUrl,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->only([
            'search',
            'account_id',
            'transaction_type',
            'preset',
            'start_date',
            'end_date',
        ]);

        $entries = $this->ledgerRepository->getExportData($filters);

        $filename = 'Ledger_Statement_'.date('Y-m-d_H-i').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($entries) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Reference', 'Transaction Type', 'Description', 'Account', 'Debit (PKR)', 'Credit (PKR)', 'Created By']);

            foreach ($entries as $entry) {
                fputcsv($file, [
                    $entry->transaction_date,
                    $entry->reference,
                    ucwords(str_replace('_', ' ', $entry->transaction_type)),
                    $entry->description,
                    $entry->account?->name ?? '—',
                    number_format((float) $entry->debit, 2, '.', ''),
                    number_format((float) $entry->credit, 2, '.', ''),
                    $entry->creator?->name ?? 'System',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function resolveSourceUrl(LedgerEntry $entry): ?string
    {
        $type = $entry->reference_type;
        $id = $entry->reference_id;

        if (! $type || ! $id) {
            return null;
        }

        if (str_contains($type, 'MoneyInTransaction')) {
            return "/money-in/{$id}";
        }

        if (str_contains($type, 'Expense')) {
            return "/expenses/{$id}";
        }

        if (str_contains($type, 'SalaryPayment')) {
            $payment = SalaryPayment::with('salaryPeriod')->find($id);
            if ($payment && $payment->salaryPeriod) {
                return "/employees/{$payment->salaryPeriod->employee_id}?tab=payments";
            }

            return '/employees';
        }

        if (str_contains($type, 'LoanPayment') || str_contains($type, 'Loan')) {
            return '/lenders';
        }

        return null;
    }
}
