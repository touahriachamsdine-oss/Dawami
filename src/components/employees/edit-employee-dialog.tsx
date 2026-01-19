'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useEffect, useState } from 'react';
import { startEnrollment, checkEnrollmentStatus } from '@/lib/actions/sensor-actions';
import { Loader2, Fingerprint } from 'lucide-react';
import { SALARY_GRID_2007, calculateBaseSalary2007, INDEX_POINT_VALUE_2007, EDUCATION_LEVELS, getEchelonFromExperience } from '@/lib/salary-scale';
import { useFirebase, updateDoc, doc } from '@/db';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  rank: z.string().min(2, 'Rank is required.'),
  nationalId: z.string().optional(),
  cnasNumber: z.string().optional(),
  birthDate: z.date().optional(),
  maritalStatus: z.string().optional(),
  childrenCount: z.coerce.number().min(0).optional(),
  phoneNumber: z.string().optional(),
  baseSalary: z.coerce.number().min(0, 'Salary must be a positive number.'),
  educationLevel: z.string().min(1, 'Education level is required.'),
  experienceYears: z.coerce.number().min(0),
  fingerprintId: z.coerce.number().min(1).max(127).optional(),
  role: z.enum(['Admin', 'Employee']),
  workDays: z.array(z.number()).min(1, "Employee must work at least one day"),
});

type EditEmployeeDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
  t: (key: string) => string;
};

export function EditEmployeeDialog({
  isOpen,
  setIsOpen,
  user,
  t
}: EditEmployeeDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState("");

  const weekDays = useMemo(() => [
    { id: 0, label: t('addEmployee.days.sun') },
    { id: 1, label: t('addEmployee.days.mon') },
    { id: 2, label: t('addEmployee.days.tue') },
    { id: 3, label: t('addEmployee.days.wed') },
    { id: 4, label: t('addEmployee.days.thu') },
    { id: 5, label: t('addEmployee.days.fri') },
    { id: 6, label: t('addEmployee.days.sat') },
  ], [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      rank: user.rank,
      fingerprintId: user.fingerprintId,
      nationalId: user.nationalId,
      cnasNumber: user.cnasNumber,
      // birthDate: user.birthDate ? new Date(user.birthDate) : undefined,
      maritalStatus: user.maritalStatus,
      childrenCount: user.childrenCount,
      phoneNumber: user.phoneNumber,
      baseSalary: user.baseSalary,
      educationLevel: user.educationLevel || '',
      experienceYears: user.experienceYears || 0,
      role: user.role,
      workDays: user.workDays || [1, 2, 3, 4, 5],
    },
  });

  const [calcCategory, setCalcCategory] = useState<string>("");
  const [calcEchelon, setCalcEchelon] = useState<string>("0");
  const [calcResult, setCalcResult] = useState<{ minIndex: number, echelonIndex: number, totalIndex: number, baseSalary: number } | null>(null);

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
    }
  }, [calcCategory, calcEchelon]);

  useEffect(() => {
    if (calcResult) {
      form.setValue('baseSalary', calcResult.baseSalary);
    }
  }, [calcResult, form]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        rank: user.rank,
        fingerprintId: user.fingerprintId,
        nationalId: user.nationalId,
        cnasNumber: user.cnasNumber,
        // birthDate: user.birthDate ? new Date(user.birthDate) : undefined, 
        maritalStatus: user.maritalStatus,
        childrenCount: user.childrenCount,
        phoneNumber: user.phoneNumber,
        baseSalary: user.baseSalary,
        educationLevel: user.educationLevel || '',
        experienceYears: user.experienceYears || 0,
        role: user.role,
        workDays: user.workDays || [1, 2, 3, 4, 5],
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, 'users', user.id || '');
      await updateDoc(userRef, {
        name: values.name,
        email: values.email,
        rank: values.rank,
        fingerprintId: values.fingerprintId,
        nationalId: values.nationalId,
        cnasNumber: values.cnasNumber,
        maritalStatus: values.maritalStatus,
        childrenCount: values.childrenCount,
        phoneNumber: values.phoneNumber,
        baseSalary: values.baseSalary,
        totalSalary: values.baseSalary, // Simplified: sync total with base for now
        educationLevel: values.educationLevel,
        experienceYears: values.experienceYears,
        category: calcCategory,
        echelon: parseInt(calcEchelon) || 0,
        role: values.role,
        workDays: values.workDays,
      });

      toast({
        title: t('employees.updated'),
        description: t('employees.updatedDesc').replace('{name}', values.name),
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating.',
      });
    }
  };

  const handleEnrollment = async () => {
    let id = form.getValues('fingerprintId');

    // If no ID provided, fetch the next available one
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('employees.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('employees.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.rank')}</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="educationLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addEmployee.educationLevel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
            </div>

            <Card className="bg-primary/5 border-primary/20 border">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  {t('addEmployee.salaryCalculator.title')}
                  {calcResult && <span className="text-primary">{calcResult.baseSalary.toLocaleString()} DA</span>}
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fingerprintId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fingerprint ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1" {...field} readOnly className="bg-muted/50 cursor-not-allowed" />
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
                )}
              />
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnasNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNAS Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="childrenCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Children Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDays"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>{t('addEmployee.workDays')}</FormLabel>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {weekDays.map((day) => (
                      <FormField
                        key={day.id}
                        control={form.control}
                        name="workDays"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.id}
                              className="flex flex-row items-center space-x-2 space-y-0"
                            >
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('employees.cancel')}</Button>
              <Button type="submit">{t('employees.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
