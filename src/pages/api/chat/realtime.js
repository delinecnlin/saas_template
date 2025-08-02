import { AzureOpenAI } from 'openai';
import { OpenAIRealtimeWS } from 'openai/beta/realtime/ws';
import validateSession from '@/config/api-validation/session';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  let rt;
  const close = () => {
    if (rt) rt.close();
    res.end();
  };

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

    if (!endpoint || !deployment || !apiKey) {
      res.status(500).json({ error: 'Azure OpenAI realtime not configured' });
      return;
    }

    const azureClient = new AzureOpenAI({
      apiKey,
      azure: { endpoint, deploymentName: deployment, apiVersion },
    });

    rt = await OpenAIRealtimeWS.azure(azureClient);

    req.on('aborted', () => {
      console.warn('Realtime request aborted');
      close();
    });

    rt.send({
      type: 'session.update',
      session: {
        turn_detection: {
          type: 'server_vad',
          create_response: true,
        },
      },
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    rt.on('response.text.delta', (event) => {
      res.write(`data: ${JSON.stringify({ text: event.delta })}\n\n`);
    });

    rt.on('conversation.item.input_audio_transcription.delta', (event) => {
      res.write(`event: transcript\ndata: ${JSON.stringify({ delta: event.delta })}\n\n`);
    });

    rt.on('conversation.item.input_audio_transcription.completed', (event) => {
      res.write(`event: transcript_done\ndata: ${JSON.stringify({ transcript: event.transcript })}\n\n`);
    });

    rt.on('response.done', () => {
      res.write('event: done\ndata: {}\n\n');
      close();
    });

    rt.on('error', (err) => {
      console.error('Realtime stream error:', err);
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      close();
    });

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const base64Audio = audioBuffer.toString('base64');

    rt.send({ type: 'input_audio_buffer.append', audio: base64Audio });
  } catch (err) {
    console.error('Realtime API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
    if (rt) rt.close();
  }
}
