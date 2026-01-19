
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
  Briefcase,
  Heart,
  Baby,
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useFirebase, useCollection, useDoc, useMemoFirebase, collection, query, where, doc } from "@/db";
import { useMemo, useState } from "react";
import { User, Setting, Salary as SalaryType } from "@/lib/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { generateAbsenceNotification, AbsenceNotificationInput, AbsenceNotificationOutput } from "@/ai/flows/generate-absence-notifications";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { mockSalaryData } from "@/lib/data";
import { calculateRawSalary, FAMILY_ALLOWANCE_PER_CHILD, SPOUSE_ALLOWANCE } from "@/lib/salary-scale";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-provider";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";

export default function SalaryPage() {
  const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const [notification, setNotification] = useState<AbsenceNotificationOutput | null>(null);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: currentUserData, isLoading: isCurrentUserLoading } = useCollection<User>(useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
  }, [firestore, authUser]));
  const currentUser = currentUserData?.[0];

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || currentUser?.role !== 'Admin') return null;
    return query(collection(firestore, 'users'), where('accountStatus', '==', 'Approved'));
  }, [firestore, currentUser]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const displayUserId = useMemo(() => {
    if (currentUser?.role === 'Admin') {
      return selectedUserId || authUser?.uid;
    }
    return authUser?.uid;
  }, [currentUser, selectedUserId, authUser]);

  const { data: selectedUserData, isLoading: selectedUserLoading } = useDoc<User>(useMemoFirebase(() => {
    if (!firestore || !displayUserId) return null;
    const userToQuery = users?.find(u => u.uid === displayUserId);
    if (!userToQuery) return null;
    return doc(firestore, 'users', userToQuery.id);
  }, [firestore, displayUserId, users]));

  const selectedUser = currentUser?.role === 'Admin' ? selectedUserData : currentUser;


  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'settings', 'global')
  }, [firestore, authUser]);
  const { data: settings } = useDoc<Setting>(settingsRef);

  const handleGenerateNotification = async () => {
    if (!selectedUser || !settings) return;

    const deductionAmount = selectedUser.baseSalary * (settings.payCutRate / 100) * selectedUser.daysAbsent;

    const input: AbsenceNotificationInput = {
      employeeName: selectedUser.name,
      daysAbsent: selectedUser.daysAbsent,
      payCutRate: settings.payCutRate,
      deductionAmount: deductionAmount,
    };

    setIsGenerating(true);
    try {
      const result = await generateAbsenceNotification(input);
      setNotification(result);
      setIsNotificationDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate notification.' });
    } finally {
      setIsGenerating(false);
    }
  };


  const chartConfig = {
    baseSalary: { label: "Base Salary", color: "hsl(var(--chart-1))" },
    deductions: { label: "Deductions", color: "hsl(var(--chart-2))" },
    netSalary: { label: "Net Salary", color: "hsl(var(--chart-3))" },
  };

  if (currentUser?.role === 'Admin' && !selectedUserId && users && users.length > 0) {
    setSelectedUserId(users[0].uid);
  }

  if (isUserLoading || isCurrentUserLoading || !currentUser || (currentUser.role === 'Admin' && usersLoading) || (displayUserId && selectedUserLoading)) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>
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
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                  <AtProfitLogo className="h-6 w-6 text-primary" />
                  <span className="font-headline">Solminder</span>
                </Link>
                <Link href="/dashboard" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                  <Users className="h-5 w-5" />
                  {t('nav.dashboard')}
                </Link>
                <Link href="/clock-in" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                  <Clock className="h-5 w-5" />
                  {t('nav.clockIn')}
                </Link>
                {currentUser?.role === 'Admin' && (
                  <Link href="/employees" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                    <Users className="h-5 w-5" />
                    {t('nav.employees')}
                  </Link>
                )}
                <Link href="/attendance" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                  <Activity className="h-5 w-5" />
                  {t('nav.attendance')}
                </Link>
                <Link href="/salary" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground">
                  <DollarSign className="h-5 w-5" />
                  {t('nav.salary')}
                </Link>
                {currentUser?.role === 'Admin' && (
                  <Link href="/applicants" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                    <Users className="h-5 w-5" />
                    {t('nav.newApplicants')}
                  </Link>
                )}
                <Link href="/settings" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 md:pb-8">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t('salary.title')}</CardTitle>
                <CardDescription>
                  {currentUser?.role === 'Admin' ? t('salary.descriptionAdmin') : t('salary.descriptionEmployee')}
                </CardDescription>
              </div>
              {currentUser?.role === 'Admin' && users && (
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateNotification} disabled={isGenerating || !selectedUser || selectedUser.daysAbsent === 0} className="w-full md:w-auto">
                    {isGenerating ? t('salary.generating') : t('salary.notifyAbsences')}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockSalaryData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'DZD' }).format(value)} />
                    <Tooltip content={<ChartTooltipContent formatter={(value, name, props) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'DZD' }).format(value as number), props.dataKey as string]} />} />
                    <Legend />
                    <Bar dataKey="baseSalary" fill="var(--color-baseSalary)" radius={4} />
                    <Bar dataKey="deductions" fill="var(--color-deductions)" radius={4} />
                    <Bar dataKey="netSalary" fill="var(--color-netSalary)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {selectedUser && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="rounded-[24px]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Salary Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">Base Salary</span>
                    <span className="font-bold">{(selectedUser.baseSalary || 0).toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex flex-col">
                      <span className="text-sm flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Marital Allowance</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedUser.maritalStatus || 'Single'}</span>
                    </div>
                    <span>{selectedUser.maritalStatus === 'Married' ? `+${SPOUSE_ALLOWANCE} DA` : '0 DA'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex flex-col">
                      <span className="text-sm flex items-center gap-1.5"><Baby className="w-3.5 h-3.5 text-blue-500" /> Family Allowance</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedUser.childrenCount || 0} Children</span>
                    </div>
                    <span>+{((selectedUser.childrenCount || 0) * FAMILY_ALLOWANCE_PER_CHILD).toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-emerald-600">
                    <span className="font-bold">Raw Salary (Gross)</span>
                    <span className="text-xl font-black">
                      {calculateRawSalary(selectedUser.baseSalary || 0, selectedUser.childrenCount || 0, selectedUser.maritalStatus || 'Single').toLocaleString()} DA
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Schedule Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 border-primary/10">
                    <span className="text-sm text-muted-foreground">Daily Hours</span>
                    <span className="font-bold">{selectedUser.dailyWorkHours || 8}h / day</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 border-primary/10">
                    <span className="text-sm text-muted-foreground">Shift Time</span>
                    <span className="font-bold">{selectedUser.shiftStart || '08:00'} - {selectedUser.shiftEnd || '17:00'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">Work Style</span>
                    <Badge variant="outline" className="border-primary/50 text-primary">{selectedUser.jobType || 'Full-time'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <AlertDialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('salary.notificationTitle', { name: selectedUser?.name })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('salary.notificationDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 text-sm bg-muted/50 p-4 rounded-md">
              {notification?.notificationText}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('salary.close')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (notification?.notificationText) {
                  navigator.clipboard.writeText(notification.notificationText);
                  toast({ title: t('salary.copied'), description: t('salary.copiedDesc') });
                }
                setIsNotificationDialogOpen(false);
              }}>{t('salary.copy')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <BottomNavBar userRole={currentUser.role} />
      </div>
    </div>
  );
}
