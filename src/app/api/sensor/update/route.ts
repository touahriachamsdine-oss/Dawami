import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { status, message, secret } = body;

        // Simple security check
        if (secret !== process.env.SENSOR_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        return NextResponse.json(sensor);
    } catch (error) {
        console.error("Error in sensor API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
