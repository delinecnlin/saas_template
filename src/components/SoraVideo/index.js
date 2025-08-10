import { useState, useRef, useEffect } from 'react';

const SoraVideo = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState('1080x1080');
  const [seconds, setSeconds] = useState(5);
  const [variants, setVariants] = useState(1);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPoll = (jobId) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/sora/status/${jobId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Failed to get job status');
          clearInterval(pollRef.current);
          pollRef.current = null;
          return;
        }
        const data = await res.json();
        setStatus(data.status);
        if (data.status === 'succeeded') {
          const url =
            data.url ||
            data.data?.generations?.[0]?.output?.[0]?.assets?.video ||
            data.data?.generations?.[0]?.assets?.video ||
            data.data?.result?.data?.[0]?.url ||
            data.data?.result?.data?.[0]?.asset_url;
          if (url) {
            setVideoUrl(url);
            clearInterval(pollRef.current);
            pollRef.current = null;
          } else if (attempts > 12) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          const err =
            data.error ||
            data.data?.error?.message ||
            data.data?.error ||
            data.data?.status_information;
          if (err) {
            console.error('Sora job failed', err);
            setError(err);
          }
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
    setError('');
    try {
      const [width, height] = resolution.split('x').map(Number);
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
        const msg = data.error || 'Failed to start video generation';
        setError(msg);
        alert(msg);
      }
    } catch (err) {
      console.error('Sora generate error', err);
      setError('Failed to start video generation');
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          className="border rounded p-2"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        >
          <option value="1080x1080">1080x1080</option>
          <option value="1920x1080">1920x1080</option>
          <option value="1080x1920">1080x1920</option>
          <option value="1280x720">1280x720</option>
        </select>
        <select
          className="border rounded p-2"
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        >
          <option value={5}>5s</option>
          <option value={10}>10s</option>
          <option value={15}>15s</option>
        </select>
        <select
          className="border rounded p-2"
          value={variants}
          onChange={(e) => setVariants(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Video'}
      </button>
      {status && <div>Status: {status}</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
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
