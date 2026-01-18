
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
} from "lucide-react";
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
    return collection(firestore, 'attendance');
  }, [firestore]);

  const { data: attendanceData, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);

  const liveAttendance = useMemo(() => {
    if (!attendanceData || !users) return [];

    // Sort by createdAt desc and take top 5
    return [...attendanceData]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(att => {
        const user = users.find(u => u.uid === att.userId);
        return {
          ...att,
          userName: user?.name || 'Unknown',
          userAvatarUrl: user?.avatarUrl,
        };
      });
  }, [attendanceData, users]);

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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
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
          </div>

          {/* Live Feed for Admin */}
          {currentUser?.role === 'Admin' && (
            <Card className="mt-12 overflow-hidden border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-[32px] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 p-6">
                <div>
                  <CardTitle className="text-lg font-bold">Live Attendance Feed</CardTitle>
                  <CardDescription className="text-xs">Real-time fingerprint activity</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Live</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-50 dark:border-slate-800">
                      <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Employee</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Time</TableHead>
                      <TableHead className="pr-6 text-right text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-xs italic">
                          No recent activity recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      liveAttendance.map((log) => (
                        <TableRow key={log.id} className="border-slate-50 dark:border-slate-800 group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-100 dark:border-slate-800">
                                <AvatarImage src={log.userAvatarUrl} />
                                <AvatarFallback>{log.userName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-navy-deep dark:text-white">{log.userName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">#{log.userId.slice(-4)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.checkOutTime ? "secondary" : "default"} className="rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tight">
                              {log.checkOutTime ? "Clock Out" : "Clock In"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-mono font-bold">
                                {log.checkOutTime
                                  ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <span className="text-xs font-bold text-slate-400">{log.date}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
        <BottomNavBar userRole={currentUser.role} />
      </div >
    </div >
  );
}
