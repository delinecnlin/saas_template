import { validateSession } from '@/config/api-validation';
import { createChild } from '@/prisma/services/child';

export default async function handler(req, res) {
  const { method } = req;
  if (method !== 'POST') {
    res.status(405).json({ error: `${method} method unsupported` });
    return;
  }
  const session = await validateSession(req, res);
  const { name, birthDate, preferences } = req.body;
  const child = await createChild(
    session.user.userId,
    name,
    new Date(birthDate),
    preferences
  );
  res.status(200).json({ data: { child } });
}
