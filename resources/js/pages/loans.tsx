import { Head } from '@inertiajs/react';

export default function Loans() {
    return (
        <>
            <Head title="Loans / Debts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border bg-sidebar/50">
                    <h1 className="text-2xl font-bold tracking-tight">💳 Loans / Debts</h1>
                    <p className="mt-2 text-muted-foreground">Manage borrowed funds, repayments, payment history, and remaining balances.</p>
                </div>
            </div>
        </>
    );
}

Loans.layout = {
    breadcrumbs: [
        {
            title: 'Loans / Debts',
            href: '/loans',
        },
    ],
};
