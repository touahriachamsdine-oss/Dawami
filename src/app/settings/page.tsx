
'use client';
import Link from "next/link";
import {
  Activity,
  CircleUser,
  Clock,
  DollarSign,
  Menu,
  Settings as SettingsIcon,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase, useDoc, useMemoFirebase, useCollection, doc, setDoc, query, where, collection } from "@/db";
import { useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Setting, User } from "@/lib/types";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-provider";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  payCutRate: z.coerce.number().min(0, "Pay cut rate must be a positive number."),
  companyName: z.string().min(1, "Company name is required."),
  companyAddress: z.string().min(1, "Company address is required."),
});


export default function SettingsPage() {
  const { auth, firestore, user: authUser, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'settings', 'global');
  }, [firestore, authUser]);

  const { data: settingsData, isLoading: settingsLoading } = useDoc<Setting>(settingsRef);

  const { data: currentUserData, isLoading: isCurrentUserLoading } = useCollection<User>(
    useMemoFirebase(() => {
      if (!firestore || !authUser) return null;
      return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
    }, [firestore, authUser])
  );
  const currentUser = currentUserData?.[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payCutRate: 0,
      companyName: '',
      companyAddress: '',
    }
  });

  useEffect(() => {
    if (settingsData) {
      form.reset({
        payCutRate: settingsData.payCutRate || 0,
        companyName: settingsData.companyName || '',
        companyAddress: settingsData.companyAddress || '',
      });
    }
  }, [settingsData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, values, { merge: true });
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDesc'),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('settings.error'),
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  if (isUserLoading || !currentUser || settingsLoading || isCurrentUserLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  const isAdmin = currentUser.role === 'Admin';

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
                {isAdmin && (
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
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-5 w-5" />
                  {t('nav.attendance')}
                </Link>                 <Link
                  href="/salary"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <DollarSign className="h-5 w-5" />
                  {t('nav.salary')}
                </Link>
                {isAdmin && (
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
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                >
                  <SettingsIcon className="h-5 w-5" />
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
            <CardHeader>
              <CardTitle>{t('settings.title')}</CardTitle>
              <CardDescription>
                {isAdmin ? t('settings.descriptionAdmin') : t('settings.descriptionEmployee')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyName')}</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly={!isAdmin} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyAddress')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} readOnly={!isAdmin} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payCutRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.payCutRate')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} readOnly={!isAdmin} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isAdmin && <Button type="submit" disabled={form.formState.isSubmitting}>{t('settings.saveButton')}</Button>}
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
        <BottomNavBar userRole={currentUser.role} />
      </div>
    </div>
  );
}
