import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import OpenAI from 'openai';

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
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const img = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size,
    });
    const b64 = img.data?.[0]?.b64_json;
    return res.status(200).json({ b64 });
  } catch (err) {
    console.error('Image generation error', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
