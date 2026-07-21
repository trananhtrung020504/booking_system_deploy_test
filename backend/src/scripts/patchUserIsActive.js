import prisma from '../config/database.js';

async function main() {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive")
    `);

    const result = await prisma.$executeRawUnsafe(`
        UPDATE "users"
        SET "isActive" = true
        WHERE "isActive" = false
    `);

    console.log(`Patched users.isActive column. Unlocked ${result} user(s).`);
}

main()
    .catch((error) => {
        console.error('Patch users.isActive failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
