import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/server/auth';
import prisma from '@/prisma/index';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PATCH') {
    const { email, subscriptionType } = req.body;
    await prisma.customerPayment.update({
      where: { email },
      data: { subscriptionType },
    });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
