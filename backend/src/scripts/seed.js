import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

async function main() {
    console.log("--- 🚀 Bắt đầu Seeding dữ liệu THẬT cho BookingSystem ---");

    try {
        console.log("⏳ Đang dọn dẹp dữ liệu cũ...");
        await prisma.transaction.deleteMany();
        await prisma.bookingCombo.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.seatHold.deleteMany();
        await prisma.show.deleteMany();
        await prisma.seat.deleteMany();
        await prisma.screen.deleteMany();
        await prisma.theaterLogo.deleteMany();
        await prisma.theater.deleteMany();
        await prisma.moviePoster.deleteMany();
        await prisma.movie.deleteMany();
        await prisma.combo.deleteMany();
        await prisma.voucher.deleteMany();
        await prisma.userAvatar.deleteMany();
        await prisma.user.deleteMany();
        console.log("✔ Đã dọn dẹp sạch sẽ database.");

        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.user.createMany({
            data: [
                { email: 'anhtrung02052004@gmail.com', name: 'Trung Admin', phone: '0766908557', password: hashedPassword, role: 'ADMIN' },
                { email: 'user@gmail.com', name: 'Khách hàng mẫu', phone: '0911111111', password: hashedPassword, role: 'USER' }
            ]
        });

        console.log(" Đang tạo Combos...");
        await prisma.combo.createMany({
            data: [
                { name: 'Combo Solo', description: '1 Bắp lớn + 2 Nước ngọt lớn', price: 80000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4VNqj94q4Z4ItOfpYtVUTuek1Tk2XqWRlQw&s' },
                { name: 'Combo Couple', description: '2 Bắp lớn + 2 Nước ngọt lớn', price: 105000, image: 'https://lh3.googleusercontent.com/-Uuyu4iVAmfg/Wcscqcgnx2I/AAAAAAAAgMQ/oVv3piWljBMMLIduVs-2Few7AwJkHswuQCHMYCw/2914a66e-7e99-48f4-8172-183d03a0d624.jpg' },
                { name: 'Combo Party', description: '3 Bắp lớn + 3 Nước ngọt lớn', price: 169000, image: 'https://iguov8nhvyobj.vcdn.cloud/media/wysiwyg/2022/012022/350x495_1.jpg' },
            ]
        });

        console.log(" Đang tạo Rạp & Phòng chiếu...");
        const theater = await prisma.theater.create({
            data: {
                name: 'RoPhim Hùng Vương',
                location: '123 Hùng Vương, Quận 5, TP.HCM',
                city: 'Hồ Chí Minh',
                screens: {
                    create: [
                        { name: 'Phòng chiếu 01', rows: 10, cols: 12 },
                        { name: 'Phòng chiếu 02 (IMAX)', rows: 12, cols: 15 }
                    ]
                }
            },
            include: { screens: true }
        });

        console.log("⏳ Đang tự động tạo ghế...");
        for (const s of theater.screens) {
            const seats = [];
            for (let r = 0; r < s.rows; r++) {
                const rowLabel = String.fromCharCode(65 + r);
                for (let c = 1; c <= s.cols; c++) {
                    let type = 'STANDARD';
                    if (r >= 4 && r <= 7) type = 'VIP';
                    if (r === s.rows - 1) type = 'SWEETBOX';
                    seats.push({ screenId: s.id, row: rowLabel, column: c, type });
                }
            }
            await prisma.seat.createMany({ data: seats });
        }

        console.log("⏳ Đang tạo danh sách phim THẬT...");
        const moviesData = [
            {
                title: 'Mắt Biếc',
                description: 'Mắt Biếc là bộ phim được chuyển thể từ tác phẩm cùng tên của nhà văn Nguyễn Nhật Ánh, kể về chuyện tình đơn phương của Ngạn dành cho Hà Lan - cô gái có đôi mắt đẹp hút hồn.',
                duration: 117,
                genre: ['Tình Cảm', 'Lãng Mạn'],
                releaseDate: new Date('2019-12-20'),
                languages: ['Tiếng Việt'],
                certification: 'T13',
                rating: 9.5,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=ITlQ0oU7tDA',
                poster: 'https://innovavietnam.vn/wp-content/uploads/poster-561x800.jpg'
            },
            {
                title: 'Mai',
                description: 'Phim xoay quanh cuộc đời của một người phụ nữ tên Mai, người đang cố gắng vượt qua những nỗi đau trong quá khứ để tìm kiếm hạnh phúc mới.',
                duration: 131,
                genre: ['Tâm Lý', 'Tình Cảm'],
                releaseDate: new Date('2024-02-10'),
                languages: ['Tiếng Việt'],
                certification: 'T18',
                rating: 9.8,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=EX6clvId19s',
                poster: 'https://cdn-images.vtv.vn/562122370168008704/2023/11/28/photo-1-17011453442011344132442.jpg'
            },
            {
                title: 'Nhà Bà Nữ',
                description: 'Câu chuyện về những mâu thuẫn trong gia đình bà Nữ, một người phụ nữ làm nghề bán bánh canh cua, với những quy tắc khắt khe dành cho con cái.',
                duration: 102,
                genre: ['Gia Đình', 'Hài Hước', 'Tâm Lý'],
                releaseDate: new Date('2023-01-22'),
                languages: ['Tiếng Việt'],
                certification: 'T16',
                rating: 9.2,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=IkaP0KJWTsQ',
                poster: 'https://cdn2.tuoitre.vn/thumb_w/480/2022/12/3/nbnteaser-posterfb-16700503265491078250905.jpg'
            },
            {
                title: 'Skyfall',
                description: 'Sứ mệnh mới nhất của James Bond đưa anh đến những nơi xa lạ để bảo vệ MI6 khỏi một mối đe dọa nguy hiểm từ quá khứ.',
                duration: 143,
                genre: ['Hành Động', 'Hình Sự'],
                releaseDate: new Date('2012-10-26'),
                languages: ['Tiếng Anh', 'Phụ đề Tiếng Việt'],
                certification: 'T13',
                rating: 9.4,
                format: ['2D', 'IMAX'],
                trailerUrl: 'https://www.youtube.com/watch?v=6kw1UVovByw',
                poster: 'https://afamilycdn.com/k:thumb_w/600/keL7OrzuedADBJkO5XgvuGSO08N3K/Image/2012/11/121108_11-ec8da/20-poster-phim-dep-nhat-nam-2012-p2.jpg'
            },
            {
                title: '7 Thi Thể',
                description: 'Một bộ phim tâm lý tội phạm đầy kịch tính về cuộc rượt đuổi giữa cảnh sát và một kẻ giết người hàng loạt bí ẩn.',
                duration: 110,
                genre: ['Hình Sự', 'Tâm Lý'],
                releaseDate: new Date('2018-10-03'),
                languages: ['Tiếng Hàn', 'Phụ đề Tiếng Việt'],
                certification: 'T18',
                rating: 8.9,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=IyvKUjStYfc',
                poster: 'https://upload.wikimedia.org/wikipedia/vi/b/b4/Poster_phim_7_thi_th%E1%BB%83.jpg'
            },
            {
                title: 'Đảo Độc Đắc',
                description: 'Một nhóm bạn thân đi du lịch trên một hòn đảo hoang sơ và vô tình bị cuốn vào những sự kiện bí ẩn và rùng rợn.',
                duration: 110,
                genre: ['Kinh Dị', 'Bí Ẩn'],
                releaseDate: new Date('2026-12-23'),
                languages: ['Tiếng Việt'],
                certification: 'T18',
                rating: 8.5,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=KG3pB16QNSA',
                poster: 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/9/6/1089731/03_TIEU-VY-01.jpg'
            },
            {
                title: 'Tấm Cám: Dị Bản Kinh Dị',
                description: 'Dựa trên câu chuyện cổ tích quen thuộc nhưng được khai thác dưới góc nhìn kinh dị và đen tối hơn.',
                duration: 105,
                genre: ['Kinh Dị', 'Thần Thoại'],
                releaseDate: new Date('2026-10-31'),
                languages: ['Tiếng Việt'],
                certification: 'T18',
                rating: 8.7,
                format: ['2D', 'IMAX'],
                trailerUrl: 'https://www.youtube.com/watch?v=_8qUFEmPQbc',
                poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy7VQMcTnXp94fDlvHTjPqH-aQxzcbutz3_w&s'
            },
            {
                title: 'Thỏ Ơi',
                description: 'Bộ phim hoạt hình dễ thương dành cho gia đình và trẻ em.',
                duration: 90,
                genre: ['Hoạt Hình', 'Gia Đình'],
                releaseDate: new Date('2026-06-01'),
                languages: ['Tiếng Việt', 'Lồng Tiếng'],
                certification: 'P',
                rating: 9.0,
                format: ['2D'],
                trailerUrl: 'https://www.youtube.com/watch?v=XMv1Zhj5TQg',
                poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRN-gREOEcNDFktBhFPsuiMRWQ5HPUqGXnOw&s'
            }
        ];

        const movies = [];
        for (const m of moviesData) {
            const movie = await prisma.movie.create({
                data: {
                    title: m.title,
                    description: m.description,
                    duration: m.duration,
                    genre: m.genre,
                    releaseDate: m.releaseDate,
                    languages: m.languages,
                    certification: m.certification,
                    rating: m.rating,
                    format: m.format,
                    trailerUrl: m.trailerUrl,
                    poster: {
                        create: {
                            publicId: `posters/${m.title.toLowerCase().replace(/ /g, '-')}`,
                            source: m.poster
                        }
                    }
                }
            });
            movies.push(movie);
        }

        console.log("⏳ Đang tạo suất chiếu cho 7 ngày tới...");
        const now = new Date();
        const nowShowing = movies.filter(m => m.releaseDate < now);

        for (const m of nowShowing) {
            // Tạo suất chiếu cho 7 ngày tới
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(now.getDate() + i);

                const times = ['09:00', '12:30', '15:00', '18:30', '21:00'];
                for (const time of times) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const startTime = new Date(date);
                    startTime.setHours(hours, minutes, 0, 0);

                    // Chỉ tạo nếu suất chiếu ở tương lai
                    if (startTime > now) {
                        const endTime = new Date(startTime.getTime() + m.duration * 60000);
                        await prisma.show.create({
                            data: {
                                movieId: m.id,
                                theaterId: theater.id,
                                screenId: theater.screens[0].id,
                                format: m.format[0],
                                startTime,
                                endTime,
                                priceMap: { STANDARD: 95000, VIP: 125000, SWEETBOX: 250000 }
                            }
                        });
                    }
                }
            }
        }

        console.log("✔ HOÀN TẤT SEEDING DỮ LIỆU THẬT.");
        console.log("🔑 Đăng nhập Admin: admin@gmail.com / 123456");

    } catch (error) {
        console.error("❌ Lỗi khi seeding:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
