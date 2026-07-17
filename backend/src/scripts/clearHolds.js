import redis from '../config/redis.js';
import prisma from '../config/database.js';

async function clearHolds() {
    try {
        console.log("🧹 Clearing all SeatHolds in Redis and Database...");
        
        const keys = await redis.keys('hold:*');
        if (keys.length > 0) {
            for (const key of keys) {
                await redis.del(key);
            }
            console.log(`✅ Deleted ${keys.length} hold keys from Redis.`);
        } else {
            console.log("ℹ️ No hold keys found in Redis.");
        }

        const deletedHolds = await prisma.seatHold.deleteMany();
        console.log(`✅ Deleted ${deletedHolds.count} seat hold records from Database.`);

        console.log("🎉 All active and ghost seat holds cleared successfully!");
    } catch (error) {
        console.error("❌ Error clearing holds:", error);
    } finally {
        await redis.quit();
        await prisma.$disconnect();
    }
}

clearHolds();
