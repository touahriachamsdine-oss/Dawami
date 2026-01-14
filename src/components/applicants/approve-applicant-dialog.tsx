
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
import { useToast } from '@/hooks/use-toast';
import { useFirebase, doc, updateDoc } from '@/db';

const formSchema = z.object({
  rank: z.string().min(2, 'Rank is required.'),
  baseSalary: z.coerce.number().min(0, 'Salary must be a positive number.'),
  role: z.enum(['Admin', 'Employee']),
});

type ApproveApplicantDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applicant: User;
  t: (key: string) => string;
};

export function ApproveApplicantDialog({
  isOpen,
  setIsOpen,
  applicant,
  t
}: ApproveApplicantDialogProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rank: applicant.rank !== 'N/A' ? applicant.rank : '',
      baseSalary: applicant.baseSalary,
      role: applicant.role,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const applicantRef = doc(firestore, 'users', applicant.id); // Use Firestore ID
      await updateDoc(applicantRef, {
        ...values,
        accountStatus: 'Approved',
        totalSalary: values.baseSalary,
      });

      toast({
        title: t('applicants.approved'),
        description: t('applicants.approvedDesc').replace('{name}', applicant.name),
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('applicants.approveTitle').replace('{name}', applicant.name)}</DialogTitle>
          <DialogDescription>
            {t('applicants.approveDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('employees.cancel')}</Button>
              <Button type="submit">{t('applicants.approveButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
