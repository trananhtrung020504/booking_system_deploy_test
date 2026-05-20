import { defineConfig } from '@prisma/config';
import { ENV_VARS } from './src/config/env_vars.js';

export default defineConfig({
    schema: './prisma/schema.prisma',
    datasource: {
        url: ENV_VARS.DATABASE_URL,
    },
});
