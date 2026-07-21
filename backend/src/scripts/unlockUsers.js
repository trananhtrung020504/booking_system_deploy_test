import prisma from '../config/database.js';

async function main() {
    const email = process.argv[2];

    if (email) {
        const user = await prisma.user.update({
            where: { email },
            data: { isActive: true },
            select: { email: true, isActive: true }
        });

        console.log(`Unlocked ${user.email}: isActive=${user.isActive}`);
        return;
    }

    const result = await prisma.user.updateMany({
        where: { isActive: false },
        data: { isActive: true }
    });

    console.log(`Unlocked ${result.count} user(s).`);
}

main()
    .catch((error) => {
        console.error('Unlock users failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
