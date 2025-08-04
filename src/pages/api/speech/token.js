import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const region = process.env.AZURE_SPEECH_REGION;
    const key = process.env.AZURE_SPEECH_KEY;
    const resp = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key },
    });
    const token = await resp.text();
    return res.status(200).json({ token, region });
  } catch (err) {
    console.error('Speech token error', err);
    return res.status(500).json({ error: 'Failed to fetch token' });
  }
}
