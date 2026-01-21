import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        let dateFilter = {};
        if (dateStr) {
            const start = new Date(dateStr);
            const end = new Date(dateStr);
            end.setDate(end.getDate() + 1);
            dateFilter = {
                timestamp: {
                    gte: start,
                    lt: end
                }
            };
        }

        // Fetch devices and their relevant location log
        // If specific date, we want the LAST log of that day.
        const devices = await prisma.device.findMany({
            include: {
                locationLogs: {
                    where: dateFilter,
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                },
                attendances: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true }
                }
            }
        });

        const data = devices.map(d => ({
            id: d.id,
            deviceId: d.deviceId,
            name: d.name,
            status: d.status,
            lastSeen: d.lastSeen,
            lat: d.locationLogs[0]?.lat || null,
            lng: d.locationLogs[0]?.lng || null,
            lastUser: d.attendances[0]?.user?.name || "None",
            allowedLat: d.allowedLat,
            allowedLng: d.allowedLng,
            allowedRadius: d.allowedRadius
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching device locations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
