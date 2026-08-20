import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import { 
    AlertTriangle, 
    ArrowDownLeft, 
    ArrowLeft, 
    ArrowUpRight, 
    Banknote, 
    CheckCircle2, 
    Clock, 
    DollarSign, 
    Eye, 
    Filter, 
    HandCoins, 
    MoreHorizontal, 
    Paperclip,
    Plus, 
    PlusCircle, 
    RotateCcw, 
    Search, 
    UserPlus, 
    Users, 
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
import type { FinancialAccount, Lender, LenderType, Loan, LoanStats } from '@/types/loans';

const customReactSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        width: '100%',
        borderRadius: 'var(--radius)',
        borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        boxShadow: state.isFocused ? '0 0 0 1px var(--ring)' : 'none',
        '&:hover': {
            borderColor: 'var(--ring)',
        },
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

interface Props {
    stats: LoanStats;
    loans: {
        data: Loan[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    lenders: Lender[];
    accounts: FinancialAccount[];
    filters: {
        search?: string;
        status?: string;
        lender_type?: string;
        lender_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function LoansIndex({ stats, loans, lenders, accounts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [lenderTypeFilter, setLenderTypeFilter] = useState(filters.lender_type || 'all');
    
    // Modal states
    const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
    const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
    const [selectedLoanForCancel, setSelectedLoanForCancel] = useState<Loan | null>(null);

    // Create Loan Form
    const createLoanForm = useForm({
        lender_id: '',
        loan_date: new Date().toISOString().split('T')[0],
        original_amount: '',
        interest_rate: '0',
        interest_amount: '0',
        due_date: '',
        payment_frequency: 'one_time',
        purpose: '',
        notes: '',
        destination_account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        attachment: null as File | null,
        display_name: '',
    });

    // Record Repayment Form
    const repaymentForm = useForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'bank_transfer',
        account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        transaction_reference: '',
        notes: '',
        attachment: null as File | null,
        display_name: '',
    });

    // Cancel Loan Form
    const cancelForm = useForm({
        reason: '',
    });

    // Currency Formatter
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const dropdownLenderOptions = lenders.map((lender) => ({
        value: String(lender.id),
        label: `${lender.name} (${lender.type})`,
    }));

    const dropdownAccountOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: acc.name,
    }));

    // Filter Handler
    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = {
            search,
            status: statusFilter,
            lender_type: lenderTypeFilter,
            ...newFilters,
        };
        
        // Remove empty values
        Object.keys(query).forEach(key => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/loans', query, { preserveState: true, replace: true });
    };

    // Helper for Status Badge
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

    // Submit Create Loan
    const handleCreateLoanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createLoanForm.post('/loans', {
            onSuccess: () => {
                setIsCreateLoanOpen(false);
                createLoanForm.reset();
                toast.success('Loan recorded successfully!');
            },
        });
    };

    // Submit Record Repayment
    const handleRepaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoanForPayment) return;

        repaymentForm.post(`/loans/${selectedLoanForPayment.id}/repayments`, {
            onSuccess: () => {
                setSelectedLoanForPayment(null);
                repaymentForm.reset();
                toast.success('Repayment recorded successfully!');
            },
        });
    };

    // Submit Cancel Loan
    const handleCancelLoanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoanForCancel) return;

        cancelForm.post(`/loans/${selectedLoanForCancel.id}/cancel`, {
            onSuccess: () => {
                setSelectedLoanForCancel(null);
                cancelForm.reset();
                toast.success('Loan cancelled successfully!');
            },
        });
    };

    return (
        <>
            <Head title="Manage Loans" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Header Title & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Link href="/lenders" className="hover:underline font-medium flex items-center gap-1">
                                <ArrowLeft className="size-3.5" />
                                Lenders Directory
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">Manage Loans</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <HandCoins className="size-7 text-foreground" />
                            Manage Loans & Repayments Table
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Detailed list of all company loans, repayment progress, and status logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setIsCreateLoanOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Record New Loan
                        </Button>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 bg-sidebar/50 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by loan reference, lender, or purpose..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                className="pl-9"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-40">
                                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); handleFilterChange({ status: val }); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                        <SelectItem value="fully_paid">Fully Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-44">
                                <Select value={lenderTypeFilter} onValueChange={(val) => { setLenderTypeFilter(val); handleFilterChange({ lender_type: val }); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Lender Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Lender Types</SelectItem>
                                        <SelectItem value="bank">Bank</SelectItem>
                                        <SelectItem value="company">Company</SelectItem>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setLenderTypeFilter('all'); router.get('/loans'); }}>
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Loans Data Table */}
                <div className="rounded-xl border border-sidebar-border/70 overflow-hidden bg-background dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-sidebar-border/70">
                                <tr>
                                    <th className="p-4">Loan Ref</th>
                                    <th className="p-4">Lender</th>
                                    <th className="p-4">Loan Date</th>
                                    <th className="p-4 text-right">Original Amount</th>
                                    <th className="p-4 text-right">Total Repaid</th>
                                    <th className="p-4 text-right">Remaining Balance</th>
                                    <th className="p-4 min-w-[140px]">Repayment Progress</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70">
                                {loans.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            No loan records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    loans.data.map((loan) => (
                                        <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                                             <td className="p-4 font-mono font-medium">
                                                 <Link href={`/loans/${loan.id}`} className="hover:underline flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                                     {loan.reference}
                                                 </Link>
                                                 {(loan.media || loan.attachment_path) && (
                                                     <div className="mt-1">
                                                         <a
                                                             href={loan.media?.url || `/storage/${loan.attachment_path}`}
                                                             target="_blank"
                                                             rel="noopener noreferrer"
                                                             className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                                                         >
                                                             <Paperclip className="size-3" />
                                                             {loan.media?.display_name || 'Attachment'}
                                                         </a>
                                                     </div>
                                                 )}
                                             </td>
                                            <td className="p-4">
                                                <div className="font-medium text-foreground">{loan.lender?.name || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground capitalize">{loan.lender?.type}</div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                <div>{loan.loan_date}</div>
                                                {loan.due_date && <div className="text-xs text-muted-foreground">Due: {loan.due_date}</div>}
                                            </td>
                                            <td className="p-4 text-right font-semibold text-foreground">
                                                {formatCurrency(Number(loan.original_amount))}
                                                {Number(loan.interest_amount) > 0 && (
                                                    <div className="text-xs text-muted-foreground">+ {formatCurrency(Number(loan.interest_amount))} int.</div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                                {formatCurrency(loan.total_repaid)}
                                            </td>
                                            <td className="p-4 text-right font-bold text-foreground">
                                                {formatCurrency(loan.remaining_balance)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                loan.repayment_progress >= 100 ? 'bg-emerald-500' : 'bg-primary'
                                                            }`}
                                                            style={{ width: `${loan.repayment_progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground w-10 text-right">
                                                        {loan.repayment_progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {renderStatusBadge(loan.computed_status)}
                                            </td>
                                            <td className="p-4 text-center">
                                                {/* ACTION DROPDOWN MENU */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="size-8 p-0">
                                                            <MoreHorizontal className="size-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/loans/${loan.id}`} className="flex items-center gap-2">
                                                                <Eye className="size-4" />
                                                                View Loan Profile
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        
                                                        {loan.status !== 'cancelled' && loan.remaining_balance > 0 && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-emerald-600 focus:text-emerald-700"
                                                                onClick={() => {
                                                                    setSelectedLoanForPayment(loan);
                                                                    repaymentForm.setData('amount', String(loan.remaining_balance));
                                                                }}
                                                            >
                                                                <PlusCircle className="size-4 text-emerald-600" />
                                                                Record Repayment
                                                            </DropdownMenuItem>
                                                        )}

                                                        {loan.status !== 'cancelled' && loan.total_repaid === 0 && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                    onClick={() => setSelectedLoanForCancel(loan)}
                                                                >
                                                                    <XCircle className="size-4 text-destructive" />
                                                                    Cancel Loan
                                                                </DropdownMenuItem>
                                                            </>
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

                    {/* Pagination Footer */}
                    {loans.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-sidebar-border/70 text-sm text-muted-foreground">
                            <div>
                                Showing <span className="font-semibold text-foreground">{(loans as any).from || 0}</span> to{' '}
                                <span className="font-semibold text-foreground">{(loans as any).to || 0}</span> of{' '}
                                <span className="font-semibold text-foreground">{loans.total}</span> loans
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {(loans as any).links?.map((link: any, idx: number) => {
                                    if (!link.url) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={link.url} preserveState preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals Section */}

                {/* 1. RECORD NEW LOAN DIALOG */}
                <Dialog open={isCreateLoanOpen} onOpenChange={setIsCreateLoanOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <HandCoins className="size-5" />
                                Record New Loan
                            </DialogTitle>
                            <DialogDescription>
                                Add a new borrowed loan record. This will increase your company's cash/bank balance and record a liability.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateLoanSubmit} className="space-y-4 py-2">
                            {/* Row 1: Lender (Full Width) */}
                            <div className="space-y-2 w-full">
                                <Label>Lender *</Label>
                                <ReactSelect
                                    options={dropdownLenderOptions}
                                    value={dropdownLenderOptions.find(opt => opt.value === createLoanForm.data.lender_id) || null}
                                    onChange={(opt) => createLoanForm.setData('lender_id', opt ? opt.value : '')}
                                    styles={customReactSelectStyles}
                                    placeholder="Select Lender"
                                    className="w-full"
                                />
                                {createLoanForm.errors.lender_id && <p className="text-xs text-destructive">{createLoanForm.errors.lender_id}</p>}
                            </div>

                            {/* Row 2: Receiving Cash/Bank Account (Full Width) */}
                            <div className="space-y-2 w-full">
                                <Label>Receiving Cash/Bank Account *</Label>
                                <ReactSelect
                                    options={dropdownAccountOptions}
                                    value={dropdownAccountOptions.find(opt => opt.value === createLoanForm.data.destination_account_id) || null}
                                    onChange={(opt) => createLoanForm.setData('destination_account_id', opt ? opt.value : '')}
                                    styles={customReactSelectStyles}
                                    placeholder="Select Receiving Account"
                                    className="w-full"
                                />
                                {createLoanForm.errors.destination_account_id && <p className="text-xs text-destructive">{createLoanForm.errors.destination_account_id}</p>}
                            </div>

                            {/* Row 3 onwards: 2 Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-2">
                                    <Label>Original Loan Amount (PKR) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="500000"
                                        value={createLoanForm.data.original_amount}
                                        onChange={(e) => createLoanForm.setData('original_amount', e.target.value)}
                                    />
                                    {createLoanForm.errors.original_amount && <p className="text-xs text-destructive">{createLoanForm.errors.original_amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Loan Date *</Label>
                                    <Input
                                        type="date"
                                        value={createLoanForm.data.loan_date}
                                        onChange={(e) => createLoanForm.setData('loan_date', e.target.value)}
                                    />
                                    {createLoanForm.errors.loan_date && <p className="text-xs text-destructive">{createLoanForm.errors.loan_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Interest Rate (%) (Optional)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        value={createLoanForm.data.interest_rate}
                                        onChange={(e) => createLoanForm.setData('interest_rate', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Due Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={createLoanForm.data.due_date}
                                        onChange={(e) => createLoanForm.setData('due_date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Purpose / Reason</Label>
                                <Input
                                    placeholder="e.g. Office expansion / Working capital"
                                    value={createLoanForm.data.purpose}
                                    onChange={(e) => createLoanForm.setData('purpose', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Attachment / Loan Agreement (Optional)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => createLoanForm.setData('attachment', e.target.files ? e.target.files[0] : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Attachment Display Name (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Loan Agreement PDF"
                                        value={createLoanForm.data.display_name || ''}
                                        onChange={(e) => createLoanForm.setData('display_name', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Additional Notes</Label>
                                <Input
                                    placeholder="Any agreement details or remarks..."
                                    value={createLoanForm.data.notes}
                                    onChange={(e) => createLoanForm.setData('notes', e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateLoanOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createLoanForm.processing}>
                                    {createLoanForm.processing ? 'Saving...' : 'Save Loan Record'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 2. RECORD REPAYMENT DIALOG */}
                <Dialog open={!!selectedLoanForPayment} onOpenChange={(open) => !open && setSelectedLoanForPayment(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <PlusCircle className="size-5 text-emerald-600" />
                                Record Repayment
                            </DialogTitle>
                            <DialogDescription>
                                Record a payment for loan <span className="font-semibold text-foreground">{selectedLoanForPayment?.reference}</span> ({selectedLoanForPayment?.lender?.name}).
                            </DialogDescription>
                        </DialogHeader>

                        {selectedLoanForPayment && (
                            <form onSubmit={handleRepaymentSubmit} className="space-y-4 py-2">
                                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Original Loan:</span>
                                        <span className="font-semibold">{formatCurrency(Number(selectedLoanForPayment.original_amount))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Repaid:</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(selectedLoanForPayment.total_repaid)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1 border-border">
                                        <span className="text-foreground font-medium">Outstanding Balance:</span>
                                        <span className="font-bold text-foreground">{formatCurrency(selectedLoanForPayment.remaining_balance)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Repayment Amount (PKR) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        max={selectedLoanForPayment.remaining_balance}
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

                                <div className="space-y-2">
                                    <Label>Attachment / Receipt (Optional)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => repaymentForm.setData('attachment', e.target.files ? e.target.files[0] : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Attachment Display Name (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Repayment Bank Slip PDF"
                                        value={repaymentForm.data.display_name || ''}
                                        onChange={(e) => repaymentForm.setData('display_name', e.target.value)}
                                    />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setSelectedLoanForPayment(null)}>Cancel</Button>
                                    <Button type="submit" disabled={repaymentForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {repaymentForm.processing ? 'Processing...' : 'Confirm Repayment'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 3. CANCEL LOAN DIALOG */}
                <Dialog open={!!selectedLoanForCancel} onOpenChange={(open) => !open && setSelectedLoanForCancel(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <XCircle className="size-5" />
                                Cancel Loan
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel loan <span className="font-semibold text-foreground">{selectedLoanForCancel?.reference}</span>? This will reverse financial liability.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedLoanForCancel && (
                            <form onSubmit={handleCancelLoanSubmit} className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Cancellation Reason *</Label>
                                    <Input
                                        placeholder="Reason for cancelling..."
                                        value={cancelForm.data.reason}
                                        onChange={(e) => cancelForm.setData('reason', e.target.value)}
                                    />
                                    {cancelForm.errors.reason && <p className="text-xs text-destructive">{cancelForm.errors.reason}</p>}
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setSelectedLoanForCancel(null)}>Cancel</Button>
                                    <Button type="submit" disabled={cancelForm.processing} variant="destructive">
                                        Confirm Cancellation
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
