import { validateSession } from '@/config/api-validation';
import { createChatSession } from '@/prisma/services/chat';

export default async function handler(req, res) {
  const { method } = req;
  if (method !== 'POST') {
    res.status(405).json({ error: `${method} method unsupported` });
    return;
  }
  await validateSession(req, res);
  const { childId } = req.body;
  const session = await createChatSession(childId);
  res.status(200).json({ data: { session } });
}
