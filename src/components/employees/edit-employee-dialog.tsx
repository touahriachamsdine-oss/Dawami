'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
      role: user.role,
      workDays: user.workDays || [1, 2, 3, 4, 5],
    },
  });

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
        role: user.role,
        workDays: user.workDays || [1, 2, 3, 4, 5],
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Updated user data:', values);
    toast({
      title: t('employees.updated'),
      description: t('employees.updatedDesc').replace('{name}', values.name),
    })
    setIsOpen(false);
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
          toast({ title: "Auto-ID Assigned", description: `Assigned next available ID: ${id}` });
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not auto-generate ID. Please enter one manually.", variant: "destructive" });
        return;
      }
    }

    if (!id) {
      toast({ title: "Error", description: "Please enter a Fingerprint ID to enroll to.", variant: "destructive" });
      return;
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
      <DialogContent className="sm:max-w-md">
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.baseSalary')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fingerprintId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fingerprint ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1" {...field} />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
