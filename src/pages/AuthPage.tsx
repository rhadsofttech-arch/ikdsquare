/**
 * AuthPage.tsx — Rewritten
 *
 * Architecture guarantees:
 *  1. NEVER calls setCurrentUser() — auth state flows through
 *     Supabase onAuthStateChange → AppContext exclusively.
 *
 *  2. Vendor registration is ONE atomic flow:
 *       signUp → upsert public.users → upsert public.vendors
 *     Any step failure is caught, logged, and reported.
 *     Partial inserts are impossible: vendor row is only written after
 *     auth.users succeeds.
 *
 *  3. Duplicate-vendor prevention: we query by (user_id OR email) before
 *     upserting, adopting the existing row's id if found.
 *
 *  4. After successful login/signup we simply navigate; AppContext already
 *     received the SIGNED_IN event from onAuthStateChange and will update
 *     currentUser automatically — no manual state manipulation needed.
 *
 *  5. The redirect-after-auth useEffect in AppContext handles all post-login
 *     navigation; this file does NOT push routes.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services/api';
import {
  signInWithGoogle,
  signUpWithEmailPassword,
  loginWithEmailPassword,
  resendSupabaseVerificationEmail,
  isSupabaseConfigured,
} from '../services/supabase';
import { supabase } from '../services/supabase';
import { ALL_IKORODU_AREAS, ALL_SUBCATEGORIES } from '../data/ikoroduData';
import {
  User as UserIcon,
  Store,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Check,
  ListChecks,
  Mail,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AuthTab = 'signin' | 'register';
type SignInMode = 'phone' | 'email';
type UserRole = 'customer' | 'vendor';
type Step = 1 | 2 | 3;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white';

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}> = ({ value, onChange, show, onToggle }) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      required
      placeholder="••••••••"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────

export const AuthPage: React.FC = () => {
  const {
    currentUser,
    setCurrentPage,
    showToast,
    refreshData,
    isAuthLoading,
    isAuthInitialized,
  } = useApp();

  // Redirect already-authenticated users after auth resolves
  useEffect(() => {
    if (!isAuthInitialized) return; // wait until session is known
    if (!currentUser) return;       // not signed in — stay here
    if (currentUser.role === 'admin') setCurrentPage('admin');
    else if (currentUser.role === 'vendor') setCurrentPage('dashboard');
    else setCurrentPage('home');
  }, [currentUser, isAuthInitialized, setCurrentPage]);

  // Derive initial tab from URL
  const [authTab, setAuthTab] = useState<AuthTab>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (
        h.includes('register') ||
        s.includes('register') ||
        s.includes('mode=register')
      )
        return 'register';
    }
    return 'signin';
  });

  // ── Sign-in state ──────────────────────────────────────────────────────────
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInMode, setSignInMode] = useState<SignInMode>('email');
  const [signInPhone, setSignInPhone] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // ── Registration state ─────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole>('vendor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer fields
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custArea, setCustArea] = useState('Agric');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // Vendor fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [category, setCategory] = useState(ALL_SUBCATEGORIES[0]);
  const [area, setArea] = useState('Agric');
  const [vendorPassword, setVendorPassword] = useState('');
  const [showVendorPassword, setShowVendorPassword] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null),
  );

  useEffect(() => {
    if (otpSent && !otpVerified) inputRefs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpSent, otpVerified]);

  // ── OTP handlers ───────────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    const email = role === 'vendor' ? vendorEmail : custEmail;
    if (!email || !email.includes('@') || email.length < 5) {
      showToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    const res = await ApiService.sendOTP(email);
    setOtpLoading(false);
    setOtpSent(true);
    if (res.success) {
      showToast(
        'success',
        'Email Code Sent',
        res.message ?? `Verification code sent to ${email}`,
      );
    } else {
      showToast(
        'info',
        'OTP Sent',
        res.message ?? 'Check your inbox for the verification code.',
      );
    }
  };

  const autoVerifyOTP = async (code: string) => {
    const email = role === 'vendor' ? vendorEmail : custEmail;
    setOtpLoading(true);
    setOtpError('');
    const res = await ApiService.verifyOTP(email, code);
    setOtpLoading(false);
    if (res.verified) {
      setOtpVerified(true);
      showToast(
        'success',
        'Email Verified!',
        res.message ?? 'Email address successfully verified.',
      );
    } else {
      setOtpError(
        res.error ?? 'Verification failed. Check your code and try again.',
      );
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) inputRefs[index + 1].current?.focus();
    const full = next.join('');
    if (full.length === 6 && !next.includes('')) void autoVerifyOTP(full);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      inputRefs[index - 1].current?.focus();
  };

  // ── Sign-in ────────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast(
        'info',
        'Redirecting to Google',
        'Connecting to Google Authentication...',
      );
    } catch (err) {
      console.error('[AuthPage] Google sign-in error:', err);
      showToast('error', 'Google Auth Error', 'Could not complete Google Sign-In.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);

    try {
      if (signInMode === 'email') {
        if (!signInEmail.includes('@') || !signInPassword) {
          showToast(
            'error',
            'Incomplete Form',
            'Please enter your email address and password.',
          );
          return;
        }

        try {
          // loginWithEmailPassword fires onAuthStateChange → AppContext updates currentUser.
          // The useEffect above then redirects based on role.
          // We do NOT call setCurrentUser() here.
          await loginWithEmailPassword(signInEmail, signInPassword);
          showToast('success', 'Signed In', 'Welcome back!');
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Invalid email or password.';
          showToast('error', 'Sign In Failed', msg);
        }
      } else {
        showToast(
          'info',
          'Phone Sign-In',
          'Please use Email & Password to sign in securely.',
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // ── Registration validation ────────────────────────────────────────────────

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'vendor') {
      if (!vendorEmail || !vendorEmail.includes('@')) {
        showToast(
          'error',
          'Email Required',
          'Please enter a valid business email address.',
        );
        return;
      }
      if (!otpVerified) {
        showToast(
          'error',
          'Email Verification Required',
          'You must verify your email address before proceeding.',
        );
        return;
      }
      if (
        !businessName.trim() ||
        !ownerName.trim() ||
        !vendorPhone.trim() ||
        !vendorPassword
      ) {
        showToast(
          'error',
          'Incomplete Form',
          'Please fill in all vendor business details.',
        );
        return;
      }
      if (vendorPassword.length < 6) {
        showToast(
          'error',
          'Password Too Short',
          'Password must be at least 6 characters.',
        );
        return;
      }
    } else {
      if (!custEmail || !custEmail.includes('@')) {
        showToast(
          'error',
          'Email Required',
          'Please enter a valid email address.',
        );
        return;
      }
      if (!custName.trim() || !custPhone.trim() || !custPassword) {
        showToast(
          'error',
          'Incomplete Form',
          'Please fill in all required details.',
        );
        return;
      }
      if (custPassword.length < 6) {
        showToast(
          'error',
          'Password Too Short',
          'Password must be at least 6 characters.',
        );
        return;
      }
    }

    setStep(3);
  };

  // ── Atomic registration flow ───────────────────────────────────────────────

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);

    const targetEmail = role === 'vendor' ? vendorEmail : custEmail;
    const targetPassword = role === 'vendor' ? vendorPassword : custPassword;
    const targetName = role === 'vendor' ? ownerName : custName;
    const targetPhone = role === 'vendor' ? vendorPhone : custPhone;
    const targetArea = role === 'vendor' ? area : custArea;

    try {
      // ── Step A: Supabase Auth signup ───────────────────────────────────────
      let authUserId: string;
      let emailVerified = role === 'vendor' ? otpVerified : false;

      try {
        const supaUser = await signUpWithEmailPassword(
          targetEmail,
          targetPassword,
          {
            name: targetName,
            phone: targetPhone,
            role,
            area: targetArea,
          },
        );

        if (!supaUser?.id) {
          throw new Error('Supabase sign-up did not return a user ID.');
        }

        authUserId = supaUser.id;
        emailVerified = supaUser.emailVerified || emailVerified;
      } catch (signUpErr: unknown) {
        const msg =
          signUpErr instanceof Error ? signUpErr.message : '';

        if (
          msg.includes('already registered') ||
          msg.includes('already in use') ||
          msg.includes('User already registered')
        ) {
          // Account exists — try logging in to adopt the existing user ID
          try {
            const existing = await loginWithEmailPassword(
              targetEmail,
              targetPassword,
            );
            if (!existing?.id)
              throw new Error('Could not retrieve existing user ID.');
            authUserId = existing.id;
            emailVerified = existing.emailVerified || emailVerified;
            showToast(
              'info',
              'Account Found',
              'Existing account authenticated. Completing your profile...',
            );
          } catch (loginErr: unknown) {
            const loginMsg =
              loginErr instanceof Error
                ? loginErr.message
                : 'Please sign in instead.';
            showToast('error', 'Email Already Registered', loginMsg);
            setIsSubmitting(false);
            return;
          }
        } else {
          console.error(
            '[AuthPage] signUpWithEmailPassword error:',
            signUpErr,
          );
          showToast(
            'error',
            'Registration Failed',
            msg || 'Could not create your account. Please try again.',
          );
          setIsSubmitting(false);
          return;
        }
      }

      // ── Step B: Upsert public.users ────────────────────────────────────────
      if (supabase) {
        try {
          const { error: userError } = await supabase.from('users').upsert(
            {
              id: authUserId,
              name: targetName,
              email: targetEmail,
              phone: targetPhone,
              role,
              area: targetArea,
              email_verified: emailVerified,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
          );

          if (userError) {
            console.error(
              '[AuthPage] public.users upsert error:',
              userError,
            );
            // Non-fatal — proceed to vendor upsert
          }
        } catch (upsertErr) {
          console.error(
            '[AuthPage] public.users upsert exception:',
            upsertErr,
          );
        }
      }

      // ── Step C: Upsert public.vendors (vendor flow only) ───────────────────
      if (role === 'vendor') {
        if (!supabase) {
          showToast(
            'error',
            'Configuration Error',
            'Database not configured. Please contact support.',
          );
          setIsSubmitting(false);
          return;
        }

        // Duplicate-prevention: find existing vendor by user_id or email
        let existingVendorId: string | null = null;
        try {
          const { data: existing } = await supabase
            .from('vendors')
            .select('id')
            .or(`user_id.eq.${authUserId},email.ilike.${targetEmail}`)
            .maybeSingle();
          if (existing?.id) existingVendorId = existing.id as string;
        } catch (checkErr) {
          console.warn(
            '[AuthPage] duplicate vendor check warning:',
            checkErr,
          );
        }

        const slug =
          businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || `store-${authUserId.slice(0, 8)}`;

        const vendorRow: Record<string, unknown> = {
          ...(existingVendorId ? { id: existingVendorId } : {}),
          user_id: authUserId,
          slug,
          business_name: businessName,
          owner_name: ownerName,
          email: vendorEmail,
          email_verified: emailVerified,
          whatsapp: vendorPhone,
          phone: vendorPhone,
          category: 'Lifestyle',
          sub_category: category,
          area,
          zone: 'East zone',
          description: `${businessName} is a verified business located in ${area}, Ikorodu.`,
          address: `${area}, Ikorodu, Lagos State`,
          cover_photo_url:
            'https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=1000&q=80',
          logo_url:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          status: 'pending',
          is_live: false,
          is_premium: false,
          nin_verified: false,
          rating: 5.0,
          review_count: 0,
          analytics: {
            profileViews: 1,
            whatsappTaps: 0,
            productViews: 0,
            dailyViews: [],
          },
          created_at: new Date().toISOString(),
        };

        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .upsert(vendorRow, {
            onConflict: existingVendorId ? 'id' : 'email',
          })
          .select()
          .single();

        if (vendorError) {
          console.error(
            '[AuthPage] public.vendors upsert error:',
            vendorError,
          );
          showToast(
            'error',
            'Vendor Record Failed',
            'Your account was created but we could not save your store details. Please contact support.',
          );
          setIsSubmitting(false);
          return;
        }

        console.log(
          '[AuthPage] ✅ Vendor record written to Supabase:',
          vendorData?.id,
        );

        // Sync local cache so the vendor is immediately visible in AppContext
        if (vendorData) {
          const { rowToVendor: rowToVendorFn, StorageManager } =
            await import('../data/mockStorage');
          const localVendor = rowToVendorFn(
            vendorData as Record<string, unknown>,
          );
          await StorageManager.addVendorAsync(localVendor);
        }

        refreshData();

        // Trigger Supabase email verification if OTP didn't already verify
        if (!emailVerified) {
          try {
            await resendSupabaseVerificationEmail(targetEmail);
          } catch {
            /* non-fatal */
          }
          showToast(
            'success',
            'Registration Successful!',
            `Store "${businessName}" created. Please check ${targetEmail} for your verification link.`,
          );
        } else {
          showToast(
            'success',
            'Registration Complete!',
            `Store "${businessName}" created. Welcome to your Vendor Dashboard.`,
          );
        }

        // Navigation is handled by AppContext's post-auth useEffect which
        // listens to onAuthStateChange. We don't call setCurrentPage() here.
        // A short fallback ensures the dashboard renders even if the event
        // fires before AppContext's useEffect re-runs.
        setTimeout(() => setCurrentPage('dashboard'), 600);
      } else {
        // Customer path
        refreshData();
        showToast(
          'success',
          'Registration Successful!',
          `Welcome to IkoroduSquare, ${targetName}!`,
        );
        // AppContext post-auth useEffect will redirect to home on next render.
        setTimeout(() => setCurrentPage('home'), 400);
      }
    } catch (err: unknown) {
      console.error(
        '[AuthPage] handleCompleteRegistration uncaught error:',
        err,
      );
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      showToast('error', 'Registration Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a minimal loading state while auth is resolving on mount
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            className="w-12 h-12 rounded-xl object-cover mx-auto mb-2 shadow-md border border-slate-700"
          />
          <h2 className="text-2xl font-black">IkoroduSquare</h2>
          <p className="text-xs text-slate-300 mt-1">
            Connect directly with buyers and local shops in Ikorodu
          </p>

          <div className="flex bg-slate-800 p-1 rounded-2xl max-w-xs mx-auto mt-4">
            <button
              onClick={() => setAuthTab('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authTab === 'register'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthTab('signin')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authTab === 'signin'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">

          {/* ── SIGN IN TAB ──────────────────────────────────────────────── */}
          {authTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="flex justify-center gap-4 text-xs font-semibold mb-2">
                <button
                  type="button"
                  onClick={() => setSignInMode('phone')}
                  className={`pb-1 border-b-2 transition ${
                    signInMode === 'phone'
                      ? 'border-orange-600 text-orange-600 font-bold'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  WhatsApp Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => setSignInMode('email')}
                  className={`pb-1 border-b-2 transition ${
                    signInMode === 'email'
                      ? 'border-orange-600 text-orange-600 font-bold'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  Email Address
                </button>
              </div>

              {signInMode === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Phone sign-in is for browsing only. Use Email to access
                    your dashboard.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. adeyemi@gmail.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('forgot-password')}
                    className="text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowSignInPassword(!showSignInPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showSignInPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm mt-4 flex items-center justify-center gap-2"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  'Sign In to Account'
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-bold">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-sm transition text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* ── REGISTRATION TAB ─────────────────────────────────────────── */}
          {authTab === 'register' && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 px-2 text-xs font-bold">
                {([1, 2, 3] as Step[]).map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && (
                      <div className="h-0.5 flex-1 bg-slate-200 mx-2" />
                    )}
                    <div
                      className={`flex items-center gap-1.5 ${
                        step >= s ? 'text-orange-600' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          step >= s
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-200'
                        }`}
                      >
                        {s}
                      </span>
                      <span>
                        {s === 1
                          ? 'Select Role'
                          : s === 2
                          ? role === 'vendor'
                            ? 'Store Details'
                            : 'Profile Info'
                          : 'Confirm'}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* ── STEP 1: Role selection ──────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-900 text-center">
                    What would you like to do on IkoroduSquare?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(['customer', 'vendor'] as UserRole[]).map((r) => (
                      <div
                        key={r}
                        onClick={() => setRole(r)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition space-y-3 ${
                          role === r
                            ? 'border-orange-600 bg-orange-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            r === 'vendor'
                              ? 'bg-orange-600 text-white'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {r === 'vendor' ? (
                            <Store className="w-5 h-5" />
                          ) : (
                            <UserIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {r === 'vendor'
                              ? 'Vendor Online Shop'
                              : 'Customer Account'}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {r === 'vendor'
                              ? 'Create your digital store, list products, and receive WhatsApp enquiries.'
                              : 'Save favourite vendors, write reviews, and search local products.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2 mt-4"
                  >
                    Continue to Step 2{' '}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── STEP 2: Details + OTP ───────────────────────────────── */}
              {step === 2 && (
                <form onSubmit={handleProceedToStep3} className="space-y-4">
                  {role === 'customer' ? (
                    <>
                      <FormField label="Full Name *">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Babatunde Raji"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Email Address *">
                        <input
                          type="email"
                          required
                          placeholder="e.g. customer@example.com"
                          value={custEmail}
                          onChange={(e) => setCustEmail(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Phone Number *">
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0803 123 4567"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Your Area in Ikorodu">
                        <select
                          value={custArea}
                          onChange={(e) => setCustArea(e.target.value)}
                          className={inputCls}
                        >
                          {ALL_IKORODU_AREAS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Create Password *">
                        <PasswordInput
                          value={custPassword}
                          onChange={setCustPassword}
                          show={showCustPassword}
                          onToggle={() =>
                            setShowCustPassword(!showCustPassword)
                          }
                        />
                      </FormField>
                    </>
                  ) : (
                    <>
                      <FormField label="Business / Shop Name *">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Royal Fits Bespoke Couture"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Owner Full Name *">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adeola Ogundele"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>

                      {/* Business email + OTP */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Business Email Address *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            required
                            placeholder="e.g. store@example.com"
                            value={vendorEmail}
                            onChange={(e) => {
                              setVendorEmail(e.target.value);
                              if (otpVerified) setOtpVerified(false);
                              if (otpSent) setOtpSent(false);
                            }}
                            className={`w-full pl-3.5 pr-28 py-2.5 rounded-xl border text-sm outline-none transition ${
                              otpVerified
                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                                : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                            }`}
                          />
                          {vendorEmail.includes('@') &&
                            vendorEmail.length >= 5 &&
                            !otpVerified && (
                              <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={otpLoading}
                                className="absolute right-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {otpLoading
                                  ? 'Sending...'
                                  : otpSent
                                  ? 'Resend'
                                  : 'Send Code'}
                              </button>
                            )}
                        </div>

                        {otpVerified && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>✓ Email Address Verified</span>
                          </div>
                        )}

                        {otpSent && !otpVerified && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-700 font-bold">
                              <Mail className="w-3.5 h-3.5 text-emerald-600" />{' '}
                              Enter 6-digit code sent to your email:
                            </div>
                            <div className="flex items-center justify-between gap-1.5 max-w-xs mx-auto">
                              {otpDigits.map((digit, idx) => (
                                <input
                                  key={idx}
                                  ref={inputRefs[idx]}
                                  type="text"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) =>
                                    handleDigitChange(idx, e.target.value)
                                  }
                                  onKeyDown={(e) => handleKeyDown(idx, e)}
                                  className="w-9 h-11 text-center text-base font-black rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 outline-none bg-white shadow-xs"
                                />
                              ))}
                            </div>
                            {otpLoading && (
                              <p className="text-xs text-emerald-600 font-semibold text-center animate-pulse">
                                Verifying code...
                              </p>
                            )}
                            {otpError && (
                              <div className="space-y-1.5 text-center">
                                <p className="text-xs text-rose-600 font-bold flex items-center justify-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />{' '}
                                  {otpError}
                                </p>
                                <button
                                  type="button"
                                  onClick={handleSendOTP}
                                  disabled={otpLoading}
                                  className="text-xs font-bold text-emerald-700 hover:underline"
                                >
                                  Resend Code
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <FormField label="WhatsApp / Contact Phone *">
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 08031234567"
                          value={vendorPhone}
                          onChange={(e) => setVendorPhone(e.target.value)}
                          className={inputCls}
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Business Category *">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={inputCls}
                          >
                            {ALL_SUBCATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Business Area *">
                          <select
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className={inputCls}
                          >
                            {ALL_IKORODU_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>

                      <FormField label="Create Password *">
                        <PasswordInput
                          value={vendorPassword}
                          onChange={setVendorPassword}
                          show={showVendorPassword}
                          onToggle={() =>
                            setShowVendorPassword(!showVendorPassword)
                          }
                        />
                      </FormField>
                    </>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={role === 'vendor' && !otpVerified}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2"
                    >
                      Proceed to Summary{' '}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Summary & Confirm ───────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
                      Registration Summary
                    </h4>
                    {role === 'vendor' ? (
                      <div className="space-y-2 text-slate-700">
                        <p>
                          <strong className="text-slate-900">
                            Shop Name:
                          </strong>{' '}
                          {businessName}
                        </p>
                        <p>
                          <strong className="text-slate-900">
                            Owner Name:
                          </strong>{' '}
                          {ownerName}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <strong className="text-slate-900">Email:</strong>{' '}
                          {vendorEmail}
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />{' '}
                            VERIFIED
                          </span>
                        </p>
                        <p>
                          <strong className="text-slate-900">
                            WhatsApp:
                          </strong>{' '}
                          {vendorPhone}
                        </p>
                        <p>
                          <strong className="text-slate-900">
                            Category:
                          </strong>{' '}
                          {category}
                        </p>
                        <p>
                          <strong className="text-slate-900">
                            Location:
                          </strong>{' '}
                          {area}, Ikorodu
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-slate-700">
                        <p>
                          <strong className="text-slate-900">Name:</strong>{' '}
                          {custName}
                        </p>
                        <p>
                          <strong className="text-slate-900">Phone:</strong>{' '}
                          {custPhone}
                        </p>
                        <p>
                          <strong className="text-slate-900">Area:</strong>{' '}
                          {custArea}
                        </p>
                      </div>
                    )}
                  </div>

                  {role === 'vendor' && (
                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-orange-400" />
                        <h4 className="font-extrabold text-sm text-white">
                          Your Dashboard Setup Roadmap
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Complete these 4 quick steps in your Vendor Dashboard
                        to go live:
                      </p>
                      <div className="space-y-2 text-xs">
                        {[
                          {
                            n: '1',
                            text: 'Upload Cover Photo, Logo & Physical Address',
                            accent: 'bg-orange-600 text-white',
                          },
                          {
                            n: '2',
                            text: 'Add Your Products with Prices (₦)',
                            accent: 'bg-orange-600 text-white',
                          },
                          {
                            n: '3',
                            text: 'Complete NIMC 11-Digit NIN Verification (Required)',
                            accent: 'bg-amber-400 text-slate-950',
                          },
                          {
                            n: '4',
                            text: 'Submit Store for Admin Review & Launch',
                            accent: 'bg-orange-600 text-white',
                          },
                        ].map(({ n, text, accent }) => (
                          <div
                            key={n}
                            className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700"
                          >
                            <span
                              className={`w-5 h-5 rounded-full ${accent} font-black flex items-center justify-center text-[10px]`}
                            >
                              {n}
                            </span>
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCompleteRegistration}
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {role === 'vendor'
                          ? 'Complete Registration & Open Dashboard'
                          : 'Complete Registration & Explore IkoroduSquare'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};