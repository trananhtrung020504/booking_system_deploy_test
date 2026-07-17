import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '../../config/database.js';

export const queryMoviesTool = tool(
  async ({ keyword, genre, status, limit = 6 }) => {
    try {
      console.log(`[Tool: query_movies] keyword='${keyword}', genre='${genre}', status='${status}'`);
      
      const where = { isActive: true };
      
      if (keyword) {
        where.title = {
          contains: keyword,
          mode: 'insensitive'
        };
      }
      
      if (genre) {
        where.genre = {
          has: genre
        };
      }
      
      if (status) {
        const now = new Date();
        if (status === 'now-showing') {
          where.releaseDate = {
            lte: now
          };
        } else {
          where.releaseDate = {
            gt: now
          };
        }
      }

      const movies = await prisma.movie.findMany({
        where,
        take: limit,
        include: {
          poster: true
        },
        orderBy: {
          releaseDate: 'desc'
        }
      });

      return JSON.stringify({
        movies: movies.map(m => ({
          id: m.id,
          title: m.title,
          genre: m.genre,
          duration: m.duration,
          rating: m.rating,
          certification: m.certification,
          poster: m.poster?.source || null,
          isActive: m.isActive,
          description: m.description
        }))
      });
    } catch (error) {
      console.error('[Tool: query_movies] Error:', error);
      return JSON.stringify({ error: 'Không thể truy vấn danh sách phim lúc này.' });
    }
  },
  {
    name: 'query_movies',
    description: 'Tìm kiếm danh sách phim đang chiếu hoặc sắp chiếu theo từ khóa tiêu đề, thể loại và trạng thái.',
    schema: z.object({
      keyword: z.string().optional().describe('Từ khóa tìm kiếm theo tiêu đề phim'),
      genre: z.string().optional().describe('Thể loại phim (ví dụ: "Hành động", "Tình cảm", "Kịch tính")'),
      status: z.enum(['now-showing', 'coming-soon']).optional().describe('Trạng thái chiếu phim'),
      limit: z.number().optional().describe('Giới hạn số lượng phim trả về')
    })
  }
);

export const getMovieDetailTool = tool(
  async ({ movieTitle }) => {
    try {
      console.log(`[Tool: get_movie_detail] title='${movieTitle}'`);
      
      const movie = await prisma.movie.findFirst({
        where: {
          title: {
            contains: movieTitle,
            mode: 'insensitive'
          },
          isActive: true
        },
        include: {
          poster: true,
          shows: {
            where: {
              startTime: {
                gt: new Date()
              },
              isActive: true
            },
            include: {
              theater: true,
              screen: true
            },
            take: 5,
            orderBy: {
              startTime: 'asc'
            }
          }
        }
      });

      if (!movie) {
        return JSON.stringify({ error: `Không tìm thấy thông tin phim nào khớp với tên "${movieTitle}"` });
      }

      return JSON.stringify({
        movie: {
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
          certification: movie.certification,
          poster: movie.poster?.source || null,
          isActive: movie.isActive,
          description: movie.description,
          shows: movie.shows.map(s => ({
            id: s.id,
            theaterName: s.theater.name,
            screenName: s.screen.name,
            startTime: s.startTime.toISOString(),
            format: s.format
          }))
        }
      });
    } catch (error) {
      console.error('[Tool: get_movie_detail] Error:', error);
      return JSON.stringify({ error: 'Không thể lấy thông tin chi tiết phim.' });
    }
  },
  {
    name: 'get_movie_detail',
    description: 'Lấy thông tin chi tiết của một bộ phim cụ thể (bao gồm lịch chiếu sắp diễn ra) dựa trên tên phim.',
    schema: z.object({
      movieTitle: z.string().describe('Tên phim cần tra cứu (ví dụ: "Mai", "Nhà bà Nữ", "Mắt biếc")')
    })
  }
);

export const queryShowtimesTool = tool(
  async ({ movieTitle, theaterName, date }) => {
    try {
      console.log(`[Tool: query_showtimes] movieTitle='${movieTitle}', theaterName='${theaterName}', date='${date}'`);
      
      const where = {
        startTime: {
          gt: new Date()
        },
        isActive: true
      };

      if (movieTitle) {
        where.movie = {
          title: {
            contains: movieTitle,
            mode: 'insensitive'
          }
        };
      }

      if (theaterName) {
        where.theater = {
          name: {
            contains: theaterName,
            mode: 'insensitive'
          }
        };
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        where.startTime = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      const shows = await prisma.show.findMany({
        where,
        take: 10,
        include: {
          movie: true,
          theater: true,
          screen: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return JSON.stringify({
        showtimes: shows.map(s => {
          let priceRange = '95.000đ';
          if (s.priceMap && typeof s.priceMap === 'object') {
            const prices = Object.values(s.priceMap);
            if (prices.length > 0) {
              const minPrice = Math.min(...prices.map(Number));
              const maxPrice = Math.max(...prices.map(Number));
              priceRange = minPrice === maxPrice 
                ? `${minPrice.toLocaleString('vi-VN')}đ`
                : `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
            }
          }

          return {
            id: s.id,
            movieTitle: s.movie.title,
            theaterName: s.theater.name,
            screenName: s.screen.name,
            startTime: s.startTime.toISOString(),
            format: s.format,
            price: priceRange
          };
        })
      });
    } catch (error) {
      console.error('[Tool: query_showtimes] Error:', error);
      return JSON.stringify({ error: 'Không thể tra cứu lịch chiếu phim.' });
    }
  },
  {
    name: 'query_showtimes',
    description: 'Tra cứu danh sách lịch chiếu phim theo tên phim, tên rạp hoặc ngày cụ thể.',
    schema: z.object({
      movieTitle: z.string().optional().describe('Tên phim cần tìm lịch chiếu (ví dụ: "Mai")'),
      theaterName: z.string().optional().describe('Tên rạp cần tìm lịch chiếu (ví dụ: "Hùng Vương")'),
      date: z.string().optional().describe('Ngày cần tìm lịch chiếu dạng YYYY-MM-DD (ví dụ: "2026-05-18")')
    })
  }
);

export const chatbotTools = [queryMoviesTool, getMovieDetailTool, queryShowtimesTool];
