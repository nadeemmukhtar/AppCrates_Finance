import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Select from 'react-select';
import { 
    AlertTriangle, 
    ArrowDownLeft, 
    ArrowLeft, 
    ArrowUpRight, 
    Building2, 
    CheckCircle2, 
    Clock, 
    DollarSign, 
    Edit, 
    Filter, 
    HandCoins, 
    Mail, 
    MoreHorizontal, 
    Phone, 
    Plus, 
    Search, 
    Trash2, 
    UserCheck, 
    UserPlus, 
    Users 
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
import { toast } from 'sonner';
import FileDropzone from '@/components/file-dropzone';
import type { FinancialAccount, Lender, LenderType, LoanStats } from '@/types/loans';

interface Props {
    stats?: LoanStats;
    lenders: {
        data: (Lender & { loans_count?: number })[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    allLenders?: Lender[];
    accounts?: FinancialAccount[];
    filters: {
        search?: string;
        type?: string;
    };
}

const lenderTypeOptions: { value: LenderType; label: string }[] = [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
    { value: 'bank', label: 'Bank' },
    { value: 'other', label: 'Other' },
];

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

export default function LendersIndex({ stats, lenders, allLenders = [], accounts = [], filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    
    // Modal States
    const [isCreateLenderModalOpen, setIsCreateLenderModalOpen] = useState(false);
    const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
    const [editingLender, setEditingLender] = useState<Lender | null>(null);
    const [deletingLender, setDeletingLender] = useState<Lender | null>(null);

    // Create Lender Form
    const createLenderForm = useForm({
        name: '',
        type: 'individual' as LenderType,
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    // Edit Lender Form
    const editLenderForm = useForm({
        name: '',
        type: 'individual' as LenderType,
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    // Record Loan Form
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

    // Delete Form
    const deleteForm = useForm();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = {
            search,
            type: typeFilter,
            ...newFilters,
        };

        Object.keys(query).forEach((key) => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/lenders', query, { preserveState: true, replace: true });
    };

    const handleCreateLenderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createLenderForm.post('/lenders', {
            onSuccess: () => {
                setIsCreateLenderModalOpen(false);
                createLenderForm.reset();
                toast.success('Lender created successfully!');
            },
        });
    };

    const handleEditLenderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLender) return;

        editLenderForm.put(`/lenders/${editingLender.id}`, {
            onSuccess: () => {
                setEditingLender(null);
                editLenderForm.reset();
                toast.success('Lender updated successfully!');
            },
        });
    };

    const handleCreateLoanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createLoanForm.post('/loans', {
            onSuccess: () => {
                setIsCreateLoanModalOpen(false);
                createLoanForm.reset();
                toast.success('Loan recorded successfully!');
            },
        });
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingLender) return;

        deleteForm.delete(`/lenders/${deletingLender.id}`, {
            onSuccess: () => {
                setDeletingLender(null);
                toast.success('Lender deleted successfully!');
            },
            onError: (errors) => {
                toast.error(errors.error || 'Failed to delete lender.');
            },
        });
    };

    const openEditModal = (lender: Lender) => {
        setEditingLender(lender);
        editLenderForm.setData({
            name: lender.name,
            type: lender.type,
            phone: lender.phone || '',
            email: lender.email || '',
            address: lender.address || '',
            notes: lender.notes || '',
        });
    };

    const openNewLoanForLender = (lenderId: number) => {
        createLoanForm.setData('lender_id', String(lenderId));
        setIsCreateLoanModalOpen(true);
    };

    const dropdownLenderOptions = (allLenders.length > 0 ? allLenders : lenders.data).map((lender) => ({
        value: String(lender.id),
        label: `${lender.name} (${lender.type})`,
    }));

    const dropdownAccountOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: acc.name,
    }));

    return (
        <>
            <Head title="Loans & Debts - Lenders" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Navigation Header & Main Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Users className="size-7 text-foreground" />
                            Loans & Debts Directory
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Overview of lenders (individuals, companies, banks) from whom the company borrowed money.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" onClick={() => setIsCreateLenderModalOpen(true)} className="gap-2">
                            <UserPlus className="size-4" />
                            Add Lender
                        </Button>

                        <Button onClick={() => setIsCreateLoanModalOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Record New Loan
                        </Button>

                        <Button variant="secondary" asChild className="gap-2 font-semibold">
                            <Link href="/loans">
                                <HandCoins className="size-4" />
                                Manage Loans
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Metric Cards Section */}
                {stats && (
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Total Borrowed</CardTitle>
                                <ArrowDownLeft className="size-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-foreground">{formatCurrency(stats.total_borrowed)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Original principal</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Total Repaid</CardTitle>
                                <ArrowUpRight className="size-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.total_repaid)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Cleared balance</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Total Outstanding</CardTitle>
                                <DollarSign className="size-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-foreground">{formatCurrency(stats.total_outstanding)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Current liability</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Active Loans</CardTitle>
                                <Clock className="size-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-foreground">{stats.active_loans}</div>
                                <p className="text-xs text-muted-foreground mt-1">Pending repayment</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Cleared Loans</CardTitle>
                                <CheckCircle2 className="size-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.cleared_loans}</div>
                                <p className="text-xs text-muted-foreground mt-1">100% paid off</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Overdue Loans</CardTitle>
                                <AlertTriangle className="size-4 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{stats.overdue_loans}</div>
                                <p className="text-xs text-muted-foreground mt-1">Past due date</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 bg-sidebar/50 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone, or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilterChange({ search: e.target.value });
                                }}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-48">
                                <Select
                                    options={[{ value: 'all', label: 'All Lender Types' }, ...lenderTypeOptions]}
                                    value={{ value: typeFilter, label: typeFilter === 'all' ? 'All Lender Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1) }}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setTypeFilter(val);
                                        handleFilterChange({ type: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); router.get('/lenders'); }}>
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lenders Directory Table */}
                <div className="rounded-xl border border-sidebar-border/70 overflow-hidden bg-background dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-sidebar-border/70">
                                <tr>
                                    <th className="p-4">Lender Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Contact Phone</th>
                                    <th className="p-4">Contact Email</th>
                                    <th className="p-4 text-center">Active Loans</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70">
                                {lenders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No lender records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    lenders.data.map((lender) => (
                                        <tr key={lender.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-bold text-foreground">
                                                {lender.name}
                                            </td>
                                            <td className="p-4 capitalize">
                                                <Badge variant="outline" className="capitalize">
                                                    {lender.type}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {lender.phone ? (
                                                    <span className="flex items-center gap-1 font-mono text-xs">
                                                        <Phone className="size-3 text-muted-foreground" />
                                                        {lender.phone}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {lender.email ? (
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Mail className="size-3 text-muted-foreground" />
                                                        {lender.email}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant="secondary">
                                                    {lender.loans_count || 0} Loans
                                                </Badge>
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
                                                        <DropdownMenuItem onClick={() => openNewLoanForLender(lender.id)} className="cursor-pointer">
                                                            <Plus className="size-4" />
                                                            Record Loan from Lender
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openEditModal(lender)} className="cursor-pointer">
                                                            <Edit className="size-4" />
                                                            Edit Lender
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingLender(lender)}
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                            Delete Lender
                                                        </DropdownMenuItem>
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
                    {lenders.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-sidebar-border/70 text-sm text-muted-foreground">
                            <div>
                                Showing <span className="font-semibold text-foreground">{lenders.from || 0}</span> to{' '}
                                <span className="font-semibold text-foreground">{lenders.to || 0}</span> of{' '}
                                <span className="font-semibold text-foreground">{lenders.total}</span> lenders
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {lenders.links.map((link, idx) => {
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

                {/* MODALS */}

                {/* 1. ADD LENDER MODAL */}
                <Dialog open={isCreateLenderModalOpen} onOpenChange={setIsCreateLenderModalOpen}>
                    <DialogContent className="max-w-3xl sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="size-5" />
                                Add New Lender
                            </DialogTitle>
                            <DialogDescription>
                                Add an individual, company, or financial institution to record loans from.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateLenderSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Lender Name *</Label>
                                        <Input
                                            placeholder="e.g. Habib Bank Ltd / Sheikh Investor"
                                            value={createLenderForm.data.name}
                                            onChange={(e) => createLenderForm.setData('name', e.target.value)}
                                        />
                                        {createLenderForm.errors.name && <p className="text-xs text-destructive">{createLenderForm.errors.name}</p>}
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <Label>Lender Type *</Label>
                                        <Select
                                            options={lenderTypeOptions}
                                            value={lenderTypeOptions.find(opt => opt.value === createLenderForm.data.type) || null}
                                            onChange={(opt) => createLenderForm.setData('type', opt ? opt.value : 'individual')}
                                            styles={customReactSelectStyles}
                                            className="w-full"
                                            placeholder="Select Lender Type"
                                        />
                                        {createLenderForm.errors.type && <p className="text-xs text-destructive">{createLenderForm.errors.type}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            placeholder="+92 300 1234567"
                                            value={createLenderForm.data.phone}
                                            onChange={(e) => createLenderForm.setData('phone', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="contact@lender.com"
                                            value={createLenderForm.data.email}
                                            onChange={(e) => createLenderForm.setData('email', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateLenderModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createLenderForm.processing}>
                                    Save Lender
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 2. RECORD NEW LOAN MODAL */}
                <Dialog open={isCreateLoanModalOpen} onOpenChange={setIsCreateLoanModalOpen}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <HandCoins className="size-5" />
                                Record New Loan
                            </DialogTitle>
                            <DialogDescription>
                                Record a new borrowed loan. This will credit your receiving account balance and record a ledger liability.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateLoanSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Horizontal Row 1: Lender & Account */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Lender *</Label>
                                        <Select
                                            options={dropdownLenderOptions}
                                            value={dropdownLenderOptions.find(opt => opt.value === createLoanForm.data.lender_id) || null}
                                            onChange={(opt) => createLoanForm.setData('lender_id', opt ? opt.value : '')}
                                            styles={customReactSelectStyles}
                                            placeholder="Select Lender"
                                            className="w-full"
                                        />
                                        {createLoanForm.errors.lender_id && <p className="text-xs text-destructive">{createLoanForm.errors.lender_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Receiving Cash/Bank Account *</Label>
                                        <Select
                                            options={dropdownAccountOptions}
                                            value={dropdownAccountOptions.find(opt => opt.value === createLoanForm.data.destination_account_id) || null}
                                            onChange={(opt) => createLoanForm.setData('destination_account_id', opt ? opt.value : '')}
                                            styles={customReactSelectStyles}
                                            placeholder="Select Receiving Account"
                                            className="w-full"
                                        />
                                        {createLoanForm.errors.destination_account_id && <p className="text-xs text-destructive">{createLoanForm.errors.destination_account_id}</p>}
                                    </div>
                                </div>

                                {/* Horizontal Row 2: Financials & Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                                {/* Horizontal Row 3: Purpose & Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Purpose / Reason</Label>
                                        <Input
                                            placeholder="e.g. Office expansion / Working capital"
                                            value={createLoanForm.data.purpose}
                                            onChange={(e) => createLoanForm.setData('purpose', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Additional Notes</Label>
                                        <Input
                                            placeholder="Any agreement details or remarks..."
                                            value={createLoanForm.data.notes}
                                            onChange={(e) => createLoanForm.setData('notes', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Horizontal Row 4: Attachments */}
                                <FileDropzone
                                    file={createLoanForm.data.attachment}
                                    onFileSelect={(file) => createLoanForm.setData('attachment', file)}
                                    displayName={createLoanForm.data.display_name}
                                    onDisplayNameChange={(val) => createLoanForm.setData('display_name', val)}
                                    label="Attachment / Loan Agreement (Optional)"
                                    description="Drag & drop loan document/agreement here, or click to browse"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateLoanModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createLoanForm.processing}>
                                    {createLoanForm.processing ? 'Saving...' : 'Save Loan Record'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 3. EDIT LENDER MODAL */}
                <Dialog open={!!editingLender} onOpenChange={(open) => !open && setEditingLender(null)}>
                    <DialogContent className="max-w-3xl sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5" />
                                Edit Lender
                            </DialogTitle>
                            <DialogDescription>Update information for <span className="font-semibold">{editingLender?.name}</span>.</DialogDescription>
                        </DialogHeader>

                        {editingLender && (
                            <form onSubmit={handleEditLenderSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Lender Name *</Label>
                                            <Input
                                                value={editLenderForm.data.name}
                                                onChange={(e) => editLenderForm.setData('name', e.target.value)}
                                            />
                                            {editLenderForm.errors.name && <p className="text-xs text-destructive">{editLenderForm.errors.name}</p>}
                                        </div>

                                        <div className="space-y-2 w-full">
                                            <Label>Lender Type *</Label>
                                            <Select
                                                options={lenderTypeOptions}
                                                value={lenderTypeOptions.find(opt => opt.value === editLenderForm.data.type) || null}
                                                onChange={(opt) => editLenderForm.setData('type', opt ? opt.value : 'individual')}
                                                styles={customReactSelectStyles}
                                                className="w-full"
                                                placeholder="Select Lender Type"
                                            />
                                            {editLenderForm.errors.type && <p className="text-xs text-destructive">{editLenderForm.errors.type}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input
                                                value={editLenderForm.data.phone}
                                                onChange={(e) => editLenderForm.setData('phone', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={editLenderForm.data.email}
                                                onChange={(e) => editLenderForm.setData('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditingLender(null)}>Cancel</Button>
                                    <Button type="submit" disabled={editLenderForm.processing}>
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 4. DELETE LENDER MODAL */}
                <Dialog open={!!deletingLender} onOpenChange={(open) => !open && setDeletingLender(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <Trash2 className="size-5" />
                                Delete Lender
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingLender?.name}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {deletingLender && (
                            <form onSubmit={handleDeleteSubmit} className="space-y-4 py-2">
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone. Lenders with active or historical loan records cannot be deleted.
                                </p>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDeletingLender(null)}>Cancel</Button>
                                    <Button type="submit" disabled={deleteForm.processing} variant="destructive">
                                        Confirm Delete
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
