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

  const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview';

  try {
    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Failed to create realtime session', text);
      return res.status(500).json({ error: 'Failed to create realtime session' });
    }

    const data = await resp.json();
    const ephemeralKey = data?.client_secret?.value;
    const webrtcUrl = 'https://api.openai.com/v1/realtime';

    return res.status(200).json({ ephemeralKey, webrtcUrl, model });
  } catch (err) {
    console.error('Realtime session error', err);
    return res.status(500).json({ error: 'Failed to create realtime session' });
  }
}
