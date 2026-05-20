import prisma from '../config/database.js';

async function main() {
  try {
    const startOfMay20 = new Date('2026-05-20T00:00:00Z');
    const endOfMay20 = new Date('2026-05-20T23:59:59Z');

    const shows = await prisma.show.findMany({
      where: {
        startTime: {
          gte: startOfMay20,
          lte: endOfMay20
        }
      },
      include: {
        movie: true,
        theater: true,
        screen: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    console.log(`--- Shows on May 20, 2026 at all theaters ---`);
    shows.forEach(s => {
      console.log(`Theater: ${s.theater.name} | Movie: ${s.movie.title} | Time: ${s.startTime.toISOString()} (${new Date(s.startTime).toLocaleString('vi-VN')}) | Screen: ${s.screen.name}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
