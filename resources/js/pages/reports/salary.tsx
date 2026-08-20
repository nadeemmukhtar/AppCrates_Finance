import { Head, Link, router } from '@inertiajs/react';
import ReportDateFilter from '@/components/ReportDateFilter';
import { ArrowLeft, ExternalLink, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    report: {
        total_payable: number;
        total_paid: number;
        total_pending: number;
        employees_paid_count: number;
        employees_pending_count: number;
        monthly_trend: { month: string; total: number }[];
        periods: {
            data: any[];
        };
    };
    employees: any[];
    filters: any;
}

export default function SalaryReportPage({ report, employees, filters }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = { ...filters, ...newFilters };
        Object.keys(query).forEach(k => { if (!query[k as keyof typeof query] || query[k as keyof typeof query] === 'all') delete query[k as keyof typeof query]; });
        router.get('/reports/salary', query, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Salary & Payroll Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Reports Dashboard
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Users className="size-7 text-indigo-600 dark:text-indigo-400" />
                        Salary & Payroll Report
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Excludes reversed salary payments. Tracks paid vs pending employee balances.</p>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter filters={filters} onFilterChange={handleFilterChange} />

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Salary Payable</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(report.total_payable)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Paid</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(report.total_paid)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pending Balance</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(report.total_pending)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Employee Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-sm font-semibold">
                                <span className="text-emerald-600">{report.employees_paid_count} Paid</span> / <span className="text-amber-600">{report.employees_pending_count} Pending</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* PERIODS TABLE */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-bold">Employee Salary Periods Log</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Period</th>
                                        <th className="p-4 text-right">Total Salary</th>
                                        <th className="p-4 text-right">Paid</th>
                                        <th className="p-4 text-right">Remaining</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {report.periods.data.map((period) => {
                                        const total = Number(period.total_salary);
                                        const paid = Number(period.paid_amount);
                                        const rem = Number(period.remaining_balance);

                                        return (
                                            <tr key={period.id} className="hover:bg-muted/30">
                                                <td className="p-4 font-semibold">{period.employee?.full_name || '—'}</td>
                                                <td className="p-4">{period.month}/{period.year}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(total)}</td>
                                                <td className="p-4 text-right font-mono text-emerald-600">{formatCurrency(paid)}</td>
                                                <td className="p-4 text-right font-mono text-amber-600">{formatCurrency(rem)}</td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={period.status === 'paid' ? 'default' : 'outline'} className="capitalize">
                                                        {period.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link href={`/employees/${period.employee_id}?tab=payments`} className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
                                                        <ExternalLink className="size-3" /> View Employee
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
