'use client';
import Link from 'next/link';
import {
  Menu,
  CircleUser,
  Users,
  Clock,
  CalendarIcon,
  Loader2,
  Fingerprint,
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
import React, { useEffect, useMemo, useState } from 'react';
import { startEnrollment, checkEnrollmentStatus } from '@/lib/actions/sensor-actions';
import { SALARY_GRID_2007, calculateBaseSalary2007, INDEX_POINT_VALUE_2007, EDUCATION_LEVELS, getEchelonFromExperience } from '@/lib/salary-scale';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rank: z.string().min(2, 'Rank is required.'),
  jobDescription: z.string().optional(),
  baseSalary: z.coerce.number().min(0, 'Salary must be a positive number.'),
  educationLevel: z.string().min(1, 'Education level is required.'),
  experienceYears: z.coerce.number().min(0),
  fingerprintId: z.coerce.number().optional(),
  cnasNumber: z.string().optional(),
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
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");

  const [calcCategory, setCalcCategory] = useState<string>("");
  const [calcEchelon, setCalcEchelon] = useState<string>("0");
  const [calcResult, setCalcResult] = useState<{ minIndex: number, echelonIndex: number, totalIndex: number, baseSalary: number } | null>(null);

  useEffect(() => {
    if (calcCategory) {
      const entry = SALARY_GRID_2007.find(e => e.category === calcCategory);
      if (entry) {
        const ech = parseInt(calcEchelon) || 0;
        const echIndex = ech > 0 ? entry.echelonIndices[ech - 1] || 0 : 0;
        const total = entry.minIndex + echIndex;
        const salary = total * INDEX_POINT_VALUE_2007;
        setCalcResult({
          minIndex: entry.minIndex,
          echelonIndex: echIndex,
          totalIndex: total,
          baseSalary: salary
        });
      }
    } else {
      setCalcResult(null);
    }
  }, [calcCategory, calcEchelon]);

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
      educationLevel: '',
      experienceYears: 0,
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

  const education = form.watch('educationLevel');
  const experience = form.watch('experienceYears');

  useEffect(() => {
    if (education) {
      const level = EDUCATION_LEVELS.find(l => l.id === education);
      if (level) {
        setCalcCategory(level.category);
        form.setValue('rank', level.suggestedRank);
      }
    }
  }, [education, form]);

  useEffect(() => {
    const ech = getEchelonFromExperience(experience || 0);
    setCalcEchelon(ech.toString());
  }, [experience]);

  useEffect(() => {
    if (calcResult) {
      form.setValue('baseSalary', calcResult.baseSalary);
    }
  }, [calcResult, form]);

  useEffect(() => {
    if (!isUserLoading && currentUser && currentUser.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [isUserLoading, currentUser, router]);

  // Fetch next ID automatically on mount
  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const response = await fetch('/api/sensor/next-id');
        const data = await response.json();
        if (data.nextId) {
          form.setValue('fingerprintId', data.nextId);
        }
      } catch (error) {
        console.error("Failed to fetch next fingerprint ID", error);
      }
    };
    fetchNextId();
  }, [form]);

  const handleEnrollment = async () => {
    let id = form.getValues('fingerprintId');

    // If no ID assigned yet, fetch it now
    if (!id) {
      try {
        const response = await fetch('/api/sensor/next-id');
        const data = await response.json();
        if (data.nextId) {
          id = data.nextId;
          form.setValue('fingerprintId', id);
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not auto-generate ID.", variant: "destructive" });
        return;
      }
    }

    setIsEnrolling(true);
    setEnrollmentMessage("Requesting sensor...");

    // Start enrollment on backend
    await startEnrollment(id);

    // Poll for status
    const interval = setInterval(async () => {
      const status = await checkEnrollmentStatus();
      setEnrollmentMessage(status.message || "Initializing...");

      if (!status.active) {
        clearInterval(interval);
        setIsEnrolling(false);
        setEnrollmentMessage("");
        toast({ title: "Enrollment Finished", description: status.message || "Process complete." });
      }
    }, 1500);
  };

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
        fingerprintId: values.fingerprintId || (Math.floor(Math.random() * 126) + 1), // Limit to 1-127 range for most sensors
        cnasNumber: values.cnasNumber,
        educationLevel: values.educationLevel,
        experienceYears: values.experienceYears,
        category: calcCategory,
        echelon: parseInt(calcEchelon) || 0,
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
                    <div className="space-y-4">
                      <FormField control={form.control} name="educationLevel" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addEmployee.educationLevel')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EDUCATION_LEVELS.map(level => (
                                <SelectItem key={level.id} value={level.id}>{level.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="experienceYears" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addEmployee.experienceYears')}</FormLabel>
                          <FormControl><Input type="number" min={0} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <Card className="bg-primary/5 border-primary/20 border">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center justify-between">
                            {t('addEmployee.salaryCalculator.title')}
                            {calcResult && <span className="text-primary">{calcResult.baseSalary.toLocaleString()} DA</span>}
                          </CardTitle>
                        </CardHeader>
                        {calcResult && (
                          <CardContent className="grid gap-2 py-3 px-4 pt-0 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('addEmployee.salaryCalculator.category')}</span>
                              <span className="font-mono bg-muted px-1 rounded">{calcCategory}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('addEmployee.salaryCalculator.echelon')}</span>
                              <span className="font-mono bg-muted px-1 rounded">{calcEchelon}</span>
                            </div>
                            <div className="flex justify-between mt-1 border-t pt-1">
                              <span className="text-muted-foreground">{t('addEmployee.salaryCalculator.totalIndex')}</span>
                              <span className="font-mono">{calcResult.totalIndex}</span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                    <FormField control={form.control} name="fingerprintId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between items-center">
                          Fingerprint ID
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">Automated</span>
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input type="number" placeholder="Auto-assigning..." {...field} readOnly className="bg-muted/50 cursor-not-allowed" />
                          </FormControl>
                          <Button
                            type="button"
                            size="icon"
                            variant={isEnrolling ? "destructive" : "default"}
                            onClick={handleEnrollment}
                            disabled={isEnrolling}
                          >
                            {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                          </Button>
                        </div>
                        {isEnrolling && <p className="text-xs text-orange-500 font-medium animate-pulse">{enrollmentMessage}</p>}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cnasNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNAS Number</FormLabel>
                        <FormControl><Input placeholder="XXXXXXXX" {...field} /></FormControl>
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
