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
import { Button } from "@/components/ui/button";
import { AtProfitLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { columns } from "@/components/employees/columns";
import { DataTable } from "@/components/employees/data-table";
import { useCollection, useFirebase, useMemoFirebase, collection, query, where } from "@/db";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-provider";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { EmployeeCardList } from "@/components/employees/employee-card-list";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export default function EmployeesPage() {
  const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');


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

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isUserLoading && currentUser && currentUser.role !== 'Admin') {
    router.replace('/dashboard');
    return null;
  }

  if (isUserLoading || usersLoading || !currentUser) {
    return <div className="flex h-screen items-center justify-center">{t('general.loading')}</div>;
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
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl  bg-muted px-3 py-2 text-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    {t('nav.employees')}
                  </Link>
                )}
                <Link
                  href="/attendance"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
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
                    <Users className="h-4 w-4" />
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
          <div className="w-full flex-1">
            <div className="w-full flex-1">
              <Input
                placeholder={t('employees.filterByName')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-8 w-full lg:w-[250px] bg-card"
              />
            </div>
          </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('employees.title')}</CardTitle>
                <CardDescription>
                  {t('employees.description')}
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/add-employee">
                  {t('employees.addEmployee')}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <EmployeeCardList users={filteredUsers || []} t={t} />
              ) : (
                <DataTable columns={columns(t)} data={filteredUsers || []} t={t} />
              )}
            </CardContent>
          </Card>
        </main>
        <BottomNavBar userRole={currentUser.role} />
      </div>
    </div>
  );
}
