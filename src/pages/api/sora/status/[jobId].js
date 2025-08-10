import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import fs from 'fs';
import path from 'path';

function findVideoUrl(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const value of Object.values(obj)) {
    if (
      typeof value === 'string' &&
      /^https?:/.test(value) &&
      /(\.mp4$|\.mov$|\.webm$)/i.test(value)
    ) {
      return value;
    }
    if (value && typeof value === 'object') {
      const nested = findVideoUrl(value);
      if (nested) return nested;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId } = req.query;

  try {
    const url = new URL(process.env.SORA_API_URL);
    url.pathname = url.pathname.replace(/jobs$/, `jobs/${jobId}`);
    const resp = await fetch(url.toString(), {
      headers: { 'Api-Key': process.env.SORA_API_KEY },
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Sora status failed', text);
      return res.status(500).json({ error: 'Failed to get job status' });
    }
    const data = await resp.json();
    const error = data.error?.message || data.error || data.status_information;
    if (data.status === 'failed' && error) {
      console.error('Sora job failed', error);
    }
    const videoUrl = findVideoUrl(data);
    let localUrl = '';
    if (data.status === 'succeeded' && videoUrl) {
      try {
        const r = await fetch(videoUrl);
        if (r.ok) {
          const arrayBuffer = await r.arrayBuffer();
          const videosDir = path.join(process.cwd(), 'public', 'generated', 'videos');
          await fs.promises.mkdir(videosDir, { recursive: true });
          const ext = path.extname(new URL(videoUrl).pathname) || '.mp4';
          const filePath = path.join(videosDir, `${jobId}${ext}`);
          await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));
          localUrl = `/generated/videos/${jobId}${ext}`;
        }
      } catch (e) {
        console.error('Failed to download video', e);
      }
    }
    return res
      .status(200)
      .json({ status: data.status, error, url: videoUrl, localUrl, data });
  } catch (err) {
    console.error('Sora status error', err);
    return res.status(500).json({ error: 'Failed to get job status' });
  }
}
