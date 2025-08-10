import { useState } from 'react';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('vivid');

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImage('');
    try {
      const res = await fetch('/api/gpt-image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, quality, style }),
      });
      if (res.status === 401) {
        alert('Please log in to generate images');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        if (data.b64) {
          setImage(`data:image/png;base64,${data.b64}`);
        } else if (data.url) {
          setImage(data.url);
        } else {
          alert('Failed to generate image');
        }
      } else {
        alert(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Image generation error', err);
      alert('Failed to generate image');
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
        placeholder="Describe the image..."
      />
      <div className="grid grid-cols-3 gap-2">
        <select
          className="border rounded p-2"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="256x256">256x256</option>
          <option value="512x512">512x512</option>
          <option value="1024x1024">1024x1024</option>
        </select>
        <select
          className="border rounded p-2"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
        >
          <option value="standard">standard</option>
          <option value="hd">hd</option>
        </select>
        <select
          className="border rounded p-2"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          <option value="vivid">vivid</option>
          <option value="natural">natural</option>
        </select>
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>
      {image && (
        <div className="space-y-2">
          <img src={image} alt="Generated" className="max-w-full rounded" />
          <a
            href={image}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Open image in new tab
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
