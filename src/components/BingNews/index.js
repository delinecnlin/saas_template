import { useState } from 'react';

const BingNews = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    setArticles([]);
    try {
      const res = await fetch(`/api/bing/news?q=${encodeURIComponent(query)}`);
      if (res.status === 401) {
        alert('Please log in to fetch news');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      } else {
        alert(data.error || 'Failed to fetch news');
      }
    } catch (err) {
      console.error('News fetch error', err);
      alert('Failed to fetch news');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded p-2"
          placeholder="Search topic..."
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
      <ul className="space-y-2">
        {articles.map((a, i) => (
          <li key={i}>
            <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              {a.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BingNews;
