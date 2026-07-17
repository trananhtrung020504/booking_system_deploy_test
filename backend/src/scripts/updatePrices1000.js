import prisma from '../config/database.js';

async function updatePrices() {
  console.log("Đang cập nhật giá vé và combo xuống 1.000 VNĐ...");
  try {
    const shows = await prisma.show.findMany();
    for (const show of shows) {
      await prisma.show.update({
        where: { id: show.id },
        data: {
          priceMap: {
            STANDARD: 1000,
            VIP: 1000,
            SWEETBOX: 1000
          }
        }
      });
    }

    await prisma.combo.updateMany({
      data: {
        price: 1000
      }
    });

    console.log("Cập nhật thành công! Tất cả vé và combo đều có giá 1.000 VNĐ.");
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrices();
