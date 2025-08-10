import { useState, useRef, useEffect } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const voiceLocaleMap = {
  'zh-CN-XiaoxiaoNeural': 'zh-CN',
  'en-US-JennyNeural': 'en-US',
  'de-DE-KatjaNeural': 'de-DE',
  'ja-JP-NanamiNeural': 'ja-JP',
};
const voices = Object.keys(voiceLocaleMap);
const languages = [...new Set(Object.values(voiceLocaleMap))];
const defaultVoice =
  process.env.NEXT_PUBLIC_AZURE_SPEECH_VOICE || 'zh-CN-XiaoxiaoNeural';

const Waveform = ({ color = 'bg-green-500' }) => (
  <>
    <div className="flex items-end h-4 space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 ${color} wave-bar`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
    <style jsx>{`
      .wave-bar {
        animation: wave 1s infinite;
        transform-origin: bottom;
      }
      @keyframes wave {
        0% { height: 20%; }
        50% { height: 100%; }
        100% { height: 20%; }
      }
    `}</style>
  </>
);

const AzureTextChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voice, setVoice] = useState(defaultVoice);
  const [inputLanguage, setInputLanguage] = useState(
    voiceLocaleMap[defaultVoice] || languages[0]
  );
  const [provider, setProvider] = useState('flowise');
  const [flowiseUrl, setFlowiseUrl] = useState(
    process.env.NEXT_PUBLIC_FLOWISE_URL || ''
  );
  const [flowiseChatflowId, setFlowiseChatflowId] = useState(
    process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID || ''
  );
  const [flowiseApiKey, setFlowiseApiKey] = useState(
    process.env.NEXT_PUBLIC_FLOWISE_API_KEY || ''
  );
  const [difyApiKey, setDifyApiKey] = useState(
    process.env.NEXT_PUBLIC_DIFY_API_KEY || ''
  );
  const [savedNotice, setSavedNotice] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const storedProvider = localStorage.getItem('agentProvider');
    if (storedProvider) setProvider(storedProvider);
    const storedFlowise = localStorage.getItem('flowiseConfig');
    if (storedFlowise) {
      try {
        const cfg = JSON.parse(storedFlowise);
        setFlowiseUrl(cfg.apiUrl || '');
        setFlowiseChatflowId(cfg.chatflowId || '');
        setFlowiseApiKey(cfg.apiKey || '');
      } catch {}
    }
    const storedDify = localStorage.getItem('difyConfig');
    if (storedDify) {
      try {
        const cfg = JSON.parse(storedDify);
        setDifyApiKey(cfg.apiKey || '');
      } catch {}
    }
    const storedVoice = localStorage.getItem('voiceConfig');
    if (storedVoice) {
      try {
        const cfg = JSON.parse(storedVoice);
        if (cfg.voice) {
          setVoice(cfg.voice);
          setInputLanguage(
            cfg.inputLanguage || voiceLocaleMap[cfg.voice] || languages[0]
          );
        } else if (cfg.inputLanguage) {
          setInputLanguage(cfg.inputLanguage);
        }
      } catch {}
    }
  }, []);

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
    synthRef.current = synthesizer;
    setSpeaking(true);
    return new Promise((resolve) => {
      synthesizer.speakTextAsync(
        text,
        () => {
          synthesizer.close();
          if (synthRef.current === synthesizer) synthRef.current = null;
          setSpeaking(false);
          resolve();
        },
        (err) => {
          console.error('speak error', err);
          synthesizer.close();
          if (synthRef.current === synthesizer) synthRef.current = null;
          setSpeaking(false);
          resolve();
        }
      );
    });
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (synthRef.current) {
      synthRef.current.close();
      synthRef.current = null;
    }
    setVoiceMode(false);
    setRecording(false);
    setSpeaking(false);
    setSubmitting(false);
  };

  const recognizeOnce = async () => {
    const data = await getToken();
    if (!data) return null;
    setRecording(true);
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
      data.token,
      data.region
    );
    speechConfig.speechRecognitionLanguage = inputLanguage;
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    return new Promise((resolve) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          setRecording(false);
          recognizer.close();
          resolve(result.text);
        },
        () => {
          setRecording(false);
          recognizer.close();
          resolve(null);
        }
      );
    });
  };

  const voiceLoop = async () => {
    if (!voiceMode) return;
    const text = await recognizeOnce();
    if (text) {
      await sendMessage(text);
    }
    if (voiceMode) voiceLoop();
  };

  const startVoiceMode = () => {
    if (voiceMode) return;
    setVoiceMode(true);
    voiceLoop();
  };

  const saveSettings = () => {
    localStorage.setItem('agentProvider', provider);
    localStorage.setItem(
      'flowiseConfig',
      JSON.stringify({
        apiUrl: flowiseUrl,
        chatflowId: flowiseChatflowId,
        apiKey: flowiseApiKey,
      })
    );
    localStorage.setItem(
      'difyConfig',
      JSON.stringify({ apiKey: difyApiKey })
    );
    localStorage.setItem(
      'voiceConfig',
      JSON.stringify({ voice, inputLanguage })
    );
    setSavedNotice('Saved');
    setTimeout(() => setSavedNotice(''), 2000);
  };

  const sendMessage = async (content) => {
    if (!content) return;
    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSubmitting(true);
    try {
      const body = {
        messages: history,
        provider,
      };
      if (provider === 'flowise') {
        body.flowiseConfig = {};
        if (flowiseUrl) body.flowiseConfig.apiUrl = flowiseUrl;
        if (flowiseChatflowId)
          body.flowiseConfig.chatflowId = flowiseChatflowId;
        if (flowiseApiKey) body.flowiseConfig.apiKey = flowiseApiKey;
        console.log('Sending Flowise chat request', body);
      } else if (provider === 'dify') {
        body.difyConfig = {};
        if (difyApiKey) body.difyConfig.apiKey = difyApiKey;
        if (conversationId)
          body.difyConfig.conversation_id = conversationId;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      abortRef.current = null;
      const data = await res.json();
      if (!res.ok) {
        console.error('Chat error', data.error || res.statusText);
        return;
      }
      if (provider === 'flowise') {
        console.log('Received Flowise chat response', data);
      }
      if (data.reply) {
        const updated = [...history, { role: 'assistant', content: data.reply }];
        setMessages(updated);
        if (voiceMode) {
          await speak(data.reply);
        }
      }
      if (provider === 'dify' && data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm mb-1">Agent Provider</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="provider"
                value="flowise"
                checked={provider === 'flowise'}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setConversationId(null);
                }}
              />
              <span>Flowise</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="provider"
                value="dify"
                checked={provider === 'dify'}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setConversationId(null);
                }}
              />
              <span>Dify</span>
            </label>
            <button
              type="button"
              onClick={saveSettings}
              className="px-2 py-1 border rounded"
            >
              Save
            </button>
            {savedNotice && (
              <span className="text-sm text-green-600">{savedNotice}</span>
            )}
          </div>
        </div>
        {provider === 'flowise' && (
          <div className="space-y-2 border p-2 rounded">
            <div className="text-sm font-semibold">Flowise Settings</div>
            <input
              className="border rounded p-2 w-full"
              placeholder="Flowise URL"
              value={flowiseUrl}
              onChange={(e) => setFlowiseUrl(e.target.value)}
            />
            <input
              className="border rounded p-2 w-full"
              placeholder="Flowise Chatflow ID"
              value={flowiseChatflowId}
              onChange={(e) => setFlowiseChatflowId(e.target.value)}
            />
            <input
              className="border rounded p-2 w-full"
              placeholder="Flowise API Key (optional)"
              value={flowiseApiKey}
              onChange={(e) => setFlowiseApiKey(e.target.value)}
            />
          </div>
        )}
        {provider === 'dify' && (
          <div className="space-y-2 border p-2 rounded">
            <div className="text-sm font-semibold">Dify Settings</div>
            <input
              className="border rounded p-2 w-full"
              placeholder="Dify API Key"
              value={difyApiKey}
              onChange={(e) => setDifyApiKey(e.target.value)}
            />
          </div>
        )}
      </div>
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
            disabled={voiceMode}
          />
          {!voiceMode && input.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Send
            </button>
          )}
          {voiceMode && (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={startVoiceMode}
            disabled={voiceMode || isSubmitting}
            className="p-2 bg-blue-600 text-white rounded disabled:opacity-50"
            aria-label="Start voice chat"
          >
            🎤
          </button>
        </div>
        {(recording || speaking) && (
          <div className="mt-2">
            {recording && <Waveform color="bg-green-500" />}
            {speaking && <Waveform color="bg-blue-500" />}
          </div>
        )}
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

