export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[API] /api/chat/realtime invoked');

  const endpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';
  const region = process.env.AZURE_OPENAI_REALTIME_REGION;

  if (!endpoint) {
    return res.status(500).json({ error: 'Missing AZURE_OPENAI_REALTIME_ENDPOINT' });
  }
  if (!deployment) {
    return res.status(500).json({ error: 'Missing AZURE_OPENAI_REALTIME_DEPLOYMENT' });
  }
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing AZURE_OPENAI_API_KEY' });
  }
  if (!region) {
    return res.status(500).json({ error: 'Missing AZURE_OPENAI_REALTIME_REGION' });
  }

  try {
    const url = `${endpoint}/openai/realtimeapi/sessions?api-version=${apiVersion}`;
    console.log('[API] requesting ephemeral key from', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: deployment, voice: 'verse' }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[API] ephemeral key request failed:', response.status, errText);
      return res
        .status(response.status)
        .json({ error: 'Failed to create ephemeral session', detail: errText });
    }

    const data = await response.json();
    console.log('[API] ephemeral key issued for session', data?.id);

    return res.status(200).json({
=======
import validateSession from '@/config/api-validation/session';

export default async function handler(req, res) {
  try {
    const session = await validateSession(req, res);
    if (!session) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const endpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';
    const region = process.env.AZURE_OPENAI_REALTIME_REGION;

    if (!endpoint || !deployment || !apiKey || !region) {
      res.status(500).json({ error: 'Azure OpenAI realtime not configured' });
      return;
    }

    const response = await fetch(
      `${endpoint}/openai/realtimeapi/sessions?api-version=${apiVersion}`,
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: deployment, voice: 'verse' }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: errText });
      return;
    }

    const data = await response.json();

    res.status(200).json({

      ephemeralKey: data?.client_secret?.value,
      sessionId: data?.id,
      webrtcUrl: `https://${region}.realtimeapi-preview.ai.azure.com/v1/realtimertc`,
      model: deployment,
    });
  } catch (err) {
    console.error('[API] Realtime session error:', err);
    return res
      .status(500)
      .json({ error: err.message || 'Internal Server Error', step: 'session' });

  }
}

