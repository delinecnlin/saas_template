import prisma from '@/prisma/index';

export const createChatSession = async (childId) =>
  await prisma.chatSession.create({
    data: {
      childId,
    },
  });

export const endChatSession = async (sessionId) =>
  await prisma.chatSession.update({
    data: { endedAt: new Date() },
    where: { id: sessionId },
  });

export const addMessage = async (chatSessionId, sender, content, memoryRef) =>
  await prisma.chatMessage.create({
    data: {
      chatSessionId,
      sender,
      content,
      memoryRef,
    },
  });

export const getSessionMessages = async (chatSessionId) =>
  await prisma.chatMessage.findMany({
    where: { chatSessionId },
    orderBy: { createdAt: 'asc' },
  });
