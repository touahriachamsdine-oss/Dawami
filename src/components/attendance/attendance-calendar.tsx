
'use client';

import { useState } from 'react';
import { DayPicker, DayModifiers } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Attendance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arDZ, fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/lib/language-provider';

type AttendanceCalendarProps = {
  attendance: Attendance[];
  workDays?: number[];
  t: (key: string) => string;
};

export function AttendanceCalendar({ attendance, workDays = [1, 2, 3, 4, 5], t }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { language } = useLanguage();

  const locales = {
    ar: arDZ,
    fr: fr,
    en: enUS
  };

  const statusToModifier = (status: Attendance['status']) => {
    switch (status) {
      case 'Present':
        return 'present';
      case 'Late':
        return 'late';
      case 'Absent':
        return 'absent';
      case 'On Leave':
        return 'onLeave';
      default:
        return '';
    }
  };

  const attendanceByDate = attendance.reduce((acc, record) => {
    const date = new Date(record.date + 'T00:00:00');
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(record);
    return acc;
  }, {} as Record<string, Attendance[]>);

  const modifiers: DayModifiers = {
    present: [],
    late: [],
    absent: [],
    onLeave: [],
    nonWorkDay: (day: Date) => !workDays.includes(day.getDay()),
  };

  for (const dateStr in attendanceByDate) {
    const records = attendanceByDate[dateStr];
    const date = new Date(dateStr + 'T00:00:00');
    for (const record of records) {
      const modifier = statusToModifier(record.status);
      if (modifier && Array.isArray(modifiers[modifier])) {
        (modifiers[modifier] as Date[]).push(date);
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DayPicker
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={locales[language as keyof typeof locales] || enUS}
            modifiers={modifiers}
            modifiersClassNames={{
              present: 'bg-green-200/50 dark:bg-green-800/30 text-green-800 dark:text-green-200',
              late: 'bg-yellow-200/50 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200',
              absent: 'bg-red-200/50 dark:bg-red-800/30 text-red-800 dark:text-red-200',
              onLeave: 'bg-blue-200/50 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200',
              nonWorkDay: 'text-muted-foreground/50 font-normal opacity-50',
              today: 'bg-accent/50',
            }}
            components={{
              DayContent: (props) => {
                const dateStr = format(props.date, 'yyyy-MM-dd');
                const records = attendanceByDate[dateStr];
                return (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <span>{props.date.getDate()}</span>
                    {records && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {records.map(r => (
                          <div key={r.id} className={cn('h-1 w-1 rounded-full', {
                            'bg-green-500': r.status === 'Present',
                            'bg-yellow-500': r.status === 'Late',
                            'bg-red-500': r.status === 'Absent',
                            'bg-blue-500': r.status === 'On Leave',
                          })} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{t('attendance.present')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>{t('attendance.late')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>{t('attendance.absent')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>{t('attendance.onLeave')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-muted/50" />
            <span className="text-sm">{t('attendance.nonWorkDay')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
