import { Head } from '@inertiajs/react';

export default function Ledger() {
    return (
        <>
            <Head title="Ledger" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border bg-sidebar/50">
                    <h1 className="text-2xl font-bold tracking-tight">📒 Ledger</h1>
                    <p className="mt-2 text-muted-foreground">Comprehensive record of all financial transactions across the company.</p>
                </div>
            </div>
        </>
    );
}

Ledger.layout = {
    breadcrumbs: [
        {
            title: 'Ledger',
            href: '/ledger',
        },
    ],
};
