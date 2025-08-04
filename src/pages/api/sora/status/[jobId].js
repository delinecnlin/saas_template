import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';

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
    return res.status(200).json({ status: data.status, data });
  } catch (err) {
    console.error('Sora status error', err);
    return res.status(500).json({ error: 'Failed to get job status' });
  }
}
