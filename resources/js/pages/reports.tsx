import { Head } from '@inertiajs/react';

export default function Reports() {
    return (
        <>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border bg-sidebar/50">
                    <h1 className="text-2xl font-bold tracking-tight">📈 Reports</h1>
                    <p className="mt-2 text-muted-foreground">Financial reports including Income, Expense, Salary, Loans, and Profit & Loss statement.</p>
                </div>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: '/reports',
        },
    ],
};
