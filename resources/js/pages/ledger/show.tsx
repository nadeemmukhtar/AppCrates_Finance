import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    BookOpen, 
    Building2, 
    Calendar, 
    CreditCard, 
    DollarSign, 
    ExternalLink, 
    FileText, 
    History, 
    Landmark, 
    Layers, 
    TrendingDown, 
    TrendingUp, 
    UserCheck, 
    Wallet 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialAccount } from '@/types/loans';

export interface LedgerEntryDetail {
    id: number;
    reference: string;
    transaction_date: string;
    account_id: number;
    debit: number;
    credit: number;
    transaction_type: string;
    reference_type?: string;
    reference_id?: number;
    description?: string;
    created_at?: string;
    account?: FinancialAccount;
    creator?: { id: number; name: string };
}

interface Props {
    ledgerEntry: LedgerEntryDetail;
    sourceUrl?: string | null;
}

export default function LedgerShow({ ledgerEntry, sourceUrl }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(val);
    };

    return (
        <>
            <Head title={`Ledger Entry ${ledgerEntry.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* BACK LINK */}
                <div>
                    <Link href="/ledger" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-3.5" /> Back to Ledger List
                    </Link>
                </div>

                {/* HEADER CARD */}
                <Card className="border-sidebar-border/70 shadow-sm overflow-hidden bg-gradient-to-r from-indigo-50/50 via-background to-background dark:from-indigo-950/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md">
                                    <BookOpen className="size-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">{ledgerEntry.reference}</h1>
                                        <Badge variant="outline" className="font-semibold capitalize bg-background">
                                            {ledgerEntry.transaction_type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                                        <span>📅 Date: {new Date(ledgerEntry.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        <span>🏦 Account: {ledgerEntry.account?.name || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {sourceUrl && (
                                <Link href={sourceUrl}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium">
                                        <ExternalLink className="size-4" /> View Source Module Record
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* DETAILS & LEDGER BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Transaction Information</CardTitle>
                            <CardDescription>Ledger double-entry accounting attributes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Transaction Date</div>
                                    <div className="text-foreground font-semibold mt-0.5">{new Date(ledgerEntry.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Transaction Type</div>
                                    <div className="text-indigo-600 font-semibold capitalize mt-0.5">{ledgerEntry.transaction_type.replace('_', ' ')}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Company Account</div>
                                <div className="font-semibold text-foreground mt-0.5">{ledgerEntry.account?.name || '—'}</div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase">Description</div>
                                <div className="text-foreground mt-0.5 font-medium">{ledgerEntry.description || 'No description recorded.'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Double-Entry Posting</CardTitle>
                            <CardDescription>Debit & Credit accounting impact.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
                                <div>
                                    <div className="text-xs font-semibold text-emerald-600 uppercase">Debit (+Inflow)</div>
                                    <div className="text-xl font-bold font-mono text-emerald-600 mt-1">{formatCurrency(Number(ledgerEntry.debit))}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-rose-600 uppercase">Credit (-Outflow)</div>
                                    <div className="text-xl font-bold font-mono text-rose-600 mt-1">{formatCurrency(Number(ledgerEntry.credit))}</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border text-xs text-muted-foreground space-y-1">
                                <div className="font-semibold text-foreground">Audit Record:</div>
                                <div>Recorded by: {ledgerEntry.creator?.name || 'System Auto Posting'}</div>
                                <div>Recorded at: {ledgerEntry.created_at ? new Date(ledgerEntry.created_at).toLocaleString() : '—'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </>
    );
}
