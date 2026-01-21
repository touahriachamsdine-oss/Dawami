'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDevice(id: string, data: {
    name?: string;
    allowedLat?: number;
    allowedLng?: number;
    allowedRadius?: number;
}) {
    try {
        await prisma.device.update({
            where: { id },
            data: {
                name: data.name,
                allowedLat: data.allowedLat,
                allowedLng: data.allowedLng,
                allowedRadius: data.allowedRadius
            }
        });
        revalidatePath('/live-map');
        return { success: true };
    } catch (error) {
        console.error("Failed to update device:", error);
        return { success: false, error: "Failed to update device" };
    }
}
