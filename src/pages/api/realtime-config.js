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

  console.log('[API] /api/realtime-config');

  const endpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
  const apiKey = process.env.AZURE_REALTIME_KEY;
  const region = process.env.AZURE_OPENAI_REALTIME_REGION;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  try {
    const url = `${endpoint}?api-version=${apiVersion}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ model: deployment }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Failed to create realtime session', text);
      return res.status(500).json({ error: 'Failed to create realtime session' });
    }

    const data = await resp.json();
    const ephemeralKey = data?.client_secret?.value;
    const webrtcUrl = `https://${region}.realtimeapi-preview.ai.azure.com/v1/realtimertc`;

    return res.status(200).json({ endpoint: webrtcUrl, apiKey: ephemeralKey, deployment });
  } catch (err) {
    console.error('Realtime session error', err);
    return res.status(500).json({ error: 'Failed to create realtime session' });
  }
}
