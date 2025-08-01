import validateSession from '@/config/api-validation/session';

export const config = {
  api: {
    bodyParser: false,
  },
};

const transcribeAudio = async (audioBuffer) => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return '';
  try {
    const resp = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
          'Ocp-Apim-Subscription-Key': key,
        },
        body: audioBuffer,
      }
    );
    const data = await resp.json();
    return data.DisplayText || '';
  } catch (e) {
    console.error('[Azure Speech] transcribe error:', e);
    return '';
  }
};

export default async function handler(req, res) {
  const session = await validateSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  if (!endpoint || !apiKey || !deployment) {
    res.status(500).json({ error: 'Azure OpenAI not configured' });
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const audioBuffer = Buffer.concat(chunks);

  const userContent = await transcribeAudio(audioBuffer);

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const azureRes = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: userContent }], stream: true }),
      signal: controller.signal,
    }
  );

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const decoder = new TextDecoder();
  for await (const chunk of azureRes.body) {
    const lines = decoder.decode(chunk).split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('data:')) {
        const data = trimmed.replace(/^data:\s*/, '');
        res.write(`data: ${data}\n\n`);
      }
    }
  }
  res.end();
}
