'use client';
import { useLanguage } from '@/lib/language-provider';
import { Activity, DollarSign, Fingerprint, Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type BottomNavBarProps = {
  userRole?: 'Admin' | 'Employee';
};

export function BottomNavBar({ userRole }: BottomNavBarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Home },
    { href: '/attendance', label: t('nav.attendance'), icon: Activity },
    { href: '/employees', label: t('nav.employees'), icon: Users },
    { href: '/payroll', label: t('nav.payroll'), icon: DollarSign },
    { href: '/sensor', label: t('nav.sensor'), icon: Fingerprint },
  ];

  const itemsToShow = navItems.length;


  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto pointer-events-none z-50 md:hidden">
      <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20 pointer-events-auto active:scale-90 transition-transform ring-4 ring-slate-50">
        <span className="material-symbols-outlined text-4xl font-bold">add</span>
      </div>
      <div className="absolute bottom-0 w-full h-24 nav-curve pointer-events-auto shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"></div>
      <nav className="absolute bottom-0 w-full h-20 flex items-center justify-around px-2 z-10 pointer-events-auto">
        <div className="flex w-1/2 justify-around pr-4">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-white/40'}`} href={item.href}>
                <item.icon className="w-6 h-6" />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex w-1/2 justify-around pl-4">
          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-white/40'}`} href={item.href}>
                <item.icon className="w-6 h-6" />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
