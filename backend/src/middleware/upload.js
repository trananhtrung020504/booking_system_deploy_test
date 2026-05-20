import { deleteFromR2, uploadToR2 } from '../config/cloudflareR2.js';
import { processMedia } from '../utils/imageProcessor.js';
import fs from 'fs';
import path from 'path';

const generateRandomString = () => Math.random().toString(36).substring(2, 8);

export const uploadToR2Middleware = (options = {}) => async (req, res, next) => {
    const {
        folder = 'general',
        reqKey = 'uploadData',
        imageOptions = { width: 1080, height: 1080, quality: 85 }
    } = options;

    const uploadedKeys = [];
    const userId = req.userId || 'anonymous';

    try {
        if (req.file) {
            const result = await processAndUpload(req.file, `${folder}/${userId}`, imageOptions);
            req[reqKey] = result;
            return next();
        }

        if (req.files) {
            const results = {};
            for (const fieldName in req.files) {
                const files = req.files[fieldName];
                const processedResults = await Promise.all(
                    files.map(file => processAndUpload(file, `${folder}/${userId}`, imageOptions))
                );
                processedResults.forEach(res => uploadedKeys.push(res.key));
                results[fieldName] = processedResults.length === 1 ? processedResults[0] : processedResults;
            }
            req[reqKey] = results;
            return next();
        }
        next();
    } catch (error) {
        console.error(`[Upload Error] ${folder}:`, error);
        if (uploadedKeys.length > 0) {
            await Promise.allSettled(uploadedKeys.map(key => deleteFromR2(key)));
        }
        res.status(500).json({ message: error.message });
    }
};

async function processAndUpload(file, folderPath, imageOptions) {
    const buffer = file.buffer || (file.path ? fs.readFileSync(path.resolve(file.path)) : null);
    if (!buffer) throw new Error('Không thể đọc dữ liệu file');

    const { mediaType, processedBuffer, extension } = await processMedia(buffer, {
        mimeType: file.mimetype,
        imageOptions
    });

    const contentType = mediaType === 'image' ? 'image/webp' : file.mimetype;
    const finalExtension = mediaType === 'image' ? 'webp' : extension;
    const key = `${folderPath}/${Date.now()}-${generateRandomString()}.${finalExtension}`;

    const { publicUrl } = await uploadToR2(key, processedBuffer, contentType);

    return {
        mediaType,
        key,
        publicUrl,
        contentType,
        size: processedBuffer.length
    };
}

export const uploadMoviePosterToR2 = uploadToR2Middleware({ folder: 'movies', reqKey: 'movieUploadData' });
export const uploadTheaterLogoToR2 = uploadToR2Middleware({ folder: 'theaters', reqKey: 'theaterUploadData' });
export const uploadUserAvatarToR2 = uploadToR2Middleware({ folder: 'avatars', reqKey: 'avatarUploadData' });
