'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
    Activity,
    DollarSign,
    Settings,
    Users,
    LayoutDashboard,
    Fingerprint
} from "lucide-react";
import { AtProfitLogo } from "@/components/icons";
import { useLanguage } from "@/lib/language-provider";
import { cn } from "@/lib/utils";

interface SidebarProps {
    userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/employees', label: t('nav.employees'), icon: Users },
        { href: '/attendance', label: t('nav.attendance'), icon: Activity },
        { href: '/work-hours', label: t('dashboard.workHours'), icon: Activity },
        { href: '/salary', label: t('nav.salary'), icon: DollarSign },
        { href: '/payroll', label: t('nav.payroll'), icon: DollarSign },
        { href: '/settings', label: t('nav.settings'), icon: Settings },
    ];

    return (
        <div className="hidden border-r border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-20 items-center px-6 mb-4">
                    <Link href="/" className="flex items-center gap-2.5">
                        <AtProfitLogo className="h-8 w-auto" />
                    </Link>
                </div>
                <div className="flex-1 px-4">
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold shadow-sm shadow-amber-100/20"
                                            : "text-slate-500 hover:text-navy-deep dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon className={cn(
                                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                                        isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                                    )} />
                                    <span className="text-sm tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-4 mt-auto">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Secure & Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
