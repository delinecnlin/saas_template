import { validateSession } from '@/config/api-validation';
import { hasPermission } from '@/lib/server/permissions';
import { searchMemory } from '@/lib/server/memory';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await validateSession(req, res);
  const canAccess = await hasPermission(req, 'hasStoryFeature');
  if (!canAccess) {
    res.status(403).json({ error: 'Your current plan does not have access to this feature.' });
    return;
  }

  const { prompt } = req.body || {};
  let memories = [];
  try {
    const result = await searchMemory(prompt, { user_id: session.user.userId, limit: 5 });
    memories = result?.results || [];
  } catch (e) {
    console.error('[mem0] search error:', e.message);
  }
  const memoryText = memories.map((m) => m.memory).join(' ');
  const story = `Once upon a time, ${memoryText || prompt || 'a new adventure'}.`;
  res.status(200).json({ story });
}
