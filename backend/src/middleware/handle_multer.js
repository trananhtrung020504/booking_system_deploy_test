import multer from "multer";
import path from "path";
import fs from "fs";

const tempUploadDir = path.join(process.cwd(), 'temp', 'uploads');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

const fileFilter = (req, file, cb) => {
    const allowed = [...IMAGE_MIMES, ...VIDEO_MIMES];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Định dạng ${file.mimetype} không hỗ trợ`));
    }
};

export const upload = {
    memory: multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024, files: 10 },
        fileFilter
    }),
    disk: multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => cb(null, tempUploadDir),
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: { fileSize: 100 * 1024 * 1024, files: 2 },
        fileFilter
    })
};

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const errorMessages = {
            LIMIT_FILE_SIZE: 'File quá lớn (tối đa 100MB)',
            LIMIT_FILE_COUNT: 'Quá nhiều file',
            LIMIT_UNEXPECTED_FILE: 'Trường file không hợp lệ hoặc quá số lượng'
        };
        return res.status(400).json({
            success: false,
            message: errorMessages[err.code] || err.message
        });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
};

export const uploadMiddleware = upload.memory;

const imageFilter = (req, file, cb) => {
    if (IMAGE_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Định dạng ${file.mimetype} không hỗ trợ, chỉ hỗ trợ ảnh`));
    }
};

export const uploadPoster = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: imageFilter
});

export const uploadLogo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: imageFilter
});
