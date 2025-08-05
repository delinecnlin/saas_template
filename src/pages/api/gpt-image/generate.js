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

  const { prompt, size = '1024x1024' } = req.body || {};
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ prompt, size }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Image generation error', text);
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const data = await resp.json();
    const b64 = data.data?.[0]?.b64_json || '';
    return res.status(200).json({ b64 });
  } catch (err) {
    console.error('Image generation exception', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
