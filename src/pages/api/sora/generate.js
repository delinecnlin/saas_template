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

  const {
    prompt,
    width = 1080,
    height = 1080,
    n_seconds = 5,
    n_variants = 1,
  } = req.body || {};

  try {
    const body = {
      prompt,
      n_variants: String(n_variants),
      n_seconds: String(n_seconds),
      width: String(width),
      height: String(height),
      model: process.env.SORA_MODEL || 'sora',
    };

    const resp = await fetch(process.env.SORA_API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.SORA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Sora generate failed', text);
      return res
        .status(500)
        .json({ error: text || 'Failed to start video generation' });
    }

    const data = await resp.json();
    if (data.error) {
      const msg = data.error?.message || data.error;
      console.error('Sora generate returned error', msg);
      return res.status(500).json({ error: msg });
    }
    return res.status(200).json({ jobId: data.id, status: data.status, data });
  } catch (err) {
    console.error('Sora generate error', err);
    return res.status(500).json({ error: 'Failed to start video generation' });
  }
}
