import { useState, useEffect } from 'react';
import '../privashield.css';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Chatbot from './Chatbot';

export default function PrivaShield() {
    const [page, setPage] = useState('home');

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
                    // Update URL without jumping
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
                <a className="ps-navbar-brand" href="/" onClick={(e) => handleNav(e, 'home')}>
                    <span className="shield">🛡️</span>
                    <h1>PrivaShield<span className="ai">AI</span></h1>
                </a>
                <ul className="ps-nav-links">
                    <li><a href="/" onClick={(e) => handleNav(e, 'home')}>Home</a></li>
                    <li><a href="/dashboard" onClick={(e) => handleNav(e, 'dashboard')}>Dashboard</a></li>
                    <li><a href="/chat" onClick={(e) => handleNav(e, 'chat')}>Chatbot</a></li>
                    <li><a href="#features" onClick={(e) => handleNav(e, 'home', 'features')}>Features</a></li>
                    <li><a href="#about" onClick={(e) => handleNav(e, 'home', 'about')}>About</a></li>
                </ul>
                <button className="ps-nav-cta" onClick={() => setPage('dashboard')}>
                    Analyze Policy
                </button>
            </nav>

            {/* ─── PAGES ─── */}
            {page === 'home' && <LandingPage onNavigate={setPage} />}
            {page === 'dashboard' && <Dashboard />}
            {page === 'chat' && <Chatbot />}
        </div>
    );
}

