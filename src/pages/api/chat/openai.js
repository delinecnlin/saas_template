import axios from 'axios';
import { addMemories, searchMemories } from '@/lib/server/mem0';
import { validateSession } from '@/config/api-validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await validateSession(req, res);
  if (!session) return; // validateSession already handled response

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing messages' });
    return;
  }

  const query = messages[messages.length - 1].content;
  const memories = await searchMemories(query, {
    user_id: session.user.userId,
    limit: 5,
  });

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint || !deployment || !apiKey) {
    res.status(500).json({ error: 'Azure OpenAI environment not configured' });
    return;
  }

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
    const response = await axios.post(
      url,
      {
        messages: [...memories.map(m => ({ role: m.role, content: m.content })), ...messages],
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || '';

    await addMemories([...messages, { role: 'assistant', content: reply }], {
      user_id: session.user.userId,
    });

    res.status(200).json({ reply, memories });
  } catch (e) {
    console.error('[API] openai chat error:', e && e.response ? e.response.data : e);
    res.status(500).json({ error: e.message, detail: e && e.response ? e.response.data : undefined });
  }
}
