import { useState } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const SpeechTools = () => {
  const [text, setText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);

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

  const speak = async () => {
    const data = await getToken();
    if (!data) return;
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(data.token, data.region);
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

  const transcribe = async () => {
    const data = await getToken();
    if (!data) return;
    setRecording(true);
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(data.token, data.region);
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognizeOnceAsync((result) => {
      setTranscript(result.text);
      recognizer.close();
      setRecording(false);
    });
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border rounded p-2"
        rows={3}
        placeholder="Text to speak..."
      />
      <div className="flex space-x-2">
        <button onClick={speak} className="px-4 py-2 bg-blue-600 text-white rounded">
          Speak
        </button>
        <button
          onClick={transcribe}
          disabled={recording}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {recording ? 'Listening...' : 'Transcribe'}
        </button>
      </div>
      {transcript && <div className="p-2 border rounded">{transcript}</div>}
    </div>
  );
};

export default SpeechTools;
