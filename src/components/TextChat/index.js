import { useState, useRef, useEffect } from 'react';

const TextChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...history, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-lg whitespace-pre-line ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 border'}`}>{m.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={isSubmitting || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TextChat;
