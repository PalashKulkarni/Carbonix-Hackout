import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BarChart3, FolderTree, Sliders, Database } from 'lucide-react';

/* ─── Logo: Fingerprint-C mark matching new brand identity ──────── */
const CarbonixLogo: React.FC<{ size?: number; light?: boolean }> = ({ size = 38, light = false }) => {
  const stroke = light ? '#ffffff' : '#1E4535';
  const dot    = light ? '#6EE7B7' : '#2D6A4F';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fingerprint-style C — concentric arcs open on the right, with endpoint dots */}
      {/* Arc 1 — innermost */}
      <path d="M 62,50 A 14,14 0 1,0 62,51" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.55"
        style={{ strokeDasharray: '0 1' }} />
      {/* We'll use path arcs directly for the C shape */}
      {/* Inner arc */}
      <path d="M 64,32 C 72,34 78,41 78,50 C 78,59 72,66 64,68" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.60" />
      <circle cx="64" cy="32" r="2.2" fill={dot} opacity="0.70" />
      <circle cx="64" cy="68" r="2.2" fill={dot} opacity="0.70" />

      {/* Mid-inner arc */}
      <path d="M 60,24 C 74,26 85,37 85,50 C 85,63 74,74 60,76" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.70" />
      <circle cx="60" cy="24" r="2.2" fill={dot} opacity="0.80" />
      <circle cx="60" cy="76" r="2.2" fill={dot} opacity="0.80" />

      {/* Mid arc */}
      <path d="M 55,17 C 73,18 92,32 92,50 C 92,68 73,82 55,83" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.80" />
      <circle cx="55" cy="17" r="2.4" fill={dot} />
      <circle cx="55" cy="83" r="2.4" fill={dot} />

      {/* Outer arc */}
      <path d="M 50,10 C 74,10 97,28 97,50 C 97,72 74,90 50,90" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.90" />
      <circle cx="50" cy="10" r="2.6" fill={dot} />
      <circle cx="50" cy="90" r="2.6" fill={dot} />

      {/* Outermost arc — thinner, fading */}
      <path d="M 44,8 C 72,6 100,26 100,50 C 100,74 72,94 44,92" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.40" />
    </svg>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#EAE6DC', color: '#2C2C2C' }}>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — full-viewport background image, no cloud overlay
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

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(5,20,12,0.50) 0%, rgba(5,20,12,0.25) 50%, rgba(5,20,12,0.60) 100%)',
          }}
        />

        {/* ── Navigation ── */}
        <nav
          className="relative z-20 w-full flex items-center justify-between px-8 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          {/* Logo + Brand */}
          <div className="flex items-center space-x-3">
            <CarbonixLogo size={38} light />
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-white drop-shadow">
                Carbonix
              </span>
              <span
                className="ml-2 font-mono-data text-[9px] uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
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

          {/* H1 — solid white, bold, heavy drop shadow for punch */}
          <h1
            className="font-heading font-bold tracking-tight leading-tight mb-4"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.5)',
              maxWidth: '920px',
            }}
          >
            Carbon-Aware Supply Chain
          </h1>

          {/* Subtitle */}
          <h2
            className="font-heading font-semibold tracking-tight mb-6"
            style={{
              fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              maxWidth: '800px',
            }}
          >
            Intelligence &amp; Decarbonization
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
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                background: 'rgba(255,255,255,0.97)',
                color: '#1E4535',
                boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
              }}
            >
              Get Started
            </button>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
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

          {/* Stat strip */}
          <div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {[
              { label: 'Total Audited Carbon', value: '285.4 tCO₂e', sub: '-12.3% YoY baseline' },
              { label: 'Audited Suppliers',     value: '1,247',       sub: 'Multi-tier coverage' },
              { label: 'Compliance Rate',       value: '94.2%',       sub: '+2.4% validated'     },
              { label: 'Risk Index',            value: '73 / 100',    sub: 'Borderline threshold' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
              >
                <p className="font-mono-data text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {stat.label}
                </p>
                <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
                <p className="font-mono-data text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
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
              End-to-End Climate Telemetry &amp; Action
            </h2>
            <p className="mt-3 text-sm" style={{ color: '#6B7B72' }}>
              From raw activity ingest to machine-assisted supplier decarbonization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <Database className="w-5 h-5" />, step: '01', title: 'Ingest Data',         desc: 'Import supplier CSV activity logs or gap-fill via Model A. Primary or modelled data, both supported.' },
              { icon: <BarChart3 className="w-5 h-5" />, step: '02', title: 'Calculate Footprint', desc: 'Deterministic factor engine evaluates energy, transport, material, manufacturing & logistics emissions.' },
              { icon: <FolderTree className="w-5 h-5" />, step: '03', title: 'Map Hotspots',       desc: 'Visualize multi-tier supplier trees and geographic pins to isolate high-carbon risk nodes in real time.' },
              { icon: <Sliders className="w-5 h-5" />,   step: '04', title: 'Simulate Actions',   desc: 'Model circular alternatives, renewable energy PPAs and modal transport shifts with live What-If sliders.' },
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
            <button
              onClick={() => navigate('/login?mode=signup')}
              className="flex items-center gap-3 px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: '#fff', color: '#1E4535', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            >
              Create Carbonix Account <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(255,255,255,0.35)' }}
            >
              Use Demo Account →
            </button>
          </div>
          <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Create an account for your organization, or use the demo account for full platform access
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
              <p className="font-mono-data text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
