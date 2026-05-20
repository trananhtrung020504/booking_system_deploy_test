import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ENV_VARS } from './env_vars.js';

const s3Client = new S3Client({
    region: ENV_VARS.CLOUDFLARE_R2_REGION || 'auto',
    endpoint: ENV_VARS.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: ENV_VARS.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: ENV_VARS.CLOUDFLARE_SECRET_ACCESS_KEY
    }
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const exponentialBackoff = (attempt) => RETRY_DELAY * Math.pow(2, attempt);

export const uploadToR2 = async (key, body, contentType = 'application/octet-stream') => {
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const command = new PutObjectCommand({
                Bucket: ENV_VARS.CLOUDFLARE_R2_BUCKET_NAME,
                Key: key,
                Body: body,
                ContentType: contentType
            });

            await s3Client.send(command);
            const publicUrl = `${ENV_VARS.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
            return { success: true, publicUrl, key };
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES - 1) {
                await sleep(exponentialBackoff(attempt));
            }
        }
    }
    throw new Error(`Không thể upload lên R2: ${lastError.message}`);
};

export const deleteFromR2 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: ENV_VARS.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key
        });
        await s3Client.send(command);
        return { success: true };
    } catch (error) {
        throw new Error(`Không thể xóa từ R2: ${error.message}`);
    }
};

export { s3Client };
