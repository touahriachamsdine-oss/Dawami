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
