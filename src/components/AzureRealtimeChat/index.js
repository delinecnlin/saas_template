import { useState, useRef, useEffect } from 'react';

const AzureRealtimeChat = ({ initialMessages = [], initialResponse = '' }) => {
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState(initialResponse);
  const [messages, setMessages] = useState(initialMessages);
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
    console.log('[AzureRealtimeChat] requesting config');
    let res;
    try {
      res = await fetch('/api/realtime-config');
    } catch (err) {
      console.error('[AzureRealtimeChat] failed to reach realtime config', err);
      alert('Realtime config unreachable');
      return;
    }
    if (!res.ok) {
      alert('Failed to load realtime config');
      return;
    }
    const { endpoint, apiKey, deployment } = await res.json();
    const webrtcUrl = endpoint;
    const ephemeralKey = apiKey;
    const model = deployment;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    pc.ontrack = (event) => {
      remoteAudio.srcObject = event.streams[0];
    };

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('[AzureRealtimeChat] microphone access denied', err);
      alert('Microphone access denied');
      return;
    }

    localStreamRef.current = localStream;
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;

    dc.addEventListener('open', () => {
      console.log('[AzureRealtimeChat] data channel open');
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
          setMessages((prev) => {
            const updated = [...prev, { role: 'user', content: transcriptRef.current }];
            saveConversation(updated);
            return updated;
          });
          transcriptRef.current = '';
        } else if (msg.type === 'response.text.delta') {
          responseRef.current += msg.delta;
          setResponse(responseRef.current);
        } else if (msg.type === 'response.done') {
          if (responseRef.current) {
            setMessages((prev) => {
              const updated = [...prev, { role: 'assistant', content: responseRef.current }];
              saveConversation(updated);
              return updated;
            });
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
    console.log('[AzureRealtimeChat] sending SDP offer');

    let sdpResponse;
    try {
      sdpResponse = await fetch(`${webrtcUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });
    } catch (err) {
      console.error('[AzureRealtimeChat] failed to send SDP offer', err);
      alert('Failed to connect to realtime service');
      return;
    }

    if (!sdpResponse.ok) {
      alert('Realtime service rejected SDP offer');
      return;
    }

    const answer = { type: 'answer', sdp: await sdpResponse.text() };
    await pc.setRemoteDescription(answer);
    console.log('[AzureRealtimeChat] connection established');

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
    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveConversation(updated);
      return updated;
    });
    setInput('');
    const res = await fetch('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => {
          const updated = [...prev, { role: 'assistant', content: data.reply }];
          saveConversation(updated);
          return updated;
        });
        const utter = new SpeechSynthesisUtterance(data.reply);
        speechSynthesis.speak(utter);
      }
    } else if (res.status === 401) {
      alert('Please log in to send messages');
    }
  };

  const saveConversation = async (msgs) => {
    try {
      await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch (e) {
      console.error('Failed to save conversation', e);
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
            <div className="flex flex-col max-w-lg">
              <span className="text-xs text-gray-500 mb-1">
                {m.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <div
                className={`px-3 py-2 rounded-lg whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border'
                }`}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {response && (
          <div className="flex justify-start">
            <div className="flex flex-col max-w-lg">
              <span className="text-xs text-gray-500 mb-1">Assistant</span>
              <div className="px-3 py-2 rounded-lg whitespace-pre-line bg-white text-gray-900 border">
                {response}
              </div>
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

export default AzureRealtimeChat;

