import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Leaf, Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@apex.example');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await api.demoLogin();
      navigate('/app');
    } catch (err) {
      setError('Unable to authenticate demo user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const action = isSignup
      ? api.signup(email, password, orgName)
      : api.login(email, password);
    action
      .then(() => navigate('/app'))
      .catch(() => setError(isSignup ? 'Unable to create account. Check your details and try again.' : 'Invalid email or password.'))
      .finally(() => setLoading(false));
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    api.requestPasswordReset(email)
      .then(() => setError('If an account exists for this email, a reset link has been sent.'))
      .catch(() => setError('Unable to request a password reset. Please try again.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1B3A2D] text-[#7A9B8A] mb-3 shadow-md">
            <Leaf className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#1B3A2D] tracking-tight">
            Carbonix Portal
          </h1>
          <p className="text-xs font-mono-data text-stone-500 mt-1 uppercase tracking-wider">
            Enterprise Carbon Audit Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="carbonix-card p-8 bg-white shadow-xl">
          {error && (
            <div className={`mb-4 p-3 rounded border text-xs flex items-center space-x-2 ${error.startsWith('If an account') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
            {isForgotPassword && (
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter your account email and we will send a one-time reset link if the account exists.
              </p>
            )}
            {isSignup && !isForgotPassword && (
              <div>
                <label className="block text-xs font-mono-data uppercase font-semibold text-stone-600 mb-1">
                  Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Your organization"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D] bg-[#F7F5F0]/30"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono-data uppercase font-semibold text-stone-600 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D] bg-[#F7F5F0]/30"
                  required
                />
              </div>
            </div>

            {!isForgotPassword && <div>
              <label className="block text-xs font-mono-data uppercase font-semibold text-stone-600 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D] bg-[#F7F5F0]/30"
                  required
                />
              </div>
            </div>}

            <div className="pt-2">
              <Button
                type="submit"
                variant="outline"
                size="md"
                className="w-full justify-center text-stone-600"
              >
                {isForgotPassword ? 'Send Reset Link' : isSignup ? 'Create Account' : 'Sign In With Credentials'}
              </Button>
            </div>
          </form>

          {!isForgotPassword && <button
            type="button"
            onClick={() => {
              setIsSignup((current) => !current);
              setError('');
            }}
            className="w-full mt-4 text-xs font-mono-data text-[#1B3A2D] hover:underline"
          >
            {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>}

          <button
            type="button"
            onClick={() => {
              setIsForgotPassword((current) => !current);
              setIsSignup(false);
              setError('');
            }}
            className="w-full mt-3 text-xs font-mono-data text-[#1B3A2D] hover:underline"
          >
            {isForgotPassword ? 'Back to sign in' : 'Forgot your password?'}
          </button>

          {/* Quick Demo Access Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E1DFDA]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-stone-500 font-mono-data uppercase">
                Fast-Track Audit Access
              </span>
            </div>
          </div>

          {/* Demo Login Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full justify-center"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleDemoLogin}
            disabled={loading}
          >
            {loading ? 'Authenticating Demo User...' : 'Sign In As Demo Auditor'}
          </Button>

          <p className="text-[11px] text-center text-stone-400 mt-4 font-mono-data">
            Preset Demo Token: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">demo-token-apex</code>
          </p>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-stone-500 mt-6 font-mono-data">
          Apex Manufacturing • Org ID: <span className="font-semibold text-[#1B3A2D]">org_apex</span>
        </p>
      </div>
    </div>
  );
};
