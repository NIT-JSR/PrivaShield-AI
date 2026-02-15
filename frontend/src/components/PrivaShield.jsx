import { useState } from 'react';
import '../privashield.css';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Chatbot from './Chatbot';

export default function PrivaShield() {
    const [page, setPage] = useState('home');

    return (
        <div className="ps-app">
            {/* ─── NAVBAR ─── */}
            <nav className="ps-navbar">
                <a className="ps-navbar-brand" href="#" onClick={() => setPage('home')}>
                    <span className="shield">🛡️</span>
                    <h1>PrivaShield<span className="ai">AI</span></h1>
                </a>
                <ul className="ps-nav-links">
                    <li><a href="#" onClick={() => setPage('home')}>Home</a></li>
                    <li><a href="#" onClick={() => setPage('dashboard')}>Dashboard</a></li>
                    <li><a href="#" onClick={() => setPage('chat')}>Chatbot</a></li>
                    <li><a href="#features">Features</a></li>
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
