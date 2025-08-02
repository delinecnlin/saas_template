import { useState, useRef, useEffect } from 'react';

const RealtimeChat = () => {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const responseRef = useRef('');
  const transcriptRef = useRef('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, response]);

  const startRecording = async () => {
    const res = await fetch('/api/chat/realtime', { method: 'POST' });
    if (!res.ok) return;
    const { ephemeralKey, webrtcUrl, model } = await res.json();

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    pc.ontrack = (event) => {
      remoteAudio.srcObject = event.streams[0];
    };

    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = localStream;
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;

    dc.addEventListener('open', () => {
      dc.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: { type: 'server_vad', create_response: true },
          },
        })
      );
    });

    dc.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'conversation.item.input_audio_transcription.delta') {
          transcriptRef.current += msg.delta;
        } else if (msg.type === 'conversation.item.input_audio_transcription.completed') {
          setMessages((prev) => [...prev, { role: 'user', content: transcriptRef.current }]);
          transcriptRef.current = '';
        } else if (msg.type === 'response.text.delta') {
          responseRef.current += msg.delta;
          setResponse(responseRef.current);
        } else if (msg.type === 'response.done') {
          if (responseRef.current) {
            setMessages((prev) => [...prev, { role: 'assistant', content: responseRef.current }]);
            const utter = new SpeechSynthesisUtterance(responseRef.current);
            speechSynthesis.speak(utter);
          }
          responseRef.current = '';
          setResponse('');
        }
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(`${webrtcUrl}?model=${model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
    });

    const answer = { type: 'answer', sdp: await sdpResponse.text() };
    await pc.setRemoteDescription(answer);

    setRecording(true);
  };

  const endConversation = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setResponse('');
  };

  const sendText = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const res = await fetch('/api/chat/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });
    const data = await res.json();
    if (data.reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      const utter = new SpeechSynthesisUtterance(data.reply);
      speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <button
          onClick={recording ? endConversation : startRecording}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {recording ? 'End Conversation' : 'Start Conversation'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-3 py-2 rounded-lg max-w-lg whitespace-pre-line ${
                m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 border'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {response && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg max-w-lg whitespace-pre-line bg-white text-gray-900 border">
              {response}
            </div>
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

