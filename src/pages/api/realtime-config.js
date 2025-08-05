import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { getRealtimeConfig } from '@/lib/server/azureConfig';

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

  const { endpoint, deployment, apiKey, region, apiVersion } = getRealtimeConfig();

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
