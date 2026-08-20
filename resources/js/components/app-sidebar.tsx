import { Link } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, BookOpen, FolderGit2, HandCoins, Landmark, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Money In',
        href: '/money-in',
        icon: ArrowDownLeft,
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: Users,
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: ArrowUpRight,
    },
    {
        title: 'Accounts',
        href: '/accounts',
        icon: Landmark,
    },
    {
        title: 'Loans',
        href: '/lenders',
        icon: HandCoins,
    },
    {
        title: 'Ledger',
        href: '/ledger',
        icon: BookOpen,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
