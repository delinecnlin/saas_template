import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { getImageConfig } from '@/lib/server/azureConfig';

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
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
  } = req.body || {};
  const { endpoint, deployment, apiKey, apiVersion } = getImageConfig();

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ prompt, size, quality, style }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Image generation error', text);
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const data = await resp.json();
    const first = data.data?.[0] || {};
    const b64 = first.b64_json || '';
    const urlOut = first.url || '';
    return res.status(200).json({ b64, url: urlOut });
  } catch (err) {
    console.error('Image generation exception', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
