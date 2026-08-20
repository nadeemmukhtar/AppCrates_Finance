import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { 
    AlertCircle, 
    ArrowDownLeft, 
    ArrowLeft, 
    ArrowUpRight, 
    Ban, 
    Banknote, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    Download, 
    Edit, 
    Eye, 
    FileText, 
    Filter, 
    HelpCircle, 
    Landmark, 
    Layers, 
    MoreHorizontal, 
    Paperclip, 
    Plus, 
    PlusCircle, 
    Receipt, 
    RefreshCcw, 
    RotateCcw, 
    Search, 
    ShieldAlert, 
    Tag, 
    Trash2, 
    UserCheck, 
    UserPlus, 
    Users, 
    Wallet, 
    XCircle 
} from 'lucide-react';
import FileDropzone from '@/components/file-dropzone';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { FinancialAccount } from '@/types/loans';

export interface Client {
    id: number;
    name: string;
    type: 'client' | 'customer' | 'company' | 'individual' | 'other';
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

export interface MoneyInCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
}

export interface MoneyInTransaction {
    id: number;
    reference: string;
    received_date: string;
    received_from: string;
    received_from_type: 'client' | 'customer' | 'company' | 'individual' | 'other';
    client_id?: number;
    category_id: number;
    account_id: number;
    payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'other';
    amount: number;
    external_reference?: string;
    description?: string;
    notes?: string;
    attachment_path?: string;
    media_id?: number;
    status: 'posted' | 'voided';
    created_by?: number;
    updated_by?: number;
    voided_by?: number;
    voided_at?: string;
    void_reason?: string;
    created_at?: string;
    category?: MoneyInCategory;
    account?: FinancialAccount;
    client?: Client;
    creator?: { id: number; name: string };
    updater?: { id: number; name: string };
    voider?: { id: number; name: string };
    media?: { id: number; display_name?: string | null; url: string; file_name: string };
}

interface Props {
    stats: {
        total_received: number;
        received_today: number;
        received_this_month: number;
        total_transactions: number;
        posted_count: number;
        voided_count: number;
    };
    transactions: {
        data: MoneyInTransaction[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    categories: MoneyInCategory[];
    accounts: FinancialAccount[];
    clients?: Client[];
    filters: {
        search?: string;
        category_id?: string;
        account_id?: string;
        payment_method?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
        min_amount?: string;
        max_amount?: string;
    };
}

const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_transfer', label: 'Online Transfer' },
    { value: 'other', label: 'Other' },
];

const receivedFromTypeOptions = [
    { value: 'client', label: 'Client' },
    { value: 'customer', label: 'Customer' },
    { value: 'company', label: 'Company' },
    { value: 'individual', label: 'Individual' },
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

export default function MoneyInIndex({ stats, transactions, categories, accounts, clients = [], filters }: Props) {
    // Filter State
    const [search, setSearch] = useState(filters.search || '');
    const [categoryIdFilter, setCategoryIdFilter] = useState(filters.category_id || 'all');
    const [accountIdFilter, setAccountIdFilter] = useState(filters.account_id || 'all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState(filters.payment_method || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [startDateFilter, setStartDateFilter] = useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = useState(filters.end_date || '');
    const [minAmountFilter, setMinAmountFilter] = useState(filters.min_amount || '');
    const [maxAmountFilter, setMaxAmountFilter] = useState(filters.max_amount || '');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<MoneyInTransaction | null>(null);
    const [voidingTransaction, setVoidingTransaction] = useState<MoneyInTransaction | null>(null);

    // Create Form
    const createForm = useForm({
        received_date: new Date().toISOString().split('T')[0],
        received_from: '',
        received_from_type: 'client' as 'client' | 'customer' | 'company' | 'individual' | 'other',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'other',
        amount: '',
        external_reference: '',
        description: '',
        notes: '',
        attachment: null as File | null,
        display_name: '',
    });

    // Quick Add Client Form
    const quickClientForm = useForm({
        name: '',
        type: 'client' as 'client' | 'customer' | 'company' | 'individual' | 'other',
        phone: '',
        email: '',
        address: '',
    });

    // Edit Form
    const editForm = useForm({
        received_date: '',
        received_from: '',
        received_from_type: 'client' as 'client' | 'customer' | 'company' | 'individual' | 'other',
        category_id: '',
        account_id: '',
        payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'other',
        amount: '',
        external_reference: '',
        description: '',
        notes: '',
        attachment: null as File | null,
        display_name: '',
    });

    // Void Form
    const voidForm = useForm({
        reason: '',
    });

    const handleQuickClientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        quickClientForm.post('/clients', {
            onSuccess: () => {
                const newName = quickClientForm.data.name;
                const newType = quickClientForm.data.type;
                setIsQuickAddClientOpen(false);
                quickClientForm.reset();
                createForm.setData((prev) => ({
                    ...prev,
                    received_from: newName,
                    received_from_type: newType,
                }));
                editForm.setData((prev) => ({
                    ...prev,
                    received_from: newName,
                    received_from_type: newType,
                }));
                toast.success(`Client '${newName}' created and selected!`);
            },
            onError: (errors) => {
                toast.error(errors.name || errors.error || 'Failed to create client.');
            },
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const categorySelectOptions = categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
    }));

    const accountSelectOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.name} (${acc.type === 'bank' ? acc.bank_name || 'Bank' : 'Cash'}) - PKR ${Number(acc.current_balance).toLocaleString('en-PK')}`,
    }));

    const clientSelectOptions = clients.map((c) => ({
        value: c.name,
        label: `${c.name} (${c.type})`,
        type: c.type,
    }));

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = {
            search,
            category_id: categoryIdFilter,
            account_id: accountIdFilter,
            payment_method: paymentMethodFilter,
            status: statusFilter,
            start_date: startDateFilter,
            end_date: endDateFilter,
            min_amount: minAmountFilter,
            max_amount: maxAmountFilter,
            ...newFilters,
        };

        Object.keys(query).forEach((key) => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/money-in', query, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        setCategoryIdFilter('all');
        setAccountIdFilter('all');
        setPaymentMethodFilter('all');
        setStatusFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        setMinAmountFilter('');
        setMaxAmountFilter('');
        router.get('/money-in', {}, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/money-in', {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success('Money In transaction created successfully!');
            },
        });
    };

    const openEditModal = (t: MoneyInTransaction) => {
        if (t.status === 'voided') {
            toast.error('Voided transactions cannot be edited.');
            return;
        }
        setEditingTransaction(t);
        editForm.setData({
            received_date: t.received_date,
            received_from: t.received_from,
            received_from_type: t.received_from_type,
            category_id: String(t.category_id),
            account_id: String(t.account_id),
            payment_method: t.payment_method,
            amount: String(t.amount),
            external_reference: t.external_reference || '',
            description: t.description || '',
            notes: t.notes || '',
            attachment: null,
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        // Using POST with _method PUT for Inertia FormData support with attachments
        router.post(`/money-in/${editingTransaction.id}`, {
            _method: 'put',
            ...editForm.data,
        }, {
            onSuccess: () => {
                setEditingTransaction(null);
                editForm.reset();
                toast.success('Money In record updated successfully!');
            },
        });
    };

    const handleVoidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!voidingTransaction) return;

        voidForm.post(`/money-in/${voidingTransaction.id}/void`, {
            onSuccess: () => {
                setVoidingTransaction(null);
                voidForm.reset();
                toast.success('Money In transaction voided successfully!');
            },
            onError: (errors) => {
                toast.error(errors.error || errors.reason || 'Failed to void transaction.');
            },
        });
    };

    return (
        <>
            <Head title="Money In - Revenue & Cash Receipts" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Top Header & New Receipt Action Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Receipt className="size-7 text-emerald-600 dark:text-emerald-400" />
                            Money In
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Record, track, and manage all incoming revenue and company cash receipts.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        <Plus className="size-4" />
                        Add Money In
                    </Button>
                </div>

                {/* 1. SUMMARY CARDS */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Total Received</CardTitle>
                            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.total_received)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Filtered posted receipts total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Received Today</CardTitle>
                            <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                                <Calendar className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.received_today)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Posted receipts on {new Date().toLocaleDateString()}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Received This Month</CardTitle>
                            <div className="rounded-full bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.received_this_month)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Current calendar month total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Transactions</CardTitle>
                            <div className="rounded-full bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                                <Layers className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.total_transactions}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.posted_count} Posted &bull; {stats.voided_count} Voided
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. SEARCH & FILTERS BAR */}
                <Card className="border-sidebar-border/70 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                            {/* Search Input */}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search ref, received from..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                />
                            </div>

                            {/* Main Filters Quick Bar */}
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                <div className="w-40">
                                    <ReactSelect
                                        options={[{ value: 'all', label: 'All Categories' }, ...categorySelectOptions]}
                                        value={[{ value: 'all', label: 'All Categories' }, ...categorySelectOptions].find(o => o.value === categoryIdFilter) || null}
                                        onChange={(opt) => {
                                            const val = opt ? opt.value : 'all';
                                            setCategoryIdFilter(val);
                                            handleFilterChange({ category_id: val });
                                        }}
                                        styles={customReactSelectStyles}
                                        placeholder="Category"
                                    />
                                </div>

                                <div className="w-44">
                                    <ReactSelect
                                        options={[{ value: 'all', label: 'All Accounts' }, ...accountSelectOptions]}
                                        value={[{ value: 'all', label: 'All Accounts' }, ...accountSelectOptions].find(o => o.value === accountIdFilter) || null}
                                        onChange={(opt) => {
                                            const val = opt ? opt.value : 'all';
                                            setAccountIdFilter(val);
                                            handleFilterChange({ account_id: val });
                                        }}
                                        styles={customReactSelectStyles}
                                        placeholder="Account"
                                    />
                                </div>

                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="gap-2"
                                >
                                    <Filter className="size-3.5" />
                                    {showAdvancedFilters ? 'Less Filters' : 'More Filters'}
                                </Button>

                                {(search || categoryIdFilter !== 'all' || accountIdFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all' || startDateFilter || endDateFilter || minAmountFilter || maxAmountFilter) && (
                                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                                        <RotateCcw className="size-3.5" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Advanced Filters */}
                        {showAdvancedFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                                <div>
                                    <Label className="text-xs mb-1 block">Payment Method</Label>
                                    <ReactSelect
                                        options={[{ value: 'all', label: 'All Methods' }, ...paymentMethodOptions]}
                                        value={[{ value: 'all', label: 'All Methods' }, ...paymentMethodOptions].find(o => o.value === paymentMethodFilter) || null}
                                        onChange={(opt) => {
                                            const val = opt ? opt.value : 'all';
                                            setPaymentMethodFilter(val);
                                            handleFilterChange({ payment_method: val });
                                        }}
                                        styles={customReactSelectStyles}
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs mb-1 block">Status</Label>
                                    <ReactSelect
                                        options={[
                                            { value: 'all', label: 'All Statuses' },
                                            { value: 'posted', label: 'Posted' },
                                            { value: 'voided', label: 'Voided' },
                                        ]}
                                        value={[
                                            { value: 'all', label: 'All Statuses' },
                                            { value: 'posted', label: 'Posted' },
                                            { value: 'voided', label: 'Voided' },
                                        ].find(o => o.value === statusFilter) || null}
                                        onChange={(opt) => {
                                            const val = opt ? opt.value : 'all';
                                            setStatusFilter(val);
                                            handleFilterChange({ status: val });
                                        }}
                                        styles={customReactSelectStyles}
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs mb-1 block">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDateFilter}
                                        onChange={(e) => {
                                            setStartDateFilter(e.target.value);
                                            handleFilterChange({ start_date: e.target.value });
                                        }}
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs mb-1 block">End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDateFilter}
                                        onChange={(e) => {
                                            setEndDateFilter(e.target.value);
                                            handleFilterChange({ end_date: e.target.value });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. MONEY IN DATA TABLE */}
                <Card className="border-sidebar-border/70 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Received From</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Account</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt className="size-8 text-muted-foreground/50" />
                                                    <p className="text-base font-semibold">No Money In records found</p>
                                                    <p className="text-xs">Adjust your search or click "Add Money In" to record your first transaction.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((t) => (
                                            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-mono font-semibold text-foreground">
                                                    <Link href={`/money-in/${t.id}`} className="hover:underline text-emerald-600 dark:text-emerald-400">
                                                        {t.reference}
                                                    </Link>
                                                    {t.external_reference && (
                                                        <div className="text-[11px] text-muted-foreground font-sans">
                                                            Ref: {t.external_reference}
                                                        </div>
                                                    )}
                                                    {(t.media || t.attachment_path) && (
                                                        <a
                                                            href={t.media?.url || `/storage/${t.attachment_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 mt-1"
                                                        >
                                                            <Paperclip className="size-3" />
                                                            {t.media?.display_name || 'Attachment'}
                                                        </a>
                                                    )}
                                                </td>

                                                <td className="p-4 text-muted-foreground">
                                                    {t.received_date}
                                                </td>

                                                <td className="p-4">
                                                    <div className="font-semibold text-foreground">{t.received_from}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">
                                                        {t.received_from_type}
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <Badge variant="secondary" className="font-normal text-xs">
                                                        {t.category?.name || 'General'}
                                                    </Badge>
                                                </td>

                                                <td className="p-4">
                                                    <div className="font-medium text-foreground flex items-center gap-1.5">
                                                        {t.account?.type === 'bank' ? (
                                                            <Landmark className="size-3.5 text-blue-500" />
                                                        ) : (
                                                            <Banknote className="size-3.5 text-emerald-500" />
                                                        )}
                                                        {t.account?.name || 'N/A'}
                                                    </div>
                                                </td>

                                                <td className="p-4 capitalize text-xs text-muted-foreground">
                                                    {t.payment_method.replace('_', ' ')}
                                                </td>

                                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                                    {formatCurrency(Number(t.amount))}
                                                </td>

                                                <td className="p-4 text-center">
                                                    {t.status === 'posted' ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                                            <CheckCircle2 className="size-3 mr-1" />
                                                            Posted
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                                            <Ban className="size-3 mr-1" />
                                                            Voided
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8">
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/money-in/${t.id}`} className="gap-2 cursor-pointer">
                                                                    <Eye className="size-4" /> View Details
                                                                </Link>
                                                            </DropdownMenuItem>

                                                            {t.status === 'posted' && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => openEditModal(t)} className="gap-2 cursor-pointer">
                                                                        <Edit className="size-4" /> Edit Transaction
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => setVoidingTransaction(t)} className="gap-2 text-destructive cursor-pointer">
                                                                        <Ban className="size-4" /> Void Transaction
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

                        {/* Pagination Bar */}
                        {transactions.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
                                <div>
                                    Showing {transactions.from || 0} to {transactions.to || 0} of {transactions.total} records
                                </div>
                                <div className="flex items-center gap-1">
                                    {transactions.links.map((link, idx) => (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, replace: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. ADD MONEY IN MODAL (HORIZONTAL MULTI-COLUMN LAYOUT) */}
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && setIsCreateModalOpen(false)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />
                                Add Money In Receipt
                            </DialogTitle>
                            <DialogDescription>Record incoming company revenue or funds into a cash box or bank account.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Transaction, Category & Payment Details */}
                                    <div className="space-y-4">
                                        {/* Section 1: Transaction & Client Info */}
                                        <div className="space-y-3">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                                1. Transaction & Client Info
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Received Date <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        type="date"
                                                        value={createForm.data.received_date}
                                                        onChange={(e) => createForm.setData('received_date', e.target.value)}
                                                    />
                                                    {createForm.errors.received_date && <p className="text-xs text-destructive">{createForm.errors.received_date}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Received From Type</Label>
                                                    <ReactSelect
                                                        options={receivedFromTypeOptions}
                                                        value={receivedFromTypeOptions.find(opt => opt.value === createForm.data.received_from_type) || null}
                                                        onChange={(opt) => createForm.setData('received_from_type', opt ? (opt.value as any) : 'client')}
                                                        styles={customReactSelectStyles}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Received From <span className="text-destructive">*</span></Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            quickClientForm.setData('name', createForm.data.received_from || '');
                                                            setIsQuickAddClientOpen(true);
                                                        }}
                                                        className="h-5 px-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 gap-1"
                                                    >
                                                        <UserPlus className="size-3" /> Quick Add
                                                    </Button>
                                                </div>
                                                <CreatableSelect
                                                    isClearable
                                                    options={clientSelectOptions}
                                                    value={
                                                        createForm.data.received_from
                                                            ? { value: createForm.data.received_from, label: createForm.data.received_from }
                                                            : null
                                                    }
                                                    onChange={(opt: any) => {
                                                        if (opt) {
                                                            createForm.setData((prev) => ({
                                                                ...prev,
                                                                received_from: opt.value,
                                                                received_from_type: opt.type || prev.received_from_type,
                                                            }));
                                                        } else {
                                                            createForm.setData('received_from', '');
                                                        }
                                                    }}
                                                    onCreateOption={(inputValue: string) => {
                                                        createForm.setData('received_from', inputValue);
                                                    }}
                                                    styles={customReactSelectStyles}
                                                    placeholder="Type or select client..."
                                                />
                                                {createForm.errors.received_from && <p className="text-xs text-destructive">{createForm.errors.received_from}</p>}
                                            </div>
                                        </div>

                                        {/* Section 2: Category & Account */}
                                        <div className="space-y-3">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                                2. Category & Receiving Account
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Category <span className="text-destructive">*</span></Label>
                                                    <ReactSelect
                                                        options={categorySelectOptions}
                                                        value={categorySelectOptions.find(opt => opt.value === createForm.data.category_id) || null}
                                                        onChange={(opt) => createForm.setData('category_id', opt ? opt.value : '')}
                                                        styles={customReactSelectStyles}
                                                        placeholder="Select Category"
                                                    />
                                                    {createForm.errors.category_id && <p className="text-xs text-destructive">{createForm.errors.category_id}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Company Receiving Account <span className="text-destructive">*</span></Label>
                                                    <ReactSelect
                                                        options={accountSelectOptions}
                                                        value={accountSelectOptions.find(opt => opt.value === createForm.data.account_id) || null}
                                                        onChange={(opt) => createForm.setData('account_id', opt ? opt.value : '')}
                                                        styles={customReactSelectStyles}
                                                        placeholder="Select Account"
                                                    />
                                                    {createForm.errors.account_id && <p className="text-xs text-destructive">{createForm.errors.account_id}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Amount & Payment Details */}
                                        <div className="space-y-3">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                                3. Amount & Payment Details
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Amount (PKR) <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="500000"
                                                        value={createForm.data.amount}
                                                        onChange={(e) => createForm.setData('amount', e.target.value)}
                                                    />
                                                    {createForm.errors.amount && <p className="text-xs text-destructive">{createForm.errors.amount}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Payment Method <span className="text-destructive">*</span></Label>
                                                    <ReactSelect
                                                        options={paymentMethodOptions}
                                                        value={paymentMethodOptions.find(opt => opt.value === createForm.data.payment_method) || null}
                                                        onChange={(opt) => createForm.setData('payment_method', opt ? (opt.value as any) : 'bank_transfer')}
                                                        styles={customReactSelectStyles}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs">External / Cheque / Txn Ref</Label>
                                                <Input
                                                    placeholder="e.g. CHQ-99001 / TXN-442211"
                                                    value={createForm.data.external_reference}
                                                    onChange={(e) => createForm.setData('external_reference', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Summary, Notes & File Attachment Dropzone */}
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                                4. Summary & Internal Notes
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Description / Summary</Label>
                                                    <Input
                                                        placeholder="e.g. Payment for Q3 Milestone Invoice"
                                                        value={createForm.data.description}
                                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Internal Notes (Optional)</Label>
                                                    <Input
                                                        placeholder="e.g. Handled by finance officer"
                                                        value={createForm.data.notes}
                                                        onChange={(e) => createForm.setData('notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <FileDropzone
                                            file={createForm.data.attachment}
                                            onFileSelect={(file) => createForm.setData('attachment', file)}
                                            displayName={createForm.data.display_name}
                                            onDisplayNameChange={(val) => createForm.setData('display_name', val)}
                                            label="Attachment / Money In Receipt (Optional)"
                                            description="Drag & drop payment receipt or bank slip here, or click to browse"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6">
                                    Post Money In Receipt
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 5. EDIT MONEY IN MODAL (HORIZONTAL MULTI-COLUMN LAYOUT) */}
                <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5 text-blue-600 dark:text-blue-400" />
                                Edit Money In Record ({editingTransaction?.reference})
                            </DialogTitle>
                            <DialogDescription>Updating this transaction will automatically recalculate the account balance and update ledger entries.</DialogDescription>
                        </DialogHeader>

                        {editingTransaction && (
                            <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
                                {/* Section 1: Transaction & Entity Info */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        1. Transaction & Entity Info
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Received Date <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="date"
                                                value={editForm.data.received_date}
                                                onChange={(e) => editForm.setData('received_date', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Received From <span className="text-destructive">*</span></Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        quickClientForm.setData('name', editForm.data.received_from || '');
                                                        setIsQuickAddClientOpen(true);
                                                    }}
                                                    className="h-5 px-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 gap-1"
                                                >
                                                    <UserPlus className="size-3" /> Quick Add
                                                </Button>
                                            </div>
                                            <CreatableSelect
                                                isClearable
                                                options={clientSelectOptions}
                                                value={
                                                    editForm.data.received_from
                                                        ? { value: editForm.data.received_from, label: editForm.data.received_from }
                                                        : null
                                                }
                                                onChange={(opt: any) => {
                                                    if (opt) {
                                                        editForm.setData((prev) => ({
                                                            ...prev,
                                                            received_from: opt.value,
                                                            received_from_type: opt.type || prev.received_from_type,
                                                        }));
                                                    } else {
                                                        editForm.setData('received_from', '');
                                                    }
                                                }}
                                                onCreateOption={(inputValue: string) => {
                                                    editForm.setData('received_from', inputValue);
                                                }}
                                                styles={customReactSelectStyles}
                                                placeholder="Type or select client..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Received From Type</Label>
                                            <ReactSelect
                                                options={receivedFromTypeOptions}
                                                value={receivedFromTypeOptions.find(opt => opt.value === editForm.data.received_from_type) || null}
                                                onChange={(opt) => editForm.setData('received_from_type', opt ? (opt.value as any) : 'client')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Category & Receiving Account */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        2. Category & Receiving Account
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Category <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={categorySelectOptions}
                                                value={categorySelectOptions.find(opt => opt.value === editForm.data.category_id) || null}
                                                onChange={(opt) => editForm.setData('category_id', opt ? opt.value : '')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Company Receiving Account <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={accountSelectOptions}
                                                value={accountSelectOptions.find(opt => opt.value === editForm.data.account_id) || null}
                                                onChange={(opt) => editForm.setData('account_id', opt ? opt.value : '')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Payment Method <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={paymentMethodOptions}
                                                value={paymentMethodOptions.find(opt => opt.value === editForm.data.payment_method) || null}
                                                onChange={(opt) => editForm.setData('payment_method', opt ? (opt.value as any) : 'bank_transfer')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Amount & Reference */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        3. Amount & Reference Details
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Amount (PKR) <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.data.amount}
                                                onChange={(e) => editForm.setData('amount', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>External / Cheque / Txn Ref</Label>
                                            <Input
                                                placeholder="e.g. CHQ-99001 / TXN-442211"
                                                value={editForm.data.external_reference}
                                                onChange={(e) => editForm.setData('external_reference', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Attachment / Receipt (Optional)</Label>
                                            <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => editForm.setData('attachment', e.target.files ? e.target.files[0] : null)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Summary & Internal Notes */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        4. Summary & Internal Notes
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Description / Summary</Label>
                                            <Input
                                                placeholder="e.g. Payment for Q3 Milestone Invoice"
                                                value={editForm.data.description}
                                                onChange={(e) => editForm.setData('description', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Internal Notes (Optional)</Label>
                                            <Input
                                                placeholder="e.g. Handled by finance officer"
                                                value={editForm.data.notes}
                                                onChange={(e) => editForm.setData('notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                                    <Button type="submit" disabled={editForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                                        Save & Recalculate
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 6. VOID TRANSACTION MODAL */}
                <Dialog open={!!voidingTransaction} onOpenChange={(open) => !open && setVoidingTransaction(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <ShieldAlert className="size-5" />
                                Void Money In Transaction
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to void <span className="font-semibold text-foreground">{voidingTransaction?.reference}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {voidingTransaction && (
                            <form onSubmit={handleVoidSubmit} className="space-y-4 pt-2">
                                <div className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <p className="font-semibold flex items-center gap-1">
                                        <AlertCircle className="size-3.5" />
                                        Financial Audit Notice:
                                    </p>
                                    <p>
                                        Voiding will deduct PKR {formatCurrency(Number(voidingTransaction.amount))} from the company account ({voidingTransaction.account?.name}) and record a reversing ledger entry. The record will remain visible for audit trail.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Void Reason <span className="text-destructive">*</span></Label>
                                    <Textarea
                                        placeholder="Please provide the specific reason for voiding this receipt (e.g. Duplicate entry, cheque bounced, wrong account selected)"
                                        rows={3}
                                        value={voidForm.data.reason}
                                        onChange={(e) => voidForm.setData('reason', e.target.value)}
                                        required
                                    />
                                    {voidForm.errors.reason && <p className="text-xs text-destructive">{voidForm.errors.reason}</p>}
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setVoidingTransaction(null)}>Cancel</Button>
                                    <Button type="submit" disabled={voidForm.processing} variant="destructive">
                                        Confirm & Void Transaction
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 7. QUICK ADD CLIENT MODAL */}
                <Dialog open={isQuickAddClientOpen} onOpenChange={(open) => !open && setIsQuickAddClientOpen(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="size-5 text-emerald-600 dark:text-emerald-400" />
                                Quick Add New Client
                            </DialogTitle>
                            <DialogDescription>Create a new client or entity to link directly to this Money In transaction.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleQuickClientSubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label>Client / Entity Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="e.g. Apex Global Solutions"
                                    value={quickClientForm.data.name}
                                    onChange={(e) => quickClientForm.setData('name', e.target.value)}
                                    required
                                />
                                {quickClientForm.errors.name && <p className="text-xs text-destructive">{quickClientForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Entity Type</Label>
                                <ReactSelect
                                    options={receivedFromTypeOptions}
                                    value={receivedFromTypeOptions.find(opt => opt.value === quickClientForm.data.type) || null}
                                    onChange={(opt) => quickClientForm.setData('type', opt ? (opt.value as any) : 'client')}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone (Optional)</Label>
                                    <Input
                                        placeholder="+92 300 1234567"
                                        value={quickClientForm.data.phone}
                                        onChange={(e) => quickClientForm.setData('phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        placeholder="client@example.com"
                                        value={quickClientForm.data.email}
                                        onChange={(e) => quickClientForm.setData('email', e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsQuickAddClientOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={quickClientForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                    Save & Select Client
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
