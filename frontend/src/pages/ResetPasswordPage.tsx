import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

/* ─── Reuse the same glass primitives (inlined for file isolation) ── */

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

const AuthLogoMark: React.FC = () => (
  <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="rgba(255,255,255,0.08)" />
    <circle cx="20" cy="8"  r="3" fill="#6EE7B7" />
    <circle cx="10" cy="28" r="3" fill="#6EE7B7" />
    <circle cx="30" cy="28" r="3" fill="#6EE7B7" />
    <line x1="20" y1="11" x2="10" y2="25" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="11" x2="30" y2="25" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="28" x2="27" y2="28" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
    <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700"
      fontFamily="'Geist', system-ui, sans-serif" fill="#fff" letterSpacing="-0.5">Cx</text>
  </svg>
);

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return setMessage('This password reset link is invalid or incomplete.');
    if (password !== confirmPassword) return setMessage('The passwords do not match.');
    setLoading(true);
    setMessage('');
    api.resetPassword(token, password)
      .then(() => {
        setIsSuccess(true);
        setMessage('Password reset successfully. Redirecting to sign in…');
        window.setTimeout(() => navigate('/login'), 1400);
      })
      .catch((error: Error) => { setIsSuccess(false); setMessage(error.message); })
      .finally(() => setLoading(false));
  };

  return (
    <AuthBg>
      {/* Header */}
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
          Set New Password
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
          Carbonix · Password Recovery
        </p>
      </div>

      {/* Glass card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
          padding: '32px',
        }}
      >
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: '20px' }}>
          Choose a new password with at least 8 characters.
        </p>

        {/* Status message */}
        {message && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isSuccess ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: isSuccess ? '#6EE7B7' : '#FCA5A5',
            }}
          >
            {isSuccess
              ? <ShieldCheck style={{ width: 16, height: 16, flexShrink: 0 }} />
              : <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
            }
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* New password */}
          <div>
            <label style={{
              display: 'block', fontSize: '10px',
              fontFamily: "'Geist Mono', monospace", fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)', marginBottom: '6px',
            }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 10, top: 11, width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
              <GlassInput
                type="password"
                minLength={8}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min. 8 characters"
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={{
              display: 'block', fontSize: '10px',
              fontFamily: "'Geist Mono', monospace", fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)', marginBottom: '6px',
            }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 10, top: 11, width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
              <GlassInput
                type="password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="repeat password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1E4535',
              background: (loading || !token) ? 'rgba(255,255,255,0.6)' : '#fff',
              border: 'none',
              cursor: (loading || !token) ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.15s',
              marginTop: '4px',
            }}
          >
            {loading ? 'Updating password…' : 'Update Password'}
          </button>
        </form>

        <div style={{ marginTop: '18px', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              fontSize: '12px',
              fontFamily: "'Geist Mono', monospace",
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'; }}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </AuthBg>
  );
};
