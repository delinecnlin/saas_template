import { useState, useRef, useEffect } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const voiceLocaleMap = {
  'en-US-JennyNeural': 'en-US',
  'zh-CN-XiaoxiaoNeural': 'zh-CN',
  'ja-JP-NanamiNeural': 'ja-JP',
};
const voices = Object.keys(voiceLocaleMap);
const languages = [...new Set(Object.values(voiceLocaleMap))];
const defaultVoice = process.env.NEXT_PUBLIC_AZURE_SPEECH_VOICE || voices[0];

const AzureTextChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voice, setVoice] = useState(defaultVoice);
  const [inputLanguage, setInputLanguage] = useState(
    voiceLocaleMap[defaultVoice] || languages[0]
  );
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getToken = async () => {
    const res = await fetch('/api/speech/token');
    if (res.status === 401) {
      alert('Please log in to use speech services');
      return null;
    }
    if (!res.ok) {
      alert('Failed to fetch speech token');
      return null;
    }
    return res.json();
  };

  const speak = async (text) => {
    const data = await getToken();
    if (!data) return;
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
      data.token,
      data.region
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      () => synthesizer.close(),
      (err) => {
        console.error('speak error', err);
        synthesizer.close();
      }
    );
  };

  const sendMessage = async (content) => {
    if (!content) return;
    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.reply) {
        const updated = [...history, { role: 'assistant', content: data.reply }];
        setMessages(updated);
        speak(data.reply);
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const startRecording = async () => {
    const data = await getToken();
    if (!data) return;
    setRecording(true);
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
      data.token,
      data.region
    );
    speechConfig.speechRecognitionLanguage = inputLanguage;
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognizeOnceAsync((result) => {
      setRecording(false);
      recognizer.close();
      if (result.text) {
        sendMessage(result.text);
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-3 py-2 rounded-lg max-w-lg whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          input.trim() && sendMessage(input.trim());
        }}
        className="mt-4 space-y-2"
      >
        <div className="flex items-center space-x-2">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              !e.shiftKey &&
              (e.preventDefault(), input.trim() && sendMessage(input.trim()))
            }
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
          <button
            type="button"
            onClick={startRecording}
            disabled={recording}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {recording ? 'Listening...' : 'Speak'}
          </button>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm mb-1">Input language</label>
            <select
              value={inputLanguage}
              onChange={(e) => setInputLanguage(e.target.value)}
              className="border rounded p-2"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="border rounded p-2"
            >
              {voices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AzureTextChat;

