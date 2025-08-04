import { useState } from 'react';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImage('');
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.status === 401) {
        alert('Please log in to generate images');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok && data.b64) {
        setImage(`data:image/png;base64,${data.b64}`);
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
      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>
      {image && (
        <img src={image} alt="Generated" className="max-w-full rounded" />
      )}
    </div>
  );
};

export default ImageGenerator;
