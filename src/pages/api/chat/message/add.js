import { validateSession } from '@/config/api-validation';
import { addMessage } from '@/prisma/services/chat';

export default async function handler(req, res) {
  const { method } = req;
  if (method !== 'POST') {
    res.status(405).json({ error: `${method} method unsupported` });
    return;
  }
  await validateSession(req, res);
  const { chatSessionId, sender, content, memoryRef } = req.body;
  const message = await addMessage(chatSessionId, sender, content, memoryRef);
  res.status(200).json({ data: { message } });
}
