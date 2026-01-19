
'use client';
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  Clock,
  CreditCard,
  DollarSign,
  Menu,
  Users,
  Fingerprint,
  PieChart,
} from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";
import { collection, query, where, useCollection, useFirebase, useMemoFirebase } from "@/db";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { EmployeeQrCodeGenerator } from "@/components/dashboard/qr-code-generator";
import { useLanguage } from "@/lib/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
  const { t, language } = useLanguage();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('accountStatus', '==', 'Approved'));
  }, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

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
    const diffToSun = dWeek.getDate() - day; // Sunday is 0
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



  const currentUserQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
  }, [firestore, authUser]);
  const { data: currentUserData } = useCollection<User>(currentUserQuery);

  const currentUser = currentUserData?.[0];

  const { totalEmployees, totalSalaryCost, totalDaysMissed, averageAttendance } = useMemo(() => {
    if (!users) return { totalEmployees: 0, totalSalaryCost: 0, totalDaysMissed: 0, averageAttendance: 0 };

    const totalEmployees = users.length;
    const totalSalaryCost = users.reduce((acc, user) => acc + (user.totalSalary || 0), 0);
    const totalDaysMissed = users.reduce((acc, user) => acc + (user.daysAbsent || 0), 0);
    const totalPossibleAttendance = users.reduce((acc, user) => acc + user.attendanceRate, 0);
    const averageAttendance = totalEmployees > 0 ? totalPossibleAttendance / totalEmployees : 0;

    return { totalEmployees, totalSalaryCost, totalDaysMissed, averageAttendance };
  }, [users]);

  if (isUserLoading || usersLoading || !currentUser) {
    return <div className="flex h-screen items-center justify-center">{t('general.loading')}</div>
  }

  const currencyFormatter = new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-US', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0
  });

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-slate-50 dark:bg-slate-950">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex flex-col relative overflow-x-hidden pb-24 md:pb-0">
        <header className="pt-16 md:pt-6 pb-6 px-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dawami</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                {currentUser?.role === 'Admin' ? 'Admin Control' : 'Worker Portal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group cursor-pointer">
                  <div className="w-12 h-12 rounded-full ring-4 ring-slate-50 dark:ring-slate-800 overflow-hidden shadow-sm">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={currentUser?.avatarUrl} alt="Profile" />
                      <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
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
          </div>
        </header>

        <main className="flex-1 px-6 pt-8 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            <Link href="/employees" className="relative flex flex-col items-center justify-center aspect-[1/1.1] bg-emerald-50 dark:bg-emerald-950/20 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/50 shadow-lg transition-transform active:scale-95 group">
              <div className="mb-2 transition-transform group-hover:scale-110">
                <div className="flex -space-x-3 items-center">
                  <Users className="w-10 h-10 text-emerald-600 bg-white dark:bg-slate-800 p-2 rounded-full border border-emerald-50 dark:border-emerald-900" />
                  <Users className="w-10 h-10 text-emerald-500 bg-white dark:bg-slate-800 p-2 rounded-full border border-emerald-50 dark:border-emerald-900 relative z-10 scale-110" />
                  <Users className="w-10 h-10 text-emerald-400 bg-white dark:bg-slate-800 p-2 rounded-full border border-emerald-50 dark:border-emerald-900" />
                </div>
              </div>
              <div className="absolute -bottom-4 w-[85%] bg-primary py-2.5 rounded-2xl shadow-xl border border-blue-400/20 text-center">
                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">{t('nav.employees')}</span>
              </div>
            </Link>

            <Link href="/attendance" className="relative flex flex-col items-center justify-center aspect-[1/1.1] bg-emerald-50 dark:bg-emerald-950/20 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/50 shadow-lg transition-transform active:scale-95 group relative shadow-inner">
              <div className="mb-2 flex items-end gap-1 transition-transform group-hover:scale-110">
                <Activity className="w-12 h-12 text-emerald-600" />
                <Clock className="w-6 h-6 text-emerald-400 -ml-2 mb-1" />
              </div>
              <div className="absolute -bottom-4 w-[85%] bg-primary py-2.5 rounded-2xl shadow-xl border border-blue-400/20 text-center">
                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">{t('nav.attendance')}</span>
              </div>
            </Link>

            {currentUser?.role === 'Admin' ? (
              <Link href="/payroll" className="relative flex flex-col items-center justify-center aspect-[1/1.1] bg-emerald-50 dark:bg-emerald-950/20 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/50 shadow-lg transition-transform active:scale-95 group shadow-inner">
                <div className="mb-2 relative flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="w-12 h-12 text-emerald-600" />
                  <div className="absolute -top-1 -right-2 bg-emerald-100 dark:bg-emerald-900 rounded-full p-1.5 border-2 border-white dark:border-slate-800">
                    <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                </div>
                <div className="absolute -bottom-4 w-[85%] bg-primary py-2.5 rounded-2xl shadow-xl border border-blue-400/20 text-center">
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">{t('nav.payroll')}</span>
                </div>
              </Link>
            ) : (
              <Link href="/salary" className="relative flex flex-col items-center justify-center aspect-[1/1.1] bg-emerald-50 dark:bg-emerald-950/20 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/50 shadow-lg transition-transform active:scale-95 group shadow-inner">
                <div className="mb-2 relative flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="absolute -bottom-4 w-[85%] bg-primary py-2.5 rounded-2xl shadow-xl border border-blue-400/20 text-center">
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">{t('nav.salary')}</span>
                </div>
              </Link>
            )}

            <Card className="col-span-2 lg:col-span-4 rounded-[32px] border border-slate-100/50 dark:border-slate-800/50 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      {t('dashboard.workHours')}
                    </CardTitle>
                    <CardDescription>{t('dashboard.recentActivity')}</CardDescription>
                  </div>
                  <div className="flex gap-4 mr-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">This Week</div>
                      <div className="text-sm font-black text-primary">{workStats.week}h</div>
                    </div>
                    <div className="text-right border-l pl-4">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">This Month</div>
                      <div className="text-sm font-black text-emerald-600">{workStats.month}h</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/attendance">{t('dashboard.viewAll')}</Link>
                  </Button>
                </div>
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
                      {attendanceLogs?.slice(0, 5).map((log) => {
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
                            <TableCell>{format(new Date(log.date), "MMM dd")}</TableCell>
                            <TableCell>{checkIn ? format(checkIn, "HH:mm") : "-"}</TableCell>
                            <TableCell>{checkOut ? format(checkOut, "HH:mm") : "-"}</TableCell>
                            <TableCell className="text-right font-mono">{duration}</TableCell>
                          </TableRow>
                        );
                      })}
                      {(!attendanceLogs || attendanceLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                            No recent work hours recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

        </main>
        <BottomNavBar userRole={currentUser.role} />
      </div >
    </div >
  );
}
