import { Head, Link, router } from '@inertiajs/react';
import ReportDateFilter from '@/components/ReportDateFilter';
import { 
    ArrowDownLeft, 
    ArrowLeft, 
    ArrowUpRight, 
    Banknote, 
    Building2, 
    DollarSign, 
    Landmark, 
    Scale, 
    TrendingDown, 
    TrendingUp, 
    Users, 
    Wallet 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    report: {
        revenue: number;
        operating_expenses: number;
        salary_expenses: number;
        total_expenses: number;
        net_profit_loss: number;
        is_profit: boolean;
        expense_categories: { category_name: string; total: number }[];
        monthly_comparison: { month: string; income: number; expenses: number; net: number }[];
        cash_movement: {
            opening_balance: number;
            money_in: number;
            operating_expenses: number;
            salary_payments: number;
            loan_received: number;
            loan_repayments: number;
            closing_balance: number;
        };
    };
    filters: any;
}

export default function ProfitLossReportPage({ report, filters }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = { ...filters, ...newFilters };
        Object.keys(query).forEach(k => { if (!query[k as keyof typeof query] || query[k as keyof typeof query] === 'all') delete query[k as keyof typeof query]; });
        router.get('/reports/profit-loss', query, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Profit & Loss Executive Statement" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Reports Dashboard
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Scale className="size-7 text-indigo-600 dark:text-indigo-400" />
                        Profit & Loss Executive Statement
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Official CEO financial statement. Net Profit = Operating Revenue - (Operating Expenses + Salary Expenses).</p>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter filters={filters} onFilterChange={handleFilterChange} />

                {/* EXECUTIVE NET RESULT BANNER */}
                <Card className={`border-2 shadow-md ${report.is_profit ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-rose-500/50 bg-rose-50/40 dark:bg-rose-950/20'}`}>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Executive Financial Result</div>
                                <div className="text-3xl font-extrabold font-mono tracking-tight mt-1 flex items-center gap-2">
                                    {report.is_profit ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                            <TrendingUp className="size-8" /> Net Profit: {formatCurrency(report.net_profit_loss)}
                                        </span>
                                    ) : (
                                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                            <TrendingDown className="size-8" /> Net Loss: {formatCurrency(Math.abs(report.net_profit_loss))}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Badge variant={report.is_profit ? 'default' : 'destructive'} className="text-sm px-4 py-1.5 uppercase font-bold">
                                {report.is_profit ? 'Profitable Period' : 'Operating Deficit'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* STATEMENT COMPUTATION BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income vs Expenses Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Income & Expenditure Computation</CardTitle>
                            <CardDescription>P&L mathematical breakdown.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">+ Operating Revenue (Money In):</span>
                                <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">{formatCurrency(report.revenue)}</span>
                            </div>

                            <div className="space-y-2 pl-2">
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>- Operating Expenses (Rent, Software, Utilities):</span>
                                    <span className="font-mono font-semibold text-rose-600">-{formatCurrency(report.operating_expenses)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>- Salary & Payroll Expenses:</span>
                                    <span className="font-mono font-semibold text-rose-600">-{formatCurrency(report.salary_expenses)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <span className="font-bold text-rose-700 dark:text-rose-400">= Total Period Expenses:</span>
                                <span className="font-mono font-extrabold text-rose-700 dark:text-rose-400">-{formatCurrency(report.total_expenses)}</span>
                            </div>

                            <div className="border-t pt-3 flex justify-between items-center font-bold text-base">
                                <span>NET PROFIT / (LOSS):</span>
                                <span className={`font-mono text-xl ${report.is_profit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(report.net_profit_loss)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expense Categories Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Expense Breakdown by Category</CardTitle>
                            <CardDescription>Operational cost distribution.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {report.expense_categories.map((cat, idx) => (
                                <div key={idx} className="flex justify-between text-sm border-b pb-2">
                                    <span className="font-semibold text-foreground">{cat.category_name}</span>
                                    <span className="font-mono font-bold text-rose-600">{formatCurrency(cat.total)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* CASH FLOW / MONEY MOVEMENT STATEMENT */}
                <Card className="border-indigo-500/30 bg-card">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Wallet className="size-5 text-indigo-600" />
                            Money Movement / Cash Flow Statement
                        </CardTitle>
                        <CardDescription>Distinguishes actual cash movement (including debt principal) from Profit & Loss.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
                            <div className="p-3 rounded-xl border bg-muted/20">
                                <div className="text-muted-foreground uppercase font-semibold">Opening Cash</div>
                                <div className="font-mono font-bold text-foreground mt-1">{formatCurrency(report.cash_movement.opening_balance)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-emerald-500/10">
                                <div className="text-emerald-600 uppercase font-semibold">+ Money In</div>
                                <div className="font-mono font-bold text-emerald-600 mt-1">+{formatCurrency(report.cash_movement.money_in)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-rose-500/10">
                                <div className="text-rose-600 uppercase font-semibold">- Op Expenses</div>
                                <div className="font-mono font-bold text-rose-600 mt-1">-{formatCurrency(report.cash_movement.operating_expenses)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-rose-500/10">
                                <div className="text-rose-600 uppercase font-semibold">- Salaries</div>
                                <div className="font-mono font-bold text-rose-600 mt-1">-{formatCurrency(report.cash_movement.salary_payments)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-amber-500/10">
                                <div className="text-amber-600 uppercase font-semibold">+ Loan Received</div>
                                <div className="font-mono font-bold text-amber-600 mt-1">+{formatCurrency(report.cash_movement.loan_received)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-amber-500/10">
                                <div className="text-amber-600 uppercase font-semibold">- Loan Repaid</div>
                                <div className="font-mono font-bold text-amber-600 mt-1">-{formatCurrency(report.cash_movement.loan_repayments)}</div>
                            </div>

                            <div className="p-3 rounded-xl border bg-indigo-500/15 border-indigo-500/30">
                                <div className="text-indigo-600 uppercase font-bold">= Closing Cash</div>
                                <div className="font-mono font-extrabold text-indigo-600 text-sm mt-1">{formatCurrency(report.cash_movement.closing_balance)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </>
    );
}
