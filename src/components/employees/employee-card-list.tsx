'use client';

import { User } from '@/lib/types';
import { EmployeeCard } from './employee-card';

interface EmployeeCardListProps {
  users: User[];
  t: (key: string) => string;
}

export function EmployeeCardList({ users, t }: EmployeeCardListProps) {
  if (users.length === 0) {
    return <p className="text-center text-muted-foreground">{t('employees.noResults')}</p>;
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <EmployeeCard key={user.uid} user={user} t={t} />
      ))}
    </div>
  );
}
