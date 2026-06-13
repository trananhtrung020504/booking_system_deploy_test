import prisma from '../config/database.js';

async function updatePricesFast() {
  console.log("Đang ép giá lên 2.000 VNĐ cực nhanh...");
  try {
    await prisma.$executeRaw`UPDATE "shows" SET "priceMap" = '{"VIP":2000,"STANDARD":2000,"SWEETBOX":2000}'::jsonb`;
    await prisma.$executeRaw`UPDATE "combos" SET "price" = 2000`;
    console.log("Thành công! Toàn bộ đã về 2.000 VNĐ.");
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePricesFast();
