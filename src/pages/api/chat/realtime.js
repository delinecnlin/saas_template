import { validateSession } from '@/config/api-validation';

export default async function handler(req, res) {
  try {
    console.log('[API] /api/chat/realtime');
    const session = await validateSession(req, res);
    if (!session) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const endpoint = process.env.AZURE_OPENAI_REALTIME_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
    const apiKey =
      process.env.AZURE_OPENAI_REALTIME_KEY ||
      process.env.AZURE_OPENAI_API_KEY ||
      process.env.AZURE_REALTIME_KEY;
    const apiVersion =
      process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';
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

    const webrtcUrl = `https://${region}.realtimeapi-preview.ai.azure.com/v1/realtimertc`;
    console.log('[API] returning WebRTC URL:', webrtcUrl);

    res.status(200).json({
      ephemeralKey: data?.client_secret?.value,
      sessionId: data?.id,
      webrtcUrl,
      model: deployment,
    });
  } catch (err) {
    console.error('[API] Realtime session error:', err);
    res
      .status(500)
      .json({ error: err.message || 'Internal Server Error', step: 'session' });
  }
}
