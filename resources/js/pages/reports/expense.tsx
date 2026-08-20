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
    RotateCcw, 
    Search, 
    TrendingDown 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialAccount } from '@/types/loans';

interface Props {
    report: {
        total_expenses: number;
        total_count: number;
        average_expense: number;
        by_category: { category_name: string; total: number }[];
        by_account: { account_name: string; total: number }[];
        by_payment_method: { method: string; total: number }[];
        monthly_trend: { month: string; total: number }[];
        expenses: {
            data: any[];
            links: any[];
            total: number;
        };
    };
    accounts: FinancialAccount[];
    categories: any[];
    filters: any;
}

export default function ExpenseReportPage({ report, accounts, categories, filters }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = { ...filters, ...newFilters };
        Object.keys(query).forEach(k => { if (!query[k as keyof typeof query] || query[k as keyof typeof query] === 'all') delete query[k as keyof typeof query]; });
        router.get('/reports/expense', query, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        const queryParams: Record<string, string> = { type: 'expense', ...filters };
        Object.keys(queryParams).forEach(k => { if (!queryParams[k] || queryParams[k] === 'all') delete queryParams[k]; });
        const query = new URLSearchParams(queryParams).toString();
        window.open(`/reports/export?${query}`, '_blank');
    };

    return (
        <>
            <Head title="Expense Report & Analytics" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Reports Dashboard
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TrendingDown className="size-7 text-rose-600 dark:text-rose-400" />
                            Operating Expense Report
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Excludes voided expenses, salary payments, and loan repayments.</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="size-4" /> Export CSV
                    </Button>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter filters={filters} onFilterChange={handleFilterChange} />

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Expenses</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-rose-600">{formatCurrency(report.total_expenses)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Count</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{report.total_count} Expenses</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Average Expense</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-indigo-600">{formatCurrency(report.average_expense)}</div></CardContent>
                    </Card>
                </div>

                {/* BREAKDOWNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base font-bold">Expenses by Category</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {report.by_category.map((cat, idx) => (
                                <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                    <span className="font-semibold">{cat.category_name}</span>
                                    <span className="font-mono font-bold text-rose-600">{formatCurrency(cat.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base font-bold">Expenses by Account</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {report.by_account.map((acc, idx) => (
                                <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                    <span className="font-semibold">{acc.account_name}</span>
                                    <span className="font-mono font-bold text-rose-600">{formatCurrency(acc.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* EXPENSES LOG TABLE */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-bold">Expense Transactions Log</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Account</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {report.expenses.data.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-muted/30">
                                            <td className="p-4">{new Date(exp.expense_date).toLocaleDateString('en-GB')}</td>
                                            <td className="p-4 font-mono font-bold text-rose-600">{exp.reference}</td>
                                            <td className="p-4"><Badge variant="outline">{exp.category?.name || 'Uncategorized'}</Badge></td>
                                            <td className="p-4 max-w-xs truncate">{exp.description || '—'}</td>
                                            <td className="p-4">{exp.account?.name || '—'}</td>
                                            <td className="p-4 text-right font-mono font-bold text-rose-600">{formatCurrency(Number(exp.amount))}</td>
                                            <td className="p-4 text-right">
                                                <Link href={`/expenses/${exp.id}`} className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
                                                    <ExternalLink className="size-3" /> View Expense
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
