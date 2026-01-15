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

        // Advanced Attendance Logic (Clock In -> Out -> In -> Out)
        let attendance = existing;
        let message = "";

        if (!existing) {
            // 1. First Clock In (Start Day)
            attendance = await prisma.attendance.create({
                data: {
                    userId: user.id,
                    date: todayStr,
                    checkInTime: new Date(),
                    status: 'Present'
                }
            });
            message = `Welcome, ${user.name}!`;
        } else if (existing.checkInTime && !existing.checkOutTime) {
            // 2. Currently In -> Clock Out (Break/Home)
            attendance = await prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOutTime: new Date() }
            });
            message = `Goodbye, ${user.name}!`;
        } else if (existing.checkInTime && existing.checkOutTime) {
            // 3. Currently Out -> Clock In Again (Return from Break)
            // *Note: Simple schema only supports one pair. To support multiple, we Reset CheckOut or create a new record.
            // For simplicity in this version, we will toggle CheckOut to null to indicate "Back In".
            attendance = await prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOutTime: null } // Resetting checkout means they are "In" again
            });
            message = `Welcome back, ${user.name}!`;
        }

        revalidatePath('/dashboard');
        revalidatePath('/attendance');

        return NextResponse.json({ message: message, user: user.name, attendance });
    } catch (error) {
        console.error("Error in fingerprint API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
