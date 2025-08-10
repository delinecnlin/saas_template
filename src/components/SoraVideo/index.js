import { useState, useRef, useEffect } from 'react';

const SoraVideo = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [seconds, setSeconds] = useState(5);
  const [variants, setVariants] = useState(1);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPoll = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/sora/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (data.status === 'succeeded') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          const url =
            data.data?.generations?.[0]?.output?.[0]?.assets?.video ||
            data.data?.generations?.[0]?.assets?.video ||
            data.data?.result?.data?.[0]?.url ||
            data.data?.result?.data?.[0]?.asset_url;
          if (url) setVideoUrl(url);
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        console.error('Failed to poll status', e);
      }
    }, 5000);
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus('');
    setVideoUrl('');
    try {
      const res = await fetch('/api/sora/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          width,
          height,
          n_seconds: seconds,
          n_variants: variants,
        }),
      });
      if (res.status === 401) {
        alert('Please log in to generate videos');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
        startPoll(data.jobId);
      } else {
        alert(data.error || 'Failed to start video generation');
      }
    } catch (err) {
      console.error('Sora generate error', err);
      alert('Failed to start video generation');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full border rounded p-2"
        rows={3}
        placeholder="Describe the video you want..."
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className="border rounded p-2"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          placeholder="Width"
        />
        <input
          type="number"
          className="border rounded p-2"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          placeholder="Height"
        />
        <input
          type="number"
          className="border rounded p-2"
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
          placeholder="Seconds"
        />
        <input
          type="number"
          className="border rounded p-2"
          value={variants}
          onChange={(e) => setVariants(Number(e.target.value))}
          placeholder="Variants"
        />
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Video'}
      </button>
      {status && <div>Status: {status}</div>}
      {videoUrl && (
        <div className="space-y-2">
          <video controls className="w-full rounded">
            <source src={videoUrl} type="video/mp4" />
          </video>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Open video in new tab
          </a>
        </div>
      )}
    </div>
  );
};

export default SoraVideo;
