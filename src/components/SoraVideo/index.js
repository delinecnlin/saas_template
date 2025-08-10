import { useState, useRef, useEffect } from 'react';

const SoraVideo = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [duration, setDuration] = useState(5);
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
            data.data?.generations?.[0]?.assets?.video;
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
          aspectRatio,
          resolution,
          duration,
          variants,
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
        <select
          className="border rounded p-2"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
        </select>
        <select
          className="border rounded p-2"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        >
          <option value="480p">480p</option>
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
        </select>
        <select
          className="border rounded p-2"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
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
      {videoUrl && (
        <video controls className="w-full rounded">
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default SoraVideo;
