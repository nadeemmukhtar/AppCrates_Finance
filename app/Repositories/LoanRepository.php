<?php

namespace App\Repositories;

use App\Contracts\Repositories\LoanRepositoryInterface;
use App\Models\Loan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class LoanRepository implements LoanRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Loan::with(['lender', 'destinationAccount', 'media', 'payments' => function ($q) {
            $q->where('is_reversed', false)->with('media');
        }]);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('lender', function (Builder $lenderQuery) use ($search) {
                        $lenderQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['lender_type'])) {
            $type = $filters['lender_type'];
            $query->whereHas('lender', function (Builder $q) use ($type) {
                $q->where('type', $type);
            });
        }

        if (! empty($filters['lender_id'])) {
            $query->where('lender_id', $filters['lender_id']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $status = $filters['status'];
            if ($status === 'overdue') {
                $query->where('status', '!=', 'cancelled')
                    ->where('due_date', '<', now()->toDateString())
                    ->whereRaw('(original_amount + interest_amount) > (SELECT COALESCE(SUM(amount), 0) FROM loan_repayments WHERE loan_repayments.loan_id = loans.id AND is_reversed = 0)');
            } else {
                $query->where('status', $status);
            }
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('loan_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('loan_date', '<=', $filters['end_date']);
        }

        return $query->latest('loan_date')->latest('id')->paginate($perPage)->withQueryString();
    }

    public function getSummaryStats(): array
    {
        $loans = Loan::with(['payments' => function ($q) {
            $q->where('is_reversed', false);
        }])->where('status', '!=', 'cancelled')->get();

        $totalBorrowed = 0.0;
        $totalRepaid = 0.0;
        $activeCount = 0;
        $clearedCount = 0;
        $overdueCount = 0;

        foreach ($loans as $loan) {
            $totalPayable = (float) $loan->original_amount + (float) $loan->interest_amount;
            $repaid = $loan->total_repaid;
            $remaining = max(0, $totalPayable - $repaid);

            $totalBorrowed += $totalPayable;
            $totalRepaid += $repaid;

            if ($remaining <= 0) {
                $clearedCount++;
            } else {
                $activeCount++;
                if ($loan->due_date && $loan->due_date->isPast()) {
                    $overdueCount++;
                }
            }
        }

        $totalOutstanding = max(0, $totalBorrowed - $totalRepaid);

        return [
            'total_borrowed' => $totalBorrowed,
            'total_repaid' => $totalRepaid,
            'total_outstanding' => $totalOutstanding,
            'active_loans' => $activeCount,
            'cleared_loans' => $clearedCount,
            'overdue_loans' => $overdueCount,
        ];
    }

    public function findWithRelations(int $id): ?Loan
    {
        return Loan::with([
            'lender',
            'destinationAccount',
            'creator',
            'canceller',
            'media',
            'payments.account',
            'payments.creator',
            'payments.reverser',
            'payments.media',
            'ledgerEntries.account',
            'ledgerEntries.creator',
        ])->find($id);
    }

    public function create(array $data): Loan
    {
        return Loan::create($data);
    }

    public function updateStatus(Loan $loan, string $status): bool
    {
        return $loan->update(['status' => $status]);
    }

    public function cancel(Loan $loan, int $userId, string $reason): bool
    {
        return $loan->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => $userId,
            'cancellation_reason' => $reason,
        ]);
    }
}
