import prisma from '@/prisma/index';

export const createChild = async (userId, name, birthDate, preferences) =>
  await prisma.child.create({
    data: {
      userId,
      name,
      birthDate,
      preferences,
    },
  });

export const getChildren = async (userId) =>
  await prisma.child.findMany({
    where: { userId },
  });
