import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper: Haversine Distance in Meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fingerprintId, secret, lat, lng, deviceId } = body;

        if (secret !== process.env.SENSOR_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find user by fingerprintId
        const user = await prisma.user.findFirst({
            where: { fingerprintId: parseInt(fingerprintId) }
        });

        if (!user) {
            // Log unknown attempt? for now just return 404 as before
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        /* ================= V2 FEATURES: GEOFENCE & SECURITY ================= */
        let riskLevel = "LOW";
        let device = null;
        let incomingLat = lat ? parseFloat(lat) : null;
        let incomingLng = lng ? parseFloat(lng) : null;

        // 1. Device Association
        if (deviceId) {
            device = await prisma.device.findUnique({ where: { deviceId } });
            if (!device) {
                // Auto-enroll new device as Pending/Offline to allow flow, or strict?
                // Requirement: "Add support for multiple devices". We'll create it if new.
                device = await prisma.device.create({
                    data: {
                        deviceId,
                        name: `Device ${deviceId}`,
                        status: "Online",
                        lastSeen: new Date()
                    }
                });
            } else {
                // Update last seen
                await prisma.device.update({
                    where: { id: device.id },
                    data: { lastSeen: new Date(), status: 'Online' }
                });
            }
        }

        // 2. Geofencing Check
        if (device && device.allowedLat && device.allowedLng && incomingLat && incomingLng) {
            const dist = getDistanceMeters(incomingLat, incomingLng, device.allowedLat, device.allowedLng);
            if (dist > device.allowedRadius) {
                // LOG REJECTION
                await prisma.attendanceLog.create({
                    data: {
                        userId: user.id,
                        deviceId: device.deviceId,
                        fingerprintId: parseInt(fingerprintId),
                        status: "REJECTED",
                        reason: "OUTSIDE_GEOFENCE",
                        riskLevel: "HIGH",
                        lat: incomingLat,
                        lng: incomingLng
                    }
                });
                return NextResponse.json({ error: "Attendance Rejected: Outside Geofence Zone" }, { status: 403 });
            }
        }

        // 3. Anti-Spoofing / Risk Level
        if (incomingLat && incomingLng) {
            // Check for impossible jumps
            const lastLog = await prisma.attendanceLog.findFirst({
                where: { userId: user.id },
                orderBy: { timestamp: 'desc' }
            });

            if (lastLog && lastLog.lat && lastLog.lng) {
                const distKm = getDistanceMeters(incomingLat, incomingLng, lastLog.lat, lastLog.lng) / 1000;
                const timeDiffHours = (new Date().getTime() - lastLog.timestamp.getTime()) / (1000 * 60 * 60);

                if (timeDiffHours > 0) {
                    const speed = distKm / timeDiffHours;
                    if (speed > 800) { // e.g. Plane speed
                        riskLevel = "HIGH";
                        // Can reject or just flag. Requirement: "Reject GPS data with impossible jumps"
                        // If strict rejection:
                        await prisma.attendanceLog.create({
                            data: {
                                userId: user.id,
                                deviceId: device ? device.deviceId : null,
                                fingerprintId: parseInt(fingerprintId),
                                status: "REJECTED",
                                reason: "IMPOSSIBLE_SPEED",
                                riskLevel: "HIGH",
                                lat: incomingLat,
                                lng: incomingLng
                            }
                        });
                        return NextResponse.json({ error: "Attendance Rejected: Impossible Location Jump" }, { status: 403 });
                    }
                }
            }
        }

        /* ================= END V2 FEATURES ================= */

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
                    status: 'Present',
                    // V2 Fields
                    deviceId: device ? device.deviceId : null,
                    lat: incomingLat,
                    lng: incomingLng,
                    riskLevel: riskLevel
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
                data: {
                    checkOutTime: now,
                    // Update location on checkout too? Maybe not strictly required to overwrite, 
                    // but we can update or keep the CheckIn location. 
                    // Usually CheckOut might be different. Let's create a NEW log anyway.
                }
            });
            message = `Goodbye, ${user.name}!`;
        }

        // Log the successful attempt
        await prisma.attendanceLog.create({
            data: {
                userId: user.id,
                deviceId: device ? device.deviceId : null,
                fingerprintId: parseInt(fingerprintId),
                status: "ACCEPTED",
                riskLevel: riskLevel,
                lat: incomingLat,
                lng: incomingLng
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/attendance');

        return NextResponse.json({ message: message, user: user.name, attendance });
    } catch (error) {
        console.error("Error in fingerprint API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
