import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    AlertCircle, 
    ArrowLeft, 
    ArrowUpRight, 
    Banknote, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    DollarSign, 
    FileText, 
    HandCoins, 
    History, 
    MoreHorizontal, 
    PlusCircle, 
    RotateCcw, 
    ShieldCheck, 
    User, 
    XCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { FinancialAccount, Loan, LoanPayment } from '@/types/loans';

interface Props {
    loan: Loan;
    accounts: FinancialAccount[];
}

export default function LoanShow({ loan, accounts }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'repayments' | 'ledger' | 'audit'>('overview');
    
    // Modal state for Reversal
    const [selectedPaymentForReversal, setSelectedPaymentForReversal] = useState<LoanPayment | null>(null);
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);

    // Reversal Form
    const reversalForm = useForm({
        reason: '',
    });

    // Repayment Form
    const repaymentForm = useForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: String(loan.remaining_balance),
        payment_method: 'bank_transfer',
        account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        transaction_reference: '',
        notes: '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200">Active</Badge>;
            case 'partially_paid':
                return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200">Partially Paid</Badge>;
            case 'fully_paid':
            case 'cleared':
                return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">Fully Paid</Badge>;
            case 'overdue':
                return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200">Overdue</Badge>;
            case 'cancelled':
                return <Badge variant="outline">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleReversalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaymentForReversal) return;

        reversalForm.post(`/repayments/${selectedPaymentForReversal.id}/reverse`, {
            onSuccess: () => {
                setSelectedPaymentForReversal(null);
                reversalForm.reset();
                toast.success('Repayment reversed successfully!');
            },
        });
    };

    const handleRepaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        repaymentForm.post(`/loans/${loan.id}/repayments`, {
            onSuccess: () => {
                setIsRepaymentModalOpen(false);
                repaymentForm.reset();
                toast.success('Repayment recorded successfully!');
            },
        });
    };

    return (
        <>
            <Head title={`Loan Profile - ${loan.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Back Button & Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link href="/loans">
                            <ArrowLeft className="size-4" />
                            Back to Loans List
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        {loan.status !== 'cancelled' && loan.remaining_balance > 0 && (
                            <Button 
                                onClick={() => setIsRepaymentModalOpen(true)}
                                className="gap-2"
                            >
                                <PlusCircle className="size-4" />
                                Record Repayment
                            </Button>
                        )}
                    </div>
                </div>

                {/* Hero Header Card */}
                <Card className="shadow-md border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            
                            {/* Loan Ref & Lender Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">
                                        {loan.reference}
                                    </h1>
                                    {renderStatusBadge(loan.computed_status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                        <Building2 className="size-4 text-muted-foreground" />
                                        {loan.lender?.name}
                                    </span>
                                    <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded">
                                        Type: {loan.lender?.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-4 text-muted-foreground" />
                                        Borrowed: {loan.loan_date}
                                    </span>
                                    {loan.due_date && (
                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                            <Clock className="size-4" />
                                            Due: {loan.due_date}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Financial Totals */}
                            <div className="grid grid-cols-3 gap-6 rounded-xl bg-muted/50 p-4 border border-border">
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Original Principal</div>
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(Number(loan.original_amount))}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Total Repaid</div>
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(loan.total_repaid)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Remaining Balance</div>
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(loan.remaining_balance)}</div>
                                </div>
                            </div>

                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                <span>Repayment Progress</span>
                                <span>{loan.repayment_progress}% Cleared</span>
                            </div>
                            <div className="h-3 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        loan.repayment_progress >= 100 ? 'bg-emerald-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${loan.repayment_progress}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'overview'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Loan Details & Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('repayments')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'repayments'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Repayment History ({loan.payments?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'ledger'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Ledger Transactions ({loan.ledger_entries?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'audit'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Audit Trail
                    </button>
                </div>

                {/* TAB CONTENTS */}

                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <FileText className="size-4" />
                                    Loan Terms & Meta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Loan Reference:</span>
                                    <span className="font-mono font-bold">{loan.reference}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Loan Date:</span>
                                    <span>{loan.loan_date}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <span>{loan.due_date || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Payment Frequency:</span>
                                    <span className="capitalize">{loan.payment_frequency}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Interest Rate:</span>
                                    <span>{Number(loan.interest_rate)}%</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Interest Amount:</span>
                                    <span>{formatCurrency(Number(loan.interest_amount))}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Receiving Account:</span>
                                    <span className="font-medium text-foreground">{loan.destination_account?.name || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-sidebar-border/70">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <User className="size-4" />
                                    Lender Information & Purpose
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Lender Name:</span>
                                    <span className="font-bold">{loan.lender?.name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Lender Type:</span>
                                    <span className="capitalize">{loan.lender?.type}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span>{loan.lender?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span>{loan.lender?.email || 'N/A'}</span>
                                </div>
                                <div className="py-1 border-b">
                                    <span className="text-muted-foreground block mb-1">Purpose / Reason:</span>
                                    <p className="font-medium text-foreground">{loan.purpose || 'No purpose recorded.'}</p>
                                </div>
                                <div className="py-1">
                                    <span className="text-muted-foreground block mb-1">Notes:</span>
                                    <p className="text-muted-foreground">{loan.notes || 'No additional notes.'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 2. REPAYMENT HISTORY TAB */}
                {activeTab === 'repayments' && (
                    <Card className="border-sidebar-border/70 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <History className="size-4" />
                                Posted Repayments Log
                            </CardTitle>
                            {loan.status !== 'cancelled' && loan.remaining_balance > 0 && (
                                <Button size="sm" onClick={() => setIsRepaymentModalOpen(true)} className="gap-1">
                                    <PlusCircle className="size-3.5" />
                                    Add Repayment
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="p-4">Payment Date</th>
                                            <th className="p-4">Reference</th>
                                            <th className="p-4 text-right">Amount Repaid</th>
                                            <th className="p-4">Payment Method</th>
                                            <th className="p-4">Paying Account</th>
                                            <th className="p-4">Trx Ref</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(!loan.payments || loan.payments.length === 0) ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                    No repayments recorded for this loan yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            loan.payments.map((payment) => (
                                                <tr key={payment.id} className={payment.is_reversed ? 'bg-rose-50/30 dark:bg-rose-950/20 opacity-70' : ''}>
                                                    <td className="p-4">{payment.payment_date}</td>
                                                    <td className="p-4 font-mono font-medium">{payment.reference}</td>
                                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(Number(payment.amount))}
                                                    </td>
                                                    <td className="p-4 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                                                    <td className="p-4 font-medium">{payment.account?.name || 'N/A'}</td>
                                                    <td className="p-4 text-xs font-mono">{payment.transaction_reference || 'N/A'}</td>
                                                    <td className="p-4 text-center">
                                                        {payment.is_reversed ? (
                                                            <Badge variant="outline" className="text-destructive border-destructive/30">Reversed</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600">Posted</Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="size-8 p-0">
                                                                    <MoreHorizontal className="size-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                {!payment.is_reversed && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setSelectedPaymentForReversal(payment)}
                                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                                    >
                                                                        <RotateCcw className="size-4 text-destructive" />
                                                                        Reverse Repayment
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. LEDGER TRANSACTIONS TAB */}
                {activeTab === 'ledger' && (
                    <Card className="border-sidebar-border/70 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Banknote className="size-4" />
                                Double-Entry Ledger Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Ledger Ref</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Financial Account</th>
                                            <th className="p-4 text-right">Debit (PKR)</th>
                                            <th className="p-4 text-right">Credit (PKR)</th>
                                            <th className="p-4">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(!loan.ledger_entries || loan.ledger_entries.length === 0) ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    No ledger entries recorded.
                                                </td>
                                            </tr>
                                        ) : (
                                            loan.ledger_entries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td className="p-4">{entry.transaction_date}</td>
                                                    <td className="p-4 font-mono font-medium">{entry.reference}</td>
                                                    <td className="p-4 capitalize">{entry.transaction_type.replace('_', ' ')}</td>
                                                    <td className="p-4 font-medium">{entry.account?.name || 'Loan Liability'}</td>
                                                    <td className="p-4 text-right font-semibold text-emerald-600">
                                                        {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                                                    </td>
                                                    <td className="p-4 text-right font-semibold text-blue-600">
                                                        {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                                                    </td>
                                                    <td className="p-4 text-xs text-muted-foreground">{entry.description}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4. AUDIT TRAIL TAB */}
                {activeTab === 'audit' && (
                    <Card className="border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <ShieldCheck className="size-4" />
                                Immutable Audit History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                                <CheckCircle2 className="size-5 text-emerald-600 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-foreground">Loan Created</div>
                                    <div className="text-xs text-muted-foreground">
                                        Recorded by {loan.creator?.name || 'System Admin'} on {loan.created_at}
                                    </div>
                                </div>
                            </div>

                            {loan.cancelled_at && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
                                    <XCircle className="size-5 mt-0.5" />
                                    <div>
                                        <div className="font-semibold">Loan Cancelled</div>
                                        <div className="text-xs opacity-80">
                                            Cancelled by {loan.canceller?.name || 'Admin'} on {loan.cancelled_at}. Reason: {loan.cancellation_reason}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loan.payments?.map((p) => p.is_reversed && (
                                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                                    <RotateCcw className="size-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-amber-900 dark:text-amber-300">Repayment {p.reference} Reversed</div>
                                        <div className="text-xs text-amber-700 dark:text-amber-400">
                                            Reversed by {p.reverser?.name || 'Admin'} on {p.reversed_at}. Reason: {p.reversal_reason}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* MODALS */}

                {/* REVERSE REPAYMENT DIALOG */}
                <Dialog open={!!selectedPaymentForReversal} onOpenChange={(open) => !open && setSelectedPaymentForReversal(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <RotateCcw className="size-5" />
                                Reverse Repayment
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reverse repayment <span className="font-mono font-semibold">{selectedPaymentForReversal?.reference}</span> ({formatCurrency(Number(selectedPaymentForReversal?.amount || 0))})?
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPaymentForReversal && (
                            <form onSubmit={handleReversalSubmit} className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Reversal Reason *</Label>
                                    <Input
                                        placeholder="Reason for reversing..."
                                        value={reversalForm.data.reason}
                                        onChange={(e) => reversalForm.setData('reason', e.target.value)}
                                    />
                                    {reversalForm.errors.reason && <p className="text-xs text-destructive">{reversalForm.errors.reason}</p>}
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setSelectedPaymentForReversal(null)}>Cancel</Button>
                                    <Button type="submit" disabled={reversalForm.processing} variant="destructive">
                                        Confirm Reversal
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* RECORD REPAYMENT DIALOG */}
                <Dialog open={isRepaymentModalOpen} onOpenChange={setIsRepaymentModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <PlusCircle className="size-5" />
                                Record Repayment
                            </DialogTitle>
                            <DialogDescription>
                                Record a payment for loan <span className="font-semibold text-foreground">{loan.reference}</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRepaymentSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Repayment Amount (PKR) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    max={loan.remaining_balance}
                                    value={repaymentForm.data.amount}
                                    onChange={(e) => repaymentForm.setData('amount', e.target.value)}
                                />
                                {repaymentForm.errors.amount && <p className="text-xs text-destructive">{repaymentForm.errors.amount}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Method *</Label>
                                <Select
                                    value={repaymentForm.data.payment_method}
                                    onValueChange={(val: any) => repaymentForm.setData('payment_method', val)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Paying Cash/Bank Account *</Label>
                                <Select
                                    value={repaymentForm.data.account_id}
                                    onValueChange={(val) => repaymentForm.setData('account_id', val)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((acc) => (
                                            <SelectItem key={acc.id} value={String(acc.id)}>
                                                {acc.name} ({formatCurrency(acc.current_balance)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Date *</Label>
                                <Input
                                    type="date"
                                    value={repaymentForm.data.payment_date}
                                    onChange={(e) => repaymentForm.setData('payment_date', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Transaction Reference / Cheque #</Label>
                                <Input
                                    placeholder="e.g. TRX-998823"
                                    value={repaymentForm.data.transaction_reference}
                                    onChange={(e) => repaymentForm.setData('transaction_reference', e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsRepaymentModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={repaymentForm.processing}>
                                    Confirm Repayment
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
