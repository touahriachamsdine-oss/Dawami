
import type { User, Attendance, Salary } from './types';

export const mockAdminUser: User = {
  uid: 'admin001',
  name: 'Admin User',
  email: 'Admin@gmail.com',
  avatarUrl: 'https://picsum.photos/seed/1/100/100',
  role: 'Admin',
  rank: 'HR Manager',
  baseSalary: 10000,
  totalSalary: 9800,
  attendanceRate: 98,
  daysAbsent: 1,
  workDays: [1, 2, 3, 4, 5],
  accountStatus: 'Approved',
};

export const mockUsers: User[] = [
  {
    uid: 'emp001',
    name: 'Olivia Martin',
    email: 'olivia.martin@example.com',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    role: 'Employee',
    rank: 'Senior Developer',
    baseSalary: 8000,
    totalSalary: 8000,
    attendanceRate: 100,
    daysAbsent: 0,
    workDays: [1, 2, 3, 4, 5],
    accountStatus: 'Approved',
  },
  {
    uid: 'emp002',
    name: 'Liam Anderson',
    email: 'liam.anderson@example.com',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    role: 'Employee',
    rank: 'Product Manager',
    baseSalary: 9500,
    totalSalary: 9181,
    attendanceRate: 96,
    daysAbsent: 2,
    workDays: [1, 2, 3, 4], // Works 4 days
    accountStatus: 'Approved',
  },
  {
    uid: 'emp003',
    name: 'Sophia Williams',
    email: 'sophia.williams@example.com',
    avatarUrl: 'https://picsum.photos/seed/4/100/100',
    role: 'Employee',
    rank: 'UI/UX Designer',
    baseSalary: 7200,
    totalSalary: 7200,
    attendanceRate: 100,
    daysAbsent: 0,
    workDays: [1, 2, 3, 4, 5],
    accountStatus: 'Approved',
  },
  {
    uid: 'emp004',
    name: 'Noah Brown',
    email: 'noah.brown@example.com',
    avatarUrl: 'https://picsum.photos/seed/5/100/100',
    role: 'Employee',
    rank: 'Junior Developer',
    baseSalary: 5500,
    totalSalary: 5000,
    attendanceRate: 91,
    daysAbsent: 4,
    workDays: [1, 3, 5], // Works 3 days
    accountStatus: 'Approved',
  },
  {
    uid: 'emp005',
    name: 'Isabella Jones',
    email: 'isabella.jones@example.com',
    avatarUrl: 'https://picsum.photos/seed/6/100/100',
    role: 'Employee',
    rank: 'QA Engineer',
    baseSalary: 6800,
    totalSalary: 6800,
    attendanceRate: 100,
    daysAbsent: 0,
    workDays: [1, 2, 3, 4, 5],
    accountStatus: 'Approved',
  },
];

export const mockRecentAttendance: Attendance[] = [
    { id: 'att1', userId: 'emp002', userName: 'Liam Anderson', userAvatarUrl: 'https://picsum.photos/seed/3/100/100', date: '2024-07-29', checkInTime: '09:15', status: 'Late' },
    { id: 'att2', userId: 'emp004', userName: 'Noah Brown', userAvatarUrl: 'https://picsum.photos/seed/5/100/100', date: '2024-07-29', status: 'Absent' },
    { id: 'att3', userId: 'emp001', userName: 'Olivia Martin', userAvatarUrl: 'https://picsum.photos/seed/2/100/100', date: '2024-07-29', checkInTime: '08:55', status: 'Present' },
    { id: 'att4', userId: 'emp003', userName: 'Sophia Williams', userAvatarUrl: 'https://picsum.photos/seed/4/100/100', date: '2024-07-28', status: 'On Leave' },
];

export const mockSalaryData: Salary[] = [
    { month: 'Jan', baseSalary: 8000, deductions: 200, netSalary: 7800 },
    { month: 'Feb', baseSalary: 8000, deductions: 0, netSalary: 8000 },
    { month: 'Mar', baseSalary: 8000, deductions: 150, netSalary: 7850 },
    { month: 'Apr', baseSalary: 8200, deductions: 0, netSalary: 8200 },
    { month: 'May', baseSalary: 8200, deductions: 300, netSalary: 7900 },
    { month: 'Jun', baseSalary: 8200, deductions: 50, netSalary: 8150 },
];

