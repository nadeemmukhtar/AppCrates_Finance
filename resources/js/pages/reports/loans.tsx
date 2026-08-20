import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, HandCoins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReportDateFilter from '@/components/ReportDateFilter';

interface Props {
    report?: {
        total_borrowed?: number;
        total_repaid?: number;
        total_outstanding?: number;
        active_count?: number;
        cleared_count?: number;
        overdue_count?: number;
        loans?: {
            data?: any[];
        };
    };
    stats?: {
        total_borrowed?: number;
        total_repaid?: number;
        total_outstanding?: number;
        active_loans?: number;
        cleared_loans?: number;
        overdue_loans?: number;
    };
    loans?: any;
    lenders?: any[];
    filters?: any;
}

export default function LoanReportPage({ report, stats, loans, lenders, filters }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val || 0);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = { ...filters, ...newFilters };
        Object.keys(query).forEach(k => { if (!query[k as keyof typeof query] || query[k as keyof typeof query] === 'all') delete query[k as keyof typeof query]; });
        router.get('/reports/loans', query, { preserveState: true, replace: true });
    };

    const summary = {
        total_borrowed: report?.total_borrowed ?? stats?.total_borrowed ?? 0,
        total_repaid: report?.total_repaid ?? stats?.total_repaid ?? 0,
        total_outstanding: report?.total_outstanding ?? stats?.total_outstanding ?? 0,
    };

    const loansList: any[] = Array.isArray(report?.loans?.data)
        ? report!.loans!.data!
        : (Array.isArray(loans?.data) ? loans.data : (Array.isArray(loans) ? loans : []));

    return (
        <>
            <Head title="Loan & Debt Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Reports Dashboard
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <HandCoins className="size-7 text-amber-600 dark:text-amber-400" />
                        Loan & Debt Liabilities Report
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Loans are liabilities (not revenue). Repayments reduce debt (not operating expense).</p>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter filters={filters || {}} onFilterChange={handleFilterChange} />

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Borrowed Principal</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(summary.total_borrowed)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Repaid</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.total_repaid)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Outstanding Liability</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(summary.total_outstanding)}</div></CardContent>
                    </Card>
                </div>

                {/* LOANS TABLE */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-bold">Company Loans Schedule</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Lender</th>
                                        <th className="p-4">Loan Date</th>
                                        <th className="p-4 text-right">Original Amount</th>
                                        <th className="p-4 text-right">Repaid</th>
                                        <th className="p-4 text-right">Outstanding</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loansList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                No loan records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        loansList.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-muted/30">
                                                <td className="p-4 font-mono font-bold text-amber-600">{loan.reference}</td>
                                                <td className="p-4 font-semibold">{loan.lender?.name || '—'}</td>
                                                <td className="p-4">{loan.loan_date ? new Date(loan.loan_date).toLocaleDateString('en-GB') : '—'}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(Number(loan.original_amount || 0))}</td>
                                                <td className="p-4 text-right font-mono text-emerald-600">{formatCurrency(Number(loan.total_repaid || 0))}</td>
                                                <td className="p-4 text-right font-mono text-amber-600">{formatCurrency(Number(loan.remaining_balance || 0))}</td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={loan.status === 'cleared' || loan.status === 'fully_paid' ? 'default' : 'outline'} className="capitalize">
                                                        {loan.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link href="/lenders" className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
                                                        <ExternalLink className="size-3" /> View Lender
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
