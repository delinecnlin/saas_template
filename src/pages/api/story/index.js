import { hasPermission } from '@/lib/server/permissions';
import { listStories } from '@/prisma/services/story';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const canAccess = await hasPermission(req, 'hasStoryFeature');
  if (!canAccess) {
    res.status(403).json({ error: 'Your current plan does not have access to this feature.' });
    return;
  }

  const { childId } = req.query;
  if (!childId) {
    res.status(400).json({ error: 'Missing childId' });
    return;
  }

  try {
    const stories = await listStories(childId);
    res.status(200).json(stories);
  } catch (e) {
    console.error('[API] story/index error:', e);
    res.status(500).json({ error: e.message });
  }
}
