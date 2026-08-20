import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
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
    TrendingDown, 
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

export interface ExpenseCategory {
    id: number;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
}

export interface Expense {
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
    media_id?: number;
    status: 'posted' | 'voided';
    created_by?: number;
    updated_by?: number;
    voided_by?: number;
    voided_at?: string;
    void_reason?: string;
    created_at?: string;
    category?: ExpenseCategory;
    account?: FinancialAccount;
    creator?: { id: number; name: string };
    updater?: { id: number; name: string };
    voider?: { id: number; name: string };
    media?: { id: number; display_name?: string | null; url: string; file_name: string };
}

interface Props {
    stats: {
        total_expenses: number;
        expenses_today: number;
        expenses_this_month: number;
        total_count: number;
    };
    expenses: {
        data: Expense[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    categories: ExpenseCategory[];
    accounts: FinancialAccount[];
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
    { value: 'all', label: 'All Payment Methods' },
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

export default function ExpensesIndex({ stats, expenses, categories, accounts, filters }: Props) {
    // Search & Filter State
    const [search, setSearch] = useState(filters.search || '');
    const [categoryIdFilter, setCategoryIdFilter] = useState(filters.category_id || 'all');
    const [accountIdFilter, setAccountIdFilter] = useState(filters.account_id || 'all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState(filters.payment_method || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [startDateFilter, setStartDateFilter] = useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = useState(filters.end_date || '');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [voidingExpense, setVoidingExpense] = useState<Expense | null>(null);
    const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);

    // Create Expense Form
    const createForm = useForm({
        expense_date: new Date().toISOString().split('T')[0],
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        account_id: accounts.length > 0 ? String(accounts[0].id) : '',
        payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'card' | 'other',
        amount: '',
        external_reference: '',
        description: '',
        notes: '',
        attachment: null as File | null,
        display_name: '',
    });

    // Edit Expense Form
    const editForm = useForm({
        expense_date: '',
        category_id: '',
        account_id: '',
        payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'online_transfer' | 'card' | 'other',
        amount: '',
        external_reference: '',
        description: '',
        notes: '',
        attachment: null as File | null,
        display_name: '',
    });

    // Void Expense Form
    const voidForm = useForm({
        reason: '',
    });

    // Quick Add Category Form
    const categoryForm = useForm({
        name: '',
        description: '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    const categoryFormSelectOptions = categories.map((c) => ({ value: String(c.id), label: c.name }));

    const accountSelectOptions = accounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.name} (${acc.type === 'bank' ? acc.bank_name || 'Bank' : 'Cash'}) - PKR ${Number(acc.current_balance).toLocaleString('en-PK')}`,
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
            ...newFilters,
        };

        Object.keys(query).forEach((key) => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/expenses', query, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        setCategoryIdFilter('all');
        setAccountIdFilter('all');
        setPaymentMethodFilter('all');
        setStatusFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        router.get('/expenses', {}, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/expenses', {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success('Operating Expense posted successfully!');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to post expense transaction.');
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;

        editForm.post(`/expenses/${editingExpense.id}`, {
            forceFormData: true,
            headers: {
                '_method': 'PUT',
            },
            onSuccess: () => {
                setEditingExpense(null);
                editForm.reset();
                toast.success('Expense record updated successfully!');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to update expense transaction.');
            },
        });
    };

    const handleVoidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!voidingExpense) return;

        voidForm.post(`/expenses/${voidingExpense.id}/void`, {
            onSuccess: () => {
                setVoidingExpense(null);
                voidForm.reset();
                toast.success('Expense record has been voided.');
            },
            onError: (err) => {
                toast.error(err.error || 'Failed to void expense record.');
            },
        });
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newCategoryName = categoryForm.data.name;
        categoryForm.post('/expense-categories', {
            onSuccess: (page) => {
                setIsQuickAddCategoryOpen(false);
                categoryForm.reset();
                toast.success(`Expense category '${newCategoryName}' added successfully!`);

                const updatedCategories = page.props.categories as ExpenseCategory[] | undefined;
                const newCat = updatedCategories?.find(
                    (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
                );

                if (newCat) {
                    createForm.setData('category_id', String(newCat.id));
                    if (editingExpense) {
                        editForm.setData('category_id', String(newCat.id));
                    }
                }
            },
        });
    };

    const openEditModal = (exp: Expense) => {
        setEditingExpense(exp);
        editForm.setData({
            expense_date: exp.expense_date,
            category_id: String(exp.category_id),
            account_id: String(exp.account_id || ''),
            payment_method: exp.payment_method,
            amount: String(exp.amount),
            external_reference: exp.external_reference || '',
            description: exp.description || '',
            notes: exp.notes || '',
            attachment: null,
        });
    };

    return (
        <>
            <Head title="Operating Expenses Management" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* 1. HEADER & MAIN ACTION BUTTON */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <TrendingDown className="size-7 text-rose-600 dark:text-rose-400" />
                            Expenses Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track company operating expenses, categories, account balances, and automated ledger postings.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm font-medium">
                        <Plus className="size-4" />
                        Record New Expense
                    </Button>
                </div>

                {/* 2. SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
                            <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats.total_expenses)}</div>
                            <p className="text-xs text-muted-foreground mt-1">All-time posted operating expenditure</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses Today</CardTitle>
                            <Calendar className="size-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.expenses_today)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Operating expenses recorded today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses This Month</CardTitle>
                            <Banknote className="size-4 text-indigo-600 dark:text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(stats.expenses_this_month)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Current month operating expenses</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expense Transactions</CardTitle>
                            <Receipt className="size-4 text-slate-600 dark:text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_count} Posted</div>
                            <p className="text-xs text-muted-foreground mt-1">Excludes voided expense records</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. FILTERS BAR */}
                <Card className="border-sidebar-border/70 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            {/* Search Input */}
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Expense Ref (EXP-00001), description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                    className="pl-9"
                                />
                            </div>

                            {/* Category Filter */}
                            <div>
                                <ReactSelect
                                    options={categoryOptions}
                                    value={categoryOptions.find(o => o.value === categoryIdFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setCategoryIdFilter(val);
                                        handleFilterChange({ category_id: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Payment Method Filter */}
                            <div>
                                <ReactSelect
                                    options={paymentMethodOptions}
                                    value={paymentMethodOptions.find(o => o.value === paymentMethodFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setPaymentMethodFilter(val);
                                        handleFilterChange({ payment_method: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => handleFilterChange({ search })} className="w-full gap-1">
                                    <Filter className="size-4" /> Filter
                                </Button>
                                {(search || categoryIdFilter !== 'all' || accountIdFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all' || startDateFilter || endDateFilter) && (
                                    <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Reset filters">
                                        <RotateCcw className="size-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. EXPENSE DATA TABLE */}
                <Card className="border-sidebar-border/70 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4">Payment Method</th>
                                        <th className="p-4">Company Account</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {expenses.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <TrendingDown className="size-8 text-muted-foreground/50" />
                                                    <p className="text-base font-semibold">No expense records found</p>
                                                    <p className="text-xs text-muted-foreground">Try adjusting your search filters or record a new expense.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.data.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-mono font-bold text-foreground">
                                                    <Link href={`/expenses/${exp.id}`} className="hover:underline text-rose-600 dark:text-rose-400">
                                                        {exp.reference}
                                                    </Link>
                                                    {(exp.media || exp.attachment_path) && (
                                                        <div className="mt-1">
                                                            <a
                                                                href={exp.media?.url || `/storage/${exp.attachment_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800"
                                                            >
                                                                <Paperclip className="size-3" />
                                                                {exp.media?.display_name || 'Receipt'}
                                                            </a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {new Date(exp.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="font-semibold bg-muted/30">
                                                        {exp.category?.name || 'Uncategorized'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 max-w-xs truncate text-foreground font-medium">
                                                    {exp.description || '—'}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                    {formatCurrency(Number(exp.amount))}
                                                </td>
                                                <td className="p-4 capitalize text-xs text-muted-foreground">
                                                    {exp.payment_method.replace('_', ' ')}
                                                </td>
                                                <td className="p-4 text-xs font-medium">
                                                    {exp.account?.name || '—'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={exp.status === 'posted' ? 'default' : 'destructive'} className={exp.status === 'posted' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-700 border-red-500/20'}>
                                                        {exp.status.toUpperCase()}
                                                    </Badge>
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
                                                                <Link href={`/expenses/${exp.id}`} className="gap-2 cursor-pointer">
                                                                    <Eye className="size-4" /> View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {exp.status === 'posted' && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => openEditModal(exp)} className="gap-2 cursor-pointer">
                                                                        <Edit className="size-4" /> Edit Expense
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => setVoidingExpense(exp)} className="gap-2 text-destructive cursor-pointer">
                                                                        <ShieldAlert className="size-4" /> Void Expense
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
                        {expenses.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
                                <div>
                                    Showing {expenses.from || 0} to {expenses.to || 0} of {expenses.total} expenses
                                </div>
                                <div className="flex items-center gap-1">
                                    {expenses.links.map((link, idx) => (
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

                {/* 5. ADD EXPENSE MODAL (HORIZONTAL MULTI-COLUMN LAYOUT) */}
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && setIsCreateModalOpen(false)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <TrendingDown className="size-5 text-rose-600 dark:text-rose-400" />
                                Record Operating Expense
                            </DialogTitle>
                            <DialogDescription>Record a company operating expense to deduct account balance and post ledger entry.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Section 1: Expense Details */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        1. Expense Details
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Expense Date <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="date"
                                                value={createForm.data.expense_date}
                                                onChange={(e) => createForm.setData('expense_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Category <span className="text-destructive">*</span></Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsQuickAddCategoryOpen(true)}
                                                    className="h-5 px-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 gap-1"
                                                >
                                                    <Plus className="size-3" /> Quick Add
                                                </Button>
                                            </div>
                                            <ReactSelect
                                                options={categoryFormSelectOptions}
                                                value={categoryFormSelectOptions.find(o => o.value === createForm.data.category_id) || null}
                                                onChange={(opt) => createForm.setData('category_id', opt ? opt.value : '')}
                                                styles={customReactSelectStyles}
                                            />
                                            {createForm.errors.category_id && <p className="text-xs text-destructive">{createForm.errors.category_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Amount (PKR) <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 200000"
                                                value={createForm.data.amount}
                                                onChange={(e) => createForm.setData('amount', e.target.value)}
                                                required
                                            />
                                            {createForm.errors.amount && <p className="text-xs text-destructive">{createForm.errors.amount}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Account & Payment Method */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        2. Account & Payment Method
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Company Paying Account <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={accountSelectOptions}
                                                value={accountSelectOptions.find(o => o.value === createForm.data.account_id) || null}
                                                onChange={(opt) => createForm.setData('account_id', opt ? opt.value : '')}
                                                styles={customReactSelectStyles}
                                            />
                                            {createForm.errors.account_id && <p className="text-xs text-destructive">{createForm.errors.account_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Payment Method <span className="text-destructive">*</span></Label>
                                            <ReactSelect
                                                options={paymentMethodOptions.filter(o => o.value !== 'all')}
                                                value={paymentMethodOptions.find(o => o.value === createForm.data.payment_method) || null}
                                                onChange={(opt) => createForm.setData('payment_method', opt ? (opt.value as any) : 'bank_transfer')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>External / Cheque / Txn Ref</Label>
                                            <Input
                                                placeholder="e.g. INV-9901 / CHQ-8822"
                                                value={createForm.data.external_reference}
                                                onChange={(e) => createForm.setData('external_reference', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Summary & Notes */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        3. Summary, Notes & Receipt Attachment
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Description / Summary</Label>
                                            <Input
                                                placeholder="e.g. August Office Rent Payment"
                                                value={createForm.data.description}
                                                onChange={(e) => createForm.setData('description', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Internal Notes (Optional)</Label>
                                            <Input
                                                placeholder="e.g. Approved by Finance Director"
                                                value={createForm.data.notes}
                                                onChange={(e) => createForm.setData('notes', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <FileDropzone
                                        file={createForm.data.attachment}
                                        onFileSelect={(file) => createForm.setData('attachment', file)}
                                        displayName={createForm.data.display_name}
                                        onDisplayNameChange={(val) => createForm.setData('display_name', val)}
                                        label="Attachment / Expense Receipt (Optional)"
                                        description="Drag & drop receipt image or PDF here, or click to browse"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6">
                                    Post Expense Record
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 6. EDIT EXPENSE MODAL */}
                <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5 text-rose-600 dark:text-rose-400" />
                                Edit Operating Expense ({editingExpense?.reference})
                            </DialogTitle>
                            <DialogDescription>Updating this expense will adjust the company account balance and update ledger entries.</DialogDescription>
                        </DialogHeader>

                        {editingExpense && (
                            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                                                options={paymentMethodOptions.filter(o => o.value !== 'all')}
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
                                            <Label>Internal Notes (Optional)</Label>
                                            <Input
                                                value={editForm.data.notes}
                                                onChange={(e) => editForm.setData('notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
                                    <Button type="submit" disabled={editForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6">
                                        Save & Adjust Financials
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 7. VOID EXPENSE MODAL */}
                <Dialog open={!!voidingExpense} onOpenChange={(open) => !open && setVoidingExpense(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <ShieldAlert className="size-5" />
                                Void Operating Expense
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to void <span className="font-semibold text-foreground">{voidingExpense?.reference}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {voidingExpense && (
                            <form onSubmit={handleVoidSubmit} className="space-y-4 pt-2">
                                <div className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <p className="font-semibold flex items-center gap-1">
                                        <AlertCircle className="size-3.5" />
                                        Financial Audit Notice:
                                    </p>
                                    <p>
                                        Voiding will restore PKR {formatCurrency(Number(voidingExpense.amount))} back to the company account ({voidingExpense.account?.name}) and post a reversing ledger entry.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Void Reason <span className="text-destructive">*</span></Label>
                                    <Textarea
                                        placeholder="Please provide reason for voiding this expense (e.g. Duplicate entry, wrong account chosen)"
                                        rows={3}
                                        value={voidForm.data.reason}
                                        onChange={(e) => voidForm.setData('reason', e.target.value)}
                                        required
                                    />
                                    {voidForm.errors.reason && <p className="text-xs text-destructive">{voidForm.errors.reason}</p>}
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setVoidingExpense(null)}>Cancel</Button>
                                    <Button type="submit" disabled={voidForm.processing} variant="destructive">
                                        Confirm & Void Expense
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 8. QUICK ADD CATEGORY MODAL */}
                <Dialog open={isQuickAddCategoryOpen} onOpenChange={(open) => !open && setIsQuickAddCategoryOpen(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="size-5 text-rose-600 dark:text-rose-400" />
                                Quick Add Expense Category
                            </DialogTitle>
                            <DialogDescription>Create a new expense category to categorize company operating costs.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label>Category Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="e.g. Legal Fees"
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    required
                                />
                                {categoryForm.errors.name && <p className="text-xs text-destructive">{categoryForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Input
                                    placeholder="Brief description of this expense category"
                                    value={categoryForm.data.description}
                                    onChange={(e) => categoryForm.setData('description', e.target.value)}
                                />
                            </div>

                            <DialogFooter className="border-t pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsQuickAddCategoryOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={categoryForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                                    Save Category
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
