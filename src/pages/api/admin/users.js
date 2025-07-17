import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/server/auth';
import prisma from '@/prisma/index';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const users = await prisma.customerPayment.findMany({
    select: { email: true, subscriptionType: true },
  });

  res.json({ users });
}
