import { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';

function Bubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bubble-user">{msg.content}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-4 gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">AI</div>
      <div className="bubble-assistant whitespace-pre-wrap">{msg.content}</div>
    </div>
  );
}

const SUGGESTED = [
  'Come spiego a un cliente l\'importanza della copertura vita?',
  'Qual è il capitale minimo consigliato per un 40enne con famiglia?',
  'Differenza tra invalidità totale e non autosufficienza?',
  'Come calcolo il bisogno assicurativo per un lavoratore autonomo?',
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono il tuo assistente per l\'analisi assicurativa. Posso aiutarti a capire i bisogni di protezione dei tuoi clienti, spiegare i tipi di copertura o rispondere a domande tecniche sul mondo assicurativo italiano. Come posso aiutarti?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.slice(1) }) // skip initial assistant msg
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Errore: ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
        <PageHeader
          title="Assistente AI"
          subtitle="Consulente virtuale specializzato in assicurazioni e pianificazione finanziaria"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl w-full mx-auto">
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

        {loading && (
          <div className="flex justify-start mb-4 gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">AI</div>
            <div className="bubble-assistant flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Suggested questions (only at start) */}
        {messages.length === 1 && !loading && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">Domande frequenti</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="text-left text-sm text-gray-600 dark:text-gray-300 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150 bg-white dark:bg-[#1a1a1a]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrivi una domanda... (Invio per inviare, Shift+Invio per andare a capo)"
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 max-h-32"
              style={{ fieldSizing: 'content' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="btn-primary py-1.5 px-3 text-xs flex-shrink-0 self-end"
            >
              Invia ↑
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2 text-center">
            Le risposte sono orientative. Verifica sempre con le compagnie assicurative per informazioni precise.
          </p>
        </div>
      </div>
    </div>
  );
}
