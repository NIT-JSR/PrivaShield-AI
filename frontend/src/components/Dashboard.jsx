import { useState, useRef, useEffect } from "react";

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
const IS_PROD =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

const PIPELINE_STEPS = [
  { id: "extract",  label: "Extracting facts",    icon: "🔍" },
  { id: "analyze",  label: "Scoring risks",        icon: "⚖️" },
  { id: "verify",   label: "Verifying output",     icon: "✅" },
  { id: "done",     label: "Complete",             icon: "🎉" },
];

function isColdStartError(msg) {
  return (
    msg.includes("502") || msg.includes("504") ||
    msg.includes("RAG Service Unavailable") ||
    msg.toLowerCase().includes("fetch")
  );
}

async function sleepWithCountdown(ms, onTick) {
  const steps = Math.ceil(ms / 1000);
  for (let i = steps; i > 0; i--) {
    onTick(i);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const PERM_ICONS = {
  Camera: "📷", Microphone: "🎤", "Location (GPS)": "📍",
  Contacts: "👥", "Storage / Files": "📁", Notifications: "🔔",
  "Background Activity Tracking": "👁️", "Clipboard Access": "📋",
  "Biometric Data (Face / Fingerprint)": "🔐", "Bluetooth / Nearby Devices": "📶",
  Calendar: "📅", "Call Logs": "📞", "SMS / Messages": "💬",
  "Advertising ID / Cross-App Tracking": "📡", "Network / Wi-Fi Information": "🌐",
};

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function formatMarkdown(text) {
  if (!text) return "";
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/- (.*?)(?:\n|$)/g, "• $1<br/>")
    .replace(/\n/g, "<br/>");
}

// Trust score uses 0-100 scale (new pipeline); fallback to old 0-10 if needed
function getTrustColor(score100) {
  if (score100 >= 75) return "#10b981";
  if (score100 >= 55) return "#f59e0b";
  if (score100 >= 35) return "#f97316";
  return "#ef4444";
}
function getTrustLabel(grade) {
  const labels = { A: "Excellent", B: "Good", C: "Fair", D: "Poor", F: "Critical" };
  return labels[grade] || "Analyzed";
}

// History stored in localStorage
function loadHistory() {
  try { return JSON.parse(localStorage.getItem("ps_history") || "[]"); } catch { return []; }
}
function saveHistory(entry) {
  const history = loadHistory().filter(h => h.url !== entry.url);
  history.unshift(entry);
  localStorage.setItem("ps_history", JSON.stringify(history.slice(0, 10)));
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [inputMode, setInputMode] = useState("url");
  const [policyText, setPolicyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1); // -1 = not running
  const [loadingMsg, setLoadingMsg] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const stepTimer = useRef(null);

  // Animate pipeline steps while loading
  useEffect(() => {
    if (loading) {
      setPipelineStep(0);
      let step = 0;
      stepTimer.current = setInterval(() => {
        step = Math.min(step + 1, 2); // stop at "Verifying" — "done" set on success
        setPipelineStep(step);
      }, 8000);
    } else {
      clearInterval(stepTimer.current);
    }
    return () => clearInterval(stepTimer.current);
  }, [loading]);

  async function fetchApi(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `API Error ${res.status}`);
    }
    return res.json();
  }

  async function runAnalysis(mode, urlVal, htmlVal) {
    if (mode === "url") {
      setLoadingMsg("📡 Fetching page content...");
      const { html } = await fetchApi("/fetch-html", { url: urlVal });
      setLoadingMsg("🤖 Running 3-stage pipeline...");
      return fetchApi("/full-analysis", { url: urlVal, html });
    }
    setLoadingMsg("🤖 Running 3-stage pipeline...");
    return fetchApi("/full-analysis", { url: "Pasted Text Analysis", html: htmlVal });
  }

  async function handleAnalyze(overrideUrl) {
    const targetUrl = overrideUrl || url;
    setError("");
    setData(null);
    setLoadingMsg("");
    retryCount.current = 0;

    if (inputMode === "url" && !overrideUrl) {
      if (!targetUrl.trim()) return;
    } else if (inputMode === "text") {
      if (!policyText.trim()) return;
      if (policyText.trim().length < 100) {
        setError("Please enter at least 100 characters.");
        return;
      }
    }

    if (overrideUrl) setUrl(overrideUrl);
    setLoading(true);
    if (IS_PROD) setLoadingMsg("⏳ Starting AI services (first use may take 30-60s)...");
    else setLoadingMsg("🤖 Running analysis...");

    while (retryCount.current <= MAX_RETRIES) {
      try {
        const result = await runAnalysis(inputMode, targetUrl, policyText);

        // Map new pipeline_data structure
        const pd = result.pipeline_data || {};
        const ts = pd.trust_score || {};
        const ef = pd.extracted_facts || {};

        const normalised = {
          // New pipeline fields
          trustScore: ts.score ?? null,
          grade: ts.grade ?? null,
          scoreBreakdown: ts.score_breakdown || [],
          sections: pd.sections || [],
          pipelineRedFlags: pd.red_flags || [],
          jurisdictionSignals: pd.jurisdiction_signals || [],
          jurisdictionNotes: pd.jurisdiction_notes || "",
          extractedFacts: ef,
          verification: pd.verification || {},
          // Old parallel fields (still returned)
          risks: result.risk_data || pd.risk_analysis || {},
          permissions: result.permission_data || {},
          hidden: result.hidden_clauses_data || pd.hidden_clauses_analysis || {},
          summary: result.summary || "",
        };

        setData(normalised);
        setPipelineStep(3); // "done"

        // Save to history
        const entry = {
          url: targetUrl,
          grade: normalised.grade,
          score: normalised.trustScore,
          ts: Date.now(),
        };
        saveHistory(entry);
        setHistory(loadHistory());

        setLoading(false);
        setLoadingMsg("");
        setActiveTab("summary");
        return;
      } catch (e) {
        const msg = e.message || "";
        const isRetryable = IS_PROD && isColdStartError(msg) && retryCount.current < MAX_RETRIES;
        if (isRetryable) {
          retryCount.current += 1;
          await sleepWithCountdown(20000, (secs) =>
            setLoadingMsg(`⏳ Warming up... retrying in ${secs}s (${retryCount.current}/${MAX_RETRIES})`)
          );
          setLoadingMsg("🔄 Retrying...");
        } else {
          let finalMsg = msg || "Analysis failed.";
          if (msg.includes("403"))
            finalMsg = "This site blocks automated access. Switch to 'Paste Policy Text' mode.";
          else if (isColdStartError(msg))
            finalMsg = "AI services are starting up. Wait 30 seconds and try again.";
          setError(finalMsg);
          setLoading(false);
          setLoadingMsg("");
          setPipelineStep(-1);
          return;
        }
      }
    }
  }

  const circumference = 326.73;

  return (
    <div className="ps-dashboard">
      <div className="ps-dashboard-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2>🛡️ Policy Analysis Dashboard</h2>
            <p>Choose an analysis mode to understand your privacy policy</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "8px", color: "#a78bfa", padding: "6px 12px", fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
            }}
          >
            🕐 History ({history.length})
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div style={{
          background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "12px", padding: "12px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "12px", color: "#a78bfa", fontWeight: 600, marginBottom: "8px" }}>
            Recent Analyses
          </div>
          {history.map((h, i) => (
            <div
              key={i}
              onClick={() => { setInputMode("url"); handleAnalyze(h.url); setShowHistory(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <span style={{ fontSize: "12px", color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                {h.url}
              </span>
              {h.grade && (
                <span style={{
                  fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                  background: h.grade === "A" || h.grade === "B" ? "rgba(16,185,129,0.15)" : h.grade === "C" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                  color: h.grade === "A" || h.grade === "B" ? "#10b981" : h.grade === "C" ? "#f59e0b" : "#ef4444",
                }}>
                  Grade {h.grade}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="ps-input-toggle">
        <button className={`ps-toggle-btn ${inputMode === "url" ? "active" : ""}`}
          onClick={() => { setInputMode("url"); setError(""); }}>🔗 Analyze URL</button>
        <button className={`ps-toggle-btn ${inputMode === "text" ? "active" : ""}`}
          onClick={() => { setInputMode("text"); setError(""); }}>📝 Paste Policy Text</button>
      </div>

      {inputMode === "url" ? (
        <div className="ps-url-input-container">
          <input className="ps-url-input" type="text" placeholder="https://example.com/privacy-policy"
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAnalyze()} />
          <button className="ps-analyze-btn" onClick={() => handleAnalyze()} disabled={loading || !url.trim()}>
            {loading ? <span className="ps-spinner" /> : "🔍 Analyze"}
          </button>
        </div>
      ) : (
        <div className="ps-text-input-container">
          <textarea className="ps-policy-textarea" placeholder="Copy and paste the privacy policy text here..."
            value={policyText} onChange={(e) => setPolicyText(e.target.value)} />
          <button className="ps-analyze-btn" style={{ width: "100%", padding: "14px", marginTop: "4px" }}
            onClick={() => handleAnalyze()} disabled={loading || !policyText.trim()}>
            {loading ? <span className="ps-spinner" /> : "🔍 Analyze Pasted Text"}
          </button>
        </div>
      )}

      {/* Pipeline Progress Steps */}
      {loading && (
        <div style={{
          background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "12px", padding: "16px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "12px", textAlign: "center" }}>
            {loadingMsg}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.id} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", margin: "0 auto 4px",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
                  background: i < pipelineStep ? "rgba(16,185,129,0.2)" : i === pipelineStep ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)",
                  border: i < pipelineStep ? "1px solid #10b981" : i === pipelineStep ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.5s",
                }}>
                  {i < pipelineStep ? "✓" : step.icon}
                </div>
                <div style={{ fontSize: "10px", color: i <= pipelineStep ? "#a78bfa" : "#64748b" }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", color: "#ef4444", padding: "20px", background: "rgba(239,68,68,0.08)", borderRadius: "12px", marginBottom: "24px" }}>
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          {/* Tab Bar */}
          <div className="ps-dashboard-tabs">
            {["summary", "score", "risks", "permissions", "hidden"].map((tab) => (
              <button key={tab} className={`ps-dashboard-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}>
                {tab === "score" ? "Trust Score" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── SUMMARY TAB ── */}
          {activeTab === "summary" && (
            <div className="ps-results-grid">
              {/* Trust Score card (new pipeline) */}
              {data.trustScore !== null && (
                <div className="ps-result-card">
                  <h3>🎯 Trust Score</h3>
                  <div className="ps-score-container">
                    <div className="ps-gauge">
                      <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="bg" />
                        <circle cx="60" cy="60" r="52" className="fill"
                          style={{
                            strokeDashoffset: circumference - (data.trustScore / 100) * circumference,
                            stroke: getTrustColor(data.trustScore),
                          }} />
                      </svg>
                      <div className="ps-gauge-text">
                        <span className="ps-gauge-score" style={{ fontSize: "22px" }}>{data.trustScore}</span>
                        <span className="ps-gauge-label">/ 100</span>
                      </div>
                    </div>
                    <div className="ps-score-details">
                      <div className={`ps-score-level ${data.grade === "A" || data.grade === "B" ? "low" : data.grade === "C" ? "medium" : "critical"}`}>
                        Grade {data.grade} — {getTrustLabel(data.grade)}
                      </div>
                      {data.jurisdictionSignals?.length > 0 && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "6px" }}>
                          🌍 {data.jurisdictionSignals.join(", ")}
                        </p>
                      )}
                      {data.verification?.verification_passed === false && (
                        <p style={{ color: "#f97316", fontSize: "11px", marginTop: "4px" }}>
                          ⚠️ {data.verification.issues_found?.length || 0} verification issues found
                        </p>
                      )}
                      {data.verification?.verification_passed === true && (
                        <p style={{ color: "#10b981", fontSize: "11px", marginTop: "4px" }}>
                          ✓ Output verified
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Rights */}
              <div className="ps-result-card">
                <h3>⚖️ Your Rights</h3>
                {data.risks.user_rights ? (
                  <div>
                    <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                      {data.risks.user_rights.can_delete_data ? "✅" : "❌"} Delete Data &nbsp;
                      {data.risks.user_rights.can_opt_out ? "✅" : "❌"} Opt Out
                    </p>
                    <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                      {data.risks.user_rights.data_portability ? "✅" : "❌"} Data Portability &nbsp;
                      {data.risks.user_rights.consent_withdrawal ? "✅" : "❌"} Withdraw Consent
                    </p>
                    {data.risks.user_rights.details && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                        {data.risks.user_rights.details}
                      </p>
                    )}
                  </div>
                ) : data.extractedFacts?.deletion_mechanism ? (
                  <div>
                    <p style={{ fontSize: "13px" }}>
                      {data.extractedFacts.deletion_mechanism.exists === true ? "✅" : data.extractedFacts.deletion_mechanism.exists === "unclear" ? "⚠️" : "❌"} Deletion mechanism
                    </p>
                    {data.extractedFacts.deletion_mechanism.source_quote && (
                      <p style={{ fontSize: "11px", fontStyle: "italic", color: "var(--text-muted)", marginTop: "6px", borderLeft: "2px solid var(--text-muted)", paddingLeft: "8px" }}>
                        "{data.extractedFacts.deletion_mechanism.source_quote}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>No data available</p>
                )}
              </div>

              {/* Summary / Red Flags */}
              <div className="ps-result-card full-width">
                <h3>📋 Summary</h3>
                {data.pipelineRedFlags?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    {data.pipelineRedFlags.map((f, i) => (
                      <div key={i} style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", fontSize: "13px", color: "#fca5a5",
                      }}>
                        🚩 {f}
                      </div>
                    ))}
                  </div>
                )}
                <div className="ps-summary-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(data.summary) }} />
                {data.jurisdictionNotes && (
                  <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                    ⚖️ {data.jurisdictionNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── TRUST SCORE TAB (breakdown) ── */}
          {activeTab === "score" && (
            <div>
              {data.scoreBreakdown?.length > 0 ? (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "16px", background: "rgba(139,92,246,0.06)", borderRadius: "12px", marginBottom: "16px",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}>
                    <div style={{ fontSize: "40px", fontWeight: 700, color: getTrustColor(data.trustScore) }}>
                      {data.trustScore}
                    </div>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: 600, color: "#e2e8f0" }}>Grade {data.grade} — {getTrustLabel(data.grade)}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Scored by weighted deduction from 100</div>
                    </div>
                  </div>
                  {data.scoreBreakdown.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", borderRadius: "8px", marginBottom: "6px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div>
                        <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{item.factor}</div>
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                          Confidence: {item.confidence}
                        </div>
                      </div>
                      <span style={{
                        fontWeight: 700, fontSize: "14px",
                        color: item.deduction < 0 ? "#ef4444" : "#10b981",
                        minWidth: "40px", textAlign: "right",
                      }}>
                        {item.deduction}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  No breakdown available — run a fresh analysis to see scores.
                </p>
              )}
            </div>
          )}

          {/* ── RISKS TAB ── */}
          {activeTab === "risks" && (
            <div>
              {data.pipelineRedFlags?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "15px", color: "#ef4444", marginBottom: "12px" }}>🚩 Red Flags</h4>
                  {data.pipelineRedFlags.map((flag, i) => (
                    <div className="ps-risk-item critical" key={i}><h5>{flag}</h5></div>
                  ))}
                </div>
              )}
              {data.risks.red_flags?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "15px", color: "#ef4444", marginBottom: "12px" }}>⚠️ Risk Flags</h4>
                  {data.risks.red_flags.map((flag, i) => (
                    <div className="ps-risk-item critical" key={i}><h5>{flag}</h5></div>
                  ))}
                </div>
              )}
              {data.risks.data_collected?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "15px", marginBottom: "12px" }}>📊 Data Collected</h4>
                  {data.risks.data_collected.map((cat, i) => (
                    <div className={`ps-risk-item ${cat.severity || ""}`} key={i}>
                      <h5>{cat.category}</h5>
                      <p>{(cat.items || []).join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Extracted facts: data collected */}
              {!data.risks.data_collected?.length && data.extractedFacts?.data_collected?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "15px", marginBottom: "12px" }}>📊 Data Collected</h4>
                  {data.extractedFacts.data_collected.map((item, i) => (
                    <div className="ps-risk-item medium" key={i}>
                      <h5>{item.item}</h5>
                      <p style={{ fontSize: "11px", fontStyle: "italic", color: "var(--text-muted)" }}>"{item.source_quote}"</p>
                    </div>
                  ))}
                </div>
              )}
              {data.risks.third_party_sharing?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "15px", color: "#f97316", marginBottom: "12px" }}>🔗 Third-Party Sharing</h4>
                  {data.risks.third_party_sharing.map((tp, i) => (
                    <div className="ps-risk-item high" key={i}>
                      <h5>{tp.entity}</h5>
                      <p><strong>Purpose:</strong> {tp.purpose}</p>
                      <p><strong>Data:</strong> {(tp.data_shared || []).join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PERMISSIONS TAB ── */}
          {activeTab === "permissions" && (
            <div>
              {(data.permissions.permissions || []).filter((p) => p.requested).length > 0 ? (
                (data.permissions.permissions || []).filter((p) => p.requested).map((perm, i) => {
                  const rec = (perm.recommendation || "").toUpperCase();
                  const badgeClass = rec === "ALLOW" ? "allow" : rec === "DENY" ? "deny" : "conditional";
                  return (
                    <div className="ps-perm-item" key={i}>
                      <span className="ps-perm-name">{PERM_ICONS[perm.name] || "🔒"} {perm.name}</span>
                      <span className={`ps-perm-badge ${badgeClass}`}>{rec || "?"}</span>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  No permission data available
                </p>
              )}
            </div>
          )}

          {/* ── HIDDEN CLAUSES TAB ── */}
          {activeTab === "hidden" && (
            <div>
              {data.hidden.transparency_score !== undefined && (
                <div style={{
                  textAlign: "center", padding: "16px", marginBottom: "16px",
                  background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "12px",
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Transparency Score</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: data.hidden.transparency_score >= 6 ? "#10b981" : data.hidden.transparency_score >= 4 ? "#f59e0b" : "#ef4444" }}>
                    {data.hidden.transparency_score}/10
                  </div>
                </div>
              )}
              {(data.hidden.hidden_clauses || []).map((clause, i) => (
                <div className="ps-risk-item critical" key={i} style={{ marginBottom: "12px" }}>
                  <h5>⚠️ {clause.title}</h5>
                  {clause.original_text && (
                    <p style={{ fontSize: "11px", fontStyle: "italic", color: "var(--text-muted)", padding: "8px", margin: "6px 0", background: "rgba(0,0,0,0.2)", borderRadius: "6px", borderLeft: "2px solid var(--text-muted)" }}>
                      "{clause.original_text}"
                    </p>
                  )}
                  <p>{clause.plain_english}</p>
                  {clause.action_recommended && (
                    <p style={{ color: "var(--accent-light)", fontSize: "12px", marginTop: "6px" }}>
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
