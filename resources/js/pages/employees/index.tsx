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
    UserCheck, 
    UserPlus, 
    Users, 
    Wallet, 
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
}

export interface Employee {
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
    creator?: { id: number; name: string };
}

interface Props {
    stats: {
        total_employees: number;
        active_employees: number;
        inactive_employees: number;
        total_monthly_payroll: number;
        total_salary_paid: number;
    };
    employees: {
        data: Employee[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    accounts: FinancialAccount[];
    filters: {
        search?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
    };
}

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

export default function EmployeesIndex({ stats, employees, accounts, filters }: Props) {
    // Search & Filter State
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [startDateFilter, setStartDateFilter] = useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = useState(filters.end_date || '');
    const [sortByFilter, setSortByFilter] = useState(filters.sort_by || 'default');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [toggleStatusEmployee, setToggleStatusEmployee] = useState<Employee | null>(null);

    // Create Form
    const createForm = useForm({
        full_name: '',
        email: '',
        phone: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active' as 'active' | 'inactive',
        basic_salary: '',
        allowances: '0',
        deductions: '0',
        effective_date: new Date().toISOString().split('T')[0],
    });

    // Edit Form
    const editForm = useForm({
        full_name: '',
        email: '',
        phone: '',
        joining_date: '',
        status: 'active' as 'active' | 'inactive',
    });

    // Calculated Net Salary preview for Create Form
    const basicVal = Number(createForm.data.basic_salary) || 0;
    const allowVal = Number(createForm.data.allowances) || 0;
    const dedVal = Number(createForm.data.deductions) || 0;
    const calculatedNetSalary = Math.max(0, basicVal + allowVal - dedVal);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        const query = {
            search,
            status: statusFilter,
            start_date: startDateFilter,
            end_date: endDateFilter,
            sort_by: sortByFilter,
            ...newFilters,
        };

        Object.keys(query).forEach((key) => {
            if (!query[key as keyof typeof query] || query[key as keyof typeof query] === 'all' || query[key as keyof typeof query] === 'default') {
                delete query[key as keyof typeof query];
            }
        });

        router.get('/employees', query, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setStartDateFilter('');
        setEndDateFilter('');
        setSortByFilter('default');
        router.get('/employees', {}, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/employees', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success('Employee created successfully!');
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;

        editForm.put(`/employees/${editingEmployee.id}`, {
            onSuccess: () => {
                setEditingEmployee(null);
                editForm.reset();
                toast.success('Employee details updated successfully!');
            },
        });
    };

    const handleToggleStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!toggleStatusEmployee) return;

        router.post(`/employees/${toggleStatusEmployee.id}/toggle-status`, {}, {
            onSuccess: () => {
                setToggleStatusEmployee(null);
                toast.success('Employee status updated successfully!');
            },
        });
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        editForm.setData({
            full_name: employee.full_name,
            email: employee.email || '',
            phone: employee.phone || '',
            joining_date: employee.joining_date,
            status: employee.status,
        });
    };

    return (
        <>
            <Head title="Employees & Salary Management" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* 1. HEADER & MAIN ACTION BUTTON */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Users className="size-7 text-indigo-600 dark:text-indigo-400" />
                            Employees & Salary Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage employee profiles, monthly salary structures, partial payouts, and payment history.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm font-medium">
                        <UserPlus className="size-4" />
                        Add New Employee
                    </Button>
                </div>

                {/* 2. SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Employees</CardTitle>
                            <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_employees}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{stats.active_employees} Active</span>
                                <span>•</span>
                                <span className="text-muted-foreground">{stats.inactive_employees} Inactive</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Employees</CardTitle>
                            <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active_employees}</div>
                            <p className="text-xs text-muted-foreground mt-1">Eligible for monthly salary payouts</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Payroll</CardTitle>
                            <Banknote className="size-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.total_monthly_payroll)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Current monthly net salary commitment</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid Salary</CardTitle>
                            <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.total_salary_paid)}</div>
                            <p className="text-xs text-muted-foreground mt-1">All-time salary payouts disbursed</p>
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
                                    placeholder="Search by Employee ID (EMP-0001), Name, or Email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search })}
                                    className="pl-9"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <ReactSelect
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'active', label: 'Active Employees' },
                                        { value: 'inactive', label: 'Inactive Employees' },
                                    ]}
                                    value={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'active', label: 'Active Employees' },
                                        { value: 'inactive', label: 'Inactive Employees' },
                                    ].find(o => o.value === statusFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'all';
                                        setStatusFilter(val);
                                        handleFilterChange({ status: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Sort Filter */}
                            <div>
                                <ReactSelect
                                    options={[
                                        { value: 'default', label: 'Sort by ID (Default)' },
                                        { value: 'salary_desc', label: 'Highest Salary First' },
                                        { value: 'salary_asc', label: 'Lowest Salary First' },
                                    ]}
                                    value={[
                                        { value: 'default', label: 'Sort by ID (Default)' },
                                        { value: 'salary_desc', label: 'Highest Salary First' },
                                        { value: 'salary_asc', label: 'Lowest Salary First' },
                                    ].find(o => o.value === sortByFilter) || null}
                                    onChange={(opt) => {
                                        const val = opt ? opt.value : 'default';
                                        setSortByFilter(val);
                                        handleFilterChange({ sort_by: val });
                                    }}
                                    styles={customReactSelectStyles}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => handleFilterChange({ search })} className="w-full gap-1">
                                    <Filter className="size-4" /> Filter
                                </Button>
                                {(search || statusFilter !== 'all' || startDateFilter || endDateFilter || sortByFilter !== 'default') && (
                                    <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Reset filters">
                                        <RotateCcw className="size-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. EMPLOYEE DATA TABLE */}
                <Card className="border-sidebar-border/70 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Employee ID</th>
                                        <th className="p-4">Employee Name</th>
                                        <th className="p-4">Contact Info</th>
                                        <th className="p-4">Joining Date</th>
                                        <th className="p-4 text-right">Current Net Salary</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {employees.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="size-8 text-muted-foreground/50" />
                                                    <p className="text-base font-semibold">No employee records found</p>
                                                    <p className="text-xs text-muted-foreground">Try adjusting your search criteria or add a new employee.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        employees.data.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-mono font-bold text-foreground">
                                                    <Link href={`/employees/${emp.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                                                        {emp.employee_id}
                                                    </Link>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-foreground">{emp.full_name}</div>
                                                </td>
                                                <td className="p-4 text-xs space-y-0.5">
                                                    {emp.email && <div className="text-foreground">{emp.email}</div>}
                                                    {emp.phone && <div className="text-muted-foreground">{emp.phone}</div>}
                                                    {!emp.email && !emp.phone && <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {new Date(emp.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-right font-mono font-semibold text-foreground">
                                                    {formatCurrency(Number(emp.current_salary?.net_salary || 0))}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className={emp.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                                                        {emp.status === 'active' ? 'Active' : 'Inactive'}
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
                                                                <Link href={`/employees/${emp.id}`} className="gap-2 cursor-pointer">
                                                                    <Eye className="size-4" /> View Profile & Salaries
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditModal(emp)} className="gap-2 cursor-pointer">
                                                                <Edit className="size-4" /> Edit Information
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setToggleStatusEmployee(emp)} className="gap-2 text-amber-600 dark:text-amber-400 cursor-pointer">
                                                                <RefreshCcw className="size-4" /> {emp.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
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

                        {/* Pagination Bar */}
                        {employees.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
                                <div>
                                    Showing {employees.from || 0} to {employees.to || 0} of {employees.total} employees
                                </div>
                                <div className="flex items-center gap-1">
                                    {employees.links.map((link, idx) => (
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

                {/* 5. ADD EMPLOYEE MODAL (HORIZONTAL MULTI-COLUMN LAYOUT) */}
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && setIsCreateModalOpen(false)}>
                    <DialogContent className="max-w-4xl sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="size-5 text-indigo-600 dark:text-indigo-400" />
                                Add New Employee
                            </DialogTitle>
                            <DialogDescription>Register a new company employee and configure initial salary structure.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Section 1: Basic Information */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        1. Basic Information
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                placeholder="e.g. Ahmed Khan"
                                                value={createForm.data.full_name}
                                                onChange={(e) => createForm.setData('full_name', e.target.value)}
                                                required
                                            />
                                            {createForm.errors.full_name && <p className="text-xs text-destructive">{createForm.errors.full_name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="ahmed@company.com"
                                                value={createForm.data.email}
                                                onChange={(e) => createForm.setData('email', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                placeholder="03001234567"
                                                value={createForm.data.phone}
                                                onChange={(e) => createForm.setData('phone', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Joining Date <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="date"
                                                value={createForm.data.joining_date}
                                                onChange={(e) => createForm.setData('joining_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <ReactSelect
                                                options={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'inactive', label: 'Inactive' },
                                                ]}
                                                value={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'inactive', label: 'Inactive' },
                                                ].find(o => o.value === createForm.data.status) || null}
                                                onChange={(opt) => createForm.setData('status', opt ? (opt.value as any) : 'active')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Salary Structure */}
                                <div className="space-y-3">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1">
                                        2. Salary Structure Setup
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Basic Salary (PKR) <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="100000"
                                                value={createForm.data.basic_salary}
                                                onChange={(e) => createForm.setData('basic_salary', e.target.value)}
                                                required
                                            />
                                            {createForm.errors.basic_salary && <p className="text-xs text-destructive">{createForm.errors.basic_salary}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Allowances (PKR)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="10000"
                                                value={createForm.data.allowances}
                                                onChange={(e) => createForm.setData('allowances', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Deductions (PKR)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="5000"
                                                value={createForm.data.deductions}
                                                onChange={(e) => createForm.setData('deductions', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Net Salary Calculation Preview */}
                                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-4 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Auto Calculated Net Salary</div>
                                            <div className="text-xs text-indigo-600/80 dark:text-indigo-400 mt-0.5">Basic + Allowances - Deductions</div>
                                        </div>
                                        <div className="text-2xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
                                            {formatCurrency(calculatedNetSalary)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6">
                                    Create Employee Record
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 6. EDIT EMPLOYEE MODAL */}
                <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                    <DialogContent className="max-w-3xl sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit className="size-5 text-indigo-600 dark:text-indigo-400" />
                                Edit Employee ({editingEmployee?.employee_id})
                            </DialogTitle>
                            <DialogDescription>Update contact information and status for {editingEmployee?.full_name}.</DialogDescription>
                        </DialogHeader>

                        {editingEmployee && (
                            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                value={editForm.data.full_name}
                                                onChange={(e) => editForm.setData('full_name', e.target.value)}
                                                required
                                            />
                                            {editForm.errors.full_name && <p className="text-xs text-destructive">{editForm.errors.full_name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input
                                                type="email"
                                                value={editForm.data.email}
                                                onChange={(e) => editForm.setData('email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={editForm.data.phone}
                                                onChange={(e) => editForm.setData('phone', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Joining Date <span className="text-destructive">*</span></Label>
                                            <Input
                                                type="date"
                                                value={editForm.data.joining_date}
                                                onChange={(e) => editForm.setData('joining_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <ReactSelect
                                                options={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'inactive', label: 'Inactive' },
                                                ]}
                                                value={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'inactive', label: 'Inactive' },
                                                ].find(o => o.value === editForm.data.status) || null}
                                                onChange={(opt) => editForm.setData('status', opt ? (opt.value as any) : 'active')}
                                                styles={customReactSelectStyles}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>Cancel</Button>
                                    <Button type="submit" disabled={editForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 7. TOGGLE STATUS CONFIRMATION MODAL */}
                <Dialog open={!!toggleStatusEmployee} onOpenChange={(open) => !open && setToggleStatusEmployee(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <RefreshCcw className="size-5 text-amber-600 dark:text-amber-400" />
                                {toggleStatusEmployee?.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to change status for <span className="font-semibold text-foreground">{toggleStatusEmployee?.full_name}</span> ({toggleStatusEmployee?.employee_id})?
                            </DialogDescription>
                        </DialogHeader>

                        {toggleStatusEmployee && (
                            <form onSubmit={handleToggleStatusSubmit} className="space-y-4 pt-2">
                                <div className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                    <p className="font-semibold flex items-center gap-1">
                                        <AlertCircle className="size-3.5" />
                                        Important Notice:
                                    </p>
                                    <p>
                                        Deactivating an employee preserves all historical salary records, payment history, and payslips. No data will be deleted.
                                    </p>
                                </div>

                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setToggleStatusEmployee(null)}>Cancel</Button>
                                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                                        Confirm Status Change
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
