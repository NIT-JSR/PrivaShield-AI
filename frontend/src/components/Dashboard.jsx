import { useState } from 'react';

const API_BASE = 'http://localhost:8000';

const PERM_ICONS = {
    'Camera': '📷', 'Microphone': '🎤', 'Location (GPS)': '📍',
    'Contacts': '👥', 'Storage / Files': '📁', 'Notifications': '🔔',
    'Background Activity Tracking': '👁️', 'Clipboard Access': '📋',
    'Biometric Data (Face / Fingerprint)': '🔐', 'Bluetooth / Nearby Devices': '📶',
    'Calendar': '📅', 'Call Logs': '📞', 'SMS / Messages': '💬',
    'Advertising ID / Cross-App Tracking': '📡', 'Network / Wi-Fi Information': '🌐'
};

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

function getScoreColor(score) {
    if (score <= 3) return '#10b981';
    if (score <= 5) return '#f59e0b';
    if (score <= 7) return '#f97316';
    return '#ef4444';
}

function getScoreLevel(score) {
    if (score <= 3) return 'low';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'high';
    return 'critical';
}

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    async function handleAnalyze() {
        if (!url.trim()) return;
        setLoading(true);
        setError('');
        setData(null);

        try {
            // Fetch the URL content
            const htmlResp = await fetch(url);
            if (!htmlResp.ok) throw new Error('Could not fetch the URL');
            const html = await htmlResp.text();

            // Run analysis
            const [analyzeRes, risksRes, permsRes, hiddenRes] = await Promise.all([
                fetchApi('/analyze', { url, html }),
                fetchApi('/risks', { url, html }).catch(() => ({})),
                fetchApi('/permissions', { url, html }).catch(() => ({})),
                fetchApi('/hidden-clauses', { url, html }).catch(() => ({})),
            ]);

            setData({
                summary: analyzeRes.summary || '',
                risks: risksRes.risk_data || {},
                permissions: permsRes.permission_data || {},
                hidden: hiddenRes.hidden_clauses_data || {},
            });
        } catch (e) {
            setError(e.message || 'Analysis failed. Check that the backend is running.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchApi(endpoint, body) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API Error ${res.status}`);
        }
        return res.json();
    }

    const score = data?.risks?.overall_risk_score || 0;
    const level = getScoreLevel(score);
    const circumference = 326.73;
    const offset = circumference - (score / 10) * circumference;

    return (
        <div className="ps-dashboard">
            <div className="ps-dashboard-header">
                <h2>🛡️ Policy Analysis Dashboard</h2>
                <p>Enter a URL to analyze its privacy policy</p>
            </div>

            {/* URL Input */}
            <div className="ps-url-input-container">
                <input
                    className="ps-url-input"
                    type="text"
                    placeholder="https://example.com/privacy-policy"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button
                    className="ps-analyze-btn"
                    onClick={handleAnalyze}
                    disabled={loading || !url.trim()}
                >
                    {loading ? <span className="ps-spinner"></span> : '🔍 Analyze'}
                </button>
            </div>

            {error && (
                <div style={{
                    textAlign: 'center', color: '#ef4444', padding: '20px',
                    background: 'rgba(239,68,68,0.08)', borderRadius: '12px', marginBottom: '24px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {data && (
                <>
                    {/* Tab Bar */}
                    <div className="ps-dashboard-tabs">
                        {['summary', 'risks', 'permissions', 'hidden'].map(tab => (
                            <button
                                key={tab}
                                className={`ps-dashboard-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                        <div className="ps-results-grid">
                            <div className="ps-result-card">
                                <h3>🎯 Risk Score</h3>
                                <div className="ps-score-container">
                                    <div className="ps-gauge">
                                        <svg viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="52" className="bg" />
                                            <circle
                                                cx="60" cy="60" r="52" className="fill"
                                                style={{
                                                    strokeDashoffset: offset,
                                                    stroke: getScoreColor(score)
                                                }}
                                            />
                                        </svg>
                                        <div className="ps-gauge-text">
                                            <span className="ps-gauge-score">{score}</span>
                                            <span className="ps-gauge-label">/ 10</span>
                                        </div>
                                    </div>
                                    <div className="ps-score-details">
                                        <div className={`ps-score-level ${level}`}>
                                            {data.risks.risk_level || 'Analyzed'}
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {data.risks.retention_policy || 'Retention policy not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="ps-result-card">
                                <h3>⚖️ Your Rights</h3>
                                {data.risks.user_rights ? (
                                    <div>
                                        <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                                            {data.risks.user_rights.can_delete_data ? '✅' : '❌'} Delete Data &nbsp;
                                            {data.risks.user_rights.can_opt_out ? '✅' : '❌'} Opt Out
                                        </p>
                                        <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                                            {data.risks.user_rights.data_portability ? '✅' : '❌'} Data Portability &nbsp;
                                            {data.risks.user_rights.consent_withdrawal ? '✅' : '❌'} Withdraw Consent
                                        </p>
                                        {data.risks.user_rights.details && (
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                {data.risks.user_rights.details}
                                            </p>
                                        )}
                                    </div>
                                ) : <p style={{ color: 'var(--text-muted)' }}>No data available</p>}
                            </div>

                            <div className="ps-result-card full-width">
                                <h3>📋 Summary</h3>
                                <div
                                    className="ps-summary-text"
                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(data.summary) }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Risks Tab */}
                    {activeTab === 'risks' && (
                        <div>
                            {data.risks.red_flags && data.risks.red_flags.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '15px', color: '#ef4444', marginBottom: '12px' }}>🚩 Red Flags</h4>
                                    {data.risks.red_flags.map((flag, i) => (
                                        <div className="ps-risk-item critical" key={i}>
                                            <h5>{flag}</h5>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {data.risks.data_collected && data.risks.data_collected.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>📊 Data Collected</h4>
                                    {data.risks.data_collected.map((cat, i) => (
                                        <div className={`ps-risk-item ${cat.severity || ''}`} key={i}>
                                            <h5>{cat.category}</h5>
                                            <p>{(cat.items || []).join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {data.risks.third_party_sharing && data.risks.third_party_sharing.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '15px', color: '#f97316', marginBottom: '12px' }}>🔗 Third-Party Sharing</h4>
                                    {data.risks.third_party_sharing.map((tp, i) => (
                                        <div className="ps-risk-item high" key={i}>
                                            <h5>{tp.entity}</h5>
                                            <p><strong>Purpose:</strong> {tp.purpose}</p>
                                            <p><strong>Data:</strong> {(tp.data_shared || []).join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Permissions Tab */}
                    {activeTab === 'permissions' && (
                        <div>
                            {(data.permissions.permissions || []).filter(p => p.requested).length > 0 ? (
                                (data.permissions.permissions || []).filter(p => p.requested).map((perm, i) => {
                                    const rec = (perm.recommendation || '').toUpperCase();
                                    const badgeClass = rec === 'ALLOW' ? 'allow' : rec === 'DENY' ? 'deny' : 'conditional';
                                    return (
                                        <div className="ps-perm-item" key={i}>
                                            <span className="ps-perm-name">
                                                {PERM_ICONS[perm.name] || '🔒'} {perm.name}
                                            </span>
                                            <span className={`ps-perm-badge ${badgeClass}`}>{rec || '?'}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                    No permission data available
                                </p>
                            )}
                        </div>
                    )}

                    {/* Hidden Clauses Tab */}
                    {activeTab === 'hidden' && (
                        <div>
                            {data.hidden.transparency_score !== undefined && (
                                <div style={{
                                    textAlign: 'center', padding: '16px', marginBottom: '16px',
                                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Transparency Score
                                    </div>
                                    <div style={{
                                        fontSize: '28px', fontWeight: 700,
                                        color: getScoreColor(10 - data.hidden.transparency_score)
                                    }}>
                                        {data.hidden.transparency_score}/10
                                    </div>
                                </div>
                            )}
                            {(data.hidden.hidden_clauses || []).map((clause, i) => (
                                <div className="ps-risk-item critical" key={i} style={{ marginBottom: '12px' }}>
                                    <h5>⚠️ {clause.title}</h5>
                                    {clause.original_text && (
                                        <p style={{
                                            fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)',
                                            padding: '8px', margin: '6px 0', background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '6px', borderLeft: '2px solid var(--text-muted)'
                                        }}>
                                            "{clause.original_text}"
                                        </p>
                                    )}
                                    <p>{clause.plain_english}</p>
                                    {clause.action_recommended && (
                                        <p style={{ color: 'var(--accent-light)', fontSize: '12px', marginTop: '6px' }}>
                                            💡 {clause.action_recommended}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
