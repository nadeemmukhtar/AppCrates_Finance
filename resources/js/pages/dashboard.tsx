import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Landmark, 
    Users, 
    ArrowRight, 
    PlusCircle, 
    FileText, 
    Scale,
    Building2,
    ShieldAlert
} from 'lucide-react';

interface Account {
    id: number;
    name: string;
    type: string;
    account_number?: string;
    bank_name?: string;
    current_balance: number;
}

interface LedgerEntry {
    id: number;
    reference: string;
    transaction_date: string;
    description: string;
    debit: number;
    credit: number;
    transaction_type: string;
    account?: {
        name: string;
    };
}

interface Props {
    metrics: {
        total_balance: number;
        this_month_income: number;
        this_month_expenses: number;
        this_month_net: number;
        outstanding_loans: number;
        active_employees: number;
    };
    accounts: Account[];
    recent_ledger: LedgerEntry[];
}

export default function Dashboard({ metrics, accounts, recent_ledger }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <>
            <Head title="CEO Financial Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
                {/* Header & Quick Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Company Financial Overview</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Real-time corporate cash flow, bank balances, operating expenses, and central ledger activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Link href="/money-in">
                                <PlusCircle className="mr-1.5 size-4" /> Money In
                            </Link>
                        </Button>
                        <Button asChild variant="default" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                            <Link href="/expenses">
                                <PlusCircle className="mr-1.5 size-4" /> Add Expense
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/employees">
                                <Users className="mr-1.5 size-4" /> Payroll
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/reports">
                                <FileText className="mr-1.5 size-4" /> Reports
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Liquidity / Cash Balance */}
                    <Card className="shadow-sm border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cash & Bank Balance</CardTitle>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <Wallet className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(metrics.total_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Across {accounts.length} active financial account{accounts.length === 1 ? '' : 's'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* This Month Income */}
                    <Card className="shadow-sm border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month Income</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                                <TrendingUp className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                                {formatCurrency(metrics.this_month_income)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Total posted revenue received
                            </p>
                        </CardContent>
                    </Card>

                    {/* This Month Expenses */}
                    <Card className="shadow-sm border-l-4 border-l-rose-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month Expenses</CardTitle>
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400">
                                <TrendingDown className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
                                {formatCurrency(metrics.this_month_expenses)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Operating expenses + Salary payments
                            </p>
                        </CardContent>
                    </Card>

                    {/* Net Profit / Outstanding Loans */}
                    <Card className={`shadow-sm border-l-4 ${metrics.this_month_net >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month Net Cash Flow</CardTitle>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Scale className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-black font-mono tracking-tight ${metrics.this_month_net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {formatCurrency(metrics.this_month_net)}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant={metrics.this_month_net >= 0 ? 'default' : 'destructive'} className="text-[10px] px-2 py-0.5">
                                    {metrics.this_month_net >= 0 ? 'Positive Surplus' : 'Deficit'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Net cash position</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Second Row: Financial Accounts & Outstanding Debts */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Financial Accounts List (2 Columns) */}
                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Landmark className="size-5 text-emerald-600" /> Financial & Bank Accounts
                                </CardTitle>
                                <CardDescription className="text-xs">Real-time balances across all company financial accounts</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/accounts">
                                    Manage Accounts <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {accounts.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No financial accounts created yet. <Link href="/accounts" className="text-indigo-600 font-semibold underline">Add first account</Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {accounts.map((acc) => (
                                        <div key={acc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-xl text-foreground">
                                                    {acc.type === 'bank' ? <Landmark className="size-4 text-blue-600" /> : <Wallet className="size-4 text-emerald-600" />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-foreground">{acc.name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                                                        <span>{acc.type} account</span>
                                                        {acc.account_number && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-mono">{acc.account_number}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(Number(acc.current_balance))}
                                                </div>
                                                <span className="text-[11px] text-muted-foreground">Current Balance</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats & Debt Overview (1 Column) */}
                    <div className="space-y-6">
                        {/* Outstanding Debt Card */}
                        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                    <ShieldAlert className="size-4" /> Loan & Debt Liabilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                                    {formatCurrency(metrics.outstanding_loans)}
                                </div>
                                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                                    Total active loan principal remaining to be repaid.
                                </p>
                                <Button asChild variant="outline" size="sm" className="mt-3 w-full border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100">
                                    <Link href="/loans">View Loan Schedule</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Quick Reports Card */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileText className="size-4 text-indigo-600" /> Executive Financial Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/reports/income" className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40 text-xs font-medium transition-colors">
                                    <span className="flex items-center gap-2"><TrendingUp className="size-3.5 text-blue-600" /> Income Statement</span>
                                    <ArrowRight className="size-3.5 text-muted-foreground" />
                                </Link>
                                <Link href="/reports/expense" className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40 text-xs font-medium transition-colors">
                                    <span className="flex items-center gap-2"><TrendingDown className="size-3.5 text-rose-600" /> Expense Breakdown</span>
                                    <ArrowRight className="size-3.5 text-muted-foreground" />
                                </Link>
                                <Link href="/reports/profit-loss" className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40 text-xs font-medium transition-colors">
                                    <span className="flex items-center gap-2"><Scale className="size-3.5 text-indigo-600" /> Profit & Loss (P&L)</span>
                                    <ArrowRight className="size-3.5 text-muted-foreground" />
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Third Row: Central Ledger Recent Activity Feed */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                        <div>
                            <CardTitle className="text-lg font-bold">Recent Financial Transactions (Ledger Feed)</CardTitle>
                            <CardDescription className="text-xs">Audit log of latest money movements posted across all modules</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm" className="text-xs">
                            <Link href="/ledger">
                                Open Central Ledger <ArrowRight className="ml-1 size-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recent_ledger.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No financial transactions recorded in ledger yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        <tr>
                                            <th className="p-3.5 pl-4">Date</th>
                                            <th className="p-3.5">Reference</th>
                                            <th className="p-3.5">Type</th>
                                            <th className="p-3.5">Description</th>
                                            <th className="p-3.5">Account</th>
                                            <th className="p-3.5 text-right">Debit (Out)</th>
                                            <th className="p-3.5 text-right pr-4">Credit (In)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recent_ledger.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3.5 pl-4 font-mono text-xs text-muted-foreground">
                                                    {new Date(item.transaction_date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="p-3.5 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                                    {item.reference}
                                                </td>
                                                <td className="p-3.5">
                                                    <Badge variant="outline" className="text-[11px] capitalize font-medium">
                                                        {item.transaction_type.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-3.5 max-w-xs truncate text-foreground">{item.description}</td>
                                                <td className="p-3.5 text-xs text-muted-foreground">{item.account?.name || '—'}</td>
                                                <td className="p-3.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                                                    {Number(item.debit) > 0 ? formatCurrency(Number(item.debit)) : '—'}
                                                </td>
                                                <td className="p-3.5 text-right pr-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                    {Number(item.credit) > 0 ? formatCurrency(Number(item.credit)) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
