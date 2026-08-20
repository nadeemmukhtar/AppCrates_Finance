import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import ReportDateFilter from '@/components/ReportDateFilter';
import { 
    ArrowUpRight, 
    Banknote, 
    BarChart3, 
    BookOpen, 
    Building2, 
    Calendar, 
    ChevronRight, 
    DollarSign, 
    Download, 
    FileSpreadsheet, 
    FileText, 
    HandCoins, 
    Layers, 
    LineChart, 
    PieChart, 
    Receipt, 
    RotateCcw, 
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
    incomeStats: { total: number; count: number };
    expenseStats: { total: number; count: number };
    salaryStats: { total_paid: number; total_pending: number };
    loanStats: { total_outstanding: number; active_count: number };
    profitLossStats: { net_profit_loss: number; is_profit: boolean };
    filters: { preset?: string; start_date?: string; end_date?: string };
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
};

export default function ReportsIndex({ incomeStats, expenseStats, salaryStats, loanStats, profitLossStats, filters }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        router.get('/reports', newFilters, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Financial Reports & Analytics" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* 1. HEADER & PRESET FILTER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BarChart3 className="size-7 text-indigo-600 dark:text-indigo-400" />
                            Reports & Financial Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Executive financial summary reports and read-only analytical statements.
                        </p>
                    </div>
                </div>

                {/* DATE FILTER BAR */}
                <ReportDateFilter filters={filters} onFilterChange={handleFilterChange} />

                {/* 2. EXECUTIVE HIGHLIGHT BANNER */}
                <Card className="border-sidebar-border/70 shadow-sm bg-gradient-to-r from-indigo-50/60 via-background to-emerald-50/40 dark:from-indigo-950/20 dark:to-emerald-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-background text-indigo-600 dark:text-indigo-400 font-bold">
                                        EXECUTIVE STATEMENT
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">Period Net Financial Result</span>
                                </div>
                                <div className="text-3xl font-extrabold font-mono tracking-tight flex items-center gap-2">
                                    {profitLossStats.is_profit ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <TrendingUp className="size-7" /> Net Profit: {formatCurrency(profitLossStats.net_profit_loss)}
                                        </span>
                                    ) : (
                                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                            <TrendingDown className="size-7" /> Net Loss: {formatCurrency(Math.abs(profitLossStats.net_profit_loss))}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Link href="/reports/profit-loss">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium shadow-sm">
                                    Full Profit & Loss Statement <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. 5 REPORT NAVIGATION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Profit & Loss */}
                    <Card className="border-sidebar-border/70 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                                    <Scale className="size-5" />
                                </div>
                                <Badge variant="secondary">Core Report</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">Profit & Loss Report</CardTitle>
                            <CardDescription>Income vs Operating Expenses & Salaries net profit statement.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Net Result:</span>
                                    <span className={profitLossStats.is_profit ? 'text-emerald-600' : 'text-rose-600'}>
                                        {formatCurrency(profitLossStats.net_profit_loss)}
                                    </span>
                                </div>
                                <div className="text-muted-foreground text-[11px]">Calculates true profitability excluding debt principal.</div>
                            </div>
                            <Link href="/reports/profit-loss">
                                <Button variant="outline" className="w-full justify-between gap-1 text-xs font-semibold">
                                    View P&L Report <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card 2: Income Report */}
                    <Card className="border-sidebar-border/70 hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <TrendingUp className="size-5" />
                                </div>
                                <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10">Inflow</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">Income Report</CardTitle>
                            <CardDescription>Total revenue received, category breakdown, and customer receipts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Revenue:</span>
                                    <span className="text-emerald-600">{formatCurrency(incomeStats.total)}</span>
                                </div>
                                <div className="text-muted-foreground text-[11px]">{incomeStats.count} posted receipt transactions</div>
                            </div>
                            <Link href="/reports/income">
                                <Button variant="outline" className="w-full justify-between gap-1 text-xs font-semibold">
                                    View Income Report <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card 3: Expense Report */}
                    <Card className="border-sidebar-border/70 hover:border-rose-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                                    <TrendingDown className="size-5" />
                                </div>
                                <Badge variant="outline" className="text-rose-600 border-rose-500/20 bg-rose-500/10">Outflow</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">Expense Report</CardTitle>
                            <CardDescription>Operating expenditure by category, account, and payment method.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Expenses:</span>
                                    <span className="text-rose-600">{formatCurrency(expenseStats.total)}</span>
                                </div>
                                <div className="text-muted-foreground text-[11px]">{expenseStats.count} posted operating expenses</div>
                            </div>
                            <Link href="/reports/expense">
                                <Button variant="outline" className="w-full justify-between gap-1 text-xs font-semibold">
                                    View Expense Report <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card 4: Salary Report */}
                    <Card className="border-sidebar-border/70 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                                    <Users className="size-5" />
                                </div>
                                <Badge variant="secondary">Payroll</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">Salary & Payroll Report</CardTitle>
                            <CardDescription>Employee salary payable, paid, and pending balance breakdown.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Paid:</span>
                                    <span className="text-indigo-600">{formatCurrency(salaryStats.total_paid)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Pending Balance:</span>
                                    <span className="text-amber-600 font-semibold">{formatCurrency(salaryStats.total_pending)}</span>
                                </div>
                            </div>
                            <Link href="/reports/salary">
                                <Button variant="outline" className="w-full justify-between gap-1 text-xs font-semibold">
                                    View Salary Report <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card 5: Loan / Debt Report */}
                    <Card className="border-sidebar-border/70 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                    <HandCoins className="size-5" />
                                </div>
                                <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/10">Liability</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">Loan & Debt Report</CardTitle>
                            <CardDescription>Borrowed principal, repayments, and outstanding liabilities.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Outstanding Debt:</span>
                                    <span className="text-amber-600">{formatCurrency(loanStats.total_outstanding)}</span>
                                </div>
                                <div className="text-muted-foreground text-[11px]">{loanStats.active_count} active company loans</div>
                            </div>
                            <Link href="/reports/loans">
                                <Button variant="outline" className="w-full justify-between gap-1 text-xs font-semibold">
                                    View Loan Report <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </>
    );
}
