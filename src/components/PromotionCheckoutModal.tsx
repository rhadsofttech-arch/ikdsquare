import React, { useState, useEffect } from 'react';
import { PromotionPackageInfo, Vendor, Promotion } from '../types';
import { useApp } from '../context/AppContext';
import { X, Building2, Package, Sparkles, Landmark, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface PromotionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageInfo: PromotionPackageInfo | null;
  initialVendor?: Vendor | null;
}

export const PromotionCheckoutModal: React.FC<PromotionCheckoutModalProps> = ({
  isOpen,
  onClose,
  packageInfo,
  initialVendor,
}) => {
  const { currentUser, vendors, products, createPromotionRequest, adminSettings, showToast } = useApp();

  // Find all vendors owned by current user
  const userVendors = vendors.filter(
    (v) => v.ownerEmail === currentUser?.email || v.id === initialVendor?.id || v.id === currentUser?.vendorId
  );
  const activeUserVendor = userVendors[0] || initialVendor || vendors[0];

  const [selectedVendorId, setSelectedVendorId] = useState<string>(activeUserVendor?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [bannerTitle, setBannerTitle] = useState<string>('');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('');
  const [bannerImageURL, setBannerImageURL] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentSelectedVendor = vendors.find((v) => v.id === selectedVendorId) || activeUserVendor;
  const vendorProducts = products.filter((p) => p.vendorId === currentSelectedVendor?.id);

  useEffect(() => {
    if (activeUserVendor) {
      setSelectedVendorId(activeUserVendor.id);
    }
  }, [activeUserVendor]);

  useEffect(() => {
    if (vendorProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(vendorProducts[0].id);
    }
  }, [vendorProducts, selectedProductId]);

  useEffect(() => {
    if (currentSelectedVendor) {
      setBannerTitle(`${currentSelectedVendor.businessName} — Exclusive Offer`);
      setBannerSubtitle(`Top verified business in ${currentSelectedVendor.area}. Connect on WhatsApp for direct quotes.`);
      setBannerImageURL(currentSelectedVendor.logoURL || 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80');
    }
  }, [currentSelectedVendor]);

  if (!isOpen || !packageInfo) return null;

  const handleMadePayment = async () => {
    if (!currentSelectedVendor) {
      showToast('error', 'Business Required', 'Please select a business for this promotion.');
      return;
    }

    if (packageInfo.type === 'featured_product' && !selectedProductId) {
      showToast('error', 'Product Required', 'Please select a product to promote.');
      return;
    }

    const selectedProdObj = products.find((p) => p.id === selectedProductId);
    setIsSubmitting(true);

    try {
      const refCode = `IKD-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const expiry = new Date(now.getTime() + 14 * 86400 * 1000);

      const promoRequest: Promotion = {
        id: `promo-req-${Date.now()}`,
        promotionType: packageInfo.type,
        promotionName: packageInfo.name,
        vendorId: currentSelectedVendor.id,
        vendorName: currentSelectedVendor.businessName,
        vendorSlug: currentSelectedVendor.slug,
        productId: packageInfo.type === 'featured_product' ? selectedProductId : undefined,
        productName: packageInfo.type === 'featured_product' ? selectedProdObj?.name : undefined,
        bannerData: packageInfo.type === 'homepage_banner' ? {
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageURL: bannerImageURL,
          ctaText: 'Visit Store',
        } : undefined,
        reference: refCode,
        amount: packageInfo.price,
        currency: 'NGN',
        paymentDate: now.toISOString(),
        startDate: now.toISOString(),
        expiryDate: expiry.toISOString(),
        status: 'pending_verification',
        userEmail: currentUser?.email || 'vendor@ikorodusquare.com.ng',
        createdAt: now.toISOString(),
      };

      await createPromotionRequest(promoRequest);

      // Automated WhatsApp notification trigger
      const cleanSupportNum = (adminSettings.whatsappSupportNumber || '08156655091')
        .replace(/\D/g, '')
        .replace(/^0/, '234');

      const waMessage = `Hello IkoroduSquare,

I have made payment for a promotional package.

Business Name:
${currentSelectedVendor.businessName}

Promotion Package:
${packageInfo.name}

Amount Paid:
₦${packageInfo.price.toLocaleString()}

Payment Reference:
${refCode}

Kindly verify my payment and activate my promotion.

Thank you.`;

      const waUrl = `https://wa.me/${cleanSupportNum}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      showToast(
        'success',
        'Promotion Request Submitted!',
        'Your request is Pending Verification. Opening WhatsApp to notify support...'
      );
      onClose();
    } catch (err: any) {
      console.error('Error submitting promotion request:', err);
      showToast('error', 'Submission Failed', 'Could not submit promotion request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Promotional Add-on Request
          </div>
          <h2 className="text-2xl font-black">{packageInfo.name}</h2>
          <p className="text-xs text-slate-300 mt-1">{packageInfo.description}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Selected Business */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" /> Selected Business
            </label>
            {userVendors.length > 1 ? (
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {userVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName} ({v.area})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-slate-900">{currentSelectedVendor?.businessName}</p>
                  <p className="text-slate-500">📍 {currentSelectedVendor?.area} • {currentSelectedVendor?.category}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full border border-emerald-300">
                  Selected
                </span>
              </div>
            )}
          </div>

          {/* Featured Product Selection */}
          {packageInfo.type === 'featured_product' && (
            <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <label className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" /> Select Product to Feature
              </label>
              {vendorProducts.length === 0 ? (
                <p className="text-rose-600 font-bold">
                  No products found for this business. Please add a product to your store first.
                </p>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-emerald-300 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {vendorProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₦{p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Banner Settings */}
          {packageInfo.type === 'homepage_banner' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-extrabold text-slate-900 uppercase tracking-wider">
                Custom Banner Details
              </p>
              <div>
                <label className="font-bold text-slate-700">Banner Headline</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Banner Subtitle</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Banner Image URL</label>
                <input
                  type="text"
                  value={bannerImageURL}
                  onChange={(e) => setBannerImageURL(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1 bg-white"
                />
              </div>
            </div>
          )}

          {/* Promotion Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <p className="font-black text-slate-900 text-sm mb-1">Promotion Request Summary</p>
            <div className="flex justify-between text-slate-600">
              <span>Promotion Name:</span>
              <span className="font-bold text-slate-900">{packageInfo.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Price:</span>
              <span className="font-bold text-slate-900">₦{packageInfo.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Duration:</span>
              <span className="font-bold text-slate-900">2 Weeks (14 Days)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Selected Business:</span>
              <span className="font-bold text-slate-900">{currentSelectedVendor?.businessName}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
              <span className="font-black text-slate-900">Total Amount:</span>
              <span className="font-black text-emerald-700 text-base">₦{packageInfo.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Bank Payment Details Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Landmark className="w-4 h-4 text-amber-700" /> Payment Transfer Details
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              Please transfer the exact amount of <strong className="text-slate-900 font-extrabold">₦{packageInfo.price.toLocaleString()}</strong> to the account below:
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-[10px] font-sans font-bold">Bank:</span>
                <span className="font-extrabold text-slate-900 text-xs">{adminSettings.bankName || 'FCMB'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-[10px] font-sans font-bold">Account Name:</span>
                <span className="font-extrabold text-slate-900 text-xs">{adminSettings.accountName || 'Rhadsoft Tech'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-[10px] font-sans font-bold">Account Number:</span>
                <span className="font-black text-emerald-700 text-sm tracking-wider">{adminSettings.accountNumber || '9474918014'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-amber-900 bg-amber-100/60 p-3 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                After completing the transfer, click "I've Made Payment". You will be redirected to WhatsApp with a pre-filled payment notification. Your promotional request will remain Pending Verification until payment is confirmed by the IkoroduSquare Administrator. Once verified, your promotion will be activated for the selected duration.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleMadePayment}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting Request...' : 'I Have Made Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
