import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { logoutUser } from '../services/supabase';
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

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentPage('home');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
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

  const scrollToSection = (sectionId: string) => {
    setCurrentPage('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-100 py-1.5 px-3 sm:px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-orange-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase shrink-0">
              {t('hyperlocal_badge', '100% Hyperlocal')}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 truncate">
              {t('hyperlocal_desc', 'Exclusively for businesses & residents in Ikorodu, Lagos')}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-slate-300 shrink-0">
            <button
              onClick={() => setShowSetupModal(true)}
              className="hover:text-orange-400 transition flex items-center gap-1 font-medium text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>{t('setup_assist', 'Need Store Setup Assistance? (₦10k - ₦25k)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => {
            setCurrentPage('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2 group text-left min-w-0 shrink-0"
        >
          <img
            src="/logo.png"
            alt="IkoroduSquare Logo"
            decoding="async"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shadow-xs group-hover:scale-105 transition shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg sm:text-2xl tracking-tight text-slate-800 leading-tight">
                Ikorodu<span className="text-orange-600">Square</span>
              </span>
              <span className="hidden sm:inline-block bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Market
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
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
            onClick={() => scrollToSection('products-section')}
            className="hover:text-orange-600 transition"
          >
            {t('all_products', 'All Products')}
          </button>
          <button
            onClick={() => scrollToSection('areas-section')}
            className="hover:text-orange-600 transition flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            {t('thirty_two_areas', '32 Areas')}
          </button>
          <button
            onClick={() => scrollToSection('plans-section')}
            className="hover:text-orange-600 transition"
          >
            {t('vendor_plans', 'Vendor Plans')}
          </button>
        </nav>

        {/* Right CTA Actions & Language Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Language Toggle Control */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch language to English"
            >
              <span>🇬🇧</span>
              <span className="hidden sm:inline">EN</span>
              <span className="sm:hidden text-[10px]">EN</span>
            </button>
            <button
              onClick={() => setLanguage('yo')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                language === 'yo'
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Yipada si ede Yorùbá"
            >
              <span>🇳🇬</span>
              <span className="hidden sm:inline font-bold">YORÙBÁ</span>
              <span className="sm:hidden font-bold text-[10px]">YOR</span>
            </button>
          </div>

          {/* List Your Business PROMINENT BUTTON - ONLY shown to users without vendor account */}
          {showRegisterButton && (
            <button
              onClick={() => setCurrentPage('auth')}
              className="hidden sm:flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs transition active:scale-95 text-xs sm:text-sm"
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
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 transition"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[11px] sm:text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
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
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm transition"
            >
              {t('sign_in', 'Sign In')}
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition focus:outline-none"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-Out Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Right Slide-Out Drawer */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col h-full lg:hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-bold text-base text-slate-800">
                  Ikorodu<span className="text-orange-600">Square</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Account Header Banner in Drawer */}
              {currentUser ? (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize shrink-0 border border-orange-200">
                    {currentUser.role}
                  </span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white flex items-center justify-between gap-3 shadow-sm">
                  <div>
                    <p className="font-bold text-sm text-white">Join IkoroduSquare</p>
                    <p className="text-xs text-slate-300">Buy, sell, or explore local shops</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage('auth');
                      setMobileMenuOpen(false);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shrink-0 transition"
                  >
                    {t('sign_in', 'Sign In')}
                  </button>
                </div>
              )}

              {/* Quick Action Buttons for Logged In User */}
              {currentUser && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setCurrentPage('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl font-bold text-xs transition"
                  >
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{t('my_profile_orders', 'My Profile')}</span>
                  </button>

                  {currentUser.role === 'vendor' ? (
                    <button
                      onClick={() => {
                        setCurrentPage('dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 p-2.5 rounded-xl font-bold text-xs transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-600 shrink-0" />
                      <span className="truncate">{t('vendor_dashboard', 'Vendor Panel')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentPage('profile');
                        window.location.hash = 'favorites';
                        window.dispatchEvent(new Event('hashchange'));
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 p-2.5 rounded-xl font-bold text-xs transition"
                    >
                      <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="truncate">Favorites ({favorites.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Links List */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setCurrentPage('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl font-semibold transition text-sm ${
                    currentPage === 'home' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-4 h-4 text-orange-600" />
                  <span>{t('explore_market', 'Explore Market')}</span>
                </button>

                <button
                  onClick={() => scrollToSection('products-section')}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition text-sm"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>{t('all_products', 'All Products')}</span>
                </button>

                <button
                  onClick={() => scrollToSection('areas-section')}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition text-sm"
                >
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>{t('thirty_two_areas', '32 Ikorodu Areas')}</span>
                </button>

                <button
                  onClick={() => scrollToSection('plans-section')}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t('vendor_plans', 'Vendor Plans')}</span>
                </button>
              </div>

              {/* Business Registration Action */}
              {showRegisterButton && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setCurrentPage('auth');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-xs text-sm transition active:scale-98"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('register_business', 'List Your Business')}</span>
                  </button>
                </div>
              )}

              {/* Store Setup Assistance Callout */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowSetupModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 p-3 rounded-xl transition text-xs font-semibold"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t('setup_assist', 'Need Store Setup Assistance? (₦10k - ₦25k)')}</span>
                  </div>
                </button>
              </div>

              {/* Language Switcher in Drawer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('language_label', 'Language')}:
                </span>
                <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      language === 'en' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => setLanguage('yo')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      language === 'yo' ? 'bg-orange-600 text-white font-bold shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <span>🇳🇬</span>
                    <span>Yorùbá</span>
                  </button>
                </div>
              </div>

              {/* Sign Out option inside mobile drawer */}
              {currentUser && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full text-left py-2.5 px-3 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('sign_out', 'Sign Out')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400 font-medium">
              IkoroduSquare • Digital Market Platform
            </div>
          </div>
        </>
      )}
    </header>
  );
};
