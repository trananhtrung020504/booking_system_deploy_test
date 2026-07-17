import Redis from 'ioredis'
import { ENV_VARS } from './env_vars.js'

let redis;

if (ENV_VARS.REDIS_URL) {
    console.log("Đang khởi tạo kết nối tới Redis qua REDIS_URL...");
    redis = new Redis(ENV_VARS.REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2000)
    });
} else {
    console.log("Đang khởi tạo kết nối tới Redis qua Host/Port/Password...");
    const redisOptions = {
        host: ENV_VARS.REDIS_HOST,
        port: ENV_VARS.REDIS_PORT,
        password: ENV_VARS.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2000)
    };

    if (ENV_VARS.REDIS_HOST && (ENV_VARS.REDIS_HOST.includes('upstash.io') || ENV_VARS.REDIS_HOST.includes('redislabs.com'))) {
        redisOptions.tls = {};
    }

    redis = new Redis(redisOptions);
}

redis.on("connect", () => console.log("Đã mở kết nối tới redis"))
redis.on("error", (e) => console.log("Lỗi khi mở kết nối tới redis: ", e))

export default redis;
