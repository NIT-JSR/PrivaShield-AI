import { useState } from 'react';

const FEATURES = [
    {
        icon: '🔍',
        title: 'AI Policy Analysis',
        desc: 'Instantly summarize privacy policies using advanced AI. No more reading thousands of words of legal jargon.'
    },
    {
        icon: '🚩',
        title: 'Risk Detection',
        desc: 'Identify hidden red flags like perpetual data ownership, silent third-party sharing, and arbitration traps.'
    },
    {
        icon: '🔐',
        title: 'Permission Mapping',
        desc: 'See exactly which device permissions an app needs and what happens if you deny each one.'
    },
    {
        icon: '⚠️',
        title: 'Hidden Clause Finder',
        desc: 'AI-powered detection of buried clauses that companies hope you won\'t read — translated to plain English.'
    },
    {
        icon: '💬',
        title: 'Policy Chatbot',
        desc: 'Ask questions about any privacy policy in natural language. Get instant, context-aware answers.'
    },
    {
        icon: '🛡️',
        title: 'Privacy Shield Score',
        desc: 'Every site gets a 1-10 risk score so you can make informed decisions at a glance.'
    }
];

const STEPS = [
    { title: 'Install the Extension', desc: 'Add PrivaShield AI to Chrome. One click and you\'re protected.' },
    { title: 'Visit Any Website', desc: 'Navigate to any site with a privacy policy or terms of service.' },
    { title: 'Click Analyze', desc: 'Our AI extracts, cleans, and processes the policy text using Legal-BERT and Gemini.' },
    { title: 'Get Instant Insights', desc: 'See your risk score, permission mapping, hidden clauses, and chat with the policy.' },
];

const ARCH_NODES = [
    'Chrome Extension', '→', 'Policy Ingest API', '→', 'Text Cleaning + Chunking', '→',
    'Legal-BERT', '→', 'Embedding Model', '→', 'Vector Database (FAISS)', '→',
    'Risk Analyzer + Permission Mapper', '→', 'RAG Chatbot', '→', 'Frontend UI'
];

export default function LandingPage({ onNavigate }) {
    return (
        <div className="ps-landing">
            {/* ─── HERO ─── */}
            <section className="ps-hero">
                <div className="ps-hero-content">
                    <div className="ps-hero-badge">
                        <span className="dot"></span>
                        AI-Powered Privacy Protection
                    </div>
                    <h2>
                        Know What They<br />
                        <span className="gradient">Really Do With Your Data</span>
                    </h2>
                    <p>
                        PrivaShield AI is an intelligent middleware that bridges the gap between
                        legal privacy policies and actual device permissions — giving you contextual consent,
                        not blind consent.
                    </p>
                    <div className="ps-hero-actions">
                        <button className="ps-btn-primary" onClick={() => onNavigate('dashboard')}>
                            🚀 Try Dashboard
                        </button>
                        <a href="#features" className="ps-btn-secondary">
                            Learn More ↓
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── FEATURES ─── */}
            <section className="ps-features" id="features">
                <div className="ps-section-title">
                    <h3>Powerful Features</h3>
                    <p>Everything you need to understand and control your digital privacy.</p>
                </div>
                <div className="ps-features-grid">
                    {FEATURES.map((f, i) => (
                        <div className="ps-feature-card" key={i}>
                            <span className="ps-feature-icon">{f.icon}</span>
                            <h4>{f.title}</h4>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="ps-how-it-works" id="how-it-works">
                <div className="ps-section-title">
                    <h3>How It Works</h3>
                    <p>From policy chaos to clarity in 4 simple steps.</p>
                </div>
                <div className="ps-steps">
                    {STEPS.map((s, i) => (
                        <div className="ps-step" key={i}>
                            <div className="ps-step-number">{i + 1}</div>
                            <div className="ps-step-content">
                                <h4>{s.title}</h4>
                                <p>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── ARCHITECTURE ─── */}
            <section className="ps-architecture" id="architecture">
                <div className="ps-section-title">
                    <h3>System Architecture</h3>
                    <p>A modular pipeline from raw policy text to actionable insights.</p>
                </div>
                <div className="ps-arch-flow">
                    {ARCH_NODES.map((node, i) => (
                        node === '→'
                            ? <span className="ps-arch-arrow" key={i}>→</span>
                            : <div className="ps-arch-node" key={i}>{node}</div>
                    ))}
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="ps-footer">
                <p>
                    Built with ❤️ by the PrivaShield AI Team — NIT Jamshedpur
                    <br />
                    <a href="https://github.com/NIT-JSR/PrivaShield-AI" target="_blank" rel="noreferrer">
                        GitHub Repository
                    </a>
                </p>
            </footer>
        </div>
    );
}
