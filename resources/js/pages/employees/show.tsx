import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import { 
    AlertCircle, 
    ArrowLeft, 
    Banknote, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    CreditCard, 
    DollarSign, 
    Download, 
    Edit, 
    FileText, 
    History, 
    Landmark, 
    Layers, 
    Paperclip, 
    Plus, 
    Printer, 
    Receipt, 
    RefreshCcw, 
    RotateCcw, 
    ShieldAlert, 
    UserCheck, 
    Users, 
    Wallet 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { FinancialAccount } from '@/types/loans';

export interface EmployeeSalary {
    id: number;
    employee_id: number;
    effective_date: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    created_by?: number;
    created_at?: string;
    creator?: { id: number; name: string };
}

export interface SalaryPayment {
    id: number;
    salary_period_id: number;
    reference: string;
    payment_date: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'other';
    account_id?: number;
    transaction_reference?: string;
    notes?: string;
    status: 'posted' | 'reversed';
    created_by?: number;
    reversed_by?: number;
    reversed_at?: string;
    reversal_reason?: string;
    created_at?: string;
    account?: FinancialAccount;
    creator?: { id: number; name: string };
    reverser?: { id: number; name: string };
}

export interface SalaryPeriod {
    id: number;
    employee_id: number;
    salary_year: number;
    salary_month: number;
    salary_amount: number;
    status: 'pending' | 'partial' | 'paid';
    total_paid: number;
    remaining_amount: number;
    computed_status: 'pending' | 'partial' | 'paid';
    payments?: SalaryPayment[];
    posted_payments?: SalaryPayment[];
}

export interface EmployeeDetail {
    id: number;
    employee_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    joining_date: string;
    status: 'active' | 'inactive';
    created_by?: number;
    updated_by?: number;
    created_at?: string;
    current_salary?: EmployeeSalary;
    salaries?: EmployeeSalary[];
    salary_periods?: SalaryPeriod[];
    creator?: { id: number; name: string };
    updater?: { id: number; name: string };
}

interface Props {
    employee: EmployeeDetail;
    accounts: FinancialAccount[];
    activeTab?: string;
}

const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_transfer', label: 'Online Transfer' },
    { value: 'other', label: 'Other' },
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

export default function EmployeeShow({ employee, accounts, activeTab = 'overview' }: Props) {
    const handleTabChange = (tabId: string) => {
        router.get(
            `/employees/${employee.id}`,
            { tab: tabId },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Modals
    const [isUpdateSalaryOpen, setIsUpdateSalaryOpen] = useState(false);
    const [isGeneratePeriodOpen, setIsGeneratePeriodOpen] = useState(false);
    const [selectedPeriodForPayment, setSelectedPeriodForPayment] = useState<SalaryPeriod | null>(null);
    const [reversingPayment, setReversingPayment] = useState<SalaryPayment | null>(null);
    const [selectedPayslipPeriodId, setSelectedPayslipPeriodId] = useState<string>(
        employee.salary_periods && employee.salary_periods.length > 0 ? String(employee.salary_periods[0].id) : ''
    );

    // Update Salary Form
    const salaryForm = useForm({
        basic_salary: employee.current_salary ? String(employee.current_salary.basic_salary) : '',
        allowances: employee.current_salary ? String(employee.current_salary.allowances) : '0',
        deductions: employee.current_salary ? String(employee.current_salary.deductions) : '0',
        effective_date: new Date().toISOString().split('T')[0],
    });

    // Generate Period Form
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const periodForm = useForm({
        salary_year: String(currentYear),
        salary_month: String(currentMonth),
    });

    // Pay Salary Form
    const paymentForm = useForm({
        salary_period_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'other',
        account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        transaction_reference: '',
        notes: '',
    });

    // Reverse Payment Form
    const reverseForm = useForm({
        reason: '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const getMonthName = (m: number) => {
        return new Date(2026, m - 1, 10).toLocaleString('en-US', { month: 'long' });
    };

    // Calculate Summary Stats from periods & payments
    const currentMonthPeriod = (employee.salary_periods || []).find(
        (p) => p.salary_year === currentYear && p.salary_month === currentMonth
    );

    const paidThisMonth = currentMonthPeriod ? currentMonthPeriod.total_paid : 0;
    const pendingThisMonth = currentMonthPeriod ? currentMonthPeriod.remaining_amount : (employee.current_salary?.net_salary || 0);

    const allPostedPayments = (employee.salary_periods || []).flatMap((p) => p.posted_payments || p.payments?.filter(x => x.status === 'posted') || []);
    const totalSalaryPaidAllTime = allPostedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const accountSelectOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.name} (${acc.type === 'bank' ? acc.bank_name || 'Bank' : 'Cash'}) - PKR ${Number(acc.current_balance).toLocaleString('en-PK')}`,
    }));

    // Handlers
    const handleSalarySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        salaryForm.post(`/employees/${employee.id}/salary`, {
            onSuccess: () => {
                setIsUpdateSalaryOpen(false);
                toast.success('Salary structure updated successfully!');
            },
        });
    };

    const handleGeneratePeriodSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        periodForm.post(`/employees/${employee.id}/periods`, {
            onSuccess: () => {
                setIsGeneratePeriodOpen(false);
                toast.success('Salary period generated successfully!');
            },
        });
    };

    const openPaymentModal = (period: SalaryPeriod) => {
        setSelectedPeriodForPayment(period);
        paymentForm.setData({
            salary_period_id: String(period.id),
            amount: String(period.remaining_amount),
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'bank_transfer',
            account_id: accounts.length > 0 ? String(accounts[0].id) : '',
            transaction_reference: '',
            notes: '',
        });
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post('/employees/payments', {
            onSuccess: () => {
                setSelectedPeriodForPayment(null);
                paymentForm.reset();
                toast.success('Salary payment recorded successfully!');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to process salary payment.');
            },
        });
    };

    const handleReverseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reversingPayment) return;

        reverseForm.post(`/employees/payments/${reversingPayment.id}/reverse`, {
            onSuccess: () => {
                setReversingPayment(null);
                reverseForm.reset();
                toast.success('Salary payment reversed successfully!');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to reverse salary payment.');
            },
        });
    };

    const currentPayslipPeriod = (employee.salary_periods || []).find((p) => String(p.id) === selectedPayslipPeriodId) || (employee.salary_periods && employee.salary_periods[0]);

    return (
        <>
            <Head title={`${employee.full_name} (${employee.employee_id}) - Profile & Salary`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* BACK LINK */}
                <div>
                    <Link href="/employees" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Employees List
                    </Link>
                </div>

                {/* HEADER PROFILE BANNER CARD */}
                <Card className="border-sidebar-border/70 shadow-sm overflow-hidden bg-gradient-to-r from-indigo-50/50 via-background to-background dark:from-indigo-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md">
                                    {employee.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.full_name}</h1>
                                        <Badge variant="outline" className="font-mono text-xs font-bold bg-background">
                                            {employee.employee_id}
                                        </Badge>
                                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className={employee.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                                            {employee.status === 'active' ? 'Active Employee' : 'Inactive Employee'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                                        {employee.email && <span>📧 {employee.email}</span>}
                                        {employee.phone && <span>📞 {employee.phone}</span>}
                                        <span>📅 Joined {new Date(employee.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="rounded-xl bg-background border p-3 text-right">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Net Salary</div>
                                    <div className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(Number(employee.current_salary?.net_salary || 0))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button onClick={() => setIsUpdateSalaryOpen(true)} variant="outline" size="sm" className="gap-1 text-xs">
                                        <Edit className="size-3.5" /> Update Salary
                                    </Button>
                                    <Button onClick={() => setIsGeneratePeriodOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs">
                                        <Plus className="size-3.5" /> Generate Period
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 6 TABS NAVIGATION */}
                <div className="flex border-b border-border gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: '1. Overview', icon: Users },
                        { id: 'salary', label: '2. Current Salary', icon: DollarSign },
                        { id: 'history', label: '3. Salary History', icon: History },
                        { id: 'periods', label: '4. Salary Periods', icon: Calendar },
                        { id: 'payments', label: '5. Payment History', icon: Receipt },
                        { id: 'payslips', label: '6. Payslips', icon: FileText },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="size-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Net Salary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold font-mono text-foreground">{formatCurrency(Number(employee.current_salary?.net_salary || 0))}</div>
                                </CardContent>
                            </Card>

                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid This Month</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(paidThisMonth)}</div>
                                </CardContent>
                            </Card>

                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending This Month</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(pendingThisMonth)}</div>
                                </CardContent>
                            </Card>

                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Salary Paid</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{formatCurrency(totalSalaryPaidAllTime)}</div>
                                </CardContent>
                            </Card>

                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Salary Payments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold">{allPostedPayments.length} Payments</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bio & System Metadata Details */}
                        <Card className="border-sidebar-border/70 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Employee Information</CardTitle>
                                <CardDescription>Basic system profile and audit metadata.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Employee ID</div>
                                        <div className="font-mono font-bold mt-1 text-foreground">{employee.employee_id}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Full Name</div>
                                        <div className="font-semibold mt-1 text-foreground">{employee.full_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Email Address</div>
                                        <div className="mt-1 text-foreground">{employee.email || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</div>
                                        <div className="mt-1 text-foreground">{employee.phone || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Joining Date</div>
                                        <div className="mt-1 text-foreground">{new Date(employee.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Account Status</div>
                                        <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{employee.status}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB CONTENT 2: CURRENT SALARY */}
                {activeTab === 'salary' && (
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Current Salary Breakdown</CardTitle>
                                <CardDescription>Active basic salary, allowances, and deductions.</CardDescription>
                            </div>
                            <Button onClick={() => setIsUpdateSalaryOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Edit className="size-4" /> Update Salary Structure
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {employee.current_salary ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl border bg-card space-y-1">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Basic Salary</div>
                                        <div className="text-2xl font-bold font-mono text-foreground">{formatCurrency(Number(employee.current_salary.basic_salary))}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card space-y-1">
                                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">+ Allowances</div>
                                        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">+{formatCurrency(Number(employee.current_salary.allowances))}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card space-y-1">
                                        <div className="text-xs font-semibold text-destructive uppercase">- Deductions</div>
                                        <div className="text-2xl font-bold font-mono text-destructive">-{formatCurrency(Number(employee.current_salary.deductions))}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-indigo-500/10 dark:bg-indigo-950/50 space-y-1">
                                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">= Net Payable Salary</div>
                                        <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(Number(employee.current_salary.net_salary))}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">No active salary structure found.</div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT 3: SALARY HISTORY */}
                {activeTab === 'history' && (
                    <Card className="border-sidebar-border/70 shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Salary Structure History</CardTitle>
                            <CardDescription>Historical salary changes are strictly preserved for financial audit integrity.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Effective Date</th>
                                        <th className="p-4 text-right">Basic Salary</th>
                                        <th className="p-4 text-right">Allowances</th>
                                        <th className="p-4 text-right">Deductions</th>
                                        <th className="p-4 text-right">Net Salary</th>
                                        <th className="p-4">Updated By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(employee.salaries || []).length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No salary history recorded yet.</td></tr>
                                    ) : (
                                        (employee.salaries || []).map((sal) => (
                                            <tr key={sal.id} className="hover:bg-muted/30">
                                                <td className="p-4 font-semibold text-foreground">
                                                    {new Date(sal.effective_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(Number(sal.basic_salary))}</td>
                                                <td className="p-4 text-right font-mono text-emerald-600">+{formatCurrency(Number(sal.allowances))}</td>
                                                <td className="p-4 text-right font-mono text-destructive">-{formatCurrency(Number(sal.deductions))}</td>
                                                <td className="p-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(Number(sal.net_salary))}</td>
                                                <td className="p-4 text-xs text-muted-foreground">{sal.creator?.name || 'System'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT 4: SALARY PERIODS */}
                {activeTab === 'periods' && (
                    <Card className="border-sidebar-border/70 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Monthly Salary Periods</CardTitle>
                                <CardDescription>Track payable net salary and payment progress month by month.</CardDescription>
                            </div>
                            <Button onClick={() => setIsGeneratePeriodOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Plus className="size-4" /> Generate New Period
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Salary Period</th>
                                        <th className="p-4 text-right">Net Payable</th>
                                        <th className="p-4 text-right">Total Paid</th>
                                        <th className="p-4 text-right">Remaining Balance</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(employee.salary_periods || []).length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No salary periods generated yet.</td></tr>
                                    ) : (
                                        (employee.salary_periods || []).map((period) => (
                                            <tr key={period.id} className="hover:bg-muted/30">
                                                <td className="p-4 font-bold text-foreground">
                                                    {getMonthName(period.salary_month)} {period.salary_year}
                                                </td>
                                                <td className="p-4 text-right font-mono font-semibold">{formatCurrency(Number(period.salary_amount))}</td>
                                                <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(period.total_paid))}</td>
                                                <td className="p-4 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(Number(period.remaining_amount))}</td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={period.computed_status === 'paid' ? 'default' : period.computed_status === 'partial' ? 'secondary' : 'outline'} className={period.computed_status === 'paid' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : period.computed_status === 'partial' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                                                        {period.computed_status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {period.computed_status !== 'paid' && (
                                                        <Button onClick={() => openPaymentModal(period)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                                                            <DollarSign className="size-3.5" /> Pay Salary
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT 5: PAYMENT HISTORY */}
                {activeTab === 'payments' && (
                    <Card className="border-sidebar-border/70 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Salary Payment History</CardTitle>
                                <CardDescription>Complete audit trail of all full and partial salary disbursements.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Payment Date</th>
                                        <th className="p-4">Payment Reference</th>
                                        <th className="p-4">Period</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Account</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allPostedPayments.length === 0 ? (
                                        <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No payment records found.</td></tr>
                                    ) : (
                                        allPostedPayments.map((pmt) => (
                                            <tr key={pmt.id} className="hover:bg-muted/30">
                                                <td className="p-4 font-semibold text-foreground">
                                                    {new Date(pmt.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{pmt.reference}</td>
                                                <td className="p-4 text-muted-foreground">
                                                    {pmt.salary_period_id ? 'Salary Period' : '—'}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-foreground">{formatCurrency(Number(pmt.amount))}</td>
                                                <td className="p-4 capitalize text-xs text-muted-foreground">{pmt.payment_method.replace('_', ' ')}</td>
                                                <td className="p-4 text-xs font-medium">{pmt.account?.name || '—'}</td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={pmt.status === 'posted' ? 'default' : 'destructive'} className={pmt.status === 'posted' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-700 border-red-500/20'}>
                                                        {pmt.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {pmt.status === 'posted' && (
                                                        <Button onClick={() => setReversingPayment(pmt)} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 text-xs gap-1">
                                                            <RotateCcw className="size-3.5" /> Reverse
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT 6: PAYSLIPS */}
                {activeTab === 'payslips' && (
                    <div className="space-y-6">
                        <Card className="border-sidebar-border/70 shadow-sm p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Label className="whitespace-nowrap font-semibold">Select Salary Period:</Label>
                                    <select
                                        value={selectedPayslipPeriodId}
                                        onChange={(e) => setSelectedPayslipPeriodId(e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {(employee.salary_periods || []).map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {getMonthName(p.salary_month)} {p.salary_year} ({p.computed_status.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                                    <Printer className="size-4" /> Print / Save PDF Payslip
                                </Button>
                            </div>
                        </Card>

                        {/* PRINTABLE PAYSLIP STATEMENT CARD */}
                        {currentPayslipPeriod ? (
                            <Card className="border-2 border-primary/20 shadow-md p-8 bg-card printable-payslip">
                                <div className="space-y-6">
                                    {/* Company & Statement Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                                <Building2 className="size-6 text-indigo-600" />
                                                Company Finance Management System
                                            </h2>
                                            <p className="text-xs text-muted-foreground mt-1">Official Monthly Salary Payslip</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="font-mono text-sm px-3 py-1 font-bold">
                                                PAYSLIP: {getMonthName(currentPayslipPeriod.salary_month).toUpperCase()} {currentPayslipPeriod.salary_year}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">Status: <span className="font-bold text-foreground capitalize">{currentPayslipPeriod.computed_status}</span></div>
                                        </div>
                                    </div>

                                    {/* Employee Details Box */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 text-sm">
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Employee Name</div>
                                            <div className="font-bold text-foreground mt-0.5">{employee.full_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Employee ID</div>
                                            <div className="font-mono font-bold text-indigo-600 mt-0.5">{employee.employee_id}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Joining Date</div>
                                            <div className="mt-0.5 text-foreground">{new Date(employee.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Contact Phone</div>
                                            <div className="mt-0.5 text-foreground">{employee.phone || '—'}</div>
                                        </div>
                                    </div>

                                    {/* Salary Breakdown Table */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Earnings & Deductions Breakdown</h3>
                                        <table className="w-full text-left text-sm border rounded-lg overflow-hidden">
                                            <thead className="bg-muted text-muted-foreground font-semibold border-b">
                                                <tr>
                                                    <th className="p-3">Component Description</th>
                                                    <th className="p-3 text-right">Amount (PKR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                <tr>
                                                    <td className="p-3 font-medium">Basic Salary</td>
                                                    <td className="p-3 text-right font-mono">{formatCurrency(Number(employee.current_salary?.basic_salary || 0))}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-medium text-emerald-600">+ Allowances & Bonuses</td>
                                                    <td className="p-3 text-right font-mono text-emerald-600">+{formatCurrency(Number(employee.current_salary?.allowances || 0))}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-medium text-destructive">- Deductions & Tax</td>
                                                    <td className="p-3 text-right font-mono text-destructive">-{formatCurrency(Number(employee.current_salary?.deductions || 0))}</td>
                                                </tr>
                                                <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 font-bold">
                                                    <td className="p-3 text-base text-indigo-700 dark:text-indigo-300">Total Net Payable Salary</td>
                                                    <td className="p-3 text-right text-base font-mono text-indigo-700 dark:text-indigo-300">{formatCurrency(Number(currentPayslipPeriod.salary_amount))}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Payment Receipts Breakdown */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Disbursement Transactions</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl border space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Total Salary Paid:</span>
                                                    <span className="font-bold text-emerald-600 font-mono">{formatCurrency(Number(currentPayslipPeriod.total_paid))}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Remaining Balance:</span>
                                                    <span className="font-bold text-amber-600 font-mono">{formatCurrency(Number(currentPayslipPeriod.remaining_amount))}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl border bg-muted/20 text-xs space-y-1">
                                                <div className="font-semibold text-muted-foreground uppercase">Disbursement Status:</div>
                                                <div className="text-base font-bold capitalize text-foreground">{currentPayslipPeriod.computed_status} Payment</div>
                                                <p className="text-muted-foreground">Verified & reconciled with company ledger.</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Card>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">No payslip available for the selected period.</div>
                        )}
                    </div>
                )}

                {/* MODAL 1: UPDATE SALARY */}
                <Dialog open={isUpdateSalaryOpen} onOpenChange={(open) => !open && setIsUpdateSalaryOpen(false)}>
                    <DialogContent className="max-w-3xl sm:max-w-3xl w-full">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <DollarSign className="size-5 text-indigo-600 dark:text-indigo-400" />
                                Update Salary Structure
                            </DialogTitle>
                            <DialogDescription>Create a new salary history record for {employee.full_name}.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSalarySubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Effective Date <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="date"
                                        value={salaryForm.data.effective_date}
                                        onChange={(e) => salaryForm.setData('effective_date', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Basic Salary (PKR) <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={salaryForm.data.basic_salary}
                                        onChange={(e) => salaryForm.setData('basic_salary', e.target.value)}
                                        required
                                    />
                                    {salaryForm.errors.basic_salary && <p className="text-xs text-destructive">{salaryForm.errors.basic_salary}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Allowances (PKR)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={salaryForm.data.allowances}
                                        onChange={(e) => salaryForm.setData('allowances', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Deductions (PKR)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={salaryForm.data.deductions}
                                        onChange={(e) => salaryForm.setData('deductions', e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsUpdateSalaryOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={salaryForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    Save New Salary Structure
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL 2: GENERATE SALARY PERIOD */}
                <Dialog open={isGeneratePeriodOpen} onOpenChange={(open) => !open && setIsGeneratePeriodOpen(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="size-5 text-indigo-600 dark:text-indigo-400" />
                                Generate Monthly Salary Period
                            </DialogTitle>
                            <DialogDescription>Create a salary period for {employee.full_name}.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleGeneratePeriodSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Salary Year <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        value={periodForm.data.salary_year}
                                        onChange={(e) => periodForm.setData('salary_year', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Salary Month <span className="text-destructive">*</span></Label>
                                    <select
                                        value={periodForm.data.salary_month}
                                        onChange={(e) => periodForm.setData('salary_month', e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                            <option key={m} value={m}>{getMonthName(m)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsGeneratePeriodOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={periodForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    Generate Period
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL 3: PAY SALARY */}
                <Dialog open={!!selectedPeriodForPayment} onOpenChange={(open) => !open && setSelectedPeriodForPayment(null)}>
                    <DialogContent className="max-w-3xl sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
                                Record Salary Payment
                            </DialogTitle>
                            <DialogDescription>
                                Disburse salary for <span className="font-semibold text-foreground">{employee.full_name}</span> ({selectedPeriodForPayment ? `${getMonthName(selectedPeriodForPayment.salary_month)} ${selectedPeriodForPayment.salary_year}` : ''}).
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPeriodForPayment && (
                            <form onSubmit={handlePaymentSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
                                        <div>
                                            <div className="font-semibold text-muted-foreground uppercase">Total Salary</div>
                                            <div className="font-mono font-bold text-foreground mt-0.5">{formatCurrency(Number(selectedPeriodForPayment.salary_amount))}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Already Paid</div>
                                            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(Number(selectedPeriodForPayment.total_paid))}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-amber-600 dark:text-amber-400 uppercase">Remaining</div>
                                            <div className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(Number(selectedPeriodForPayment.remaining_amount))}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Payment Amount (PKR) <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={paymentForm.data.amount}
                                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                                required
                                            />
                                            {paymentForm.errors.amount && <p className="text-xs text-destructive">{paymentForm.errors.amount}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Payment Date <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="date"
                                                value={paymentForm.data.payment_date}
                                                onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Payment Method <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={paymentMethodOptions}
                                                value={paymentMethodOptions.find(opt => opt.value === paymentForm.data.payment_method) || null}
                                                onChange={(opt) => paymentForm.setData('payment_method', opt ? (opt.value as any) : 'bank_transfer')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Company Paying Account <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={accountSelectOptions}
                                                value={accountSelectOptions.find(opt => opt.value === paymentForm.data.account_id) || null}
                                                onChange={(opt) => paymentForm.setData('account_id', opt ? opt.value : '')}
                                                styles={customReactSelectStyles}
                                            />
                                            {paymentForm.errors.account_id && <p className="text-xs text-destructive">{paymentForm.errors.account_id}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Transaction / Cheque Reference</Label>
                                            <Input
                                                placeholder="e.g. TXN-998112"
                                                value={paymentForm.data.transaction_reference}
                                                onChange={(e) => paymentForm.setData('transaction_reference', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Notes (Optional)</Label>
                                            <Input
                                                placeholder="e.g. Disbursed via online bank portal"
                                                value={paymentForm.data.notes}
                                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setSelectedPeriodForPayment(null)}>Cancel</Button>
                                    <Button type="submit" disabled={paymentForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6">
                                        Confirm Salary Payment
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL 4: REVERSE SALARY PAYMENT */}
                <Dialog open={!!reversingPayment} onOpenChange={(open) => !open && setReversingPayment(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <ShieldAlert className="size-5" />
                                Reverse Salary Payment
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reverse payment <span className="font-semibold text-foreground">{reversingPayment?.reference}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {reversingPayment && (
                            <form onSubmit={handleReverseSubmit} className="space-y-4 pt-2">
                                <div className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <p className="font-semibold flex items-center gap-1">
                                        <AlertCircle className="size-3.5" />
                                        Financial Reversal Notice:
                                    </p>
                                    <p>
                                        Reversing will restore PKR {formatCurrency(Number(reversingPayment.amount))} back to the company account ({reversingPayment.account?.name}) and post a reversing ledger entry.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Reversal Reason <span className="text-destructive">*</span></Label>
                                    <Textarea
                                        placeholder="Specify reason for reversal (e.g. Wrong bank account selected, duplicate payment)"
                                        rows={3}
                                        value={reverseForm.data.reason}
                                        onChange={(e) => reverseForm.setData('reason', e.target.value)}
                                        required
                                    />
                                    {reverseForm.errors.reason && <p className="text-xs text-destructive">{reverseForm.errors.reason}</p>}
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setReversingPayment(null)}>Cancel</Button>
                                    <Button type="submit" disabled={reverseForm.processing} variant="destructive">
                                        Confirm & Reverse Payment
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
