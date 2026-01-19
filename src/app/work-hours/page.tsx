
'use client';
import Link from "next/link";
import {
    Activity,
    CircleUser,
    Clock,
    DollarSign,
    Menu,
    Settings,
    Users,
    PieChart,
} from "lucide-react";
import { useMemo } from "react";
import { collection, query, where, useCollection, useFirebase, useMemoFirebase } from "@/db";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AtProfitLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

import { Attendance, User } from "@/lib/types";
import { useLanguage } from "@/lib/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";

export default function WorkHoursPage() {
    const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
    const { t } = useLanguage();
    const router = useRouter();

    const { data: currentUserData, isLoading: isCurrentUserLoading } = useCollection<User>(useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
    }, [firestore, authUser]));
    const currentUser = currentUserData?.[0];

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'attendance'), where('status', '==', 'Present'));
    }, [firestore]);

    const { data: attendanceLogs } = useCollection<Attendance>(attendanceQuery);

    const workStats = useMemo(() => {
        if (!attendanceLogs) return { week: 0, month: 0 };
        const now = new Date();

        // Copy for week calculation
        const dWeek = new Date(now);
        const day = dWeek.getDay();
        const diffToSun = dWeek.getDate() - day;
        const startOfWeek = new Date(dWeek.setDate(diffToSun));
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let weekHours = 0;
        let monthHours = 0;

        attendanceLogs.forEach(log => {
            const checkInInput = log.checkInTime;
            const checkOutInput = log.checkOutTime;

            const checkIn = (checkInInput?.toDate ? checkInInput.toDate() : (checkInInput ? new Date(checkInInput) : null));
            const checkOut = (checkOutInput?.toDate ? checkOutInput.toDate() : (checkOutInput ? new Date(checkOutInput) : null));

            if (checkIn && checkOut) {
                const diff = Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                if (checkIn >= startOfWeek) weekHours += diff;
                if (checkIn >= startOfMonth) monthHours += diff;
            }
        });

        return { week: Math.round(weekHours), month: Math.round(monthHours) };
    }, [attendanceLogs]);

    if (isUserLoading || isCurrentUserLoading || !currentUser) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar userRole={currentUser?.role} />
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
                                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                                    <AtProfitLogo className="h-6 w-6 text-primary" />
                                    <span className="font-headline">Solminder</span>
                                </Link>
                                <Link href="/dashboard" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                                    <Users className="h-5 w-5" />
                                    {t('nav.dashboard')}
                                </Link>
                                <Link href="/employees" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                                    <Users className="h-5 w-5" />
                                    {t('nav.employees')}
                                </Link>
                                <Link href="/attendance" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                                    <Activity className="h-5 w-5" />
                                    {t('nav.attendance')}
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

                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 md:pb-8 max-w-6xl mx-auto w-full">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        <Card className="rounded-[24px] bg-primary/5 border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Weekly Total</CardTitle>
                                <Clock className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{workStats.week}h</div>
                                <p className="text-xs text-muted-foreground">Current Week</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[24px] bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                                <PieChart className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{workStats.month}h</div>
                                <p className="text-xs text-muted-foreground">This Month</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[24px] border shadow-md overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle>{t('dashboard.workHours')}</CardTitle>
                            <CardDescription>{t('dashboard.recentActivity')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dashboard.employee')}</TableHead>
                                            <TableHead>{t('dashboard.date')}</TableHead>
                                            <TableHead>{t('dashboard.checkIn')}</TableHead>
                                            <TableHead>{t('dashboard.checkOut')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.duration')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceLogs?.map((log) => {
                                            const checkIn = log.checkInTime?.toDate?.() || new Date(log.checkInTime);
                                            const checkOut = log.checkOutTime?.toDate?.() || (log.checkOutTime ? new Date(log.checkOutTime) : null);
                                            let duration = "-";
                                            if (checkIn && checkOut) {
                                                const diff = Math.abs(checkOut.getTime() - checkIn.getTime());
                                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                                const mins = Math.floor((diff / (1000 * 60)) % 60);
                                                duration = `${hours}h ${mins}m`;
                                            }
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-medium">{log.userName}</TableCell>
                                                    <TableCell>{format(new Date(log.date), "MMM dd, yyyy")}</TableCell>
                                                    <TableCell>{checkIn ? format(checkIn, "HH:mm") : "-"}</TableCell>
                                                    <TableCell>{checkOut ? format(checkOut, "HH:mm") : "-"}</TableCell>
                                                    <TableCell className="text-right font-mono">{duration}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {(!attendanceLogs || attendanceLogs.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                                    No work hours recorded
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <BottomNavBar userRole={currentUser?.role} />
            </div>
        </div>
    );
}
