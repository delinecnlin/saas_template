import { useState } from 'react';
import { useRouter } from 'next/router';
import AccountLayout from '@/layouts/AccountLayout';
import api from '@/lib/common/api';

function ChatPage() {
  const router = useRouter();
  const { workspaceSlug } = router.query; // unused but kept for future use
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSubmitting(true);
    const result = await api('/api/chat/openai', {
      method: 'POST',
      body: { messages: history },
    });
    if (result.reply) {
      setMessages([...history, { role: 'assistant', content: result.reply }]);
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Chat Panel</h1>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-3 py-2 rounded bg-gray-100">
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          className="flex-grow px-3 py-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter message"
        />
        <button
          className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={isSubmitting || !input.trim()}
        >
          Button 1
        </button>
        <button className="px-4 py-2 bg-gray-200 rounded" disabled>
          Button 2
        </button>
      </div>
    </div>
  );
}

ChatPage.getLayout = function getLayout(page) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default ChatPage;
