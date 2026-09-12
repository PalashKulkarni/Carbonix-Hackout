import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

/* ─── Shared background wrapper ───────────────────────────────────── */
const AuthBg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden"
    style={{
      backgroundImage: 'url(/auth-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center 40%',
      backgroundRepeat: 'no-repeat',
    }}
  >
    {/* Dark overlay */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, rgba(5,25,15,0.55) 0%, rgba(5,25,15,0.30) 60%, rgba(5,25,15,0.55) 100%)',
      }}
    />
    <div className="relative z-10 w-full max-w-md">
      {children}
    </div>
  </div>
);

/* ─── Glass card ──────────────────────────────────────────────────── */
const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.10)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      borderRadius: '16px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
    }}
  >
    {children}
  </div>
);

/* ─── Glass input ─────────────────────────────────────────────────── */
const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%',
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.28)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      padding: '10px 12px 10px 36px',
      outline: 'none',
      backdropFilter: 'blur(6px)',
      transition: 'border-color 0.2s',
    }}
    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,231,183,0.7)'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }}
  />
);

/* ─── Label text ─────────────────────────────────────────────────── */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    style={{
      display: 'block',
      fontSize: '10px',
      fontFamily: "'Geist Mono', monospace",
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.65)',
      marginBottom: '6px',
    }}
  >
    {children}
  </label>
);

/* ─── Carbonix logo mark for auth pages — fingerprint-C ────────── */
const AuthLogoMark: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 64,32 C 72,34 78,41 78,50 C 78,59 72,66 64,68" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.52" />
    <circle cx="64" cy="32" r="2.4" fill="#6EE7B7" opacity="0.72" />
    <circle cx="64" cy="68" r="2.4" fill="#6EE7B7" opacity="0.72" />
    <path d="M 60,24 C 74,26 85,37 85,50 C 85,63 74,74 60,76" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.66" />
    <circle cx="60" cy="24" r="2.4" fill="#6EE7B7" opacity="0.82" />
    <circle cx="60" cy="76" r="2.4" fill="#6EE7B7" opacity="0.82" />
    <path d="M 55,17 C 73,18 92,32 92,50 C 92,68 73,82 55,83" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.80" />
    <circle cx="55" cy="17" r="2.6" fill="#6EE7B7" />
    <circle cx="55" cy="83" r="2.6" fill="#6EE7B7" />
    <path d="M 50,10 C 74,10 97,28 97,50 C 97,72 74,90 50,90" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.92" />
    <circle cx="50" cy="10" r="2.8" fill="#6EE7B7" />
    <circle cx="50" cy="90" r="2.8" fill="#6EE7B7" />
    <path d="M 44,8 C 72,6 100,26 100,50 C 100,74 72,94 44,92" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.35" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE (handles login + signup + forgot password states)
═══════════════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('demo@apex.example');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName]   = useState('');
  const [isSignup, setIsSignup]                 = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleDemoLogin = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.demoLogin();
      navigate('/app');
    } catch {
      setError('Unable to authenticate demo user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const action = isSignup
      ? api.signup(email, password, orgName)
      : api.login(email, password);
    action
      .then(() => navigate('/app'))
      .catch(() => setError(isSignup
        ? 'Unable to create account. Check your details and try again.'
        : 'Invalid email or password.'))
      .finally(() => setLoading(false));
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    api.requestPasswordReset(email)
      .then(() => setSuccess('If an account exists for this email, a reset link has been sent.'))
      .catch(() => setError('Unable to request a password reset. Please try again.'))
      .finally(() => setLoading(false));
  };

  const mode = isForgotPassword ? 'forgot' : isSignup ? 'signup' : 'login';

  return (
    <AuthBg>
      {/* ── Header ── */}
      <div className="text-center mb-7">
        <div className="flex justify-center mb-3">
          <AuthLogoMark />
        </div>
        <h1
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: '-0.02em',
          }}
        >
          Carbonix Portal
        </h1>
        <p
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.50)',
            marginTop: '4px',
          }}
        >
          {mode === 'forgot' ? 'Password Recovery' : mode === 'signup' ? 'Create Account' : 'Enterprise Carbon Audit'}
        </p>
      </div>

      {/* ── Glass card ── */}
      <GlassCard>
        <div style={{ padding: '32px' }}>

          {/* Error / success message */}
          {(error || success) && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: success ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${success ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: success ? '#6EE7B7' : '#FCA5A5',
              }}
            >
              {success
                ? <ShieldCheck style={{ width: 16, height: 16, flexShrink: 0 }} />
                : <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
              }
              <span>{error || success}</span>
            </div>
          )}

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Forgot password helper text */}
              {isForgotPassword && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                  Enter your account email and we will send a one-time reset link if the account exists.
                </p>
              )}

              {/* Org name (signup only) */}
              {isSignup && !isForgotPassword && (
                <div>
                  <FieldLabel>Organization Name</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <Building2 style={{ position: 'absolute', left: 10, top: 11, width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
                    <GlassInput
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="Your organization"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <FieldLabel>Corporate Email</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 10, top: 11, width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
                  <GlassInput
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div>
                  <FieldLabel>Security Password</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: 10, top: 11, width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
                    <GlassInput
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Primary submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1E4535',
                  background: loading ? 'rgba(255,255,255,0.6)' : '#fff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s',
                  marginTop: '4px',
                }}
              >
                {loading
                  ? 'Please wait…'
                  : isForgotPassword ? 'Send Reset Link'
                  : isSignup        ? 'Create Account'
                  :                   'Sign In With Credentials'}
              </button>
            </div>
          </form>

          {/* Toggle signup / login */}
          {!isForgotPassword && (
            <button
              type="button"
              onClick={() => { setIsSignup(s => !s); setError(''); setSuccess(''); }}
              style={{
                display: 'block', width: '100%', marginTop: '14px',
                fontSize: '12px', fontFamily: "'Geist Mono', monospace",
                color: 'rgba(255,255,255,0.60)', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          )}

          {/* Forgot password toggle */}
          <button
            type="button"
            onClick={() => { setIsForgotPassword(f => !f); setIsSignup(false); setError(''); setSuccess(''); }}
            style={{
              display: 'block', width: '100%', marginTop: '8px',
              fontSize: '12px', fontFamily: "'Geist Mono', monospace",
              color: 'rgba(255,255,255,0.60)', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}
          >
            {isForgotPassword ? '← Back to sign in' : 'Forgot your password?'}
          </button>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '22px 0 18px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.18)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                padding: '0 10px',
                background: 'transparent',
                fontSize: '10px',
                fontFamily: "'Geist Mono', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.40)',
              }}>
                Fast-Track Audit Access
              </span>
            </div>
          </div>

          {/* Demo login — glassmorphism style */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(10px)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            {loading ? 'Authenticating…' : 'Sign In As Demo Auditor'}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>

          <p style={{
            marginTop: '12px', textAlign: 'center',
            fontSize: '11px', fontFamily: "'Geist Mono', monospace",
            color: 'rgba(255,255,255,0.35)',
          }}>
            Demo token:&nbsp;
            <code style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '4px', padding: '1px 6px',
              color: 'rgba(255,255,255,0.60)',
            }}>
              demo-token-apex
            </code>
          </p>
        </div>
      </GlassCard>

      {/* Footer caption */}
      <p style={{
        marginTop: '20px', textAlign: 'center',
        fontSize: '11px', fontFamily: "'Geist Mono', monospace",
        color: 'rgba(255,255,255,0.35)',
      }}>
        Apex Manufacturing · Org ID:&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 600 }}>org_apex</span>
      </p>
    </AuthBg>
  );
};
