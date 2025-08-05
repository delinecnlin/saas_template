import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { gptDefaultParams } from '@/lib/server/azureConfig';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json(gptDefaultParams);
}
