<?php

namespace App\Repositories;

use App\Contracts\Repositories\MoneyInRepositoryInterface;
use App\Models\Client;
use App\Models\MoneyInCategory;
use App\Models\MoneyInTransaction;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class MoneyInRepository implements MoneyInRepositoryInterface
{
    public function getPaginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = MoneyInTransaction::with(['category', 'account', 'client', 'creator', 'updater', 'voider', 'media']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('received_from', 'like', "%{$search}%")
                    ->orWhere('external_reference', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('received_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('received_date', '<=', $filters['end_date']);
        }

        if (isset($filters['min_amount']) && $filters['min_amount'] !== '') {
            $query->where('amount', '>=', (float) $filters['min_amount']);
        }

        if (isset($filters['max_amount']) && $filters['max_amount'] !== '') {
            $query->where('amount', '<=', (float) $filters['max_amount']);
        }

        return $query->orderBy('received_date', 'desc')->orderBy('id', 'desc')->paginate($perPage)->withQueryString();
    }

    public function getSummaryStats(array $filters = []): array
    {
        $query = MoneyInTransaction::query();

        if (! empty($filters['start_date'])) {
            $query->whereDate('received_date', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('received_date', '<=', $filters['end_date']);
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['account_id']) && $filters['account_id'] !== 'all') {
            $query->where('account_id', $filters['account_id']);
        }

        if (! empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }

        $allMatching = $query->get();
        $postedMatching = $allMatching->where('status', 'posted');

        $today = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $receivedToday = MoneyInTransaction::where('status', 'posted')
            ->whereDate('received_date', $today)
            ->sum('amount');

        $receivedThisMonth = MoneyInTransaction::where('status', 'posted')
            ->whereDate('received_date', '>=', $startOfMonth)
            ->whereDate('received_date', '<=', $endOfMonth)
            ->sum('amount');

        return [
            'total_received' => round((float) $postedMatching->sum('amount'), 2),
            'received_today' => round((float) $receivedToday, 2),
            'received_this_month' => round((float) $receivedThisMonth, 2),
            'total_transactions' => $allMatching->count(),
            'posted_count' => $postedMatching->count(),
            'voided_count' => $allMatching->where('status', 'voided')->count(),
        ];
    }

    public function findWithRelations(int $id): ?MoneyInTransaction
    {
        return MoneyInTransaction::with(['category', 'account', 'client', 'creator', 'updater', 'voider', 'ledgerEntries', 'media'])->find($id);
    }

    public function create(array $data): MoneyInTransaction
    {
        return MoneyInTransaction::create($data);
    }

    public function update(MoneyInTransaction $moneyIn, array $data): bool
    {
        return $moneyIn->update($data);
    }

    public function void(MoneyInTransaction $moneyIn, int $voidedBy, string $reason): bool
    {
        return $moneyIn->update([
            'status' => 'voided',
            'voided_by' => $voidedBy,
            'voided_at' => now(),
            'void_reason' => $reason,
        ]);
    }

    public function generateReference(): string
    {
        $year = date('Y');
        $latest = MoneyInTransaction::whereYear('created_at', $year)->latest('id')->first();
        $nextNumber = $latest ? ((int) substr($latest->reference, -5)) + 1 : 1;

        return sprintf('MI-%s-%05d', $year, $nextNumber);
    }

    public function getAllActiveCategories(): Collection
    {
        return MoneyInCategory::where('is_active', true)->orderBy('name')->get();
    }

    public function getAllClients(): Collection
    {
        return Client::orderBy('name')->get();
    }

    public function findOrCreateClientByName(string $name, string $type = 'client', ?int $userId = null): Client
    {
        $trimmedName = trim($name);

        return Client::firstOrCreate(
            ['name' => $trimmedName],
            [
                'type' => $type,
                'created_by' => $userId,
            ]
        );
    }
}
