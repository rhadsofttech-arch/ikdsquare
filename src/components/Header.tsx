import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Search,
  MapPin,
  User,
  ShieldCheck,
  PlusCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Heart,
  LayoutDashboard,
  Globe,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    setCurrentUser,
    activeVendor,
    vendors,
    setShowSetupModal,
    favorites,
    language,
    setLanguage,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setUserDropdownOpen(false);
  };

  const isVendorOwner = Boolean(
    currentUser?.role === 'vendor' ||
      currentUser?.vendorId ||
      (currentUser?.email && vendors.some((v) => v.email?.toLowerCase() === currentUser.email?.toLowerCase()))
  );

  const isViewingOwnVendorPage =
    currentPage === 'dashboard' ||
    (currentPage === 'store' &&
      activeVendor &&
      (activeVendor.id === currentUser?.vendorId ||
        (activeVendor.email && currentUser?.email && activeVendor.email.toLowerCase() === currentUser.email.toLowerCase())));

  const showRegisterButton = !isVendorOwner && !isViewingOwnVendorPage;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-100 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase">
              {t('hyperlocal_badge', '100% Hyperlocal')}
            </span>
            <span className="hidden sm:inline">{t('hyperlocal_desc', 'Exclusively for businesses & residents in Ikorodu, Lagos')}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <button
              onClick={() => setShowSetupModal(true)}
              className="hidden md:flex hover:text-orange-400 transition items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>{t('setup_assist', 'Need Store Setup Assistance? (₦10k - ₦25k)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2.5 group text-left"
        >
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            className="w-10 h-10 rounded-lg object-cover shadow-sm group-hover:scale-105 transition"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-2xl tracking-tight text-slate-800">
                Ikorodu<span className="text-orange-600">Square</span>
              </span>
              <span className="hidden sm:inline-block bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Market
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {t('tagline', "Ikorodu's Digital Market Square")}
            </p>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentPage('home')}
            className={`hover:text-orange-600 transition ${
              currentPage === 'home' ? 'text-orange-600 font-bold' : ''
            }`}
          >
            {t('explore_market', 'Explore Market')}
          </button>
          <button
            onClick={() => {
              setCurrentPage('home');
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-orange-600 transition"
          >
            {t('all_products', 'All Products')}
          </button>
          <button
            onClick={() => {
              setCurrentPage('home');
              const el = document.getElementById('areas-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-orange-600 transition flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            {t('thirty_two_areas', '32 Areas')}
          </button>
          <button
            onClick={() => {
              setCurrentPage('home');
              const el = document.getElementById('plans-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-orange-600 transition"
          >
            {t('vendor_plans', 'Vendor Plans')}
          </button>
        </nav>

        {/* Right CTA Actions & Language Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle Control */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch language to English"
            >
              <span>🇬🇧</span>
              <span className="hidden sm:inline">EN</span>
            </button>
            <button
              onClick={() => setLanguage('yo')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                language === 'yo'
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Yipada si ede Yorùbá"
            >
              <span>🇳🇬</span>
              <span className="font-bold">YORÙBÁ</span>
            </button>
          </div>

          {/* List Your Business PROMINENT BUTTON - ONLY shown to users without vendor account */}
          {showRegisterButton && (
            <button
              onClick={() => setCurrentPage('auth')}
              className="hidden sm:flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm transition active:scale-95 text-xs sm:text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('register_business', 'List Your Business')}</span>
            </button>
          )}

          {/* User Account Button or Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{currentUser.role} Account</p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage('profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    {t('my_profile_orders', 'My Profile & Orders')}
                  </button>

                  {currentUser.role === 'vendor' && (
                    <button
                      onClick={() => {
                        setCurrentPage('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-orange-800 font-semibold flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-600" />
                      {t('vendor_dashboard', 'Vendor Dashboard')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setCurrentPage('home');
                      setUserDropdownOpen(false);
                      const el = document.getElementById('products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    Saved Favorites ({favorites.length})
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('sign_out', 'Sign Out')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition"
            >
              {t('sign_in', 'Sign In')}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 font-medium text-slate-700">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('language_label', 'Language')}:</span>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg transition ${
                  language === 'en' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setLanguage('yo')}
                className={`px-3 py-1 rounded-lg transition ${
                  language === 'yo' ? 'bg-orange-600 text-white font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                🇳🇬 Yorùbá
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentPage('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-semibold text-orange-600"
          >
            {t('explore_market', 'Marketplace Home')}
          </button>
          {currentUser && (
            <button
              onClick={() => {
                setCurrentPage('profile');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-emerald-700 font-bold flex items-center gap-2"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>{t('my_profile_orders', 'My Profile & Orders')}</span>
            </button>
          )}
          {showRegisterButton && (
            <button
              onClick={() => {
                setCurrentPage('auth');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-full text-center justify-center shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              {t('register_business', 'List Your Business')}
            </button>
          )}
          <button
            onClick={() => {
              setShowSetupModal(true);
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-amber-700 font-semibold text-xs"
          >
            ✨ {t('setup_assist', 'Need Store Setup Assistance? (₦10k - ₦25k)')}
          </button>
        </div>
      )}
    </header>
  );
};
