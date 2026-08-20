import { Head } from '@inertiajs/react';

export default function Employees() {
    return (
        <>
            <Head title="Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border bg-sidebar/50">
                    <h1 className="text-2xl font-bold tracking-tight">👥 Employees</h1>
                    <p className="mt-2 text-muted-foreground">Manage employee salaries, payment history, and pending payouts.</p>
                </div>
            </div>
        </>
    );
}

Employees.layout = {
    breadcrumbs: [
        {
            title: 'Employees',
            href: '/employees',
        },
    ],
};
