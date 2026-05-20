import { ENV_VARS } from './env_vars.js';
import pkgPrisma from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkgPg from 'pg';

const { PrismaClient } = pkgPrisma;
const { Pool } = pkgPg;

const globalForPrisma = global;

const connectionString = ENV_VARS.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: ENV_VARS.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (ENV_VARS.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
