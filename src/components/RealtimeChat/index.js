import { useState, useRef, useEffect } from 'react';

const RealtimeChat = () => {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const mediaRecorderRef = useRef(null);
  const abortRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, response]);

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
      let eventName = '';
      let transcript = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const str = decoder.decode(value);
        str.split('\n').forEach(line => {
          if (line.startsWith('event:')) {
            eventName = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            const data = line.replace('data:', '').trim();
            if (!data) return;
            if (eventName === 'transcript') {
              try { const json = JSON.parse(data); transcript += json.delta || ''; } catch {}
            } else if (eventName === 'transcript_done') {
              try { const json = JSON.parse(data); transcript += json.transcript || ''; } catch {}
              setMessages(prev => [...prev, { role: 'user', content: transcript }]);
              transcript = '';
            } else {
              try { const json = JSON.parse(data); txt += json.text || json.choices?.[0]?.delta?.content || ''; } catch { txt += data; }
              setResponse(txt);
            }
            eventName = '';
          }
        });
      }
      if (txt) {
        setMessages(prev => [...prev, { role: 'assistant', content: txt }]);
        const utter = new SpeechSynthesisUtterance(txt);
        speechSynthesis.speak(utter);
      }
      setResponse('');
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

  const sendText = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const res = await fetch('/api/chat/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });
    const data = await res.json();
    if (data.reply) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      const utter = new SpeechSynthesisUtterance(data.reply);
      speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="space-x-2">
        <button onClick={recording ? stopRecording : startRecording} className="px-4 py-2 bg-blue-500 text-white rounded">
          {recording ? 'Stop' : 'Record'}
        </button>
        <button onClick={interrupt} disabled={!abortRef.current} className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50">
          Interrupt
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-lg whitespace-pre-line ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 border'}`}>{m.content}</div>
          </div>
        ))}
        {response && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg max-w-lg whitespace-pre-line bg-white text-gray-900 border">{response}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendText())}
          className="flex-1 border rounded p-2"
          placeholder="Type your message..."
        />
        <button onClick={sendText} className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default RealtimeChat;
