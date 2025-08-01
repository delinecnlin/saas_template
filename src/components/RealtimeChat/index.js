import { useState, useRef } from 'react';

const RealtimeChat = () => {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState('');
  const mediaRecorderRef = useRef(null);
  const abortRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch('/api/chat/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'audio/webm' },
        body: blob,
        signal: controller.signal,
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let txt = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const str = decoder.decode(value);
        str.split('\n').forEach(line => {
          if (line.startsWith('data:')) {
            const data = line.replace('data:', '').trim();
            if (data && data !== '[DONE]') {
              try {
                const json = JSON.parse(data);
                txt += json.choices?.[0]?.delta?.content || '';
              } catch {
                txt += data;
              }
            }
          }
        });
        setResponse(txt);
      }
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const interrupt = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={recording ? stopRecording : startRecording} className="px-4 py-2 bg-blue-500 text-white rounded">
        {recording ? 'Stop' : 'Record'}
      </button>
      <button onClick={interrupt} disabled={!abortRef.current} className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50">
        Interrupt
      </button>
      <pre className="p-2 bg-gray-100 rounded whitespace-pre-wrap">{response}</pre>
    </div>
  );
};

export default RealtimeChat;
