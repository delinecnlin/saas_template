import { hasPermission } from '@/lib/server/permissions';
import { addMemories, searchMemories } from '@/lib/server/mem0';

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

  const { childId, message } = req.body;
  if (!childId || !message) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  try {
    const memories = await searchMemories(message, { user_id: childId, limit: 5 });
    // TODO: integrate actual LLM call using memories and message
    const story = `Once upon a time...`; // placeholder
    await addMemories([{ role: 'user', content: message }, { role: 'assistant', content: story }], { user_id: childId });
    res.status(200).json({ story, memories });
  } catch (e) {
    console.error('[API] story/generate error:', e);
    res.status(500).json({ error: e.message });
  }
}
