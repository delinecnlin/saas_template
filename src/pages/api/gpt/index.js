import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { getGptConfig, gptDefaultParams } from '@/lib/server/azureConfig';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { messages = [], model = 'gpt-4o', params = {} } = req.body || {};
  const { apiKey, endpoint, deployment, apiVersion } = getGptConfig(model);

  const {
    temperature = gptDefaultParams.temperature,
    top_p = gptDefaultParams.top_p,
    frequency_penalty = gptDefaultParams.frequency_penalty,
    presence_penalty = gptDefaultParams.presence_penalty,
    max_tokens = gptDefaultParams.max_tokens,
  } = params;

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const body = {
      messages,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      max_tokens,
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Azure OpenAI chat error', text);
      return res.status(500).json({ error: 'Failed to generate reply' });
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Azure OpenAI chat exception', err);
    return res.status(500).json({ error: 'Failed to generate reply' });
  }
}
