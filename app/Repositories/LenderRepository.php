<?php

namespace App\Repositories;

use App\Contracts\Repositories\LenderRepositoryInterface;
use App\Models\Lender;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class LenderRepository implements LenderRepositoryInterface
{
    public function all(): Collection
    {
        return Lender::orderBy('name')->get();
    }

    public function getPaginatedWithStats(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Lender::withCount(['loans' => function ($q) {
            $q->where('status', '!=', 'cancelled');
        }])->with(['loans' => function ($q) {
            $q->where('status', '!=', 'cancelled')->with('payments');
        }]);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }

        return $query->latest('id')->paginate($perPage)->withQueryString();
    }

    public function find(int $id): ?Lender
    {
        return Lender::with('loans.payments')->find($id);
    }

    public function create(array $data): Lender
    {
        return Lender::create($data);
    }

    public function update(Lender $lender, array $data): bool
    {
        return $lender->update($data);
    }

    public function delete(Lender $lender): bool
    {
        if ($lender->loans()->count() > 0) {
            throw new \InvalidArgumentException('Cannot delete lender with existing loan records.');
        }

        return $lender->delete();
    }
}
