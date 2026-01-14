'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    const users = await prisma.user.findMany();

    return users.map((u: any) => ({
        ...u,
        workDays: typeof u.workDays === 'string'
            ? u.workDays.split(',').filter(Boolean).map(Number)
            : (Array.isArray(u.workDays) ? u.workDays : [])
    }));

}

export async function getUserByUid(uid: string) {
    const user = await prisma.user.findUnique({
        where: { uid },
    });
    if (!user) return null;
    return {
        ...user,
        workDays: typeof user.workDays === 'string'
            ? user.workDays.split(',').filter(Boolean).map(Number)
            : (Array.isArray(user.workDays) ? user.workDays : [])
    };
}



export async function createUser(data: any) {
    const user = await prisma.user.create({
        data: {
            ...data,
            workDays: Array.isArray(data.workDays) ? data.workDays.join(',') : '',
        },
    });
    revalidatePath('/employees');
    return user;
}

export async function updateUser(uid: string, data: any) {
    const updateData = { ...data };
    if (data.workDays && Array.isArray(data.workDays)) {
        updateData.workDays = data.workDays.join(',');
    }
    const user = await prisma.user.update({
        where: { uid },
        data: updateData,
    });
    revalidatePath('/employees');
    revalidatePath(`/profile`);
    return user;
}


export async function deleteUser(uid: string) {
    await prisma.user.delete({
        where: { uid },
    });
    revalidatePath('/employees');
}
