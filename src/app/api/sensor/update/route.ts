import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { status, message, secret, lat, lng, deviceId } = body;

        // V2: Location Logging
        if (deviceId) {
            // Update device status
            await prisma.device.upsert({
                where: { deviceId },
                update: {
                    status: 'Online',
                    lastSeen: new Date(),
                    // Optionally update name if not set? No.
                },
                create: {
                    deviceId,
                    name: `Device ${deviceId}`,
                    status: 'Online',
                    lastSeen: new Date()
                }
            });

            if (lat && lng) {
                await prisma.locationLog.create({
                    data: {
                        deviceId,
                        lat: parseFloat(lat),
                        lng: parseFloat(lng)
                    }
                });
            }
        }

        // Simple security check
        if (secret !== process.env.SENSOR_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if we are in enrollment mode
        // If the sensor reports "ENROLL_SUCCESS", turn off enrollment mode
        if (status === "ENROLL_SUCCESS") {
            await prisma.sensorStatus.update({
                where: { id: 'default' },
                data: {
                    enrollmentMode: false,
                    enrollmentTargetId: null,
                    message: `Enrollment Success! ${message || ''}`
                }
            });
            return NextResponse.json({ command: "IDLE" });
        }

        if (status === "ENROLL_FAILED") {
            await prisma.sensorStatus.update({
                where: { id: 'default' },
                data: {
                    enrollmentMode: false,
                    enrollmentTargetId: null,
                    message: `Enrollment Failed: ${message || 'Unknown error'}`
                }
            });
            return NextResponse.json({ command: "IDLE" });
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

        // Respond with command if there is one
        if (sensor.enrollmentMode) {
            if (sensor.enrollmentTargetId === -1) {
                return NextResponse.json({
                    ...sensor,
                    command: "EMPTY"
                });
            }
            if (sensor.enrollmentTargetId) {
                return NextResponse.json({
                    ...sensor,
                    command: "ENROLL",
                    targetId: sensor.enrollmentTargetId
                });
            }
        }

        return NextResponse.json({ ...sensor, command: "IDLE" });
    } catch (error) {
        console.error("Error in sensor API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
