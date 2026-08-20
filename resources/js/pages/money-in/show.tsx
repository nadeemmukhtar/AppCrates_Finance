import { Head, Link } from '@inertiajs/react';
import { 
    AlertCircle, 
    ArrowLeft, 
    Ban, 
    Banknote, 
    Building2, 
    Calendar, 
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    Download, 
    FileText, 
    History, 
    Landmark, 
    Paperclip, 
    Receipt, 
    ShieldAlert, 
    Tag, 
    UserCheck, 
    Users 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MoneyInTransaction } from './index';

interface LedgerEntry {
    id: number;
    reference: string;
    transaction_date: string;
    debit: number;
    credit: number;
    transaction_type: string;
    description: string;
}

interface Props {
    transaction: MoneyInTransaction & {
        ledger_entries?: LedgerEntry[];
    };
}

export default function MoneyInShow({ transaction }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    return (
        <>
            <Head title={`Money In Receipt - ${transaction.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* Back Button */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link href="/money-in">
                            <ArrowLeft className="size-4" />
                            Back to Money In List
                        </Link>
                    </Button>
                </div>

                {/* Hero Header Card */}
                <Card className="shadow-md border-sidebar-border/70 dark:border-sidebar-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            
                            {/* Receipt Details */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                        <Receipt className="size-8 text-emerald-600 dark:text-emerald-400" />
                                        {transaction.reference}
                                    </h1>
                                    {transaction.status === 'posted' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                            <CheckCircle2 className="size-3.5 mr-1" /> Posted Receipt
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                            <Ban className="size-3.5 mr-1" /> Voided Transaction
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                        <Calendar className="size-4 text-muted-foreground" />
                                        {transaction.received_date}
                                    </span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1">
                                        <Users className="size-4 text-muted-foreground" />
                                        Received From: <strong className="text-foreground">{transaction.received_from}</strong> ({transaction.received_from_type})
                                    </span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1">
                                        <Tag className="size-4 text-muted-foreground" />
                                        Category: <strong className="text-foreground">{transaction.category?.name || 'General'}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Total Amount Box */}
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center lg:text-right min-w-56">
                                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Amount Received</div>
                                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {formatCurrency(Number(transaction.amount))}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 capitalize">
                                    Via {transaction.payment_method.replace('_', ' ')}
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Void Warning Banner if Voided */}
                {transaction.status === 'voided' && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="p-4 flex items-start gap-3">
                            <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-destructive">This transaction has been voided</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Voided by <strong className="text-foreground">{transaction.voider?.name || 'Authorized User'}</strong> on {transaction.voided_at ? new Date(transaction.voided_at).toLocaleString() : 'N/A'}.
                                </p>
                                {transaction.void_reason && (
                                    <p className="text-xs text-destructive font-medium mt-2 bg-destructive/10 p-2 rounded border border-destructive/20">
                                        Reason: "{transaction.void_reason}"
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 2 Grid Columns: Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Transaction & Payment Info Card */}
                    <Card className="border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                Transaction Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Received From</div>
                                    <div className="font-semibold text-foreground">{transaction.received_from}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Entity Type</div>
                                    <div className="font-semibold text-foreground capitalize">{transaction.received_from_type}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Category</div>
                                    <div className="font-semibold text-foreground">{transaction.category?.name || 'General'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Payment Method</div>
                                    <div className="font-semibold text-foreground capitalize">{transaction.payment_method.replace('_', ' ')}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Company Receiving Account</div>
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                        {transaction.account?.type === 'bank' ? <Landmark className="size-4" /> : <Banknote className="size-4" />}
                                        {transaction.account?.name}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">External / Txn Ref</div>
                                    <div className="font-mono font-medium text-foreground">{transaction.external_reference || 'N/A'}</div>
                                </div>
                            </div>

                            {transaction.description && (
                                <div className="text-sm">
                                    <div className="text-xs text-muted-foreground">Description</div>
                                    <div className="text-foreground mt-0.5">{transaction.description}</div>
                                </div>
                            )}

                            {transaction.notes && (
                                <div className="text-sm">
                                    <div className="text-xs text-muted-foreground">Internal Notes</div>
                                    <div className="text-foreground text-xs bg-muted p-2 rounded mt-0.5">{transaction.notes}</div>
                                </div>
                            )}

                            {transaction.attachment_path && (
                                <div className="pt-2">
                                    <div className="text-xs text-muted-foreground mb-1">Receipt Attachment</div>
                                    <a
                                        href={`/storage/${transaction.attachment_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/10 px-3 py-1.5 rounded border border-blue-200"
                                    >
                                        <Paperclip className="size-3.5" /> View / Download Attachment
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Audit Information Card */}
                    <Card className="border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <UserCheck className="size-4 text-primary" />
                                Audit & Governance Trail
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Created By</div>
                                    <div className="font-semibold text-foreground">{transaction.creator?.name || 'System / Admin'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Created At</div>
                                    <div className="text-foreground text-xs">{transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'}</div>
                                </div>
                            </div>

                            {transaction.updater && (
                                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Last Updated By</div>
                                        <div className="font-semibold text-foreground">{transaction.updater.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Status</div>
                                        <div className="font-semibold text-foreground capitalize">{transaction.status}</div>
                                    </div>
                                </div>
                            )}

                            {transaction.status === 'voided' && (
                                <div className="space-y-2 pt-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Voided By</div>
                                            <div className="font-semibold text-destructive">{transaction.voider?.name || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Voided Date</div>
                                            <div className="text-foreground text-xs">{transaction.voided_at ? new Date(transaction.voided_at).toLocaleString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Related Ledger Entries Statement */}
                <Card className="border-sidebar-border/70 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <History className="size-4" />
                            Associated Double-Entry Ledger Statements
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
                                    {(!transaction.ledger_entries || transaction.ledger_entries.length === 0) ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                No direct ledger entries linked.
                                            </td>
                                        </tr>
                                    ) : (
                                        transaction.ledger_entries.map((entry) => (
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
