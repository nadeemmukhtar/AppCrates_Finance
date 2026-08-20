import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import ReactSelect from 'react-select';
import { 
    AlertCircle, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Banknote, 
    Building2, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    Edit, 
    Eye, 
    Filter, 
    Landmark, 
    MoreHorizontal, 
    Plus, 
    PlusCircle, 
    Power, 
    Search, 
    Trash2, 
    Wallet 
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
import type { FinancialAccount } from '@/types/loans';

interface Props {
    stats: {
        total_cash: number;
        total_bank: number;
        total_other: number;
        total_liquidity: number;
        total_accounts: number;
        active_accounts: number;
    };
    accounts: {
        data: FinancialAccount[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    filters: {
        search?: string;
        type?: string;
        is_active?: string;
    };
}

const accountTypeOptions = [
    { value: 'cash', label: 'Cash Box / Wallet' },
    { value: 'bank', label: 'Bank Account' },
    { value: 'other', label: 'Other Account' },
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

export default function AccountsIndex({ stats, accounts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<FinancialAccount | null>(null);
    const [toggleStatusAccount, setToggleStatusAccount] = useState<FinancialAccount | null>(null);

    // Create Account Form
    const createForm = useForm({
        name: '',
        type: 'bank' as 'cash' | 'bank' | 'other',
        account_number: '',
        bank_name: '',
        opening_balance: '0',
        is_active: true,
    });

    // Edit Account Form
    const editForm = useForm({
        name: '',
        type: 'bank' as 'cash' | 'bank' | 'other',
        account_number: '',
        bank_name: '',
        is_active: true,
    });

    // Delete / Action Forms
    const deleteForm = useForm();
    const statusForm = useForm();

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

        router.get('/accounts', query, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/accounts', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success('Financial account created successfully!');
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;

        editForm.put(`/accounts/${editingAccount.id}`, {
            onSuccess: () => {
                setEditingAccount(null);
                editForm.reset();
                toast.success('Financial account updated successfully!');
            },
        });
    };

    const handleToggleStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!toggleStatusAccount) return;

        statusForm.post(`/accounts/${toggleStatusAccount.id}/toggle-status`, {
            onSuccess: () => {
                setToggleStatusAccount(null);
                toast.success('Account status updated successfully!');
            },
        });
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingAccount) return;

        deleteForm.delete(`/accounts/${deletingAccount.id}`, {
            onSuccess: () => {
                setDeletingAccount(null);
                toast.success('Financial account deleted successfully!');
            },
            onError: (errors) => {
                toast.error(errors.error || 'Failed to delete account.');
            },
        });
    };

    const openEditModal = (account: FinancialAccount) => {
        setEditingAccount(account);
        editForm.setData({
            name: account.name,
            type: account.type,
            account_number: account.account_number || '',
            bank_name: account.bank_name || '',
            is_active: account.is_active,
        });
    };

    return (
        <>
            <Head title="Cash & Bank Accounts" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Header & Main Action Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Landmark className="size-7 text-foreground" />
                            Cash & Bank Accounts
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage liquid cash boxes, bank accounts, wallets, and track available company funds.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                        <Plus className="size-4" />
                        Add New Account
                    </Button>
                </div>

                {/* Summary Metric Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Total Cash</CardTitle>
                            <Banknote className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.total_cash)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Available in cash boxes</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Total Bank Balance</CardTitle>
                            <Building2 className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-foreground">{formatCurrency(stats.total_bank)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Commercial bank accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Wallets / Other</CardTitle>
                            <CreditCard className="size-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-foreground">{formatCurrency(stats.total_other)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Other financial channels</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Net Liquidity</CardTitle>
                            <DollarSign className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-foreground">{formatCurrency(stats.total_liquidity)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Combined company liquidity</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 p-4 bg-sidebar/50 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by account name, bank name, or IBAN..."
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
                                <ReactSelect
                                    options={[{ value: 'all', label: 'All Types' }, ...accountTypeOptions]}
                                    value={{ value: typeFilter, label: typeFilter === 'all' ? 'All Types' : typeFilter.toUpperCase() }}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setTypeFilter(val);
                                        handleFilterChange({ type: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); router.get('/accounts'); }}>
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-xl border border-sidebar-border/70 overflow-hidden bg-background dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-sidebar-border/70">
                                <tr>
                                    <th className="p-4">Account Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Bank / Institution</th>
                                    <th className="p-4">Account / IBAN #</th>
                                    <th className="p-4 text-right">Current Balance</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70">
                                {accounts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No financial accounts found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.data.map((account) => (
                                        <tr key={account.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-bold text-foreground">
                                                <Link href={`/accounts/${account.id}`} className="hover:underline flex items-center gap-1.5">
                                                    {account.name}
                                                </Link>
                                            </td>
                                            <td className="p-4 capitalize">
                                                <Badge variant="outline" className="capitalize">
                                                    {account.type}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground font-medium">
                                                {account.bank_name || '-'}
                                            </td>
                                            <td className="p-4 font-mono text-xs text-muted-foreground">
                                                {account.account_number || '-'}
                                            </td>
                                            <td className="p-4 text-right font-bold text-foreground">
                                                {formatCurrency(Number(account.current_balance))}
                                            </td>
                                            <td className="p-4 text-center">
                                                {account.is_active ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
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
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/accounts/${account.id}`} className="flex items-center gap-2">
                                                                <Eye className="size-4" />
                                                                View Statement
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openEditModal(account)} className="cursor-pointer">
                                                            <Edit className="size-4" />
                                                            Edit Account
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setToggleStatusAccount(account)} className="cursor-pointer">
                                                            <Power className="size-4" />
                                                            {account.is_active ? 'Deactivate' : 'Activate'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingAccount(account)}
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                            Delete Account
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
                    {accounts.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-sidebar-border/70 text-sm text-muted-foreground">
                            <div>
                                Showing <span className="font-semibold text-foreground">{accounts.from || 0}</span> to{' '}
                                <span className="font-semibold text-foreground">{accounts.to || 0}</span> of{' '}
                                <span className="font-semibold text-foreground">{accounts.total}</span> accounts
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {accounts.links.map((link, idx) => {
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

                {/* 1. ADD ACCOUNT MODAL */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Landmark className="size-5" />
                                Add Financial Account
                            </DialogTitle>
                            <DialogDescription>Create a new bank account or cash box for tracking company liquidity.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Account Name *</Label>
                                <Input
                                    placeholder="e.g. HBL Operational Account / Main Cash Box"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                />
                                {createForm.errors.name && <p className="text-xs text-destructive">{createForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2 w-full">
                                <Label>Account Type *</Label>
                                <ReactSelect
                                    options={accountTypeOptions}
                                    value={accountTypeOptions.find(opt => opt.value === createForm.data.type) || null}
                                    onChange={(opt) => createForm.setData('type', opt ? (opt.value as any) : 'bank')}
                                    styles={customReactSelectStyles}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Bank / Institution Name</Label>
                                <Input
                                    placeholder="e.g. Habib Bank Limited"
                                    value={createForm.data.bank_name}
                                    onChange={(e) => createForm.setData('bank_name', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Account Number / IBAN</Label>
                                <Input
                                    placeholder="e.g. PK12HABB00012345678901"
                                    value={createForm.data.account_number}
                                    onChange={(e) => createForm.setData('account_number', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Opening Balance (PKR) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={createForm.data.opening_balance}
                                    onChange={(e) => createForm.setData('opening_balance', e.target.value)}
                                />
                                {createForm.errors.opening_balance && <p className="text-xs text-destructive">{createForm.errors.opening_balance}</p>}
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing}>
                                    Save Account
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 2. EDIT ACCOUNT MODAL */}
                <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5" />
                                Edit Account
                            </DialogTitle>
                            <DialogDescription>Update details for <span className="font-semibold">{editingAccount?.name}</span>.</DialogDescription>
                        </DialogHeader>

                        {editingAccount && (
                            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Account Name *</Label>
                                    <Input
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                    />
                                    {editForm.errors.name && <p className="text-xs text-destructive">{editForm.errors.name}</p>}
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label>Account Type *</Label>
                                    <ReactSelect
                                        options={accountTypeOptions}
                                        value={accountTypeOptions.find(opt => opt.value === editForm.data.type) || null}
                                        onChange={(opt) => editForm.setData('type', opt ? (opt.value as any) : 'bank')}
                                        styles={customReactSelectStyles}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Bank / Institution Name</Label>
                                    <Input
                                        value={editForm.data.bank_name}
                                        onChange={(e) => editForm.setData('bank_name', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Account Number / IBAN</Label>
                                    <Input
                                        value={editForm.data.account_number}
                                        onChange={(e) => editForm.setData('account_number', e.target.value)}
                                    />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
                                    <Button type="submit" disabled={editForm.processing}>
                                        Update Account
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 3. TOGGLE STATUS MODAL */}
                <Dialog open={!!toggleStatusAccount} onOpenChange={(open) => !open && setToggleStatusAccount(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Power className="size-5" />
                                {toggleStatusAccount?.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to {toggleStatusAccount?.is_active ? 'deactivate' : 'activate'} <span className="font-semibold">{toggleStatusAccount?.name}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {toggleStatusAccount && (
                            <form onSubmit={handleToggleStatusSubmit} className="space-y-4 py-2">
                                <p className="text-sm text-muted-foreground">
                                    {toggleStatusAccount.is_active
                                        ? 'Deactivated accounts will not appear in payment selection dropdowns.'
                                        : 'Activated accounts will become available for receiving and recording payments.'}
                                </p>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setToggleStatusAccount(null)}>Cancel</Button>
                                    <Button type="submit" disabled={statusForm.processing}>
                                        Confirm
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 4. DELETE ACCOUNT MODAL */}
                <Dialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <Trash2 className="size-5" />
                                Delete Account
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingAccount?.name}</span>?
                            </DialogDescription>
                        </DialogHeader>

                        {deletingAccount && (
                            <form onSubmit={handleDeleteSubmit} className="space-y-4 py-2">
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone. Accounts with linked transactions or ledger entries cannot be deleted.
                                </p>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDeletingAccount(null)}>Cancel</Button>
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
