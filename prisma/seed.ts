import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Seed System Setting
    await prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            payCutRate: 10,
            companyName: 'Dawami',
            companyAddress: 'Dawami Headquarters, Algeria'
        }
    })

    // Seed Users
    const users = [
        {
            uid: 'dev-admin',
            name: 'Dev Admin',
            email: 'dev@test.com',
            role: 'Admin',
            rank: 'Developer',
            baseSalary: 10000,
            totalSalary: 10000,
            attendanceRate: 100,
            daysAbsent: 0,
            accountStatus: 'Approved',
            fingerprintId: 0,
            workDays: '1,2,3,4,5'
        },
        {
            uid: 'admin-1',
            name: 'Admin User',
            email: 'admin@solminder.com',
            role: 'Admin',
            rank: 'Manager',
            baseSalary: 5000,
            totalSalary: 5000,
            attendanceRate: 100,
            daysAbsent: 0,
            accountStatus: 'Approved',
            fingerprintId: 1,
            workDays: '1,2,3,4,5'
        },
        {
            uid: 'emp-1',
            name: 'John Doe',
            email: 'john@solminder.com',
            role: 'Admin',
            rank: 'Developer',
            baseSalary: 3000,
            totalSalary: 3000,
            attendanceRate: 95,
            daysAbsent: 1,
            accountStatus: 'Approved',
            fingerprintId: 2,
            workDays: '1,2,3,4,5'
        }
    ]

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { uid: userData.uid },
            update: userData as any,
            create: userData as any,
        })

        // Seed some attendance records for the last 5 days
        const last5Days = [0, 1, 2, 3, 4, 5].map(offset => {
            const d = new Date();
            d.setDate(d.getDate() - offset);
            return d;
        });

        for (const date of last5Days) {
            const dateStr = date.toISOString().split('T')[0];

            // Randomly skip some days for "Absent" look
            if (Math.random() > 0.8) continue;

            const checkIn = new Date(date);
            checkIn.setHours(8, Math.floor(Math.random() * 30), 0);

            const checkOut = new Date(date);
            checkOut.setHours(17, Math.floor(Math.random() * 30), 0);

            await prisma.attendance.upsert({
                where: {
                    id: `${user.id}-${dateStr}` // Deterministic ID for upsert
                },
                create: {
                    id: `${user.id}-${dateStr}`,
                    userId: user.id,
                    date: dateStr,
                    checkInTime: checkIn,
                    checkOutTime: checkOut,
                    status: 'Present'
                },
                update: {}
            });
        }
    }

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error('Seed Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
