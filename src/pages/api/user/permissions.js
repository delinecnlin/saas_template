import prisma from '@/prisma/index';
import rules from '@/config/subscription-rules/index';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const customerPayment = await prisma.customerPayment.findUnique({
      where: { customerId: session.user.id },
      select: { subscriptionType: true },
    });

    const subscriptionType = customerPayment?.subscriptionType || 'FREE';
    const subscriptionRules = rules[subscriptionType];

    res.status(200).json(subscriptionRules);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'An error occurred while fetching permissions.' });
  }
}
