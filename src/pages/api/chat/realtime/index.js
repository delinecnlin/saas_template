import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  const model = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
  const endpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  const region = process.env.AZURE_OPENAI_REALTIME_REGION;

  try {
    const resp = await fetch(
      `${endpoint}/openai/realtime/sessions?api-version=${apiVersion}`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_REALTIME_KEY || process.env.AZURE_OPENAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model }),
      },
    );


    if (!resp.ok) {
      const text = await resp.text();
      console.error('Failed to create realtime session', text);
      return res.status(500).json({ error: 'Failed to create realtime session' });
    }

    const data = await resp.json();

    const ephemeralKey = data.key || data?.client_secret?.value;
    const webrtcUrl = `https://${region}.realtimeapi-preview.ai.azure.com/v1/realtimertc`;


    return res.status(200).json({ ephemeralKey, webrtcUrl, model });
  } catch (err) {
    console.error('Realtime session error', err);
    return res.status(500).json({ error: 'Failed to create realtime session' });
  }
}
