import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { getImageConfig } from '@/lib/server/azureConfig';
import fs from 'fs';
import path from 'path';

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
    quality = 'high',
    n = 1,
    output_format = 'png',
    output_compression = 100,
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
      body: JSON.stringify({
        prompt,
        size,
        quality,
        n,
        output_format,
        output_compression,
      }),
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
    let localUrl = '';
    try {
      const imagesDir = path.join(process.cwd(), 'public', 'generated', 'images');
      await fs.promises.mkdir(imagesDir, { recursive: true });
      const ext = `.${output_format}`;
      const fileName = `${Date.now()}${ext}`;
      const filePath = path.join(imagesDir, fileName);
      if (b64) {
        await fs.promises.writeFile(filePath, Buffer.from(b64, 'base64'));
        localUrl = `/generated/images/${fileName}`;
      } else if (urlOut) {
        const r = await fetch(urlOut);
        if (r.ok) {
          const arrayBuffer = await r.arrayBuffer();
          await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));
          localUrl = `/generated/images/${fileName}`;
        }
      }
    } catch (e) {
      console.error('Failed to save image', e);
    }
    return res.status(200).json({ b64, url: urlOut, localUrl });
  } catch (err) {
    console.error('Image generation exception', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
