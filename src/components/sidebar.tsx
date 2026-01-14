'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
    Activity,
    Clock,
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
        { href: '/attendance', label: t('nav.attendance'), icon: Activity },
        { href: '/clock-in', label: t('nav.clockIn'), icon: Clock },
        { href: '/salary', label: t('nav.salary'), icon: DollarSign },
    ];

    if (userRole === 'Admin') {
        // Insert after dashboard
        navItems.splice(1, 0, { href: '/employees', label: t('nav.employees'), icon: Users });
        // Add Payroll after salary
        navItems.splice(4, 0, { href: '/payroll', label: t('nav.payroll'), icon: DollarSign });
        // Add Sensor after payroll
        navItems.splice(5, 0, { href: '/sensor', label: t('nav.sensor'), icon: Fingerprint });
        // Add Applicants
        navItems.push({ href: '/applicants', label: t('nav.newApplicants'), icon: Users });
    }

    navItems.push({ href: '/settings', label: t('nav.settings'), icon: Settings });

    return (
        <div className="hidden border-r border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-20 items-center px-6 mb-4">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <AtProfitLogo className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-display text-2xl font-black tracking-tighter text-navy-deep dark:text-white">Dawami</span>
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
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-100/20"
                                            : "text-slate-500 hover:text-navy-deep dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon className={cn(
                                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                                        isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                                    )} />
                                    <span className="text-sm tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
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
