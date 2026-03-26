import 'dotenv/config';
import { createRequire } from 'module';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

// Required for Neon adapter in Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;