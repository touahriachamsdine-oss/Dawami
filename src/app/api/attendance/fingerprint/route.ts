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

        // Efficient Logic: Get the MOST RECENT attendance record for today
        const lastRecord = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                date: todayStr
            },
            orderBy: {
                createdAt: 'desc'
            } // Get the latest one
        });

        let attendance;
        let message = "";
        const now = new Date();
        const DEBOUNCE_SECONDS = 30; // Prevent double-scans within 30 seconds

        // Helper to check time difference
        const isTooSoon = (time: Date) => (now.getTime() - new Date(time).getTime()) < (DEBOUNCE_SECONDS * 1000);

        if (!lastRecord || lastRecord.checkOutTime) {
            // Case 1: No record yet, OR the last session is closed (Clocked Out).
            // Action: Start NEW Session (Clock In)

            // Anti-bounce: Check if we just clocked out (if lastRecord exists)
            if (lastRecord && lastRecord.checkOutTime && isTooSoon(lastRecord.checkOutTime)) {
                return NextResponse.json({ message: "Ignored (Too soon)", user: user.name });
            }

            attendance = await prisma.attendance.create({
                data: {
                    userId: user.id,
                    date: todayStr,
                    checkInTime: now,
                    status: 'Present'
                }
            });
            message = `Welcome In, ${user.name}!`;

        } else {
            // Case 2: Last record is Open (No CheckOut).
            // Action: Close Session (Clock Out)

            // Anti-bounce: Check if we just clocked in
            if (lastRecord.checkInTime && isTooSoon(lastRecord.checkInTime)) {
                return NextResponse.json({ message: "Ignored (Too soon)", user: user.name });
            }

            attendance = await prisma.attendance.update({
                where: { id: lastRecord.id },
                data: { checkOutTime: now }
            });
            message = `Goodbye, ${user.name}!`;
        }

        revalidatePath('/dashboard');
        revalidatePath('/attendance');

        return NextResponse.json({ message: message, user: user.name, attendance });
    } catch (error) {
        console.error("Error in fingerprint API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
