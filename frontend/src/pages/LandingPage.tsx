import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BarChart3, FolderTree, Sliders, Database, Wind } from 'lucide-react';

/* ─── Logo SVG ─────────────────────────────────────────────────────── */
const CarbonixLogo: React.FC<{ size?: number; light?: boolean }> = ({ size = 38, light = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hexagon base */}
    <polygon
      points="20,2 36,11 36,29 20,38 4,29 4,11"
      fill={light ? 'rgba(255,255,255,0.15)' : '#1E4535'}
      stroke={light ? 'rgba(255,255,255,0.6)' : '#3A7A5C'}
      strokeWidth="1.5"
    />
    {/* Leaf/molecule arc */}
    <path
      d="M13 24 Q13 14 20 12 Q27 14 27 24"
      stroke={light ? '#6EE7B7' : '#52C78A'}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* CO2 molecule dots */}
    <circle cx="20" cy="12" r="2" fill={light ? '#6EE7B7' : '#52C78A'} />
    <circle cx="13" cy="24" r="2" fill={light ? '#6EE7B7' : '#52C78A'} />
    <circle cx="27" cy="24" r="2" fill={light ? '#6EE7B7' : '#52C78A'} />
    {/* Stem */}
    <line x1="20" y1="24" x2="20" y2="29" stroke={light ? '#6EE7B7' : '#52C78A'} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#EAE6DC', color: '#2C2C2C' }}>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — full‑viewport background image with cloud animation
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>

        {/* Background photo */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/hero-landscape.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Dark gradient overlay so text is readable */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(5,20,12,0.42) 0%, rgba(5,20,12,0.18) 55%, rgba(5,20,12,0.55) 100%)',
          }}
        />

        {/* ── Animated cloud planes ──
            We use 3 shifted copies of the same image at different speeds
            and vertical positions to create a parallax cloud drift.        */}
        <style>{`
          @keyframes cloudDrift1 {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          @keyframes cloudDrift2 {
            from { transform: translateX(-15%); }
            to   { transform: translateX(-65%); }
          }
          @keyframes cloudDrift3 {
            from { transform: translateX(-30%); }
            to   { transform: translateX(-80%); }
          }
          .cloud-layer-1 {
            position: absolute; top: 0; left: 0; z-index: 11;
            width: 200%; height: 45%;
            background-image: url(/hero-landscape.jpg);
            background-repeat: repeat-x;
            background-size: auto 100%;
            background-position: 0 0;
            opacity: 0.22;
            mix-blend-mode: screen;
            animation: cloudDrift1 18s linear infinite;
            pointer-events: none;
          }
          .cloud-layer-2 {
            position: absolute; top: 3%; left: 0; z-index: 12;
            width: 200%; height: 38%;
            background-image: url(/hero-landscape.jpg);
            background-repeat: repeat-x;
            background-size: auto 110%;
            background-position: 0 0;
            opacity: 0.14;
            mix-blend-mode: screen;
            animation: cloudDrift2 12s linear infinite;
            pointer-events: none;
          }
          .cloud-layer-3 {
            position: absolute; top: 1%; left: 0; z-index: 13;
            width: 200%; height: 32%;
            background-image: url(/hero-landscape.jpg);
            background-repeat: repeat-x;
            background-size: auto 120%;
            background-position: 0 -5%;
            opacity: 0.10;
            mix-blend-mode: screen;
            animation: cloudDrift3 8s linear infinite;
            pointer-events: none;
          }
        `}</style>

        <div className="cloud-layer-1" />
        <div className="cloud-layer-2" />
        <div className="cloud-layer-3" />

        {/* ── Navigation ── */}
        <nav className="relative z-20 w-full flex items-center justify-between px-8 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>

          {/* Logo + Brand */}
          <div className="flex items-center space-x-3">
            <CarbonixLogo size={38} light />
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-white drop-shadow">
                Carbonix
              </span>
              <span
                className="ml-2 font-mono-data text-[9px] uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#86efac', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                v2.4 Climate Portal
              </span>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
          </div>

          {/* CTA */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium transition-colors hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.45)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Access Platform →
            </button>
          </div>
        </nav>

        {/* ── Hero copy ── */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 pt-16 pb-32">

          {/* Badge */}
          <div
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-mono-data font-semibold mb-8"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#86efac',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Research-Grade Scope 3 Intelligence · COP28 Compliant</span>
          </div>

          {/* H1 — hollow/outlined style */}
          <h1
            className="font-heading font-bold tracking-tight leading-none mb-6"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px rgba(255,255,255,0.9)',
              textShadow: '0 2px 40px rgba(0,0,0,0.3)',
              maxWidth: '900px',
            }}
          >
            Carbon-Aware Supply Chain
          </h1>
          {/* Subtitle in solid white for contrast */}
          <h2
            className="font-heading font-semibold tracking-tight mb-6"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
              color: '#fff',
              textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              maxWidth: '800px',
            }}
          >
            Intelligence & Decarbonization
          </h2>

          <p
            className="font-sans text-base md:text-lg leading-relaxed mb-10 max-w-2xl"
            style={{
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 1px 6px rgba(0,0,0,0.4)',
            }}
          >
            Auditable Scope 3 carbon accounting across multi-tier supply networks.
            Ingest activity, calculate exact CO₂e footprints, identify hotspots,
            and model what-if circular decarbonization scenarios in real time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Primary: Google Sign-in style (placeholder) */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#1E4535',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              {/* Google G icon placeholder */}
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Access Demo Platform <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No credit card required · COP28-compliant audit trail · SOC 2 ready
          </p>

          {/* ── Stat strip ── */}
          <div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {[
              { label: 'Total Audited Carbon', value: '285.4 tCO₂e', sub: '-12.3% YoY baseline' },
              { label: 'Audited Suppliers', value: '1,247', sub: 'Multi-tier coverage' },
              { label: 'Compliance Rate', value: '94.2%', sub: '+2.4% validated' },
              { label: 'Risk Index', value: '73 / 100', sub: 'Borderline threshold' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
              >
                <p className="font-mono-data text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {stat.label}
                </p>
                <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
                <p className="font-mono-data text-[11px] mt-1" style={{ color: '#86efac' }}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #EAE6DC)' }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WORKFLOW SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section id="workflow" className="py-20 px-8" style={{ background: '#EAE6DC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="font-mono-data text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full"
              style={{ background: '#D6E8DC', color: '#1E4535' }}
            >
              How It Works
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mt-4" style={{ color: '#1E4535' }}>
              End-to-End Climate Telemetry & Action
            </h2>
            <p className="mt-3 text-sm" style={{ color: '#6B7B72' }}>
              From raw activity ingest to machine-assisted supplier decarbonization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <Database className="w-5 h-5" />, step: '01', title: 'Ingest Data', desc: 'Import supplier CSV activity logs or gap-fill via Model A. Primary or modelled data, both supported.' },
              { icon: <BarChart3 className="w-5 h-5" />, step: '02', title: 'Calculate Footprint', desc: 'Deterministic factor engine evaluates energy, transport, material, manufacturing & logistics emissions.' },
              { icon: <FolderTree className="w-5 h-5" />, step: '03', title: 'Map Hotspots', desc: 'Visualize multi-tier supplier trees and geographic pins to isolate high-carbon risk nodes in real time.' },
              { icon: <Sliders className="w-5 h-5" />, step: '04', title: 'Simulate Actions', desc: 'Model circular alternatives, renewable energy PPAs and modal transport shifts with live What-If sliders.' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-xl transition-all hover:-translate-y-1"
                style={{
                  background: '#fff',
                  border: '1.5px solid #D8D4CC',
                  boxShadow: '0 2px 12px rgba(27,58,45,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: '#1E4535', color: '#6EE7B7' }}
                >
                  {item.icon}
                </div>
                <span className="font-mono-data text-xs font-bold" style={{ color: '#9DB8A8' }}>{item.step}</span>
                <h3 className="font-heading font-bold text-lg mt-1 mb-2" style={{ color: '#1E4535' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#666' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SIGN-IN CTA BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-8" style={{ background: '#1E4535' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            Ready to decarbonize your supply chain?
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Join forward-looking procurement and sustainability teams using Carbonix.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Google Sign-in placeholder */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: '#fff', color: '#1E4535', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'transparent', color: '#86efac', border: '1.5px solid rgba(134,239,172,0.4)' }}
            >
              Use Demo Account →
            </button>
          </div>
          <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Google OAuth integration coming soon · Use the demo account for full platform access
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="py-8 px-8" style={{ background: '#12281F', borderTop: '1px solid #254F3E' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <CarbonixLogo size={30} light />
            <div>
              <span className="font-heading text-base font-bold text-white">Carbonix</span>
              <p className="font-mono-data text-[10px] mt-0.5" style={{ color: '#6EE7B7' }}>
                Supply Chain Intel Platform v2.4
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs" style={{ color: '#6B8C7C' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>© 2025 Carbonix. COP28 compliant · SOC 2 Type II ready</span>
          </div>
          <div className="font-mono-data text-xs" style={{ color: '#4B6B5B' }}>
            SYSTEM SPECIFICATION v2.4
          </div>
        </div>
      </footer>

    </div>
  );
};
