import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        let logDateFilter = {};
        if (dateStr) {
            const start = new Date(dateStr);
            const end = new Date(dateStr);
            end.setDate(end.getDate() + 1);
            logDateFilter = {
                timestamp: {
                    gte: start,
                    lt: end
                }
            };
        }

        // Fetch users who have attendance logs
        const users = await prisma.user.findMany({
            where: {
                attendanceLogs: {
                    some: logDateFilter
                }
            },
            include: {
                attendanceLogs: {
                    where: logDateFilter,
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        const data = users.map(u => ({
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            lat: u.attendanceLogs[0]?.lat || null,
            lng: u.attendanceLogs[0]?.lng || null,
            lastSeen: u.attendanceLogs[0]?.timestamp || null,
            status: u.attendanceLogs[0]?.status, // ACCEPTED/REJECTED
            riskLevel: u.attendanceLogs[0]?.riskLevel
        })).filter(u => u.lat && u.lng); // Only return users with location data

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching user locations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
