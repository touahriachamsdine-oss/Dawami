'use client';

import React, { useState } from 'react';
import Link from "next/link";
import {
    CircleUser,
    Menu,
    Users,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    DollarSign
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AtProfitLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirebase, useCollection, useMemoFirebase, collection, query, where } from "@/db";
import { User } from "@/lib/types";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-provider";
import PayrollGrid from "@/components/payroll/PayrollGrid";
import { Sidebar } from "@/components/sidebar";
import { format, addMonths, subMonths } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PayrollPage() {
    const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
    const { t, language } = useLanguage();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: currentUserData, isLoading: isCurrentUserLoading } = useCollection<User>(useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
    }, [firestore, authUser]));

    const currentUser = currentUserData?.[0];

    const monthKey = format(currentDate, 'yyyy-MM');

    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    if (isUserLoading || isCurrentUserLoading || !currentUser) {
        return <div className="flex h-screen w-full items-center justify-center">{t('general.loading')}</div>
    }

    if (currentUser.role !== 'Admin') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
                <Button asChild><Link href="/dashboard">Go back to Dashboard</Link></Button>
            </div>
        );
    }

    const formattedDate = currentDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar userRole={currentUser.role} />

            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                                    <AtProfitLogo className="h-6 w-6 text-primary" />
                                    <span className="font-headline">Solminder</span>
                                </Link>
                                <Link href="/dashboard" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                                    <Users className="h-5 w-5" />
                                    {t('nav.dashboard')}
                                </Link>
                                <Link href="/payroll" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground">
                                    <DollarSign className="h-5 w-5" />
                                    {t('nav.payroll')}
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1" />
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/profile">{t('nav.profile')}</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/settings">{t('nav.settings')}</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { auth.signOut(); router.push('/login'); }}>
                                {t('nav.logout')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 md:pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t('payroll.title')}</h1>
                            <p className="text-muted-foreground">{t('payroll.description')}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                                {language === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </Button>
                            <div className="flex items-center gap-2 px-4 py-1 font-semibold min-w-[140px] justify-center capitalize">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                {formattedDate}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                                {language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0">
                            <CardTitle>{t('nav.payroll')} ({monthKey})</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <PayrollGrid currentMonth={monthKey} />
                        </CardContent>
                    </Card>
                </main>
                <BottomNavBar userRole={currentUser.role} />
            </div>
        </div>
    );
}
