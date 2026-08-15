/**
 * PrivaShield AI — Chrome Extension Popup Logic
 * Handles analysis flow, risk display, permission mapping, chatbot, and settings.
 */

// ──────────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────────

let state = {
    apiBaseUrl: "http://localhost:5000/api/rag",
    currentUrl: "",
    currentHtml: "",
    analysisData: null,
    isAnalyzing: false,
};

// ──────────────────────────────────────────────
//  DOM ELEMENTS
// ──────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const elements = {
    scanSection: $("#scanSection"),
    scanBtn: $("#scanBtn"),
    loadingSection: $("#loadingSection"),
    loadingText: $("#loadingText"),
    resultsSection: $("#resultsSection"),
    errorSection: $("#errorSection"),
    errorText: $("#errorText"),
    retryBtn: $("#retryBtn"),
    currentUrl: $("#currentUrl"),
    // Score
    scoreNumber: $("#scoreNumber"),
    scoreLevel: $("#scoreLevel"),
    gaugeFill: $("#gaugeFill"),
    summaryContent: $("#summaryContent"),
    // Tabs
    riskFlags: $("#riskFlags"),
    permissionsList: $("#permissionsList"),
    hiddenClauses: $("#hiddenClauses"),
    // Chat
    chatMessages: $("#chatMessages"),
    chatInput: $("#chatInput"),
    chatSendBtn: $("#chatSendBtn"),
    // Settings
    settingsBtn: $("#settingsBtn"),
    settingsPanel: $("#settingsPanel"),
    closeSettingsBtn: $("#closeSettingsBtn"),
    apiUrlInput: $("#apiUrlInput"),
    saveSettingsBtn: $("#saveSettingsBtn"),
};

// ──────────────────────────────────────────────
//  INITIALIZATION
// ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    // Load settings
    await loadSettings();

    // Setup event listeners
    elements.scanBtn.addEventListener("click", startAnalysis);
    elements.retryBtn.addEventListener("click", startAnalysis);
    elements.chatSendBtn.addEventListener("click", sendChatMessage);
    elements.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });
    elements.settingsBtn.addEventListener("click", () =>
        elements.settingsPanel.classList.remove("hidden")
    );
    elements.closeSettingsBtn.addEventListener("click", () =>
        elements.settingsPanel.classList.add("hidden")
    );
    elements.saveSettingsBtn.addEventListener("click", saveSettings);

    // Tab switching
    $$(".tab").forEach((tab) => {
        tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    // Get current tab URL
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab) {
            state.currentUrl = tab.url;
            elements.currentUrl.textContent = new URL(tab.url).hostname;
        }
    } catch (e) {
        elements.currentUrl.textContent = "Ready to analyze";
    }
});

// ──────────────────────────────────────────────
//  SETTINGS
// ──────────────────────────────────────────────

async function loadSettings() {
    try {
        const data = await chrome.storage.local.get(["apiBaseUrl"]);
        if (data.apiBaseUrl) {
            state.apiBaseUrl = data.apiBaseUrl;
            elements.apiUrlInput.value = data.apiBaseUrl;
        }
    } catch (e) {
        console.log("Using default settings");
    }
}

async function saveSettings() {
    state.apiBaseUrl = elements.apiUrlInput.value.replace(/\/$/, "");
    try {
        await chrome.storage.local.set({ apiBaseUrl: state.apiBaseUrl });
    } catch (e) {
        console.log("Could not save to chrome storage");
    }
    elements.settingsPanel.classList.add("hidden");
}

// ──────────────────────────────────────────────
//  ANALYSIS FLOW
// ──────────────────────────────────────────────

async function startAnalysis() {
    if (state.isAnalyzing) return;
    state.isAnalyzing = true;

    showSection("loading");
    updateLoadingStep(1);

    try {
        // Step 1: Extract page HTML
        updateLoadingStep(1);
        const pageData = await extractPageHTML();
        state.currentUrl = pageData.url;
        state.currentHtml = pageData.html;

        // Step 2: Run full-analysis (3-stage pipeline + permissions + hidden clauses)
        updateLoadingStep(2);
        const result = await apiCall("/full-analysis", {
            url: state.currentUrl,
            html: state.currentHtml,
        });

        // Step 3 & 4: Handled inside full-analysis concurrently
        updateLoadingStep(3);
        const pd = result.pipeline_data || {};
        const ts = pd.trust_score || {};

        updateLoadingStep(4);
        state.analysisData = {
            summary: result.summary || `Trust Score: ${ts.score}/100 (Grade ${ts.grade})`,
            trustScore: ts.score ?? null,
            grade: ts.grade ?? null,
            scoreBreakdown: ts.score_breakdown || [],
            pipelineRedFlags: pd.red_flags || [],
            jurisdictionSignals: pd.jurisdiction_signals || [],
            risks: pd.risk_analysis || result.risk_data || {},
            permissions: result.permission_data || {},
            hiddenClauses: result.hidden_clauses_data || pd.hidden_clauses_analysis || {},
        };

        // Render all sections
        renderSummary();
        renderRisks();
        renderPermissions();
        renderHiddenClauses();

        showSection("results");
    } catch (error) {
        console.error("Analysis failed:", error);
        elements.errorText.textContent = error.message || "Analysis failed. Is the backend running?";
        showSection("error");
    } finally {
        state.isAnalyzing = false;
    }
}

// ──────────────────────────────────────────────
//  PAGE HTML EXTRACTION
// ──────────────────────────────────────────────

function extractPageHTML() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                reject(new Error("No active tab found"));
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "getPageHTML" },
                (response) => {
                    if (chrome.runtime.lastError) {
                        // Content script not available — inject and retry
                        chrome.scripting.executeScript(
                            {
                                target: { tabId: tabs[0].id },
                                files: ["content.js"],
                            },
                            () => {
                                setTimeout(() => {
                                    chrome.tabs.sendMessage(
                                        tabs[0].id,
                                        { action: "getPageHTML" },
                                        (retryResponse) => {
                                            if (retryResponse && retryResponse.success) {
                                                resolve(retryResponse);
                                            } else {
                                                reject(
                                                    new Error("Could not extract page content")
                                                );
                                            }
                                        }
                                    );
                                }, 200);
                            }
                        );
                    } else if (response && response.success) {
                        resolve(response);
                    } else {
                        reject(new Error("Failed to extract page HTML"));
                    }
                }
            );
        });
    });
}

// ──────────────────────────────────────────────
//  API CALLS
// ──────────────────────────────────────────────

async function apiCall(endpoint, body) {
    const url = `${state.apiBaseUrl}${endpoint}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

// ──────────────────────────────────────────────
//  RENDER: SUMMARY
// ──────────────────────────────────────────────

function renderSummary() {
    const data = state.analysisData;

    // Prefer new trust score (0-100), fallback to old risk score (0-10)
    const hasTrustScore = data.trustScore !== null && data.trustScore !== undefined;
    const displayScore = hasTrustScore ? data.trustScore : (data.risks.overall_risk_score || 0);
    const maxScore = hasTrustScore ? 100 : 10;
    const level = hasTrustScore
        ? (data.grade === "A" || data.grade === "B" ? "low" : data.grade === "C" ? "medium" : "critical")
        : ((data.risks.risk_level || "UNKNOWN").toLowerCase());

    elements.scoreNumber.textContent = displayScore;
    elements.scoreLevel.textContent = hasTrustScore
        ? `Grade ${data.grade} / 100`
        : (data.risks.risk_level || "Analyzed");
    elements.scoreLevel.className = `score-level ${level}`;

    // Animate gauge
    const circumference = 326.73;
    const offset = circumference - (displayScore / maxScore) * circumference;
    elements.gaugeFill.style.strokeDashoffset = offset;

    // Gauge color
    const color = hasTrustScore
        ? (displayScore >= 75 ? "#10b981" : displayScore >= 55 ? "#f59e0b" : displayScore >= 35 ? "#f97316" : "#ef4444")
        : (displayScore <= 3 ? "#10b981" : displayScore <= 5 ? "#f59e0b" : displayScore <= 7 ? "#f97316" : "#ef4444");
    elements.gaugeFill.style.stroke = color;

    // Summary text
    const summary = data.summary || "No summary available.";
    elements.summaryContent.innerHTML = formatMarkdown(summary);

    // Jurisdiction signals
    if (data.jurisdictionSignals?.length > 0) {
        elements.summaryContent.innerHTML += `<p style="margin-top:8px;font-size:11px;color:#94a3b8">🌍 ${data.jurisdictionSignals.join(", ")}</p>`;
    }
}

// ──────────────────────────────────────────────
//  RENDER: RISKS
// ──────────────────────────────────────────────

function renderRisks() {
    const risks = state.analysisData.risks;
    let html = "";

    // Red flags
    if (risks.red_flags && risks.red_flags.length > 0) {
        html += `<h3 style="font-size:13px;color:var(--red);margin-bottom:10px;">🚩 Red Flags</h3>`;
        risks.red_flags.forEach((flag) => {
            html += `
        <div class="risk-flag critical">
          <div class="risk-flag-header">
            <span class="risk-flag-title">${escapeHtml(flag)}</span>
            <span class="severity-badge critical">Alert</span>
          </div>
        </div>
      `;
        });
    }

    // Data collected
    if (risks.data_collected && risks.data_collected.length > 0) {
        html += `<h3 style="font-size:13px;color:var(--text-primary);margin:16px 0 10px;">📊 Data Collected</h3>`;
        risks.data_collected.forEach((cat) => {
            const severity = cat.severity || "medium";
            html += `
        <div class="risk-flag ${severity}">
          <div class="risk-flag-header">
            <span class="risk-flag-title">${escapeHtml(cat.category)}</span>
            <span class="severity-badge ${severity}">${severity}</span>
          </div>
          <p class="risk-flag-desc">${escapeHtml((cat.items || []).join(", "))}</p>
        </div>
      `;
        });
    }

    // Third party sharing
    if (risks.third_party_sharing && risks.third_party_sharing.length > 0) {
        html += `<h3 style="font-size:13px;color:var(--orange);margin:16px 0 10px;">🔗 Third-Party Sharing</h3>`;
        risks.third_party_sharing.forEach((tp) => {
            html += `
        <div class="risk-flag high">
          <div class="risk-flag-header">
            <span class="risk-flag-title">${escapeHtml(tp.entity)}</span>
          </div>
          <p class="risk-flag-desc"><strong>Purpose:</strong> ${escapeHtml(tp.purpose)}</p>
          <p class="risk-flag-desc"><strong>Data:</strong> ${escapeHtml((tp.data_shared || []).join(", "))}</p>
        </div>
      `;
        });
    }

    // User rights
    if (risks.user_rights) {
        const rights = risks.user_rights;
        html += `<h3 style="font-size:13px;color:var(--green);margin:16px 0 10px;">⚖️ Your Rights</h3>`;
        html += `
      <div class="risk-flag" style="border-left-color:var(--green)">
        <p class="risk-flag-desc">
          ${rightsBadge("Delete Data", rights.can_delete_data)} 
          ${rightsBadge("Opt Out", rights.can_opt_out)} 
          ${rightsBadge("Data Portability", rights.data_portability)} 
          ${rightsBadge("Withdraw Consent", rights.consent_withdrawal)}
        </p>
        ${rights.details ? `<p class="risk-flag-desc" style="margin-top:8px">${escapeHtml(rights.details)}</p>` : ""}
      </div>
    `;
    }

    elements.riskFlags.innerHTML = html || '<p class="empty-state">No risk data available</p>';
}

function rightsBadge(label, value) {
    const icon = value ? "✅" : "❌";
    return `<span style="display:inline-block;margin:2px 6px 2px 0;font-size:11px">${icon} ${label}</span>`;
}

// ──────────────────────────────────────────────
//  RENDER: PERMISSIONS
// ──────────────────────────────────────────────

function renderPermissions() {
    const permData = state.analysisData.permissions;
    const permissions = permData.permissions || [];

    if (permissions.length === 0) {
        elements.permissionsList.innerHTML = '<p class="empty-state">No permission data available</p>';
        return;
    }

    let html = "";

    // Stats bar
    const requested = permissions.filter((p) => p.requested).length;
    html += `
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="flex:1;padding:10px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--accent-secondary)">${requested}</div>
        <div style="font-size:10px;color:var(--text-muted)">Requested</div>
      </div>
      <div style="flex:1;padding:10px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);text-align:center">
        <div style="font-size:20px;font-weight:700;color:var(--yellow)">${(permData.unnecessary_permissions || []).length}</div>
        <div style="font-size:10px;color:var(--text-muted)">Unnecessary</div>
      </div>
      <div style="flex:1;padding:10px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);text-align:center">
        <div style="font-size:20px;font-weight:700;color:${getScoreColor(permData.permission_risk_score || 0)}">${permData.permission_risk_score || "-"}/10</div>
        <div style="font-size:10px;color:var(--text-muted)">Risk Score</div>
      </div>
    </div>
  `;

    // Permission items (only show requested ones first, then not requested)
    const sorted = [...permissions].sort((a, b) => (b.requested ? 1 : 0) - (a.requested ? 1 : 0));

    sorted.forEach((perm) => {
        if (!perm.requested) return; // Only show requested permissions

        const rec = (perm.recommendation || "").toUpperCase();
        const badgeClass = rec === "ALLOW" ? "allow" : rec === "DENY" ? "deny" : "conditional";
        const icon = getPermissionIcon(perm.name);

        html += `
      <div class="permission-item">
        <div class="permission-header">
          <span class="permission-name">${icon} ${escapeHtml(perm.name)}</span>
          <span class="permission-badge ${badgeClass}">${rec || "?"}</span>
        </div>
        <p class="permission-detail"><strong>Why:</strong> ${escapeHtml(perm.purpose || "Unknown")}</p>
        <p class="permission-detail"><strong>If denied:</strong> ${escapeHtml(perm.deny_consequence || "Unknown")}</p>
        ${perm.recommendation_reason ? `<p class="permission-detail" style="color:var(--accent-secondary)">💡 ${escapeHtml(perm.recommendation_reason)}</p>` : ""}
      </div>
    `;
    });

    elements.permissionsList.innerHTML = html;
}

function getPermissionIcon(name) {
    const icons = {
        Camera: "📷",
        Microphone: "🎤",
        "Location (GPS)": "📍",
        Contacts: "👥",
        "Storage / Files": "📁",
        Notifications: "🔔",
        "Background Activity Tracking": "👁️",
        "Clipboard Access": "📋",
        "Biometric Data (Face / Fingerprint)": "🔐",
        "Bluetooth / Nearby Devices": "📶",
        Calendar: "📅",
        "Call Logs": "📞",
        "SMS / Messages": "💬",
        "Advertising ID / Cross-App Tracking": "📡",
        "Network / Wi-Fi Information": "🌐",
    };
    return icons[name] || "🔒";
}

function getScoreColor(score) {
    if (score <= 3) return "var(--green)";
    if (score <= 5) return "var(--yellow)";
    if (score <= 7) return "var(--orange)";
    return "var(--red)";
}

// ──────────────────────────────────────────────
//  RENDER: HIDDEN CLAUSES
// ──────────────────────────────────────────────

function renderHiddenClauses() {
    const data = state.analysisData.hiddenClauses;
    const clauses = data.hidden_clauses || [];

    if (clauses.length === 0) {
        elements.hiddenClauses.innerHTML = '<p class="empty-state">No hidden clauses detected</p>';
        return;
    }

    let html = "";

    // Transparency score
    if (data.transparency_score !== undefined) {
        const tScore = data.transparency_score;
        html += `
      <div style="padding:12px;margin-bottom:12px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);text-align:center">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Transparency Score</div>
        <div style="font-size:24px;font-weight:700;color:${getScoreColor(10 - tScore)}">${tScore}/10</div>
      </div>
    `;
    }

    // Overall assessment
    if (data.overall_assessment) {
        html += `
      <div style="padding:12px;margin-bottom:12px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary);line-height:1.6">
        ${escapeHtml(data.overall_assessment)}
      </div>
    `;
    }

    // Hidden clauses
    clauses.forEach((clause, i) => {
        html += `
      <div class="hidden-clause" style="animation-delay:${i * 0.1}s">
        <div class="hidden-clause-title">
          ⚠️ ${escapeHtml(clause.title || "Hidden Clause")}
          <span class="severity-badge ${clause.severity || "high"}">${clause.severity || "high"}</span>
        </div>
        ${clause.original_text ? `<div class="hidden-clause-original">"${escapeHtml(clause.original_text)}"</div>` : ""}
        <p class="hidden-clause-plain">
          <strong>What this means:</strong> ${escapeHtml(clause.plain_english || "")}
        </p>
        ${clause.action_recommended ? `<p class="hidden-clause-action">💡 ${escapeHtml(clause.action_recommended)}</p>` : ""}
      </div>
    `;
    });

    elements.hiddenClauses.innerHTML = html;
}

// ──────────────────────────────────────────────
//  CHATBOT
// ──────────────────────────────────────────────

async function sendChatMessage() {
    const question = elements.chatInput.value.trim();
    if (!question) return;

    addChatMessage("user", question);
    elements.chatInput.value = "";

    const typingEl = addTypingIndicator();

    try {
        const response = await apiCall("/chat", {
            url: state.currentUrl,
            question: question,
        });

        typingEl.remove();
        const confidence = response.confidence || null;
        const silent = response.document_silent_on_topic || false;
        addChatMessage("bot", response.answer || "I couldn't find an answer.", confidence, silent);
    } catch (error) {
        typingEl.remove();
        addChatMessage("bot", `Sorry, I couldn't answer that. ${error.message || "Please make sure the backend is running."}`);
    }
}

function addChatMessage(role, text, confidence, silent) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-msg ${role}`;
    let meta = "";
    if (role === "bot" && confidence) {
        const color = confidence === "High" ? "#4ade80" : confidence === "Medium" ? "#facc15" : "#f87171";
        const bg = confidence === "High" ? "rgba(34,197,94,0.12)" : confidence === "Medium" ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";
        meta += `<span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;background:${bg};color:${color}">${confidence === "High" ? "✓" : confidence === "Medium" ? "~" : "?"} ${confidence}</span>`;
        if (silent) meta += `<span style="font-size:10px;color:#64748b;margin-left:4px;font-style:italic">Policy silent on topic</span>`;
    }
    msgDiv.innerHTML = `
    <div class="msg-avatar">${role === "bot" ? "🛡️" : "👤"}</div>
    <div class="msg-bubble">${role === "bot" ? formatMarkdown(text) : escapeHtml(text)}${meta}</div>
  `;
    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg bot";
    msgDiv.innerHTML = `
    <div class="msg-avatar">🛡️</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return msgDiv;
}

// ──────────────────────────────────────────────
//  UI HELPERS
// ──────────────────────────────────────────────

function showSection(name) {
    elements.scanSection.classList.add("hidden");
    elements.loadingSection.classList.add("hidden");
    elements.resultsSection.classList.add("hidden");
    elements.errorSection.classList.add("hidden");

    switch (name) {
        case "scan":
            elements.scanSection.classList.remove("hidden");
            break;
        case "loading":
            elements.loadingSection.classList.remove("hidden");
            break;
        case "results":
            elements.resultsSection.classList.remove("hidden");
            break;
        case "error":
            elements.errorSection.classList.remove("hidden");
            break;
    }
}

function updateLoadingStep(step) {
    for (let i = 1; i <= 4; i++) {
        const el = $(`#step${i}`);
        el.classList.remove("active", "done");
        if (i < step) el.classList.add("done");
        if (i === step) el.classList.add("active");
    }

    const texts = [
        "",
        "Extracting page content...",
        "Running AI analysis...",
        "Mapping permissions...",
        "Detecting hidden clauses...",
    ];
    elements.loadingText.textContent = texts[step] || "Processing...";
}

function switchTab(tabName) {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-content").forEach((c) => c.classList.remove("active"));

    $(`.tab[data-tab="${tabName}"]`).classList.add("active");
    $(`#tab-${tabName}`).classList.add("active");
}

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
        .replace(/- (.*?)(?:\n|$)/g, "• $1<br>")
        .replace(/\n/g, "<br>");
}
