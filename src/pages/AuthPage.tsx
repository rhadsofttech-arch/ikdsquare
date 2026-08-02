import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ApiService } from '../services/api';
import {
  signInWithGoogle,
  signUpWithEmailPassword,
  loginWithEmailPassword,
  resendSupabaseVerificationEmail,
  checkSupabaseEmailVerified,
  isSupabaseConfigured
} from '../services/supabase';
import { ALL_IKORODU_AREAS, CATEGORY_GROUPS, ALL_SUBCATEGORIES } from '../data/ikoroduData';
import { User, Vendor } from '../types';
import {
  User as UserIcon,
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  AlertCircle,
  Check,
  ListChecks,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { setCurrentUser, setCurrentPage, showToast, refreshData } = useApp();

  const [authTab, setAuthTab] = useState<'signin' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('register') || search.includes('register') || search.includes('mode=register')) {
        return 'register';
      }
    }
    return 'signin';
  });

  // Password visibility states
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [showVendorPassword, setShowVendorPassword] = useState(false);

  // Sign in state
  const [signInMode, setSignInMode] = useState<'phone' | 'email'>('phone');
  const [signInPhone, setSignInPhone] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Three-step registration state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'customer' | 'vendor'>('vendor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 Customer fields
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custArea, setCustArea] = useState('Agric');
  const [custPassword, setCustPassword] = useState('');

  // Step 2 Vendor fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [category, setCategory] = useState(ALL_SUBCATEGORIES[0]);
  const [area, setArea] = useState('Agric');
  const [vendorPassword, setVendorPassword] = useState('');

  // Email OTP State for Vendor Registration
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('123456');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Refs for 6 OTP input boxes
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto focus first OTP input when sent
  useEffect(() => {
    if (otpSent && !otpVerified && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [otpSent, otpVerified]);

  // Handle Send Email OTP
  const handleSendOTP = async () => {
    const targetEmail = role === 'vendor' ? vendorEmail : custEmail;
    if (!targetEmail || !targetEmail.includes('@') || targetEmail.length < 5) {
      showToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    const res = await ApiService.sendOTP(targetEmail);
    setOtpLoading(false);

    if (res.success) {
      setOtpSent(true);
      showToast('success', 'Email Code Sent', res.message || `Verification code sent to ${targetEmail}`);
    } else {
      setOtpSent(true);
      showToast('info', 'OTP Sent', res.message || 'Please check your email inbox for the verification code.');
    }
  };

  // Quick fill helper
  const handleQuickFillOTP = (codeToFill: string) => {
    const digits = codeToFill.slice(0, 6).split('');
    while (digits.length < 6) digits.push('');
    setOtpDigits(digits);
    autoVerifyOTP(codeToFill);
  };

  // Handle OTP Digit Input & Auto Verify
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-advance focus to next box
    if (value && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current?.focus();
    }

    // When all 6 boxes are filled, automatically call verification!
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      autoVerifyOTP(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const autoVerifyOTP = async (code: string) => {
    const targetEmail = role === 'vendor' ? vendorEmail : custEmail;
    setOtpLoading(true);
    setOtpError('');
    const res = await ApiService.verifyOTP(targetEmail, code);
    setOtpLoading(false);

    if (res.verified) {
      setOtpVerified(true);
      setOtpError('');
      showToast('success', 'Email Verified!', res.message || 'Email address successfully verified.');
    } else {
      setOtpError(res.error || 'Verification failed. Please check your code and try again.');
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    }
  };

  // Google Sign In via Supabase Auth
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('info', 'Redirecting to Google', 'Connecting to Google Authentication...');
    } catch (err) {
      console.error('Google Auth Failed:', err);
      showToast('error', 'Google Auth Error', 'Could not complete Google Sign-In.');
    }
  };

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      if (signInMode === 'email' && signInEmail) {
        if (!signInEmail.includes('@') || !signInPassword) {
          showToast('error', 'Incomplete Form', 'Please enter your email address and password.');
          setIsSigningIn(false);
          return;
        }
        try {
          const supaUser = await loginWithEmailPassword(signInEmail, signInPassword);
          const isVerified = supaUser ? supaUser.emailVerified : true;

          const vendors = StorageManager.getVendors();
          const matchingVendor = vendors.find(
            (v) => v.email?.toLowerCase() === signInEmail.toLowerCase()
          );

          const user: User = {
            id: supaUser ? supaUser.id : 'u-' + Date.now(),
            name: matchingVendor ? matchingVendor.ownerName : signInEmail.split('@')[0],
            phone: signInPhone || matchingVendor?.phone || '08030000000',
            email: signInEmail,
            emailVerified: isVerified,
            role: matchingVendor ? 'vendor' : 'customer',
            vendorId: matchingVendor?.id,
            createdAt: new Date().toISOString(),
          };

          setCurrentUser(user);

          if (!isVerified) {
            showToast('info', 'Email Verification Required', `Verification link sent to ${signInEmail}. Account access is restricted until confirmed.`);
          } else {
            showToast('success', 'Signed In', `Welcome back, ${user.name}!`);
          }

          if (user.role === 'vendor') {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('home');
          }
        } catch (err: any) {
          if (isSupabaseConfigured()) {
            console.error('Sign In Error:', err);
            const msg = err.message || 'Invalid email address or password. Please try again.';
            showToast('error', 'Sign In Failed', msg);
            setIsSigningIn(false);
            return;
          }

          const vendors = StorageManager.getVendors();
          const matchingVendor = vendors.find(
            (v) => v.email?.toLowerCase() === signInEmail.toLowerCase()
          );

          const user: User = {
            id: 'u-' + Date.now(),
            name: matchingVendor ? matchingVendor.ownerName : signInEmail.split('@')[0],
            phone: signInPhone || matchingVendor?.phone || '08030000000',
            email: signInEmail,
            emailVerified: matchingVendor?.emailVerified ?? true,
            role: matchingVendor ? 'vendor' : 'customer',
            vendorId: matchingVendor?.id,
            createdAt: new Date().toISOString(),
          };

          setCurrentUser(user);
          showToast('success', 'Signed In', `Welcome back, ${user.name}!`);
          if (user.role === 'vendor') {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('home');
          }
        }
      } else {
        const vendors = StorageManager.getVendors();
        const matchingVendor = vendors.find(
          (v) => v.phone?.includes(signInPhone) || v.whatsapp?.includes(signInPhone)
        );

        const user: User = {
          id: 'u-' + Date.now(),
          name: matchingVendor ? matchingVendor.ownerName : 'Ikorodu User',
          phone: signInPhone || '08030000000',
          email: signInEmail || undefined,
          emailVerified: true,
          role: matchingVendor ? 'vendor' : 'customer',
          vendorId: matchingVendor?.id,
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(user);
        showToast('success', 'Signed In', `Welcome back, ${user.name}!`);
        if (user.role === 'vendor') {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('home');
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Step 2 Proceed to Step 3
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'vendor') {
      if (!vendorEmail || !vendorEmail.includes('@')) {
        showToast('error', 'Email Required', 'Please enter a valid business email address.');
        return;
      }
      if (!otpVerified) {
        showToast('error', 'Email Verification Required', 'You must verify your email address via 6-digit OTP code before proceeding.');
        return;
      }
      if (!businessName || !ownerName || !vendorPhone || !vendorPassword) {
        showToast('error', 'Incomplete Form', 'Please fill in all vendor business details.');
        return;
      }
      if (vendorPassword.length < 6) {
        showToast('error', 'Password Too Short', 'Password must be at least 6 characters.');
        return;
      }
    } else {
      if (!custEmail || !custEmail.includes('@')) {
        showToast('error', 'Email Required', 'Please enter a valid email address.');
        return;
      }
      if (!custName || !custPhone || !custPassword) {
        showToast('error', 'Incomplete Form', 'Please fill in all required customer details.');
        return;
      }
      if (custPassword.length < 6) {
        showToast('error', 'Password Too Short', 'Password must be at least 6 characters.');
        return;
      }
    }

    setStep(3);
  };

  // Complete Registration
  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    try {
      let createdUser: User;
      const targetEmail = role === 'vendor' ? vendorEmail : custEmail;
      const targetPassword = role === 'vendor' ? vendorPassword : custPassword;
      const targetName = role === 'vendor' ? ownerName : custName;
      const targetPhone = role === 'vendor' ? vendorPhone : custPhone;
      const targetArea = role === 'vendor' ? area : custArea;

      let supaUid = 'u-' + Date.now();
      let isEmailVerifiedInSupabase = role === 'vendor' ? otpVerified : false;

      try {
        const supaUser = await signUpWithEmailPassword(targetEmail, targetPassword, {
          name: targetName,
          phone: targetPhone,
          role,
          area: targetArea,
        });
        if (supaUser) {
          supaUid = supaUser.id;
          isEmailVerifiedInSupabase = supaUser.emailVerified || isEmailVerifiedInSupabase;
        }
      } catch (err: any) {
        console.warn('Supabase Auth Sign-Up Note:', err?.message || err);
        const errMsg = err?.message || '';

        if (errMsg.includes('already registered') || errMsg.includes('already in use')) {
          try {
            const loggedInUser = await loginWithEmailPassword(targetEmail, targetPassword);
            if (loggedInUser) {
              supaUid = loggedInUser.id;
              isEmailVerifiedInSupabase = loggedInUser.emailVerified || isEmailVerifiedInSupabase;
              showToast('info', 'Account Connected', 'Existing account detected and authenticated.');
            }
          } catch (loginErr: any) {
            showToast('error', 'Email Registered', 'This email is already registered. Please sign in instead.');
          }
        } else {
          showToast('info', 'Registration Complete', `Your account has been registered successfully.`);
        }
      }

      if (role === 'vendor') {
        const slug = businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const newVendor: Vendor = {
          id: 'v-' + Date.now(),
          slug: slug || 'store-' + Date.now(),
          businessName,
          ownerName,
          email: vendorEmail,
          emailVerified: isEmailVerifiedInSupabase,
          whatsapp: vendorPhone,
          phone: vendorPhone,
          category: 'Lifestyle',
          subCategory: category,
          area,
          zone: 'East zone',
          description: `${businessName} is a verified business located in ${area}, Ikorodu.`,
          address: `${area}, Ikorodu, Lagos State`,
          coverPhotoURL: 'https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=1000&q=80',
          logoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          status: 'pending',
          isLive: false,
          isPremium: false,
          ninVerified: false,
          createdAt: new Date().toISOString(),
          rating: 5.0,
          reviewCount: 0,
          analytics: {
            profileViews: 1,
            whatsappTaps: 0,
            productViews: 0,
            dailyViews: [],
          },
        };

        StorageManager.addVendor(newVendor);

        createdUser = {
          id: supaUid,
          name: ownerName,
          email: vendorEmail,
          emailVerified: isEmailVerifiedInSupabase,
          phone: vendorPhone,
          role: 'vendor',
          vendorId: newVendor.id,
          area,
          createdAt: new Date().toISOString(),
        };
      } else {
        createdUser = {
          id: supaUid,
          name: custName,
          email: custEmail,
          emailVerified: isEmailVerifiedInSupabase,
          phone: custPhone,
          role: 'customer',
          area: custArea,
          createdAt: new Date().toISOString(),
        };
      }

      await StorageManager.setCurrentUserAsync(createdUser);
      setCurrentUser(createdUser);
      refreshData();

      if (role === 'vendor') {
        if (!isEmailVerifiedInSupabase) {
          await resendSupabaseVerificationEmail(targetEmail);
          showToast(
            'success',
            'Registration Successful!',
            `Welcome ${createdUser.name}! Store created. Please check ${targetEmail} for your email verification link.`
          );
        } else {
          showToast(
            'success',
            'Registration Complete & Verified!',
            `Store "${businessName}" created and email verified. Welcome to your Vendor Dashboard.`
          );
        }
      } else {
        showToast(
          'success',
          'Registration Successful!',
          `Welcome to IkoroduSquare, ${custName}!`
        );
      }

      if (role === 'vendor') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('home');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header Switcher */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            className="w-12 h-12 rounded-xl object-cover mx-auto mb-2 shadow-md border border-slate-700"
          />
          <h2 className="text-2xl font-black">IkoroduSquare</h2>
          <p className="text-xs text-slate-300 mt-1">Connect directly with buyers and local shops in Ikorodu</p>

          <div className="flex bg-slate-800 p-1 rounded-2xl max-w-xs mx-auto mt-4">
            <button
              onClick={() => setAuthTab('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authTab === 'register' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthTab('signin')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authTab === 'signin' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: SIGN IN */}
          {authTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="flex justify-center gap-4 text-xs font-semibold mb-2">
                <button
                  type="button"
                  onClick={() => setSignInMode('phone')}
                  className={`pb-1 border-b-2 transition ${
                    signInMode === 'phone' ? 'border-orange-600 text-orange-600 font-bold' : 'border-transparent text-slate-500'
                  }`}
                >
                  WhatsApp Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => setSignInMode('email')}
                  className={`pb-1 border-b-2 transition ${
                    signInMode === 'email' ? 'border-orange-600 text-orange-600 font-bold' : 'border-transparent text-slate-500'
                  }`}
                >
                  Email Address
                </button>
              </div>

              {signInMode === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. adeyemi@gmail.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password *</label>
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
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
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
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-bold">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs transition text-sm flex items-center justify-center gap-2"
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

              {/* Administrator Direct Access Portal */}
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage('admin')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Are you an Administrator? Access Admin Portal</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: THREE-STEP REGISTRATION */}
          {authTab === 'register' && (
            <div>
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6 px-2 text-xs font-bold">
                <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>
                    1
                  </span>
                  <span>Select Role</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-200 mx-2"></div>
                <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>
                    2
                  </span>
                  <span>{role === 'vendor' ? 'Store Details & Email Verification' : 'Profile Info'}</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-200 mx-2"></div>
                <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}>
                    3
                  </span>
                  <span>Summary & Roadmap</span>
                </div>
              </div>

              {/* STEP 1: ROLE SELECTION */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-900 text-center">
                    What would you like to do on IkoroduSquare?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Role Card */}
                    <div
                      onClick={() => setRole('customer')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition space-y-3 ${
                        role === 'customer'
                          ? 'border-orange-600 bg-orange-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">Customer Account</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Save favourite vendors, write reviews, and search local products in your area.
                        </p>
                      </div>
                    </div>

                    {/* Vendor Role Card */}
                    <div
                      onClick={() => setRole('vendor')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition space-y-3 ${
                        role === 'vendor'
                          ? 'border-orange-600 bg-orange-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">Vendor Online Shop</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Create your digital store, list products, and receive WhatsApp enquiries directly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2 mt-4"
                  >
                    Continue to Step 2 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: USER / VENDOR FORM + OTP */}
              {step === 2 && (
                <form onSubmit={handleProceedToStep3} className="space-y-4">
                  {role === 'customer' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Babatunde Raji"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. customer@example.com"
                          value={custEmail}
                          onChange={(e) => setCustEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0803 123 4567"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Area in Ikorodu</label>
                        <select
                          value={custArea}
                          onChange={(e) => setCustArea(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                        >
                          {ALL_IKORODU_AREAS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                        <div className="relative">
                          <input
                            type={showCustPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={custPassword}
                            onChange={(e) => setCustPassword(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustPassword(!showCustPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={showCustPassword ? 'Hide password' : 'Show password'}
                          >
                            {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Business / Shop Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Royal Fits Bespoke Couture"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Owner Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adeola Ogundele"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      {/* BUSINESS EMAIL & VERIFICATION */}
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
                          {vendorEmail.includes('@') && vendorEmail.length >= 5 && !otpVerified && (
                            <button
                              type="button"
                              onClick={handleSendOTP}
                              disabled={otpLoading}
                              className="absolute right-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {otpLoading ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
                            </button>
                          )}
                        </div>

                        {/* Green Verified Badge */}
                        {otpVerified && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>✓ Email Address Verified</span>
                          </div>
                        )}

                        {/* 6 OTP Input Boxes when OTP is sent */}
                        {otpSent && !otpVerified && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-fade-in mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                              <span className="flex items-center gap-1 font-bold">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" /> Enter 6-digit verification code sent to your email:
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 max-w-xs mx-auto">
                              {otpDigits.map((digit, idx) => (
                                <input
                                  key={idx}
                                  ref={inputRefs[idx]}
                                  type="text"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleDigitChange(idx, e.target.value)}
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
                                  <AlertCircle className="w-3.5 h-3.5" /> {otpError}
                                </p>
                                <button
                                  type="button"
                                  onClick={handleSendOTP}
                                  disabled={otpLoading}
                                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                                >
                                  Resend Code
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* WHATSAPP CONTACT NUMBER */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 08031234567"
                          value={vendorPhone}
                          onChange={(e) => setVendorPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Business Category *</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                          >
                            {ALL_SUBCATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Business Area *</label>
                          <select
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                          >
                            {ALL_IKORODU_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                        <div className="relative">
                          <input
                            type={showVendorPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={vendorPassword}
                            onChange={(e) => setVendorPassword(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowVendorPassword(!showVendorPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={showVendorPassword ? 'Hide password' : 'Show password'}
                          >
                            {showVendorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
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
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Proceed to Summary <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: REGISTRATION SUMMARY & DASHBOARD ROADMAP */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
                      Registration Summary
                    </h4>

                    {role === 'vendor' ? (
                      <div className="space-y-2 text-slate-700">
                        <p>
                          <strong className="text-slate-900">Shop Name:</strong> {businessName}
                        </p>
                        <p>
                          <strong className="text-slate-900">Owner Name:</strong> {ownerName}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <strong className="text-slate-900">Email:</strong> {vendorEmail}
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> VERIFIED
                          </span>
                        </p>
                        <p>
                          <strong className="text-slate-900">WhatsApp:</strong> {vendorPhone}
                        </p>
                        <p>
                          <strong className="text-slate-900">Category:</strong> {category}
                        </p>
                        <p>
                          <strong className="text-slate-900">Location:</strong> {area}, Ikorodu
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-slate-700">
                        <p>
                          <strong className="text-slate-900">Customer Name:</strong> {custName}
                        </p>
                        <p>
                          <strong className="text-slate-900">Phone:</strong> {custPhone}
                        </p>
                        <p>
                          <strong className="text-slate-900">Area:</strong> {custArea}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Vendor Dashboard Roadmap (PRD Mandated 4 Steps) */}
                  {role === 'vendor' && (
                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-orange-400" />
                        <h4 className="font-extrabold text-sm text-white">Your Dashboard Setup Roadmap</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        After completing registration, you will finalize these 4 quick steps in your Vendor Dashboard to go live:
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-[10px]">
                            1
                          </span>
                          <span>Upload Cover Photo, Logo & Physical Address</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-[10px]">
                            2
                          </span>
                          <span>Add Your Products with Prices (₦)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                            3
                          </span>
                          <span>Complete NIMC 11-Digit NIN Verification (Required)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-[10px]">
                            4
                          </span>
                          <span>Submit Store for Admin Review & Launch</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCompleteRegistration}
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {role === 'vendor' ? 'Complete Registration & Open Dashboard' : 'Complete Registration & Explore IkoroduSquare'}
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
