import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { fingerprintId: true },
            orderBy: { fingerprintId: 'desc' },
            take: 1
        });

        const maxId = users.length > 0 ? (users[0].fingerprintId || 0) : 0;
        const nextId = maxId + 1;

        return NextResponse.json({ nextId });
    } catch (error) {
        console.error("Error in next-id API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
