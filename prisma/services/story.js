import prisma from '@/prisma/index';

export const createStory = async (userId, title, content, parentStoryId = null) =>
  prisma.story.create({
    data: {
      userId,
      title,
      content,
      parentStoryId,
      status: 'published',
    },
  });

export const getStories = async (userId) =>
  prisma.story.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
