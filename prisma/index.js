import { PrismaClient } from '@prisma/client';

let prisma;

function logPrismaError(e) {
  // 只输出部分连接串，避免泄露密码
  const dbUrl = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/\/\/.*?:.*?@/, '//****:****@')
    : 'undefined';
  console.error('Prisma 初始化失败:', e && e.message, 'DATABASE_URL:', dbUrl);
}

if (process.env.NODE_ENV === 'production') {
  try {
    prisma = new PrismaClient();
  } catch (e) {
    logPrismaError(e);
    throw e;
  }
} else {
  if (!global.prisma) {
    try {
      global.prisma = new PrismaClient();
    } catch (e) {
      logPrismaError(e);
      throw e;
    }
  }
  prisma = global.prisma;
}

export default prisma;
