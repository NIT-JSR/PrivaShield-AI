import { useState } from 'react';

const FEATURES = [
    {
        icon: 'gpp_bad',
        title: 'Risk Detection',
        desc: 'Automatically flags aggressive data harvesting tactics and silent background tracking attempts.',
        color: 'text-error'
    },
    {
        icon: 'key',
        title: 'Permission Mapping',
        desc: 'Cross-references stated policies with actual OS-level device permissions requested by apps.',
        color: 'text-secondary'
    },
    {
        icon: 'search_insights',
        title: 'Hidden Clause Finder',
        desc: 'Unearths buried terms regarding third-party data sales and indefinite retention periods.',
        color: 'text-tertiary'
    },
    {
        icon: 'smart_toy',
        title: 'Policy Chatbot',
        desc: 'Ask natural language questions about any terms of service and get instant, accurate answers.',
        color: 'text-primary'
    }
];

const STEPS = [
    {
        icon: 'upload_file',
        title: '1. Upload or Link',
        desc: 'Provide the URL to a privacy policy or upload the document directly to the platform.',
        shadow: 'shadow-[0_0_15px_rgba(208,188,255,0.2)]',
        border: 'border-primary/40',
        text: 'text-primary'
    },
    {
        icon: 'memory',
        title: '2. AI Analysis',
        desc: 'Our neural network scans for malicious clauses, data brokering terms, and aggressive permissions.',
        shadow: 'shadow-[0_0_15px_rgba(76,215,246,0.2)]',
        border: 'border-secondary/40',
        text: 'text-secondary'
    },
    {
        icon: 'shield_locked',
        title: '3. Protect',
        desc: 'Review the generated Privacy Shield Score and actionable steps to lock down your settings.',
        shadow: 'shadow-[0_0_15px_rgba(255,178,183,0.2)]',
        border: 'border-tertiary/40',
        text: 'text-tertiary'
    }
];

const TEAM = [
    {
        name: 'Prince',
        role: 'Lead Engineer',
        color: 'from-primary/20',
        border: 'hover:border-primary/30',
        textColor: 'text-primary/80',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEmBBjaYFh7R17O0rqlxuxPjk5kZjtSZVX88cCoDKpHoRs-MdZnfQvl7Cc0HLFByoTot-7Qaxe_0qgRSyO8dp6492Rq0jFXtoLn98wBSgXBvpta346Z2S1m4iLYoXP9Z24pKwKL6uj4dxWt3MUJNjFvb8w3RkObYJOGe8Cz1zRh36x2xUaUkuNu_CloEkWQ6LkIoJ0pS3ywShG7g9CsjjYLnzaJgBntB1L-m8sVJPfPp1RNcZyxMqpqzfpFmgk9dp4n6cKgXd31w'
    },
    {
        name: 'Harsha',
        role: 'AI Researcher',
        color: 'from-secondary/20',
        border: 'hover:border-secondary/30',
        textColor: 'text-secondary/80',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSF1XWISjZpmALr5aKhoaXXgD6MTayT0RNxUBx_VvJ3Qtrxl1hi39WosLiGVnlfGE-EvKVQl-2p0pccKeE2yXx17EecSW47Iv-iKTKwX3yz5kstyDtuKlykLyz08bKW0PPbE5J4yRoxkQkzeUpOFt5NlyLSnl3LP495G17OeB7u0x3hb9HJqPvuI97UfEXxH4_J9NMZlSwHNTIhXJrkoHdkX9N8Uxy8cAKy5EpzGHamGONT246SYcf8cnRsPxQ9uaWGhobDyjiwQ'
    },
    {
        name: 'Shivagya',
        role: 'Legal Analyst',
        color: 'from-tertiary/20',
        border: 'hover:border-tertiary/30',
        textColor: 'text-tertiary/80',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmLO9lDMgZrDj0elCwzk6Jwms-ZG7BDNBXXqjfR1J-OlizzxGXQy_rs83-Pl_DP-VwbAV_vXVwsfMCsFmVcy_wpcYUs3ocu64gGba541lO7WEsB7zn1tW3E7Yto8lZ9-pupC6VJAd3heKf1ZocPM-1DexD4iqqvfsRoxYXX_XSuNuT9VBEcBqNraulX3QOTY86-23hokN1fI6G3FxPxMedUPEs8oXtSzlSJdE0PrgpDajaT7Qm_AmlZbs07lKqJv7RzkBvok124g'
    },
    {
        name: 'Satyam',
        role: 'UX Designer',
        color: 'from-primary/40',
        border: 'hover:border-primary/30',
        textColor: 'text-primary/80',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARJNfKwsN-YhFCAdiz1oASikPcvzkGrAAqQbIBoYaYNbizx53pW1rm4NZi4ASTdg6BpJJbfpT2fn1iZBxzJgbvUPGXq5YOwBB5X6AQ9dK2ZCNUraO3Z5Yv56jEK7WVPnCibGoqDSj3epsUNV3-yOSxZ34HYZmlRr1XC4o6WmVHUkpVVWX6mfpcfa2qAFgoGzR92GGLEmumT_CsuXIztH0voXD8yIGkBennX7kPzE5j05pZlhV3vmEdbk4lPbpP2AoD-FpRPVAc-A'
    },
    {
        name: 'Ashutosh',
        role: 'Data Scientist',
        color: 'from-secondary/40',
        border: 'hover:border-secondary/30',
        textColor: 'text-secondary/80',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_TOqwuCFOUozHTZZJik_YYYRqd7l8vnDNPVy4R5WmDDsoFo67RXP9LQa8NdfMw9_ZyrPHUgmhPWLv24ZGS30fCyPADDIxI1YIvmE8Z260H2D2bAPkE4QK1O9L-f42HWORIBy6NpJHMq-u3RlHSDdqMuc3jzFiuzuwAgBiS4tV14JyTq1gFkpc8gr0GvT4KrlvY0Tk0ii6RKTXJoUChxJYwzvdK0vD6mZRuz2UIcmwsj1tjF4B-6Le4XLS9CGh0CNw3xuLNEX3SQ'
    }
];

export default function LandingPage({ onNavigate }) {
    return (
        <div className="flex-grow flex flex-col">
            {/* Main Content */}
            <main className="flex-grow pt-[80px]">
                {/* Hero Section */}
                <section className="relative min-h-[85vh] flex items-center justify-center px-margin-mobile md:px-margin-desktop py-xl overflow-hidden">
                    {/* Atmospheric Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
                    <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-md">
                        <span className="font-label-sm text-xs font-semibold uppercase tracking-widest text-secondary bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20 backdrop-blur-sm mb-sm inline-block">
                            AI-Powered Privacy Protection
                        </span>
                        <h1 className="font-display-lg text-3xl md:text-5xl leading-tight md:leading-tight mb-4 font-bold text-white">
                            Know What They <span className="text-gradient">Really Do</span> With Your Data
                        </h1>
                        <p className="font-body-lg text-lg text-[#cbc3d7] max-w-2xl mx-auto mb-lg">
                            PrivaShield AI bridges the gap between opaque legal policies and actual device permissions. We analyze app behaviors in real-time, translating complex terms of service into actionable privacy insights so you can take back control of your digital life.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-sm w-full sm:w-auto justify-center">
                            <button 
                                className="btn-primary text-white font-body-md text-base px-8 py-3 rounded-lg flex items-center justify-center gap-xs"
                                onClick={() => onNavigate('dashboard')}
                            >
                                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                                Try Dashboard
                            </button>
                            <a 
                                href="#features"
                                className="glass-panel text-[#e1e1f7] font-body-md text-base px-8 py-3 rounded-lg flex items-center justify-center gap-xs hover:bg-white/5 transition-colors border border-outline-variant hover:border-primary/50"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Bento Grid */}
                <section className="px-margin-mobile md:px-margin-desktop py-xl max-w-7xl mx-auto" id="features">
                    <div className="mb-lg">
                        <h2 className="font-headline-lg text-2xl md:text-3xl font-semibold text-white mb-xs">Platform Capabilities</h2>
                        <p className="font-body-md text-base text-[#cbc3d7]">Advanced tools to dissect and secure your privacy.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-md">
                        {/* Feature 1: Large Span */}
                        <div className="md:col-span-4 glass-panel glass-panel-hover rounded-xl p-md flex flex-col justify-between transition-all duration-300">
                            <div className="mb-sm">
                                <span className="material-symbols-outlined text-primary text-[32px] mb-xs">policy</span>
                                <h3 className="font-title-md text-xl font-medium text-white mb-xs">AI Policy Analysis</h3>
                                <p className="font-body-md text-base text-[#cbc3d7]">
                                    Our proprietary NLP engine instantly reads and digests 50-page privacy policies, highlighting the exact clauses that matter to you.
                                </p>
                            </div>
                            <div className="h-32 rounded-lg bg-[#1d1e2e]/50 border border-white/5 flex items-end p-xs gap-1 overflow-hidden relative">
                                <div className="w-full h-[80%] bg-gradient-to-t from-primary/30 to-transparent rounded-t-sm"></div>
                                <div className="w-full h-[40%] bg-gradient-to-t from-secondary/30 to-transparent rounded-t-sm"></div>
                                <div className="w-full h-[90%] bg-gradient-to-t from-primary/40 to-transparent rounded-t-sm"></div>
                                <div className="w-full h-[60%] bg-gradient-to-t from-tertiary/30 to-transparent rounded-t-sm"></div>
                            </div>
                        </div>

                        {/* Feature 2 to 5 */}
                        {FEATURES.map((f, i) => (
                            <div className="md:col-span-2 glass-panel glass-panel-hover rounded-xl p-md transition-all duration-300" key={i}>
                                <span className={`material-symbols-outlined ${f.color} text-[32px] mb-xs`}>{f.icon}</span>
                                <h3 className="font-title-md text-xl font-medium text-white mb-xs">{f.title}</h3>
                                <p className="font-body-md text-base text-[#cbc3d7]">
                                    {f.desc}
                                </p>
                            </div>
                        ))}

                        {/* Feature 6: Long Span */}
                        <div className="md:col-span-6 glass-panel glass-panel-hover rounded-xl p-md flex flex-col md:flex-row items-center gap-md transition-all duration-300">
                            <div className="flex-1">
                                <span className="material-symbols-outlined text-secondary text-[32px] mb-xs">speed</span>
                                <h3 className="font-title-md text-xl font-medium text-white mb-xs">Privacy Shield Score</h3>
                                <p className="font-body-md text-base text-[#cbc3d7] max-w-lg">
                                    Get a unified, easy-to-understand health score for every app you use, calculated across dozens of risk vectors and policy transparency metrics.
                                </p>
                            </div>
                            {/* AI Score Gauge Visualization */}
                            <div className="w-32 h-32 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-[#1d1e2e]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                    <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="85, 100" strokeWidth="3"></path>
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="font-display-lg text-2xl font-bold text-white">92</span>
                                    <span className="font-label-sm text-[10px] font-semibold text-secondary">SAFE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="px-margin-mobile md:px-margin-desktop py-xl max-w-7xl mx-auto" id="how-it-works">
                    <div className="text-center mb-xl">
                        <h2 className="font-headline-lg text-2xl md:text-3xl font-semibold text-white mb-xs">How It Works</h2>
                        <p className="font-body-md text-base text-[#cbc3d7] max-w-2xl mx-auto">Simple process, complex analysis. Protect your data in three steps.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0"></div>
                        {STEPS.map((s, i) => (
                            <div className="relative z-10 flex flex-col items-center text-center" key={i}>
                                <div className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-sm ${s.border} ${s.shadow}`}>
                                    <span className={`material-symbols-outlined ${s.text} text-[28px]`}>{s.icon}</span>
                                </div>
                                <h3 className="font-title-md text-xl font-medium text-white mb-2">{s.title}</h3>
                                <p className="font-body-md text-base text-[#cbc3d7] px-4">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Architecture Section */}
                <section className="px-margin-mobile md:px-margin-desktop py-xl bg-[#191a2a]/30 border-y border-white/5" id="architecture">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-lg text-center">
                            <h2 className="font-headline-lg text-2xl md:text-3xl font-semibold text-white mb-xs">Platform Architecture</h2>
                            <p className="font-body-md text-base text-[#cbc3d7] max-w-2xl mx-auto">A look under the hood at how our systems correlate legal text with technical reality.</p>
                        </div>
                        <div className="glass-panel rounded-xl p-4 md:p-md shadow-lg overflow-hidden border-primary/20">
                            <img 
                                alt="System Architecture Flowchart" 
                                className="w-full h-auto rounded-lg mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDBysxqMGxulMpFLOGL4WMC8-lAslikx19QJVaQFAIKeE0geBlFVZMwie2YJIuyobxlFBO1QA-robdDxjCiIAD7WWMk_MoF2uvkyJxYVveteVx4cIJ8qUkPIqSlOOEFT48YBIs9FRMJ8cXUPCtQpDhG1SaeHYsFzULNsw74FEgWabj_WatgHMbGfQPVhfUa0Z5viC7jlbekCpXCJ5VHow0T9keCGzD6wPO0qzV5iSaByg3v8cnzmDTvSGHUgZeEF0oZU1gmaEHig"
                            />
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="px-margin-mobile md:px-margin-desktop py-xl max-w-7xl mx-auto" id="team">
                    <div className="mb-lg text-center">
                        <h2 className="font-headline-lg text-2xl md:text-3xl font-semibold text-white mb-xs">The Builders</h2>
                        <p className="font-body-md text-base text-[#cbc3d7]">Engineering privacy for the AI era.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                        {TEAM.map((member, i) => (
                            <div 
                                className={`glass-panel rounded-xl p-md flex flex-col items-center text-center ${member.border} transition-colors ${i === 4 ? 'col-span-2 md:col-span-1 mx-auto md:mx-0 w-full md:w-auto' : ''}`}
                                key={i}
                            >
                                <div 
                                    className={`w-20 h-20 rounded-full mb-sm overflow-hidden bg-gradient-to-br ${member.color} to-surface border border-white/10 bg-cover bg-center`}
                                    style={{ backgroundImage: `url(${member.avatar})` }}
                                ></div>
                                <h4 className="font-title-md text-base font-semibold text-white">{member.name}</h4>
                                <span className={`font-label-sm text-xs ${member.textColor}`}>{member.role}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-xl bg-[#0b0d1c] border-t border-white/5 transition-all duration-300 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-7xl mx-auto gap-lg w-full">
                    {/* Brand & Copyright */}
                    <div className="flex flex-col items-center md:items-start gap-xs">
                        <div className="flex items-center gap-xs">
                            <img 
                                alt="PrivaShield AI Logo" 
                                className="w-6 h-6 rounded-full opacity-80" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAzNzCHEIIVFU4fB_O2D0VU0XCv8h_Us6OkhMSakNcuEjG1jzuOVFK1YeAM3mqOn_WsvhVyAUN3uO72KkMkBAcsY6AybPCUwZpoviYl3XWSbcc6qigGNLF8c0WNYUScEmQpxebAs2PwefojLJi23CLfh_7PyuLdU_D4m1OR_1hvprizG5pONRpMTi46eRdHo2YcxRb5S-6ylAIUic3y-v7CIcvMERfnNAOes97Vpl5la0SfKXOF5YAXiieS7hHtOQwhefogJOasQ"
                            />
                            <span className="font-headline-lg text-lg text-primary tracking-tight font-semibold">PrivaShield AI</span>
                        </div>
                        <p className="font-body-md text-xs text-[#cbc3d7] mt-1">© 2024 PrivaShield AI. All rights reserved.</p>
                    </div>
                    {/* Links */}
                    <div className="flex flex-wrap justify-center gap-md">
                        <a className="font-body-md text-sm text-[#cbc3d7] hover:text-secondary transition-colors" href="#">Privacy Policy</a>
                        <a className="font-body-md text-sm text-[#cbc3d7] hover:text-secondary transition-colors" href="#">Terms of Service</a>
                        <a className="font-body-md text-sm text-[#cbc3d7] hover:text-secondary transition-colors" href="#">API Documentation</a>
                        <a className="font-body-md text-sm text-[#cbc3d7] hover:text-secondary transition-colors" href="#">Contact Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
