import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, loginWithEmailPassword, sendPasswordResetEmail, logoutUser } from '../services/supabase';
import { isAdminEmail, getAdminEmail } from '../lib/admin';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, setCurrentUser, setCurrentPage, showToast } = useApp();

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setCurrentPage('admin');
    }
  }, [currentUser, setCurrentPage]);
  const [email, setEmail] = useState(getAdminEmail());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot Password Modal state inside Admin login
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(getAdminEmail());
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const expectedAdminEmail = getAdminEmail();

    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both administrator email and password.');
      return;
    }

    // Verify email BEFORE attempt or immediately during attempt
    if (!isAdminEmail(cleanEmail)) {
      setErrorMsg(`Access Denied: Only ${expectedAdminEmail} is authorized as system administrator.`);
      return;
    }

    setLoading(true);

    try {
      let adminEmail = cleanEmail;
      let adminId = 'u-' + Date.now();

      if (supabase) {
        // Authenticate administrator using Supabase Auth with email and password only
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.user || !data.user.email) {
          throw new Error('Authentication failed. Please check your administrator credentials.');
        }

        adminEmail = data.user.email;
        adminId = data.user.id;
      } else {
        const authResult = await loginWithEmailPassword(cleanEmail, password);
        if (!authResult || !authResult.email) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        adminEmail = authResult.email;
        adminId = authResult.id;
      }

      // Verify email again after Supabase Auth login
      if (!isAdminEmail(adminEmail)) {
        await logoutUser();
        setCurrentUser(null);
        setErrorMsg(`Unauthorized account email (${adminEmail}). Signed out immediately.`);
        showToast('error', '403 Forbidden', 'Your account does not have administrator privileges.');
        return;
      }

      const adminUser = {
        id: adminId,
        name: 'Platform Administrator',
        email: adminEmail,
        emailVerified: true,
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(adminUser);
      showToast('success', 'Admin Access Granted', `Welcome back, Administrator (${adminEmail})`);
      setCurrentPage('admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      const message = err.message || 'Invalid administrator password or authentication failed.';
      setErrorMsg(message);
      showToast('error', 'Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      showToast('error', 'Invalid Email', 'Please enter a valid administrator email address.');
      return;
    }

    if (!isAdminEmail(forgotEmail)) {
      showToast('error', 'Unauthorized Email', 'Password recovery is restricted to configured administrator accounts.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail.trim().toLowerCase());
      if (res.success) {
        setForgotSuccess(true);
        showToast('success', 'Reset Link Sent', `Password reset instructions sent to ${forgotEmail}`);
      } else {
        showToast('error', 'Reset Failed', res.error || 'Failed to dispatch password reset email.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to send password reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-900 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-fade-in">
        {/* Header Branding */}
        <div className="bg-slate-950 p-8 text-white text-center border-b border-slate-800 relative">
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg shadow-orange-600/20 border border-orange-400/30"
          />

          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>IkoroduSquare Official</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">Administrator Login</h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            Secure authentication portal for platform oversight & management operations.
          </p>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-rose-900 block">Authentication Denied</strong>
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            {/* Administrator Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Administrator Email Address
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
                  placeholder="adeniji@ikorodusquare.com.ng"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess(false);
                    setForgotEmail(email || getAdminEmail());
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  Signing in Administrator...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  Sign In to Admin Console
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setCurrentPage('home')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <KeyRound className="w-5 h-5 text-orange-600" />
                <span>Admin Password Reset</span>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="py-5">
              {forgotSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Reset Email Dispatched</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We sent a recovery link to <strong className="text-slate-900">{forgotEmail}</strong>. Please check your inbox to choose a new password.
                    </p>
                  </div>
                  <button
                    onClick={() => setForgotModalOpen(false)}
                    className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs"
                  >
                    Back to Admin Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the administrator email address below. We'll send a password recovery link to your email.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Administrator Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 bg-orange-600 text-white font-extrabold text-xs rounded-xl hover:bg-orange-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
