'use client';
import { AtProfitLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/db';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const { auth } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader>
          <div className="flex justify-center items-center mb-4">
            <AtProfitLogo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Approval Pending</CardTitle>
          <CardDescription>
            Your account has been created successfully, but it is currently pending approval from an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>Please check back later. You will not be able to access the application until your account has been approved.</p>
          <Button onClick={handleLogout}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
