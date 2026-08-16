import { useState, useEffect } from 'react';
import '../privashield.css';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Chatbot from './Chatbot';
import logoImg from '../assets/logo.png';

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

export default function PrivaShield() {
    const [page, setPage] = useState('home');
    const [currentUser, setCurrentUser] = useState(null);

    // Verify token on mount
    useEffect(() => {
        const token = localStorage.getItem("ps_token");
        if (token) {
            fetch(`${API_BASE}/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Invalid token");
            })
            .then(data => {
                setCurrentUser(data);
            })
            .catch(() => {
                localStorage.removeItem("ps_token");
                setCurrentUser(null);
            });
        }
    }, []);

    // Support initial load with hash
    useEffect(() => {
        if (window.location.hash) {
            setTimeout(() => {
                const el = document.querySelector(window.location.hash);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    const handleNav = (e, targetPage, targetId = null) => {
        e.preventDefault();
        setPage(targetPage);
        
        if (targetId) {
            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, null, `#${targetId}`);
                }
            }, 50);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.pushState(null, null, ' '); // remove hash
        }
    };

    return (
        <div className="ps-app">
            {/* ─── NAVBAR ─── */}
            <nav className="ps-navbar">
                <a className="ps-navbar-brand" href="/" onClick={(e) => handleNav(e, 'home')} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={logoImg} alt="PrivaShield AI Logo" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    <h1>PrivaShield<span className="ai">AI</span></h1>
                </a>
                <ul className="ps-nav-links">
                    <li><a href="/" onClick={(e) => handleNav(e, 'home')}>Home</a></li>
                    <li><a href="/dashboard" onClick={(e) => handleNav(e, 'dashboard')}>Dashboard</a></li>
                    <li><a href="/chat" onClick={(e) => handleNav(e, 'chat')}>Chatbot</a></li>
                    <li><a href="#features" onClick={(e) => handleNav(e, 'home', 'features')}>Features</a></li>
                    <li><a href="#about" onClick={(e) => handleNav(e, 'home', 'about')}>About</a></li>
                </ul>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {currentUser ? (
                        <div className="ps-user-menu" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 600 }}>
                                👤 {currentUser.name || currentUser.email.split('@')[0]}
                            </span>
                            <button className="ps-nav-cta secondary" onClick={() => {
                                localStorage.removeItem("ps_token");
                                setCurrentUser(null);
                                window.location.reload();
                            }} style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button className="ps-nav-cta secondary" onClick={() => {
                            setPage('dashboard');
                            setTimeout(() => {
                                const btn = document.getElementById("trigger-login-btn");
                                if (btn) btn.click();
                            }, 100);
                        }} style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
                            Sign In
                        </button>
                    )}
                    <button className="ps-nav-cta" onClick={() => setPage('dashboard')}>
                        Analyze Policy
                    </button>
                </div>
            </nav>

            {/* ─── PAGES ─── */}
            {page === 'home' && <LandingPage onNavigate={setPage} />}
            {page === 'dashboard' && <Dashboard currentUser={currentUser} setCurrentUser={setCurrentUser} />}
            {page === 'chat' && <Chatbot currentUser={currentUser} />}
        </div>
    );
}

