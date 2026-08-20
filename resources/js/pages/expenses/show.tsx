import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import { 
    AlertCircle, 
    ArrowLeft, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    Download, 
    Edit, 
    FileText, 
    History, 
    Landmark, 
    Layers, 
    Paperclip, 
    Receipt, 
    ShieldAlert, 
    Tag, 
    TrendingDown, 
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

export interface ExpenseCategory {
    id: number;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
}

export interface LedgerEntry {
    id: number;
    reference: string;
    transaction_date: string;
    debit: number;
    credit: number;
    transaction_type: string;
    description?: string;
}

export interface ExpenseDetail {
    id: number;
    reference: string;
    expense_date: string;
    category_id: number;
    account_id?: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'card' | 'other';
    amount: number;
    external_reference?: string;
    description?: string;
    notes?: string;
    attachment_path?: string;
    status: 'posted' | 'voided';
    created_by?: number;
    updated_by?: number;
    voided_by?: number;
    voided_at?: string;
    void_reason?: string;
    created_at?: string;
    updated_at?: string;
    category?: ExpenseCategory;
    account?: FinancialAccount;
    creator?: { id: number; name: string };
    updater?: { id: number; name: string };
    voider?: { id: number; name: string };
    ledger_entries?: LedgerEntry[];
}

interface Props {
    expense: ExpenseDetail;
    accounts: FinancialAccount[];
    categories: ExpenseCategory[];
    activeTab?: string;
}

const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_transfer', label: 'Online Transfer' },
    { value: 'card', label: 'Debit / Credit Card' },
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

export default function ExpenseShow({ expense, accounts, categories, activeTab = 'overview' }: Props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

    // Edit Form
    const editForm = useForm({
        expense_date: expense.expense_date,
        category_id: String(expense.category_id),
        account_id: String(expense.account_id || ''),
        payment_method: expense.payment_method,
        amount: String(expense.amount),
        external_reference: expense.external_reference || '',
        description: expense.description || '',
        notes: expense.notes || '',
        attachment: null as File | null,
    });

    // Void Form
    const voidForm = useForm({
        reason: '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const accountSelectOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.name} (${acc.type === 'bank' ? acc.bank_name || 'Bank' : 'Cash'}) - PKR ${Number(acc.current_balance).toLocaleString('en-PK')}`,
    }));

    const categoryFormSelectOptions = categories.map((c) => ({ value: String(c.id), label: c.name }));

    const handleTabChange = (tabId: string) => {
        router.get(
            `/expenses/${expense.id}`,
            { tab: tabId },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.post(`/expenses/${expense.id}`, {
            forceFormData: true,
            headers: {
                '_method': 'PUT',
            },
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success('Expense updated successfully!');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to update expense.');
            },
        });
    };

    const handleVoidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        voidForm.post(`/expenses/${expense.id}/void`, {
            onSuccess: () => {
                setIsVoidModalOpen(false);
                toast.success('Expense record has been voided.');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to void expense.');
            },
        });
    };

    return (
        <>
            <Head title={`Expense ${expense.reference} - Details`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* BACK LINK */}
                <div>
                    <Link href="/expenses" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Expense List
                    </Link>
                </div>

                {/* HEADER BANNER CARD */}
                <Card className="border-sidebar-border/70 shadow-sm overflow-hidden bg-gradient-to-r from-rose-50/50 via-background to-background dark:from-rose-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-600 text-xl font-bold text-white shadow-md">
                                    <TrendingDown className="size-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">{expense.reference}</h1>
                                        <Badge variant={expense.status === 'posted' ? 'default' : 'destructive'} className={expense.status === 'posted' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-700 border-red-500/20'}>
                                            {expense.status.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="font-semibold bg-background">
                                            {expense.category?.name || 'Uncategorized'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                                        <span>📅 Date: {new Date(expense.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        <span>💳 Method: <span className="capitalize">{expense.payment_method.replace('_', ' ')}</span></span>
                                        <span>🏦 Account: {expense.account?.name || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="rounded-xl bg-background border p-3 text-right">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expense Amount</div>
                                    <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                                        {formatCurrency(Number(expense.amount))}
                                    </div>
                                </div>

                                {expense.status === 'posted' && (
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" className="gap-1 text-xs">
                                            <Edit className="size-3.5" /> Edit Expense
                                        </Button>
                                        <Button onClick={() => setIsVoidModalOpen(false)} variant="destructive" size="sm" className="gap-1 text-xs">
                                            <ShieldAlert className="size-3.5" /> Void Expense
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2 TABS NAVIGATION */}
                <div className="flex border-b border-border gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: '1. Expense Details & Financial Impact', icon: FileText },
                        { id: 'audit', label: '2. Audit Trail & Metadata', icon: History },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="size-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT 1: OVERVIEW & FINANCIAL IMPACT */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Expense Metadata Box */}
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Expense Information</CardTitle>
                                    <CardDescription>Transaction category, description, and payment reference.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Category</div>
                                            <div className="font-semibold text-foreground mt-0.5">{expense.category?.name || 'Uncategorized'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Expense Date</div>
                                            <div className="text-foreground mt-0.5">{new Date(expense.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Paying Company Account</div>
                                            <div className="font-semibold text-foreground mt-0.5">{expense.account?.name || '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</div>
                                            <div className="capitalize text-foreground mt-0.5">{expense.payment_method.replace('_', ' ')}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">External / Cheque Reference</div>
                                        <div className="font-mono text-foreground mt-0.5">{expense.external_reference || '—'}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">Description / Summary</div>
                                        <div className="text-foreground mt-0.5 font-medium">{expense.description || 'No description provided.'}</div>
                                    </div>

                                    {expense.notes && (
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">Internal Notes</div>
                                            <div className="text-muted-foreground mt-0.5 text-xs bg-muted/40 p-2.5 rounded-md">{expense.notes}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Financial & Ledger Impact Box */}
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Financial & Ledger Impact</CardTitle>
                                    <CardDescription>Automated double-entry accounting transaction.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground font-semibold">Expense Debit (DR):</span>
                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(Number(expense.amount))}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground font-semibold">Account Credit (CR):</span>
                                            <span className="font-mono font-bold text-foreground">{expense.account?.name || 'Bank/Cash Account'}</span>
                                        </div>
                                        <div className="border-t pt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Transaction Status:</span>
                                            <Badge variant={expense.status === 'posted' ? 'default' : 'destructive'}>
                                                {expense.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Attachment Card if exists */}
                                    {expense.attachment_path ? (
                                        <div className="rounded-xl border p-4 flex items-center justify-between bg-card">
                                            <div className="flex items-center gap-3">
                                                <Paperclip className="size-5 text-indigo-600" />
                                                <div>
                                                    <div className="text-xs font-semibold text-foreground">Attached Receipt Document</div>
                                                    <div className="text-[11px] text-muted-foreground">Stored securely on server</div>
                                                </div>
                                            </div>
                                            <a
                                                href={`/storage/${expense.attachment_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                <Download className="size-3.5" /> Download Receipt
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
                                            No receipt attachment uploaded for this expense.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 2: AUDIT TRAIL */}
                {activeTab === 'audit' && (
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Audit Trail & System Metadata</CardTitle>
                            <CardDescription>Full history of creation, updates, and voiding actions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Created By</div>
                                    <div className="font-bold text-foreground">{expense.creator?.name || 'System User'}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {expense.created_at ? new Date(expense.created_at).toLocaleString() : '—'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Last Updated By</div>
                                    <div className="font-bold text-foreground">{expense.updater?.name || 'Not modified'}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {expense.updated_at ? new Date(expense.updated_at).toLocaleString() : '—'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Void Status</div>
                                    <div className="font-bold text-foreground capitalize">{expense.status}</div>
                                    {expense.voided_at && (
                                        <div className="text-xs text-destructive mt-1">
                                            Voided on {new Date(expense.voided_at).toLocaleString()} by {expense.voider?.name || 'User'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expense.status === 'voided' && expense.void_reason && (
                                <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-1">
                                    <div className="text-xs font-bold text-destructive uppercase">Void Reason Recorded:</div>
                                    <p className="text-sm text-foreground">{expense.void_reason}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* EDIT EXPENSE MODAL */}
                <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && setIsEditModalOpen(false)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5 text-rose-600 dark:text-rose-400" />
                                Edit Expense ({expense.reference})
                            </DialogTitle>
                            <DialogDescription>Updating this expense will adjust financial balances and update ledger records.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Expense Date <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="date"
                                        value={editForm.data.expense_date}
                                        onChange={(e) => editForm.setData('expense_date', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Category <span className="text-destructive">*</span></Label>
                                    <ReactSelect
                                        options={categoryFormSelectOptions}
                                        value={categoryFormSelectOptions.find(o => o.value === editForm.data.category_id) || null}
                                        onChange={(opt) => editForm.setData('category_id', opt ? opt.value : '')}
                                        styles={customReactSelectStyles}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Amount (PKR) <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.amount}
                                        onChange={(e) => editForm.setData('amount', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Company Paying Account <span className="text-destructive">*</span></Label>
                                    <ReactSelect
                                        options={accountSelectOptions}
                                        value={accountSelectOptions.find(o => o.value === editForm.data.account_id) || null}
                                        onChange={(opt) => editForm.setData('account_id', opt ? opt.value : '')}
                                        styles={customReactSelectStyles}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Payment Method <span className="text-destructive">*</span></Label>
                                    <ReactSelect
                                        options={paymentMethodOptions}
                                        value={paymentMethodOptions.find(o => o.value === editForm.data.payment_method) || null}
                                        onChange={(opt) => editForm.setData('payment_method', opt ? (opt.value as any) : 'bank_transfer')}
                                        styles={customReactSelectStyles}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>External Ref</Label>
                                    <Input
                                        value={editForm.data.external_reference}
                                        onChange={(e) => editForm.setData('external_reference', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Description / Summary</Label>
                                    <Input
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Internal Notes</Label>
                                    <Input
                                        value={editForm.data.notes}
                                        onChange={(e) => editForm.setData('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={editForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* VOID EXPENSE MODAL */}
                <Dialog open={isVoidModalOpen} onOpenChange={(open) => !open && setIsVoidModalOpen(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <ShieldAlert className="size-5" />
                                Void Operating Expense
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to void <span className="font-semibold text-foreground">{expense.reference}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleVoidSubmit} className="space-y-4 pt-2">
                            <div className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                <p className="font-semibold flex items-center gap-1">
                                    <AlertCircle className="size-3.5" />
                                    Financial Audit Notice:
                                </p>
                                <p>
                                    Voiding will restore PKR {formatCurrency(Number(expense.amount))} back to the company account ({expense.account?.name}) and post a reversing ledger entry.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Void Reason <span className="text-destructive">*</span></Label>
                                <Textarea
                                    placeholder="Please provide reason for voiding this expense..."
                                    rows={3}
                                    value={voidForm.data.reason}
                                    onChange={(e) => voidForm.setData('reason', e.target.value)}
                                    required
                                />
                                {voidForm.errors.reason && <p className="text-xs text-destructive">{voidForm.errors.reason}</p>}
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsVoidModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={voidForm.processing} variant="destructive">
                                    Confirm & Void Expense
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
