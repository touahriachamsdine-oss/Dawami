
export const MOCK_USERS = [
  {
    uid: 'admin-1',
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@solminder.com',
    role: 'Admin',
    rank: 'Manager',
    baseSalary: 5000,
    totalSalary: 5000,
    attendanceRate: 100,
    daysAbsent: 0,
    accountStatus: 'Approved',
    fingerprintId: 1
  },
  {
    uid: 'emp-1',
    id: 'emp-1',
    name: 'John Doe',
    email: 'john@solminder.com',
    role: 'Employee',
    rank: 'Developer',
    baseSalary: 3000,
    totalSalary: 3000,
    attendanceRate: 95,
    daysAbsent: 1,
    accountStatus: 'Approved',
    fingerprintId: 101,
    workDays: [1, 2, 3, 4, 5]
  },
  {
    uid: 'emp-2',
    id: 'emp-2',
    name: 'Jane Smith',
    email: 'jane@solminder.com',
    role: 'Employee',
    rank: 'Designer',
    baseSalary: 3200,
    totalSalary: 3200,
    attendanceRate: 98,
    daysAbsent: 0,
    accountStatus: 'Approved',
    fingerprintId: 102,
    workDays: [1, 2, 3, 4, 5]
  }
];

export const MOCK_ATTENDANCE = [
  {
    id: 'att-1',
    userId: 'emp-1',
    userName: 'John Doe',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 },
  }
];

export const MOCK_SETTINGS = [
  {
    id: 'default',
    payCutRate: 10,
    companyName: 'Solminder Inc.',
    companyAddress: '123 Tech Lane, Silicon Valley'
  }
];
