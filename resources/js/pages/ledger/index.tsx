import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import { 
    ArrowDownLeft, 
    ArrowLeft, 
    ArrowUpRight, 
    BookOpen, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    Download, 
    ExternalLink, 
    Eye, 
    FileText, 
    Filter, 
    HandCoins, 
    History, 
    Landmark, 
    Layers, 
    Receipt, 
    RotateCcw, 
    Search, 
    Tag, 
    TrendingDown, 
    TrendingUp, 
    UserCheck, 
    Wallet 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FinancialAccount } from '@/types/loans';

export interface LedgerEntryItem {
    id: number;
    reference: string;
    transaction_date: string;
    account_id: number;
    debit: number;
    credit: number;
    transaction_type: string;
    reference_type?: string;
    reference_id?: number;
    description?: string;
    running_balance?: number;
    created_at?: string;
    account?: FinancialAccount;
    creator?: { id: number; name: string };
}

interface AccountStats {
    account_name: string;
    account_type: string;
    opening_balance: number;
    period_debits: number;
    period_credits: number;
    closing_balance: number;
}

interface Props {
    stats: {
        total_debits: number;
        total_credits: number;
        net_movement: number;
        total_count: number;
    };
    accountStats?: AccountStats | null;
    ledgerEntries: {
        data: LedgerEntryItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    accounts: FinancialAccount[];
    filters: {
        search?: string;
        account_id?: string;
        transaction_type?: string;
        preset?: string;
        start_date?: string;
        end_date?: string;
        min_amount?: string;
        max_amount?: string;
    };
}

const datePresetOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
];

const transactionTypeOptions = [
    { value: 'all', label: 'All Transaction Types' },
    { value: 'money_in', label: 'Money In (Receipt)' },
    { value: 'money_in_void', label: 'Money In Void' },
    { value: 'expense', label: 'Operating Expense' },
    { value: 'expense_reversal', label: 'Expense Reversal' },
    { value: 'salary_payment', label: 'Salary Payment' },
    { value: 'salary_payment_reversal', label: 'Salary Reversal' },
    { value: 'loan_disbursed', label: 'Loan Disbursed' },
    { value: 'loan_received', label: 'Loan Received' },
    { value: 'loan_repayment', label: 'Loan Repayment' },
];

const customReactSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: 'var(--background)',
        borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
        color: 'var(--foreground)',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        minHeight: '2.5rem',
        boxShadow: state.isFocused ? '0 0 0 1px var(--ring)' : 'none',
        '&:hover': {
            borderColor: 'var(--ring)',
        },
    }),
    valueContainer: (base: any) => ({
        ...base,
        paddingTop: '2px',
        paddingBottom: '2px',
    }),
    singleValue: (base: any) => ({
        ...base,
        color: 'var(--foreground)',
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'var(--primary)'
            : state.isFocused
            ? 'var(--accent)'
            : 'transparent',
        color: state.isSelected
            ? 'var(--primary-foreground)'
            : state.isFocused
            ? 'var(--accent-foreground)'
            : 'var(--popover-foreground)',
        cursor: 'pointer',
    }),
    input: (base: any) => ({
        ...base,
        color: 'var(--foreground)',
    }),
    placeholder: (base: any) => ({
        ...base,
        color: 'var(--muted-foreground)',
    }),
};

export default function LedgerIndex({ stats, accountStats, ledgerEntries, accounts, filters }: Props) {
    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [accountIdFilter, setAccountIdFilter] = useState(filters.account_id || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.transaction_type || 'all');
    const [presetFilter, setPresetFilter] = useState(filters.preset || 'all');
    const [startDateFilter, setStartDateFilter] = useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = useState(filters.end_date || '');

    // Detail Modal
    const [selectedEntry, setSelectedEntry] = useState<LedgerEntryItem | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const accountSelectOptions = [
        { value: 'all', label: 'All Accounts' },
        ...accounts.map((acc) => ({
            value: String(acc.id),
            label: `${acc.name} (${acc.type === 'bank' ? acc.bank_name || 'Bank' : 'Cash'})`,
        })),
    ];

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = {
            search,
            account_id: accountIdFilter,
            transaction_type: typeFilter,
            preset: presetFilter,
            start_date: startDateFilter,
            end_date: endDateFilter,
            ...newFilters,
        };

        Object.keys(query).forEach((key) => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/ledger', query, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        setAccountIdFilter('all');
        setTypeFilter('all');
        setPresetFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        router.get('/ledger', {}, { preserveState: true, replace: true });
    };

    const resolveSourceUrl = (entry: LedgerEntryItem): string | null => {
        if (!entry.reference_type || !entry.reference_id) return null;
        const type = entry.reference_type;
        const id = entry.reference_id;

        if (type.includes('MoneyInTransaction')) return `/money-in/${id}`;
        if (type.includes('Expense')) return `/expenses/${id}`;
        if (type.includes('SalaryPayment')) return `/employees?tab=payments`;
        if (type.includes('LoanPayment') || type.includes('Loan')) return `/lenders`;
        return null;
    };

    const handleExport = () => {
        const query = new URLSearchParams({
            search,
            account_id: accountIdFilter,
            transaction_type: typeFilter,
            preset: presetFilter,
            start_date: startDateFilter,
            end_date: endDateFilter,
        }).toString();

        window.open(`/ledger/export?${query}`, '_blank');
    };

    return (
        <>
            <Head title="Central Financial Ledger" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* 1. HEADER & MAIN ACTIONS */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BookOpen className="size-7 text-indigo-600 dark:text-indigo-400" />
                            Central Financial Ledger
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Auditable, immutable chronological record of all company inflows, outflows, and account balance movements.
                        </p>
                    </div>

                    <Button onClick={handleExport} variant="outline" className="gap-2 shadow-sm font-medium">
                        <Download className="size-4" />
                        Export Ledger CSV
                    </Button>
                </div>

                {/* 2. SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Debits (+Inflow)</CardTitle>
                            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.total_debits)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total debited funds in current period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Credits (-Outflow)</CardTitle>
                            <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats.total_credits)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total credited funds in current period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Financial Movement</CardTitle>
                            <DollarSign className="size-4 text-indigo-600 dark:text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats.net_movement >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(stats.net_movement)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Debits minus credits movement</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Transactions</CardTitle>
                            <Layers className="size-4 text-slate-600 dark:text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_count} Entries</div>
                            <p className="text-xs text-muted-foreground mt-1">Total recorded ledger entries</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ACCOUNT BALANCE HEADER (IF ACCOUNT FILTERED) */}
                {accountStats && (
                    <Card className="border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Landmark className="size-6 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <h3 className="font-bold text-base text-foreground">{accountStats.account_name} Account Statement</h3>
                                    <p className="text-xs text-muted-foreground">Account-level balance breakdown for filtered period</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right text-xs">
                                <div>
                                    <div className="text-muted-foreground uppercase font-semibold">Opening Balance</div>
                                    <div className="font-mono font-bold text-foreground mt-0.5">{formatCurrency(accountStats.opening_balance)}</div>
                                </div>
                                <div>
                                    <div className="text-emerald-600 dark:text-emerald-400 uppercase font-semibold">+ Period Debits</div>
                                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatCurrency(accountStats.period_debits)}</div>
                                </div>
                                <div>
                                    <div className="text-rose-600 dark:text-rose-400 uppercase font-semibold">- Period Credits</div>
                                    <div className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">-{formatCurrency(accountStats.period_credits)}</div>
                                </div>
                                <div>
                                    <div className="text-indigo-600 dark:text-indigo-400 uppercase font-semibold">= Closing Balance</div>
                                    <div className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{formatCurrency(accountStats.closing_balance)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. FILTERS BAR */}
                <Card className="border-sidebar-border/70 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                            {/* Search Input */}
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Reference, description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                    className="pl-9"
                                />
                            </div>

                            {/* Account Filter */}
                            <div>
                                <ReactSelect
                                    options={accountSelectOptions}
                                    value={accountSelectOptions.find(o => o.value === accountIdFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setAccountIdFilter(val);
                                        handleFilterChange({ account_id: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Type Filter */}
                            <div>
                                <ReactSelect
                                    options={transactionTypeOptions}
                                    value={transactionTypeOptions.find(o => o.value === typeFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setTypeFilter(val);
                                        handleFilterChange({ transaction_type: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Preset Filter */}
                            <div>
                                <ReactSelect
                                    options={datePresetOptions}
                                    value={datePresetOptions.find(o => o.value === presetFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setPresetFilter(val);
                                        handleFilterChange({ preset: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => handleFilterChange({ search })} className="w-full gap-1">
                                    <Filter className="size-4" /> Filter
                                </Button>
                                {(search || accountIdFilter !== 'all' || typeFilter !== 'all' || presetFilter !== 'all' || startDateFilter || endDateFilter) && (
                                    <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Reset filters">
                                        <RotateCcw className="size-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Custom Date Range if preset is custom */}
                        {presetFilter === 'custom' && (
                            <div className="flex items-center gap-4 pt-2 border-t text-sm">
                                <div className="flex items-center gap-2">
                                    <Label>Start Date:</Label>
                                    <Input
                                        type="date"
                                        value={startDateFilter}
                                        onChange={(e) => setStartDateFilter(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label>End Date:</Label>
                                    <Input
                                        type="date"
                                        value={endDateFilter}
                                        onChange={(e) => setEndDateFilter(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleFilterChange({ start_date: startDateFilter, end_date: endDateFilter })}>
                                    Apply Dates
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. LEDGER DATA TABLE */}
                <Card className="border-sidebar-border/70 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Company Account</th>
                                        <th className="p-4 text-right">Debit (+Inflow)</th>
                                        <th className="p-4 text-right">Credit (-Outflow)</th>
                                        <th className="p-4 text-right">Running Balance</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {ledgerEntries.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <BookOpen className="size-8 text-muted-foreground/50" />
                                                    <p className="text-base font-semibold">No ledger transactions found</p>
                                                    <p className="text-xs text-muted-foreground">Try adjusting your search criteria or date filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        ledgerEntries.data.map((item) => {
                                            const debitVal = Number(item.debit);
                                            const creditVal = Number(item.credit);
                                            const sourceUrl = resolveSourceUrl(item);

                                            return (
                                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-4 text-muted-foreground">
                                                        {new Date(item.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-foreground">
                                                        <button onClick={() => setSelectedEntry(item)} className="hover:underline text-indigo-600 dark:text-indigo-400">
                                                            {item.reference}
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className="font-semibold capitalize text-xs bg-muted/40">
                                                            {item.transaction_type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 max-w-xs truncate text-foreground font-medium">
                                                        {item.description || '—'}
                                                    </td>
                                                    <td className="p-4 text-xs font-medium">
                                                        {item.account?.name || '—'}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                        {debitVal > 0 ? formatCurrency(debitVal) : '—'}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                        {creditVal > 0 ? formatCurrency(creditVal) : '—'}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-foreground">
                                                        {item.running_balance !== undefined ? formatCurrency(item.running_balance) : '—'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {sourceUrl ? (
                                                            <Link href={sourceUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                                <ExternalLink className="size-3.5" /> View Source
                                                            </Link>
                                                        ) : (
                                                            <Button onClick={() => setSelectedEntry(item)} variant="ghost" size="sm" className="h-7 text-xs">
                                                                <Eye className="size-3.5" /> Details
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {ledgerEntries.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
                                <div>
                                    Showing {ledgerEntries.from || 0} to {ledgerEntries.to || 0} of {ledgerEntries.total} ledger entries
                                </div>
                                <div className="flex items-center gap-1">
                                    {ledgerEntries.links.map((link, idx) => (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, replace: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 5. TRANSACTION DETAIL MODAL */}
                <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 font-mono">
                                <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
                                {selectedEntry?.reference}
                            </DialogTitle>
                            <DialogDescription>Immutable double-entry ledger record transaction metadata.</DialogDescription>
                        </DialogHeader>

                        {selectedEntry && (
                            <div className="space-y-4 pt-2 text-sm">
                                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/40">
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Transaction Date</div>
                                        <div className="font-bold text-foreground mt-0.5">{new Date(selectedEntry.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Transaction Type</div>
                                        <div className="font-semibold text-indigo-600 capitalize mt-0.5">{selectedEntry.transaction_type.replace('_', ' ')}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Company Account</div>
                                        <div className="font-semibold text-foreground mt-0.5">{selectedEntry.account?.name || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Recorded By</div>
                                        <div className="text-foreground mt-0.5">{selectedEntry.creator?.name || 'System Auto Posting'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border">
                                    <div>
                                        <div className="text-xs font-semibold text-emerald-600 uppercase">Debit (+Inflow)</div>
                                        <div className="font-mono font-bold text-emerald-600 mt-0.5">{formatCurrency(Number(selectedEntry.debit))}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-rose-600 uppercase">Credit (-Outflow)</div>
                                        <div className="font-mono font-bold text-rose-600 mt-0.5">{formatCurrency(Number(selectedEntry.credit))}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Running Balance</div>
                                        <div className="font-mono font-bold text-foreground mt-0.5">{selectedEntry.running_balance !== undefined ? formatCurrency(selectedEntry.running_balance) : '—'}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Description</div>
                                    <div className="text-foreground mt-0.5 font-medium">{selectedEntry.description || 'No description recorded.'}</div>
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4 flex items-center justify-between">
                                    {resolveSourceUrl(selectedEntry) ? (
                                        <Link href={resolveSourceUrl(selectedEntry)!} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                            <ExternalLink className="size-4" /> Open Source Module Record
                                        </Link>
                                    ) : (
                                        <div />
                                    )}
                                    <Button type="button" variant="outline" onClick={() => setSelectedEntry(null)}>Close</Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
