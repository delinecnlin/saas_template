import { hasPermission } from '@/lib/server/permissions';
import { publishStory, saveStory } from '@/prisma/services/story';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const canAccess = await hasPermission(req, 'hasStoryFeature');
  if (!canAccess) {
    res.status(403).json({ error: 'Your current plan does not have access to this feature.' });
    return;
  }

  const { childId, title, content, storyId } = req.body;
  if (!childId || !content) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  try {
    if (storyId) {
      await publishStory(storyId, content);
      res.status(200).json({ id: storyId, status: 'published' });
    } else {
      const story = await saveStory(childId, title || '', content, 'published');
      res.status(200).json(story);
    }
  } catch (e) {
    console.error('[API] story/save error:', e);
    res.status(500).json({ error: e.message });
  }
}
