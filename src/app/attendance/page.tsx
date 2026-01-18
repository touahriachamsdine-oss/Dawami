
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Attendance, User } from "@/lib/types";
import { useCollection, useFirebase, useMemoFirebase, collection, query, where } from "@/db";
import { useLanguage } from "@/lib/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";
import { LiveAttendanceFeed } from "@/components/attendance/live-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
  const { t } = useLanguage();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('accountStatus', '==', 'Approved'));
  }, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const currentUserQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
  }, [firestore, authUser]);
  const { data: currentUserData } = useCollection<User>(currentUserQuery);
  const currentUser = currentUserData?.[0];

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const displayUserId = useMemo(() => {
    if (currentUser?.role === 'Admin') {
      return selectedUserId || users?.[0]?.uid;
    }
    return authUser?.uid;
  }, [currentUser, selectedUserId, authUser, users]);

  const selectedUser = useMemo(() => {
    if (!users) return null;
    if (currentUser?.role === 'Admin') {
      return users?.find(u => u.uid === displayUserId) || null;
    }
    return currentUser;
  }, [users, displayUserId, currentUser]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !selectedUser) return null;
    const userIdToFetch = currentUser?.role === 'Admin' ? displayUserId : selectedUser.uid;
    if (!userIdToFetch) return null;

    const userToQuery = users?.find(u => u.uid === userIdToFetch);
    if (!userToQuery) return null;

    return collection(firestore, 'users', userToQuery.id, 'attendance');
  }, [firestore, selectedUser, currentUser?.role, displayUserId, users]);

  const { data: attendanceData, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);

  const allAttendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'attendance');
  }, [firestore]);

  const { data: allAttendance } = useCollection<Attendance>(allAttendanceQuery);

  const liveAttendance = useMemo(() => {
    if (!allAttendance || !users) return [];
    return [...allAttendance]
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
  }, [allAttendance, users]);

  if (currentUser?.role === 'Admin' && !selectedUserId && users && users.length > 0) {
    setSelectedUserId(users[0].uid);
  }

  if (isUserLoading || !currentUser || usersLoading || (displayUserId && attendanceLoading)) {
    return <div className="flex h-screen w-full items-center justify-center">{t('general.loading')}</div>;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <AtProfitLogo className="h-6 w-6 text-primary" />
                  <span className="font-headline">Solminder</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/clock-in"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Clock className="h-5 w-5" />
                  {t('nav.clockIn')}
                </Link>
                {currentUser?.role === 'Admin' && (
                  <Link
                    href="/employees"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    {t('nav.employees')}
                  </Link>
                )}
                <Link
                  href="/attendance"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                >
                  <Activity className="h-5 w-5" />
                  {t('nav.attendance')}
                </Link>
                <Link
                  href="/salary"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <DollarSign className="h-5 w-5" />
                  {t('nav.salary')}
                </Link>
                {currentUser?.role === 'Admin' && (
                  <Link
                    href="/applicants"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    {t('nav.newApplicants')}
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  {t('nav.settings')}
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
        <main className="flex flex-1 flex-col gap-8 p-4 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                  <div>
                    <CardTitle className="text-2xl font-black text-navy-deep dark:text-white">{t('attendance.title')}</CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {currentUser?.role === 'Admin' ? t('attendance.descriptionAdmin') : t('attendance.descriptionEmployee')}
                    </CardDescription>
                  </div>
                  {currentUser?.role === 'Admin' && users && (
                    <div className="w-[220px]">
                      <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
                        <SelectTrigger className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold">
                          <SelectValue placeholder={t('attendance.selectEmployee')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {users.map(user => (
                            <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-1 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    {displayUserId ? (
                      <AttendanceCalendar attendance={attendanceData || []} workDays={selectedUser?.workDays} t={t} />
                    ) : (
                      <div className="text-center py-20 text-slate-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">{t('attendance.pleaseSelect')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats / Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Present', color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/50', text: 'text-green-700 dark:text-green-400' },
                  { label: 'Absent', color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/50', text: 'text-red-700 dark:text-red-400' },
                  { label: 'Late', color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-400' },
                  { label: 'Rest Day', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/50', text: 'text-blue-700 dark:text-blue-400' },
                ].map((item) => (
                  <div key={item.label} className={cn("flex items-center gap-3 p-4 rounded-3xl border transition-transform hover:scale-105", item.bg, item.border)}>
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", item.color)}></div>
                    <span className={cn("text-xs font-black uppercase tracking-tight", item.text)}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <LiveAttendanceFeed attendance={liveAttendance} />
              </div>
            </div>
          </div>
        </main>
        <BottomNavBar userRole={currentUser.role} />
      </div>
    </div>
  );
}
