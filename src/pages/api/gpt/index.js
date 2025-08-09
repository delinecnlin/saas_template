import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    messages = [],
    provider = 'flowise',
    flowiseConfig = {},
    difyConfig = {},
  } = req.body || {};

  const lastMsg = messages.filter((m) => m.role === 'user').slice(-1)[0];
  const question = lastMsg?.content || '';

  try {
    if (provider === 'flowise') {
      const {
        apiUrl = process.env.FLOWISE_URL,
        chatflowId = process.env.FLOWISE_CHATFLOW_ID,
        apiKey = process.env.FLOWISE_API_KEY,
      } = flowiseConfig;

      if (!apiUrl || !chatflowId) {
        return res
          .status(400)
          .json({ error: 'Missing Flowise URL or chatflow ID' });
      }
      const url = `${apiUrl}/api/v1/prediction/${chatflowId}`;
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const body = { question, history: messages };
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error('Flowise chat error', text);
        return res.status(500).json({ error: 'Failed to generate reply' });
      }
      const data = await resp.json();
      const reply =
        data.answer || data.text || data.data || data.output || '';
      return res.status(200).json({ reply });
    }

    if (provider === 'dify') {
      const {
        apiKey = process.env.DIFY_API_KEY,
        apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1',
        conversation_id,
      } = difyConfig;

      if (!apiKey) {
        return res.status(400).json({ error: 'Missing Dify API key' });
      }

      const url = `${apiUrl}/chat-messages`;
      const body = { inputs: {}, query: question };
      if (conversation_id) body.conversation_id = conversation_id;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error('Dify chat error', text);
        return res.status(500).json({ error: 'Failed to generate reply' });
      }
      const data = await resp.json();
      const reply = data.answer || data.output || '';
      return res
        .status(200)
        .json({ reply, conversation_id: data.conversation_id });
    }

    return res.status(400).json({ error: 'Invalid provider' });
  } catch (err) {
    console.error('Chat exception', err);
    return res.status(500).json({ error: 'Failed to generate reply' });
  }
}
