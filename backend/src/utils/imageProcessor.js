import sharp from 'sharp';

sharp.cache(false);
sharp.concurrency(1); // Giảm số lượng thread xử lý đồng thời để tiết kiệm CPU/RAM


const IMAGE_MIME_PREFIX = 'image/';
const VIDEO_MIME_PREFIX = 'video/';

const getMediaTypeFromMime = (mimeType = '') => {
    const normalizedMime = String(mimeType).toLowerCase().trim();
    if (normalizedMime.startsWith(IMAGE_MIME_PREFIX)) return 'image';
    if (normalizedMime.startsWith(VIDEO_MIME_PREFIX)) return 'video';
    return null;
};

const getMediaTypeFromBuffer = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image';
    return null;
};

export const processImage = async (buffer, options = {}) => {
    if (!buffer || buffer.length === 0) throw new Error('Buffer ảnh không hợp lệ');
    const { width = 1080, height = 1080, quality = 80 } = options;
    try {
        return await sharp(buffer)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();
    } catch (error) {
        throw new Error(`Không thể xử lý ảnh: ${error.message}`);
    }
};

export const processMedia = async (buffer, options = {}) => {
    const { mimeType, imageOptions = {} } = options;
    const mediaType = getMediaTypeFromMime(mimeType) || getMediaTypeFromBuffer(buffer);

    if (mediaType === 'image') {
        const processedBuffer = await processImage(buffer, imageOptions);
        return { mediaType, processedBuffer, extension: 'webp' };
    }
    throw new Error('Không xác định được loại media (chỉ hỗ trợ ảnh)');
};
