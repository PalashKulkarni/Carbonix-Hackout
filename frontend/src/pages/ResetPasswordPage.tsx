import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return setMessage('This password reset link is invalid or incomplete.');
    if (password !== confirmPassword) return setMessage('The passwords do not match.');
    setLoading(true);
    setMessage('');
    api.resetPassword(token, password)
      .then(() => {
        setMessage('Password reset successfully. Redirecting to sign in…');
        window.setTimeout(() => navigate('/login'), 1200);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md carbonix-card p-8 bg-white shadow-xl">
        <h1 className="font-heading text-2xl font-bold text-[#1B3A2D]">Set a new password</h1>
        <p className="text-xs text-stone-500 mt-1">Choose a new password with at least eight characters.</p>
        {message && <div className="mt-4 p-3 rounded bg-stone-50 border border-[#E1DFDA] text-xs text-stone-700 flex gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{message}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {['New password', 'Confirm new password'].map((label, index) => (
            <label key={label} className="block text-xs font-mono-data uppercase font-semibold text-stone-600">
              {label}
              <span className="relative block mt-1"><Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" /><input type="password" minLength={8} required value={index ? confirmPassword : password} onChange={(event) => index ? setConfirmPassword(event.target.value) : setPassword(event.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D]" /></span>
            </label>
          ))}
          <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={loading || !token}>{loading ? 'Updating password…' : 'Update password'}</Button>
        </form>
        <Link to="/login" className="block mt-5 text-center text-xs font-mono-data text-[#1B3A2D] hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
};
