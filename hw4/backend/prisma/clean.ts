import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning all data...');
  
  try {
    // 按照外鍵依賴順序刪除
    await prisma.favorite.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.treasure.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ All data cleaned successfully!');
  } catch (error) {
    console.error('❌ Clean failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});