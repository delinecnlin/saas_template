import { validateSession } from '@/config/api-validation';
import { createStory, updateStoryStatus } from '@/prisma/services/story';

export default async function handler(req, res) {
  const { method } = req;
  if (method !== 'POST') {
    res.status(405).json({ error: `${method} method unsupported` });
    return;
  }
  await validateSession(req, res);
  const { childId, title, content, parentStoryId, storyId, publish } = req.body;
  let story;
  if (storyId) {
    story = await updateStoryStatus(storyId, publish ? 'PUBLISHED' : 'DRAFT');
  } else {
    story = await createStory(childId, title, content, parentStoryId);
    if (publish) {
      story = await updateStoryStatus(story.id, 'PUBLISHED');
    }
  }
  res.status(200).json({ data: { story } });
}
