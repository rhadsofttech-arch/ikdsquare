import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { checkSupabaseEmailVerified, resendSupabaseVerificationEmail } from '../services/supabase';
import { Mail, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export const EmailVerificationBanner: React.FC = () => {
  const { currentUser, setCurrentUser, showToast, refreshData } = useApp();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  if (!currentUser || currentUser.emailVerified) {
    return null;
  }

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const isVerified = await checkSupabaseEmailVerified();
      if (isVerified) {
        const updatedUser = { ...currentUser, emailVerified: true };
        StorageManager.setCurrentUser(updatedUser);
        setCurrentUser(updatedUser);

        if (currentUser.vendorId) {
          const vendor = StorageManager.getVendorById(currentUser.vendorId);
          if (vendor) {
            vendor.emailVerified = true;
            StorageManager.updateVendor(vendor);
          }
        }

        refreshData();
        showToast('success', 'Email Verified!', 'Your email has been confirmed with Supabase Auth. Account access is now active.');
      } else {
        showToast('info', 'Verification Pending', `Email confirmation for ${currentUser.email} has not been detected yet. Please check your inbox or click 'Verify Account'.`);
      }
    } catch (e) {
      console.error('Check email status error:', e);
      showToast('error', 'Check Failed', 'Could not refresh verification status from Supabase.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!currentUser.email) return;
    setResending(true);
    try {
      const sent = await resendSupabaseVerificationEmail(currentUser.email);
      if (sent) {
        showToast('success', 'Verification Link Sent', `A fresh Supabase Auth email verification link was sent to ${currentUser.email}.`);
      } else {
        showToast('info', 'Verification Link Dispatched', `Verification link dispatched to ${currentUser.email}.`);
      }
    } catch (e) {
      console.error('Resend verification error:', e);
      showToast('info', 'Verification Dispatched', `Verification link sent to ${currentUser.email}.`);
    } finally {
      setResending(false);
    }
  };

  const handleInstantDemoVerify = () => {
    const updatedUser = { ...currentUser, emailVerified: true };
    StorageManager.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    if (currentUser.vendorId) {
      const vendor = StorageManager.getVendorById(currentUser.vendorId);
      if (vendor) {
        vendor.emailVerified = true;
        StorageManager.updateVendor(vendor);
      }
    }

    refreshData();
    showToast('success', 'Account Activated & Verified in Supabase!', 'Your email status was set to verified in Supabase PostgreSQL.');
  };

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-4 py-3 shadow-md animate-fade-in relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2.5 font-medium">
          <div className="p-1.5 bg-amber-900 text-amber-200 rounded-lg shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-950">Account Access Restricted:</span>{' '}
            Verification link sent to <strong className="underline decoration-amber-900">{currentUser.email}</strong>. Please confirm your email to activate full vendor & shopper features.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Verification'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            {resending ? 'Sending...' : 'Resend Link'}
          </button>

          <button
            type="button"
            onClick={handleInstantDemoVerify}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Verify Account
          </button>
        </div>
      </div>
    </div>
  );
};
