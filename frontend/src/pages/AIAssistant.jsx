import { useState, useRef, useEffect } from 'react';
import { aiChat } from '../services/api';
import { Bot, User, Send, Zap, Loader2, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  'Find customers inactive for 60 days with spend > ₹5000',
  'Create a win-back campaign for inactive customers',
  'Show me analytics for the latest campaign',
  'Segment customers from Mumbai who ordered more than 2 times',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: isUser ? '#ffffff' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={15} color="#000000" /> : <img src="/ai-icon.png" width={15} height={15} style={{ objectFit: 'contain', filter: 'invert(1)' }} alt="AI" />}
      </div>

      <div style={{
        maxWidth: '75%',
        background: isUser ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-card)',
        border: '1px solid',
        borderColor: isUser ? 'rgba(255,255,255,0.2)' : 'var(--color-border)',
        borderRadius: isUser ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
        padding: '12px 16px',
        color: 'var(--color-text-primary)',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.toolsUsed?.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {msg.toolsUsed.map(tool => (
              <span key={tool} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.1)', borderRadius: 999,
                padding: '2px 10px', fontSize: 11, color: '#e4e4e7',
              }}>
                <Zap size={9} /> {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI marketing assistant. I can help you:\n• Find the right customer segments\n• Generate campaign messages\n• Create and send campaigns\n• Analyze campaign performance\n\nWhat would you like to do today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setInput('');
    setError('');

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build conversation for API (only role + content)
    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const r = await aiChat(apiMessages);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: r.data.reply,
          toolsUsed: r.data.toolsUsed,
        }
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg.includes('API key') ? 'OpenAI API key is not configured. Please add your OPENAI_API_KEY to the .env file.' : errMsg}`,
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxHeight: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255,255,255,0.15)',
          }}>
            <img src="/ai-icon.png" width={20} height={20} style={{ objectFit: 'contain' }} alt="AI" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>AI Marketing Assistant</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Powered by OpenAI Function Calling
            </p>
          </div>
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(16,185,129,0.15)',
            color: '#10b981',
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 999,
          }}>
            ● LIVE
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '7px 12px', fontSize: 12, color: 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#ffffff'; e.target.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-text-secondary)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px 12px 0 0',
        padding: 20,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/ai-icon.png" width={15} height={15} style={{ objectFit: 'contain', filter: 'invert(1)' }} alt="AI" />
            </div>
            <div style={{
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              borderRadius: '2px 12px 12px 12px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 13,
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              AI is thinking and calling tools...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '14px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to find customers, create a campaign, or analyze performance..."
          style={{
            flex: 1, background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)', borderRadius: 8,
            color: 'var(--color-text-primary)', padding: '10px 12px',
            fontSize: 14, resize: 'none', outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120,
          }}
          rows={1}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 8,
            background: input.trim() && !loading ? '#ffffff' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: input.trim() && !loading ? '0 0 16px rgba(255,255,255,0.15)' : 'none',
          }}
        >
          <Send size={15} color={input.trim() && !loading ? '#000000' : '#4b5563'} />
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
