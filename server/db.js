import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws


const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
  webSocketConstructor: ws,
})
export const prisma = new PrismaClient({ adapter })