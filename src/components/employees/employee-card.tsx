'use client';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DataTableRowActions } from './data-table-row-actions';
import { Card } from '../ui/card';

interface EmployeeCardProps {
  user: User;
  t: (key: string) => string;
}

export function EmployeeCard({ user, t }: EmployeeCardProps) {
  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(user.baseSalary);

  return (
    <Card className="mb-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person face" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DataTableRowActions row={{ original: user }} t={t} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{t('general.rank')}</p>
          <p>{user.rank}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('general.baseSalary')}</p>
          <p>{formattedSalary}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('dashboard.attendanceRate')}</p>
          <p>{user.attendanceRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('general.role')}</p>
          <div>
            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
