import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';

function getDimensions(aspect, res) {
  const map = {
    '16:9': {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    },
    '9:16': {
      '480p': { width: 480, height: 854 },
      '720p': { width: 720, height: 1280 },
      '1080p': { width: 1080, height: 1920 },
    },
    '1:1': {
      '480p': { width: 480, height: 480 },
      '720p': { width: 720, height: 720 },
      '1080p': { width: 1080, height: 1080 },
    },
  };
  return map[aspect]?.[res] || { width: 720, height: 720 };
}

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
    aspectRatio = '16:9',
    resolution = '720p',
    duration = 5,
    variants = 1,
  } = req.body || {};

  try {
    const { width, height } = getDimensions(aspectRatio, resolution);
    const body = {
      prompt,
      n_variants: String(variants),
      n_seconds: String(duration),
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
      return res.status(500).json({ error: 'Failed to start video generation' });
    }

    const data = await resp.json();
    return res.status(200).json({ jobId: data.id, status: data.status, data });
  } catch (err) {
    console.error('Sora generate error', err);
    return res.status(500).json({ error: 'Failed to start video generation' });
  }
}
