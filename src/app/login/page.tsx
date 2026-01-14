'use client';
import Link from 'next/link';
import { AtProfitLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirebase, signInWithEmailAndPassword } from '@/db';
import { useEffect } from 'react';

const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, user, isUserLoading } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isUserLoading || user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-background font-sans min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-sm aspect-[9/19.5] bg-card dark:bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center border-[8px] border-muted dark:border-slate-800">
        <div className="w-full h-10 flex justify-between items-center px-8 pt-2">
          <span className="text-xs font-semibold dark:text-white">9:41</span>
          <div className="flex gap-1 items-center">
            <span className="material-symbols-outlined text-[16px] dark:text-white">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[16px] dark:text-white">wifi</span>
            <span className="material-symbols-outlined text-[16px] dark:text-white font-bold">battery_full</span>
          </div>
        </div>

        <div className="flex-1 w-full px-8 py-12 flex flex-col items-center justify-between">
          <div className="w-full flex flex-col items-center mt-4">
            <div className="w-48 h-32 bg-secondary rounded-2xl flex items-center justify-center overflow-hidden mb-8 shadow-xl">
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <span className="text-white text-3xl font-bold tracking-tight">Dawami</span>
                <div className="absolute bottom-2 right-2 w-16 h-1 bg-accent-lime opacity-50 blur-sm transform rotate-[-15deg]"></div>
              </div>
            </div>
            <p className="font-serif italic text-lg text-muted-foreground text-center leading-relaxed">
              &quot;Confirmed commitment and <br /> appreciated effort.&quot;
            </p>
          </div>

          <div className="w-full flex flex-col gap-5 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="relative group">
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">person</span>
                          </div>
                          <Input
                            className="w-full pl-12 pr-4 py-6 rounded-full bg-slate-50 dark:bg-slate-800/50 border-none shadow-inner dark:text-white focus-visible:ring-2 focus-visible:ring-primary/20 transition-all outline-none text-sm font-sans placeholder:text-slate-400"
                            placeholder="Email Address"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="px-4 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative group">
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-xl">lock</span>
                          </div>
                          <Input
                            type="password"
                            className="w-full pl-12 pr-4 py-6 rounded-full bg-slate-50 dark:bg-slate-800/50 border-none shadow-inner dark:text-white focus-visible:ring-2 focus-visible:ring-primary/20 transition-all outline-none text-sm font-sans placeholder:text-slate-400"
                            placeholder="Password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="px-4 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="w-full flex flex-col items-center gap-6 pb-4">
                  <Button
                    type="submit"
                    className="w-full py-6 rounded-full bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                  >
                    Login
                  </Button>
                  <Link href="/signup" className="text-xs text-muted-foreground hover:text-primary transition-colors font-sans">
                    Don&apos;t have an account? Sign up
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
        <div className="w-32 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-2"></div>
      </div>
    </div>
  )
}
