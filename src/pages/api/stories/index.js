import { validateSession } from '@/config/api-validation';
import { hasPermission } from '@/lib/server/permissions';
import { addMemory } from '@/lib/server/memory';
import { createStory, getStories } from '@/prisma/services/story';

export default async function handler(req, res) {
  const { method } = req;
  const session = await validateSession(req, res);
  const canAccess = await hasPermission(req, 'hasStoryFeature');
  if (!canAccess) {
    res.status(403).json({ error: 'Your current plan does not have access to this feature.' });
    return;
  }

  if (method === 'GET') {
    const stories = await getStories(session.user.userId);
    res.status(200).json({ stories });
  } else if (method === 'POST') {
    const { title, content, parentStoryId } = req.body || {};
    const story = await createStory(session.user.userId, title, content, parentStoryId);
    try {
      await addMemory([{ role: 'assistant', content }], { user_id: session.user.userId });
    } catch (e) {
      console.error('[mem0] add memory error:', e.message);
    }
    res.status(200).json({ story });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
