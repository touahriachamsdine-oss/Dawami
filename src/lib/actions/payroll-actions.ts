'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPayrollRecords(month: string) {
    try {
        const records = await prisma.payrollRecord.findMany({
            where: { month },
            include: {
                user: true,
            },
        });
        return records;
    } catch (error) {
        console.error('Error fetching payroll records:', error);
        return [];
    }
}

export async function upsertPayrollRecord(data: any) {
    try {
        const { id, userId, month, ...rest } = data;

        if (id) {
            await prisma.payrollRecord.update({
                where: { id },
                data: rest,
            });
        } else {
            await prisma.payrollRecord.upsert({
                where: {
                    userId_month: {
                        userId,
                        month,
                    },
                },
                update: rest,
                create: {
                    userId,
                    month,
                    ...rest,
                },
            });
        }

        revalidatePath('/admin/payroll');
        return { success: true };
    } catch (error) {
        console.error('Error upserting payroll record:', error);
        return { success: false, error: String(error) };
    }
}

export async function deletePayrollRecord(id: string) {
    try {
        await prisma.payrollRecord.delete({
            where: { id },
        });
        revalidatePath('/admin/payroll');
        return { success: true };
    } catch (error) {
        console.error('Error deleting payroll record:', error);
        return { success: false, error: String(error) };
    }
}

export async function getEmployeesForPayroll() {
    try {
        return await prisma.user.findMany({
            where: {
                accountStatus: 'Approved',
                role: { not: 'Admin' } // Usually admins might not be on the same payroll grid, but let's see
            },
            select: {
                id: true,
                name: true,
                rank: true,
                baseSalary: true, // This is usually the contracted base
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
    }
}
