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
            role: 'Employee',
            rank: 'Developer',
            baseSalary: 3000,
            totalSalary: 3000,
            attendanceRate: 95,
            daysAbsent: 1,
            accountStatus: 'Approved',
            fingerprintId: 101,
            workDays: '1,2,3,4,5'
        }
    ]

    for (const user of users) {
        await prisma.user.upsert({
            where: { uid: user.uid },
            update: user as any,
            create: user as any,
        })
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
