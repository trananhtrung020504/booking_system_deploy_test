import prisma from '../config/database.js';

async function updatePricesFast() {
  console.log("Đang ép giá xuống 1.000 VNĐ cực nhanh...");
  try {
    await prisma.$executeRaw`UPDATE "combos" SET "price" = 1000`;
    console.log("Thành công! Toàn bộ đã về 1.000 VNĐ.");
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePricesFast();
