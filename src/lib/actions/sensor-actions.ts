'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSensorStatus() {
    try {
        let sensor = await prisma.sensorStatus.findUnique({
            where: { id: 'default' }
        });

        if (!sensor) {
            sensor = await prisma.sensorStatus.create({
                data: {
                    id: 'default',
                    status: 'Offline',
                    message: 'Sensor system initialized.'
                }
            });
        }

        return sensor;
    } catch (error) {
        console.error('Error fetching sensor status:', error);
        return { status: 'Error', message: 'Could not fetch sensor status.' };
    }
}

export async function updateSensorStatus(status: string, message?: string) {
    try {
        const sensor = await prisma.sensorStatus.upsert({
            where: { id: 'default' },
            update: {
                status,
                message,
                lastSeen: new Date()
            },
            create: {
                id: 'default',
                status,
                message,
                lastSeen: new Date()
            }
        });

        revalidatePath('/dashboard'); // Or wherever it might be used
        return sensor;
    } catch (error) {
        console.error('Error updating sensor status:', error);
        throw error;
    }
}
// ... existing exports ...

export async function startEnrollment(targetId: number) {
    try {
        await prisma.sensorStatus.upsert({
            where: { id: 'default' },
            update: {
                enrollmentMode: true,
                enrollmentTargetId: targetId,
                message: `Waiting for sensor to enroll ID #${targetId}...`
            },
            create: {
                id: 'default',
                status: 'Online',
                enrollmentMode: true,
                enrollmentTargetId: targetId,
                message: `Waiting for sensor to enroll ID #${targetId}...`
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error starting enrollment:", error);
        return { success: false, error };
    }
}

export async function checkEnrollmentStatus() {
    try {
        const sensor = await prisma.sensorStatus.findUnique({
            where: { id: 'default' }
        });

        // If enrollmentMode is false, it means the process finished (either success or cancelled/timeout)
        // We assume the ESP32 sets it to false upon completion
        return {
            active: sensor?.enrollmentMode || false,
            message: sensor?.message
        };
    } catch (error) {
        return { active: false, message: "Error checking status" };
    }
}

export async function cancelEnrollment() {
    try {
        await prisma.sensorStatus.update({
            where: { id: 'default' },
            data: {
                enrollmentMode: false,
                enrollmentTargetId: null,
                message: "Enrollment cancelled."
            }
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
