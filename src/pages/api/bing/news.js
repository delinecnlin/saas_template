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

  const { q = 'world' } = req.query;
  try {
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(q)}&count=5&mkt=en-US`;
    const resp = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Bing news error', text);
      return res.status(500).json({ error: 'Failed to fetch news' });
    }
    const data = await resp.json();
    return res.status(200).json({ articles: data.value || [] });
  } catch (err) {
    console.error('Bing news exception', err);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
}
