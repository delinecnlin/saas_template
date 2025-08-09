import { useState } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const AzureSpeechChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const voiceLocaleMap = {
    'en-US-JennyNeural': 'en-US',
    'zh-CN-XiaoxiaoNeural': 'zh-CN',
    'ja-JP-NanamiNeural': 'ja-JP',
  };
  const voices = Object.keys(voiceLocaleMap);
  const languages = [...new Set(Object.values(voiceLocaleMap))];
  const defaultVoice = process.env.NEXT_PUBLIC_AZURE_SPEECH_VOICE || voices[0];
  const [voice, setVoice] = useState(defaultVoice);
  const [inputLanguage, setInputLanguage] = useState(
    voiceLocaleMap[defaultVoice] || languages[0]
  );

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
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(data.token, data.region);
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
    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const res = await fetch('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.reply || '';
      const updated = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(updated);
      speak(reply);
    } else {
      alert('Failed to get reply');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
    }
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
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto border rounded p-2 space-y-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-2 py-1 rounded bg-gray-200">
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
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
      </form>
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
  );
};

export default AzureSpeechChat;

