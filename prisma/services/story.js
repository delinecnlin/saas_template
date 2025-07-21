import prisma from '@/prisma/index';

export const createChild = async (userId, name, birthDate, preferences = {}) => {
  return prisma.child.create({
    data: {
      userId,
      name,
      birthDate,
      preferences,
    },
  });
};

export const createSession = async (childId) => {
  return prisma.storySession.create({
    data: { childId },
  });
};

export const addMessage = async (sessionId, sender, content, memoryRef = null) => {
  return prisma.storyMessage.create({
    data: { sessionId, sender, content, memoryRef },
  });
};

export const saveStory = async (childId, title, content, status = 'draft', parentStoryId = null) => {
  return prisma.story.create({
    data: { childId, title, content, status, parentStoryId },
  });
};

export const publishStory = async (id, content) => {
  return prisma.story.update({
    data: { content, status: 'published' },
    where: { id },
  });
};

export const listStories = async (childId) => {
  return prisma.story.findMany({
    where: { childId, status: 'published' },
    orderBy: { createdAt: 'asc' },
  });
};
