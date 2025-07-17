import prisma from '@/prisma/index';

export const createStory = async (childId, title, content, parentStoryId) =>
  await prisma.story.create({
    data: {
      childId,
      title,
      content,
      parentStoryId,
    },
  });

export const updateStoryStatus = async (storyId, status) =>
  await prisma.story.update({
    data: { status },
    where: { id: storyId },
  });

export const getStories = async (childId) =>
  await prisma.story.findMany({
    where: { childId },
    orderBy: { createdAt: 'asc' },
  });
