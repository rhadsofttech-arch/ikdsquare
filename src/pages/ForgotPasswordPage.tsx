import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sendPasswordResetEmail } from '../services/supabase';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { setCurrentPage, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('error', 'Invalid Email', 'Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordResetEmail(cleanEmail);
      if (res.success) {
        setSubmitted(true);
        showToast('success', 'Reset Link Dispatched', `Password reset instructions sent to ${cleanEmail}`);
      } else {
        showToast('error', 'Password Reset Failed', res.error || 'Could not dispatch password reset email.');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      showToast('error', 'Error', 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <KeyRound className="w-36 h-36 text-white" />
          </div>
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 border border-white/20 shadow-md"
          />
          <h1 className="text-2xl font-black tracking-tight">Forgot Password?</h1>
          <p className="text-emerald-100 text-xs mt-1 max-w-xs mx-auto">
            No worries! Enter your account email and we'll send you a link to reset your password via Supabase Auth.
          </p>
        </div>

        <div className="p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Check Your Inbox</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                We sent a password reset link to <strong className="text-slate-900 underline">{email}</strong>. Please check your email inbox and click the link to choose a new password.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
                >
                  Resend Email
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('auth')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. vendor@ikorodumarket.ng"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Supabase Auth will dispatch a single-use secure recovery link directly to your verified address.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send Reset Link
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage('auth')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
