import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Check, Phone, MapPin, Camera, FileText, CheckCircle2 } from 'lucide-react';

export const StoreSetupModal: React.FC = () => {
  const { showSetupModal, setShowSetupModal, showToast } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Agric');
  const [tier, setTier] = useState<'standard' | 'express'>('standard');
  const [submitted, setSubmitted] = useState(false);

  if (!showSetupModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !phone) {
      showToast('error', 'Incomplete Form', 'Please enter your business name and phone number.');
      return;
    }
    setSubmitted(true);
    showToast('success', 'Setup Request Received!', 'Our Ikorodu field agent will contact you on WhatsApp shortly.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 relative">
          <button
            onClick={() => {
              setShowSetupModal(false);
              setSubmitted(false);
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-300 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              Hand-Held Onboarding
            </span>
          </div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            Ikorodu Store Setup Assistance
          </h3>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Not tech-savvy or too busy? Our local field team in Ikorodu will visit your physical shop, take professional photos, create your catalogue, and publish your online store!
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-xl text-slate-900">Request Sent Successfully!</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Thank you <strong>{businessName}</strong>. An IkoroduSquare store setup agent will call or WhatsApp you at <strong>{phone}</strong> within 2 hours.
              </p>
              <button
                onClick={() => {
                  setShowSetupModal(false);
                  setSubmitted(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Features */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-amber-900 mb-4">
                <div className="flex items-center gap-1.5 font-medium">
                  <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>On-site Product Photos</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Catalog Creation</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>NIN & WhatsApp Setup</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Google Map Sync</span>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setTier('standard')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    tier === 'standard'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">Standard Package</div>
                  <div className="text-amber-700 font-extrabold text-base">₦10,000</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">24-48 hr setup time</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTier('express')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    tier === 'express'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">Express VIP Package</div>
                  <div className="text-amber-700 font-extrabold text-base">₦25,000</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Same-day agent visit & logo design</p>
                </button>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Grace Boutique"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shop Location in Ikorodu</label>
                <input
                  type="text"
                  placeholder="e.g. Agric Bus Stop, opposite First Bank"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Request Store Setup Agent
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
