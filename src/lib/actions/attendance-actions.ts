'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAttendances() {
    const attendances = await prisma.attendance.findMany({
        include: {
            user: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return attendances.map((att: any) => ({
        ...att,
        userName: att.user?.name || 'Unknown',
        userAvatarUrl: att.user?.avatarUrl || null,
    }));
}


export async function createAttendance(data: { userId: string, date: string, status: any, checkInTime?: any }) {
    // Handle mock timestamps
    const checkInTime = data.checkInTime?.__mockTimestamp
        ? new Date(data.checkInTime.seconds * 1000)
        : (data.checkInTime instanceof Date ? data.checkInTime : null);

    const attendance = await prisma.attendance.create({
        data: {
            user: { connect: { uid: data.userId } },
            date: data.date,
            status: data.status,
            checkInTime: checkInTime,
        },
    });
    revalidatePath('/attendance');
    return attendance;
}


export async function updateAttendance(id: string, data: any) {
    const attendance = await prisma.attendance.update({
        where: { id },
        data,
    });
    revalidatePath('/attendance');
    return attendance;
}
