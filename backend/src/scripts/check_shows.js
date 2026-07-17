import prisma from '../config/database.js';

async function main() {
  console.log("--- 🕵️ Checking Database Movies & Showtimes ---");
  try {
    const movies = await prisma.movie.findMany({
      select: { id: true, title: true }
    });
    console.log("Movies in DB:", movies);

    const totalShows = await prisma.show.count();
    console.log("Total Showtimes in DB:", totalShows);

    const now = new Date();
    console.log("Current System Time:", now.toISOString());

    const upcomingShows = await prisma.show.findMany({
      where: {
        startTime: { gt: now }
      },
      take: 5,
      include: {
        movie: { select: { title: true } }
      }
    });
    console.log("Upcoming 5 Showtimes:", upcomingShows.map(s => ({
      id: s.id,
      movie: s.movie.title,
      startTime: s.startTime.toISOString()
    })));

    const searchResult = await prisma.show.findMany({
      where: {
        startTime: { gt: now },
        movie: {
          title: {
            contains: "Mai",
            mode: "insensitive"
          }
        }
      },
      include: {
        movie: { select: { title: true } }
      }
    });
    console.log("Upcoming Showtimes for 'Mai':", searchResult.map(s => ({
      id: s.id,
      movie: s.movie.title,
      startTime: s.startTime.toISOString()
    })));

  } catch (error) {
    console.error("Error reading database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
