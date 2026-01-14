import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fingerprintId, secret } = body;

        if (secret !== process.env.SENSOR_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find user by fingerprintId
        const user = await prisma.user.findFirst({
            where: { fingerprintId: parseInt(fingerprintId) }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Check if already clocked in
        const existing = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                date: todayStr
            }
        });

        if (existing) {
            return NextResponse.json({ message: "Already clocked in", user: user.name });
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId: user.id,
                date: todayStr,
                checkInTime: new Date(),
                status: 'Present'
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/attendance');

        return NextResponse.json({ message: "Success", user: user.name, attendance });
    } catch (error) {
        console.error("Error in fingerprint API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
