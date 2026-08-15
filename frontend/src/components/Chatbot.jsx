import { useState, useRef, useEffect } from 'react';

let backendUrl = import.meta.env.VITE_BACKEND_URL;
if (backendUrl) {
  if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
    backendUrl = "https://" + backendUrl;
  }
  if (!backendUrl.endsWith("/api/rag")) {
    backendUrl = backendUrl + "/api/rag";
  }
}
const API_BASE = backendUrl || "/api/rag";

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMarkdown(text) {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)(?:\n|$)/g, '• $1<br/>')
        .replace(/\n/g, '<br/>');
}

export default function Chatbot() {
    const [url, setUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: 'Hi! 👋 Enter a URL above that you\'ve already analyzed, then ask me anything about its privacy policy.',
            confidence: null,
            citedChunks: [],
            silent: false
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesRef = useRef(null);

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    function handleConnect() {
        if (!url.trim()) return;
        setIsConnected(true);
        setMessages(prev => [...prev, {
            role: 'bot',
            text: `Connected to **${url}**. Ask me anything about this site's privacy policy!`
        }]);
    }

    async function handleSend() {
        if (!input.trim() || loading) return;
        const question = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: question, confidence: null, citedChunks: [] }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, question })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Error ${res.status}`);
            }

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'bot',
                text: data.answer || 'No answer available.',
                confidence: data.confidence || null,
                citedChunks: data.cited_chunks || [],
                silent: data.document_silent_on_topic || false
            }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                role: 'bot',
                text: `Sorry, I couldn't answer that. ${e.message}`,
                confidence: null,
                citedChunks: []
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ps-dashboard" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="ps-dashboard-header">
                <h2>💬 Policy Chatbot</h2>
                <p>Ask questions about any analyzed privacy policy</p>
            </div>

            {/* URL connection */}
            {!isConnected && (
                <div className="ps-url-input-container">
                    <input
                        className="ps-url-input"
                        type="text"
                        placeholder="Enter the URL you already analyzed..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                    />
                    <button className="ps-analyze-btn" onClick={handleConnect} disabled={!url.trim()}>
                        Connect
                    </button>
                </div>
            )}

            {/* Chat Interface */}
            <div className="ps-chatbot">
                <div className="ps-chat-header">
                    <span>🛡️</span>
                    <h3>PrivaShield AI Chat</h3>
                    {isConnected && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--green)' }}>
                            ● Connected
                        </span>
                    )}
                </div>

                <div className="ps-chat-messages" ref={messagesRef}>
                    {messages.map((msg, i) => (
                        <div className={`ps-msg ${msg.role === 'user' ? 'user' : 'bot'}`} key={i}>
                            <div className="ps-msg-avatar">
                                {msg.role === 'bot' ? '🛡️' : '👤'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <div
                                    className="ps-msg-bubble"
                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
                                />
                                {/* Confidence badge + silent indicator */}
                                {msg.role === 'bot' && msg.confidence && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '600', padding: '2px 8px',
                                            borderRadius: '12px', letterSpacing: '0.05em',
                                            background: msg.confidence === 'High' ? 'rgba(34,197,94,0.15)' : msg.confidence === 'Medium' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: msg.confidence === 'High' ? '#4ade80' : msg.confidence === 'Medium' ? '#facc15' : '#f87171',
                                            border: `1px solid ${msg.confidence === 'High' ? 'rgba(34,197,94,0.3)' : msg.confidence === 'Medium' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`
                                        }}>
                                            {msg.confidence === 'High' ? '✓' : msg.confidence === 'Medium' ? '~' : '?'} {msg.confidence} confidence
                                        </span>
                                        {msg.silent && (
                                            <span style={{ fontSize: '10px', color: 'var(--muted, #888)', fontStyle: 'italic' }}>
                                                Policy silent on this topic
                                            </span>
                                        )}
                                        {msg.citedChunks && msg.citedChunks.length > 0 && (
                                            <span style={{ fontSize: '10px', color: 'var(--muted, #888)' }}>
                                                Sources: {msg.citedChunks.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="ps-msg bot">
                            <div className="ps-msg-avatar">🛡️</div>
                            <div className="ps-msg-bubble">
                                <span className="ps-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="ps-chat-input-area">
                    <input
                        className="ps-chat-input"
                        type="text"
                        placeholder={isConnected ? 'Ask about this privacy policy...' : 'Connect to a URL first...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!isConnected || loading}
                    />
                    <button
                        className="ps-chat-send"
                        onClick={handleSend}
                        disabled={!isConnected || loading || !input.trim()}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
