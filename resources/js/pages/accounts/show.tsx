import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Banknote, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    FileText, 
    History, 
    Landmark 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialAccount } from '@/types/loans';

interface Props {
    account: FinancialAccount;
}

export default function AccountShow({ account }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    return (
        <>
            <Head title={`Account Statement - ${account.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Back Button & Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link href="/accounts">
                            <ArrowLeft className="size-4" />
                            Back to Accounts
                        </Link>
                    </Button>
                </div>

                {/* Hero Header Card */}
                <Card className="shadow-md border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            
                            {/* Account Details */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                        <Landmark className="size-7 text-foreground" />
                                        {account.name}
                                    </h1>
                                    {account.is_active ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>
                                    ) : (
                                        <Badge variant="outline">Inactive</Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="capitalize font-medium text-foreground">
                                        Type: {account.type}
                                    </span>
                                    {account.bank_name && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="size-4 text-muted-foreground" />
                                            {account.bank_name}
                                        </span>
                                    )}
                                    {account.account_number && (
                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                            A/C #: {account.account_number}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Balance Totals */}
                            <div className="grid grid-cols-2 gap-6 rounded-xl bg-muted/50 p-4 border border-border">
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Opening Balance</div>
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(Number(account.opening_balance))}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium">Current Balance</div>
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(account.current_balance))}</div>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Ledger Statement Table */}
                <Card className="border-sidebar-border/70 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <History className="size-4" />
                            Recent Account Statement Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Reference</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4 text-right">Debit (In)</th>
                                        <th className="p-4 text-right">Credit (Out)</th>
                                        <th className="p-4">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(!account.ledger_entries || account.ledger_entries.length === 0) ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                No ledger transactions recorded for this account yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        account.ledger_entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4">{entry.transaction_date}</td>
                                                <td className="p-4 font-mono font-medium">{entry.reference}</td>
                                                <td className="p-4 capitalize">{entry.transaction_type.replace('_', ' ')}</td>
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

            </div>
        </>
    );
}
