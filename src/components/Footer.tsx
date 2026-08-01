import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IKORODU_ZONES } from '../data/ikoroduData';
import { MapPin, Phone, MessageSquare, Shield, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, setShowSetupModal, setSelectedArea, showToast, currentUser, vendors } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const isVendorOwner = Boolean(
    currentUser?.role === 'vendor' ||
      currentUser?.vendorId ||
      (currentUser?.email && vendors.some((v) => v.email?.toLowerCase() === currentUser.email?.toLowerCase()))
  );

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    showToast('success', 'Subscribed!', 'You will now receive top Ikorodu market deals and business updates.');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-900 border border-orange-500/20 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Market Intelligence
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Stay Updated on Local Deals in Ikorodu
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">
              Join thousands of Ikorodu residents receiving weekly updates on newly verified local businesses, discounts, and market highlights across all 32 areas.
            </p>
          </div>

          <div className="w-full lg:w-auto min-w-[320px]">
            {newsletterSubscribed ? (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Thank you! You're subscribed to Ikorodu market alerts.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="px-4 py-3 bg-slate-950 border border-slate-700 focus:border-orange-500 text-white rounded-2xl text-sm outline-none placeholder-slate-500 flex-1 min-w-[240px]"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" /> Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="IkoroduSquare Logo"
                className="w-9 h-9 rounded-lg object-cover shadow-sm"
              />
              <span className="font-bold text-2xl text-white tracking-tight">
                Ikorodu<span className="text-orange-500">Square</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Ikorodu’s dedicated digital market square. Built to empower over 1,500+ local businesses, artisans, and vendors across all 32 areas of Ikorodu, Lagos, Nigeria.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-green-400 border border-green-800 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" /> WhatsApp Direct Connect
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-orange-400" /> 32 Local Areas
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="hover:text-orange-400 transition"
                >
                  Explore Directory
                </button>
              </li>
              {!isVendorOwner && (
                <li>
                  <button
                    onClick={() => setCurrentPage('auth')}
                    className="hover:text-orange-400 transition font-medium text-orange-400 flex items-center gap-1"
                  >
                    List Your Business
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="hover:text-amber-400 transition flex items-center gap-1 text-amber-300"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Store Setup Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentPage('home');
                    const el = document.getElementById('plans-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-orange-400 transition"
                >
                  Vendor Pricing Tiers
                </button>
              </li>
            </ul>
          </div>

          {/* Ikorodu Zones */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Ikorodu Zones</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {IKORODU_ZONES.map((zone) => (
                <li key={zone.name}>
                  <button
                    onClick={() => {
                      setCurrentPage('home');
                      setSelectedArea(zone.areas[0]);
                      const el = document.getElementById('products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-orange-400 transition text-left"
                  >
                    {zone.name.replace(' zone', '')} ({zone.areas.length} areas)
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Local Contact & Onboarding Support */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Ikorodu Support</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Ikorodu, Lagos, Nigeria</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <span>+2348156655091, +2349057197678</span>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500 shrink-0" />
                <span>support@ikorodusquare.com.ng</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} IkoroduSquare. Ikorodu's digital market square. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-400">Powered by <strong className="text-orange-400 font-bold">Rhadsoft Tech</strong></span>
            <span>•</span>
            <span>Built for Ikorodu, Lagos, Nigeria 🇳🇬</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
