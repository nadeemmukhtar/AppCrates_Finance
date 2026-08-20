import { Head } from '@inertiajs/react';

export default function Expenses() {
    return (
        <>
            <Head title="Expenses" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border bg-sidebar/50">
                    <h1 className="text-2xl font-bold tracking-tight">💸 Expenses</h1>
                    <p className="mt-2 text-muted-foreground">Track where and how much company money was spent.</p>
                </div>
            </div>
        </>
    );
}

Expenses.layout = {
    breadcrumbs: [
        {
            title: 'Expenses',
            href: '/expenses',
        },
    ],
};
