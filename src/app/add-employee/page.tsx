'use client';
import Link from 'next/link';
import {
  Menu,
  CircleUser,
  Users,
  Clock,
  CalendarIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AtProfitLogo } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase, collection, query, where, addDoc, createUserWithEmailAndPassword } from '@/db';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLanguage } from '@/lib/language-provider';
import { BottomNavBar } from '@/components/ui/bottom-nav-bar';
import { Sidebar } from '@/components/sidebar';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import React, { useEffect, useMemo } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rank: z.string().min(2, 'Rank is required.'),
  jobDescription: z.string().optional(),
  baseSalary: z.coerce.number().min(0, 'Salary must be a positive number.'),
  role: z.enum(['Admin', 'Employee']),
  workDays: z.array(z.number()).min(1, "Employee must work at least one day"),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddEmployeePage() {
  const { firestore, auth, user: authUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const weekDays = useMemo(() => [
    { id: 0, label: t('addEmployee.days.sun') },
    { id: 1, label: t('addEmployee.days.mon') },
    { id: 2, label: t('addEmployee.days.tue') },
    { id: 3, label: t('addEmployee.days.wed') },
    { id: 4, label: t('addEmployee.days.thu') },
    { id: 5, label: t('addEmployee.days.fri') },
    { id: 6, label: t('addEmployee.days.sat') },
  ], [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      rank: '',
      jobDescription: '',
      baseSalary: 0,
      role: 'Employee',
      workDays: [1, 2, 3, 4, 5],
      startDate: new Date(),
    },
  });

  const currentUserQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, 'users'), where('uid', '==', authUser.uid));
  }, [firestore, authUser]);
  const { data: currentUserData, isLoading: currentUserLoading } = useCollection<User>(currentUserQuery);
  const currentUser = currentUserData?.[0];

  useEffect(() => {
    if (!isUserLoading && currentUser && currentUser.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [isUserLoading, currentUser, router]);

  const onSubmit = async (values: FormValues) => {
    if (!auth || !firestore) return;
    try {
      const tempUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = tempUserCredential.user;

      const userDoc: Omit<User, 'id'> = {
        uid: newUser.uid,
        name: values.name,
        email: values.email,
        role: values.role,
        accountStatus: 'Approved',
        rank: values.rank,
        baseSalary: values.baseSalary,
        totalSalary: values.baseSalary,
        attendanceRate: 100,
        daysAbsent: 0,
        workDays: values.workDays,
        startDate: values.startDate.toISOString(),
        jobDescription: values.jobDescription,
        fingerprintId: Math.floor(Math.random() * 1000),
      };

      await addDoc(collection(firestore, 'users'), userDoc);

      toast({
        title: t('addEmployee.success'),
        description: t('addEmployee.successDesc', { name: values.name }),
      });

      router.push('/employees');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('addEmployee.fail'),
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isUserLoading || currentUserLoading || !currentUser || currentUser.role !== 'Admin') {
    return <div className="flex h-screen items-center justify-center">{t('general.loading')}</div>;
  }

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
                <Link href="/clock-in" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                  <Clock className="h-5 w-5" />
                  {t('nav.clockIn')}
                </Link>
                <Link href="/employees" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground">
                  <Users className="h-5 w-5" />
                  {t('nav.employees')}
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
              <CardTitle>{t('addEmployee.title')}</CardTitle>
              <CardDescription>
                {t('addEmployee.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addEmployee.fullName')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addEmployee.email')}</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addEmployee.password')}</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rank" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addEmployee.rank')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="baseSalary" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addEmployee.baseSalary')}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('general.role')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Employee">Employee</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('addEmployee.startDate')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? (format(field.value, "PPP")) : (<span>{t('addEmployee.pickDate')}</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div />
                    <FormField control={form.control} name="jobDescription" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <div className='flex justify-between items-center'>
                          <FormLabel>{t('addEmployee.jobDescription')}</FormLabel>
                          <Button variant="link" size="sm" asChild><Link href="/job-description" target="_blank">{t('addEmployee.generateAi')}</Link></Button>
                        </div>
                        <FormControl><Textarea {...field} rows={6} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField
                    control={form.control}
                    name="workDays"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>{t('addEmployee.workDays')}</FormLabel>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                          {weekDays.map((day) => (
                            <FormField
                              key={day.id}
                              control={form.control}
                              name="workDays"
                              render={({ field }) => {
                                return (
                                  <FormItem key={day.id} className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, day.id])
                                            : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.id
                                              )
                                            )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {t('addEmployee.createButton')}
                    </Button>
                  </div>
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
