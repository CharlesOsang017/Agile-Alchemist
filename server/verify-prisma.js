import prisma from './configs/prisma.js';

async function main() {
  try {
    console.log('Attempting to connect to Prisma...');
    // We don't necessarily need to query, just check if it instantiates without error
    // and if we can access a model.
    console.log('Prisma models available:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    
    // Attempt a simple query to verify connection (optional, might fail if DB is not reachable from here)
    // const count = await prisma.user.count();
    // console.log('User count:', count);
    
    console.log('PrismaClient initialized successfully!');
  } catch (error) {
    console.error('PrismaClient initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
