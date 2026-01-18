
export type User = {
  uid: string;
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Admin' | 'Employee';
  rank: string;
  baseSalary: number;
  totalSalary: number;
  attendanceRate: number;
  daysAbsent: number;
  workDays?: number[]; // 0 for Sunday, 6 for Saturday
  accountStatus: 'Pending' | 'Approved' | 'Rejected';
  startDate?: string;
  jobDescription?: string;
  fingerprintId?: number;
  nationalId?: string;
  birthDate?: string;
  maritalStatus?: string;
  childrenCount?: number;
  phoneNumber?: string;
  cnasNumber?: string;
};

export type Attendance = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  date: string;
  checkInTime?: any; // Can be a server timestamp or Date
  checkOutTime?: any; // Can be a server timestamp or Date
  status: 'Present' | 'Absent' | 'Late' | 'On Leave';
  createdAt?: any;
};

export type Salary = {
  month: string;
  baseSalary: number;
  deductions: number;
  netSalary: number;
};

export type Setting = {
  id: string;
  payCutRate: number;
  companyName: string;
  companyAddress: string;
}


