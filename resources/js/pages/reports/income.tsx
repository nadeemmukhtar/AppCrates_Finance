import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import ReportDateFilter from '@/components/ReportDateFilter';
import { 
    ArrowLeft, 
    BarChart3, 
    Calendar, 
    Download, 
    ExternalLink, 
    Filter, 
    Landmark, 
    RotateCcw, 
    Search, 
    TrendingUp 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { FinancialAccount } from '@/types/loans';

interface Props {
    report: {
        total_income: number;
        total_count: number;
        average_income: number;
        by_category: { category_name: string; total: number }[];
        by_account: { account_name: string; total: number }[];
        by_payment_method: { method: string; total: number }[];
        monthly_trend: { month: string; total: number }[];
        transactions: {
            data: any[];
            links: any[];
            total: number;
            from: number;
            to: number;
        };
    };
    accounts: FinancialAccount[];
    categories: any[];
    filters: any;
}

const datePresetOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
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
    }),
    singleValue: (base: any) => ({ ...base, color: 'var(--foreground)' }),
    menu: (base: any) => ({ ...base, backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', zIndex: 9999 }),
    option: (base: any, state: any) => ({ ...base, color: state.isSelected ? 'white' : 'inherit', cursor: 'pointer' }),
};

export default function IncomeReportPage({ report, accounts, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [accountId, setAccountId] = useState(filters.account_id || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = { 
            search, 
            account_id: accountId, 
            category_id: categoryId, 
            ...filters,
            ...newFilters 
        };
        Object.keys(query).forEach(k => { if (!query[k as keyof typeof query] || query[k as keyof typeof query] === 'all') delete query[k as keyof typeof query]; });
        router.get('/reports/income', query, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        const queryParams: Record<string, string> = { type: 'income', search, account_id: accountId, category_id: categoryId, ...filters };
        Object.keys(queryParams).forEach(k => { if (!queryParams[k] || queryParams[k] === 'all') delete queryParams[k]; });
        const query = new URLSearchParams(queryParams).toString();
        window.open(`/reports/export?${query}`, '_blank');
    };

    const categoryOptions = [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: String(c.id), label: c.name }))];
    const accountOptions = [{ value: 'all', label: 'All Accounts' }, ...accounts.map(a => ({ value: String(a.id), label: a.name }))];

    return (
        <>
            <Head title="Income Report & Analytics" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Reports Dashboard
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TrendingUp className="size-7 text-emerald-600 dark:text-emerald-400" />
                            Income & Revenue Report
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Excludes voided transactions and loan receipts.</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="size-4" /> Export CSV
                    </Button>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    extraFiltersNode={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-48">
                                <Input
                                    placeholder="Search reference..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="w-44">
                                <ReactSelect
                                    options={categoryOptions}
                                    value={categoryOptions.find(o => o.value === categoryId) || categoryOptions[0]}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setCategoryId(val);
                                        handleFilterChange({ category_id: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>
                            <div className="w-44">
                                <ReactSelect
                                    options={accountOptions}
                                    value={accountOptions.find(o => o.value === accountId) || accountOptions[0]}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setAccountId(val);
                                        handleFilterChange({ account_id: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>
                        </div>
                    }
                />

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Income</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(report.total_income)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Receipts</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{report.total_count} Transactions</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Average Inflow</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-indigo-600">{formatCurrency(report.average_income)}</div></CardContent>
                    </Card>
                </div>

                {/* BREAKDOWNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base font-bold">Income by Category</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {report.by_category.map((cat, idx) => (
                                <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                    <span className="font-semibold">{cat.category_name}</span>
                                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(cat.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base font-bold">Income by Account</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {report.by_account.map((acc, idx) => (
                                <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                    <span className="font-semibold">{acc.account_name}</span>
                                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(acc.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* TRANSACTIONS TABLE */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-bold">Income Transactions Log</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Received From</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Account</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {report.transactions.data.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-muted/30">
                                            <td className="p-4">{new Date(tx.received_date).toLocaleDateString('en-GB')}</td>
                                            <td className="p-4 font-mono font-bold text-emerald-600">{tx.reference}</td>
                                            <td className="p-4">{tx.received_from}</td>
                                            <td className="p-4"><Badge variant="outline">{tx.category?.name || 'Uncategorized'}</Badge></td>
                                            <td className="p-4">{tx.account?.name || '—'}</td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(Number(tx.amount))}</td>
                                            <td className="p-4 text-right">
                                                <Link href={`/money-in/${tx.id}`} className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
                                                    <ExternalLink className="size-3" /> View Money In
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
