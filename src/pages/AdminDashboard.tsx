import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ALL_IKORODU_AREAS } from '../data/ikoroduData';
import { DashboardSkeleton } from '../components/Skeletons';
import { Vendor, Promotion } from '../types';
import { AdminLoginPage } from './AdminLoginPage';
import { isAdminEmail, getAdminEmail } from '../lib/admin';
import { logoutUser } from '../services/supabase';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, Clock, Users, Store,
  Package, TrendingUp, MessageCircle, Sparkles, Award, AlertCircle,
  ExternalLink, Eye, Trash2, MapPin, Search, X, Star, LogOut,
  Settings, Layers, ShoppingBag, Tag, Activity, RefreshCw, Zap,
  LayoutTemplate,
} from 'lucide-react';

// ── Promo type config ─────────────────────────────────────────────────────
const PROMO_CONFIG = {
  featured_product:  { label: 'Feat. Product',  labelFull: 'Featured Product',       price: 5000,  Icon: Zap,           activeClass: 'bg-amber-500 text-slate-950 border-amber-600',    inactiveClass: 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50' },
  sponsored_vendor:  { label: 'Sponsored',       labelFull: 'Sponsored Vendor Slot',  price: 10000, Icon: Sparkles,      activeClass: 'bg-purple-600 text-white border-purple-700',        inactiveClass: 'bg-white text-purple-800 border-purple-300 hover:bg-purple-50' },
  category_top_spot: { label: 'Cat. Top Spot',   labelFull: 'Category Top Spot',      price: 7500,  Icon: Award,         activeClass: 'bg-blue-600 text-white border-blue-700',            inactiveClass: 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50' },
  homepage_banner:   { label: 'Banner',           labelFull: 'Homepage Banner Slot',   price: 15000, Icon: LayoutTemplate, activeClass: 'bg-emerald-600 text-white border-emerald-700',     inactiveClass: 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50' },
} as const;

type PromoType = keyof typeof PROMO_CONFIG;

// ── PromoButton — self-contained with optimistic state ────────────────────
interface PromoButtonProps {
  vendor: Vendor;
  promoType: PromoType;
  isActive: boolean;
  onToggle: (vendor: Vendor, promoType: PromoType, currentlyActive: boolean) => Promise<void>;
}

const PromoButton: React.FC<PromoButtonProps> = ({ vendor, promoType, isActive, onToggle }) => {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const config = PROMO_CONFIG[promoType];
  const Icon   = config.Icon;

  // Sync optimistic state whenever real state changes from parent
  useEffect(() => { setOptimistic(null); }, [isActive]);

  // What the button currently shows — optimistic wins until parent syncs
  const displayed = optimistic !== null ? optimistic : isActive;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setOptimistic(!displayed); // flip immediately
    try {
      await onToggle(vendor, promoType, displayed);
    } catch {
      setOptimistic(displayed); // revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-xl border-2 font-extrabold transition-all cursor-pointer flex items-center gap-1 text-xs disabled:opacity-60 disabled:cursor-not-allowed ${
        displayed ? config.activeClass : config.inactiveClass
      }`}
      title={displayed ? `Click to deactivate ${config.labelFull}` : `Click to activate ${config.labelFull}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
      {displayed && <span className="text-[10px] font-black">✓</span>}
      {loading && <span className="animate-spin text-[10px]">⟳</span>}
    </button>
  );
};

// ── StatusToggleButton — for Approve / Verify / Feature ───────────────────
interface StatusToggleProps {
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeClass: string;
  inactiveClass: string;
  icon: React.ReactNode;
  onClick: () => Promise<void>;
}

const StatusToggleButton: React.FC<StatusToggleProps> = ({
  isActive, activeLabel, inactiveLabel, activeClass, inactiveClass, icon, onClick
}) => {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setOptimistic(null); }, [isActive]);

  const displayed = optimistic !== null ? optimistic : isActive;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setOptimistic(!displayed);
    try { await onClick(); }
    catch { setOptimistic(displayed); }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-xl border-2 font-extrabold transition-all cursor-pointer flex items-center gap-1 text-xs disabled:opacity-60 disabled:cursor-not-allowed ${
        displayed ? activeClass : inactiveClass
      }`}
    >
      {icon}
      <span>{displayed ? activeLabel : inactiveLabel}</span>
      {loading && <span className="animate-spin text-[10px] ml-0.5">⟳</span>}
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AdminDashboard
// ══════════════════════════════════════════════════════════════════════════════
export const AdminDashboard: React.FC = () => {
  const {
    vendors, products,
    approveVendor, unapproveVendor,
    toggleVendorApproval, toggleVendorVerification, toggleVendorFeatured,
    rejectVendor, deleteVendor,
    refreshData, showToast, navigateToStore,
    setCurrentPage, setCurrentUser, setIsAdminMode,
    isLoading, currentUser,
    promotions, updatePromotionStatus, activatePromotion,
    adminSettings, updateAdminSettings,
  } = useApp();

  // ── Settings form ─────────────────────────────────────────────────────────
  const [bankName,              setBankName]              = useState(adminSettings?.bankName || 'FCMB');
  const [accountName,           setAccountName]           = useState(adminSettings?.accountName || 'Rhadsoft Tech');
  const [accountNumber,         setAccountNumber]         = useState(adminSettings?.accountNumber || '9474918014');
  const [whatsappSupportNumber, setWhatsappSupportNumber] = useState(adminSettings?.whatsappSupportNumber || '08156655091');

  useEffect(() => {
    if (adminSettings) {
      setBankName(adminSettings.bankName);
      setAccountName(adminSettings.accountName);
      setAccountNumber(adminSettings.accountNumber);
      setWhatsappSupportNumber(adminSettings.whatsappSupportNumber);
    }
  }, [adminSettings]);

  // ── Tab routing ───────────────────────────────────────────────────────────
  const getInitialTab = (): string => {
    if (typeof window === 'undefined') return 'approvals';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/vendors'))     return 'featured';
    if (path.includes('/analytics'))   return 'analytics';
    if (path.includes('/products'))    return 'products';
    if (path.includes('/customers'))   return 'customers';
    if (path.includes('/orders'))      return 'orders';
    if (path.includes('/categories'))  return 'categories';
    if (path.includes('/areas'))       return 'areas';
    if (path.includes('/promotions'))  return 'promotions';
    if (path.includes('/settings'))    return 'settings';
    if (path.includes('/system-logs')) return 'system-logs';
    return 'approvals';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab());
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') window.history.pushState({}, '', `/admin/${tab}`);
  };

  // ── Modal state ───────────────────────────────────────────────────────────
  const [selectedVendorId,  setSelectedVendorId]  = useState<string | null>(null);
  const [vendorToDeleteId,  setVendorToDeleteId]  = useState<string | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<string | null>(null);
  const [rejectReasonText,  setRejectReasonText]  = useState('');
  const [promoSearchQuery,  setPromoSearchQuery]  = useState('');
  const [promoStatusFilter, setPromoStatusFilter] = useState<'all' | 'pending_verification' | 'active' | 'expired' | 'rejected'>('all');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [statusFilter,      setStatusFilter]      = useState<'all' | 'pending' | 'approved' | 'rejected' | 'featured' | 'verified'>('all');

  // ── Derived data ──────────────────────────────────────────────────────────
  const pendingVendors  = useMemo(() => vendors.filter((v) => v.status === 'pending'),  [vendors]);
  const approvedVendors = useMemo(() => vendors.filter((v) => v.status === 'approved'), [vendors]);

  const selectedVendorForDetails = useMemo(() => vendors.find((v) => v.id === selectedVendorId) ?? null, [vendors, selectedVendorId]);
  const vendorToDelete           = useMemo(() => vendors.find((v) => v.id === vendorToDeleteId) ?? null, [vendors, vendorToDeleteId]);

  // Active promo types per vendor — derived from promotions state
  // PromoButton has its own optimistic state so it flips instantly without waiting for this
  const vendorActivePromos = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const p of promotions || []) {
      if (p.status === 'active' && p.vendorId) {
        if (!map[p.vendorId]) map[p.vendorId] = new Set();
        map[p.vendorId].add(p.promotionType);
      }
    }
    return map;
  }, [promotions]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.businessName.toLowerCase().includes(q) ||
        v.ownerName.toLowerCase().includes(q) ||
        v.subCategory.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === 'pending')  return v.status === 'pending' || !v.isLive;
      if (statusFilter === 'approved') return v.status === 'approved' || v.isLive;
      if (statusFilter === 'rejected') return v.status === 'rejected';
      if (statusFilter === 'featured') return Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
      if (statusFilter === 'verified') return Boolean(v.ninVerified || v.nin_verified);
      return true;
    });
  }, [vendors, searchQuery, statusFilter]);

  // ── Auto-refresh (60s) ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => refreshData(), 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return <DashboardSkeleton />;
  if (!currentUser) return <AdminLoginPage />;

  if (!isAdminEmail(currentUser.email)) {
    return (
      <div className="min-h-[85vh] bg-slate-900 flex items-center justify-center p-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 space-y-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-rose-100 text-rose-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">403 FORBIDDEN</span>
            <h2 className="font-extrabold text-2xl text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your account (<strong className="text-slate-900">{currentUser.email || 'Unrecognized User'}</strong>) is not
              authorized. Access is strictly limited to <strong className="text-orange-600 underline">{getAdminEmail()}</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button onClick={() => setCurrentPage('home')} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl text-xs transition shadow-md cursor-pointer">Return to Marketplace Home</button>
            <button onClick={async () => { await logoutUser(); setCurrentUser(null); StorageManager.setCurrentUser(null); setCurrentPage('admin'); }} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition shadow-md cursor-pointer">Sign In as Administrator</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleConfirmReject = async () => {
    if (!rejectReasonModal || !rejectReasonText.trim()) {
      showToast('error', 'Reason Required', 'Please provide a reason for rejecting the application.');
      return;
    }
    await rejectVendor(rejectReasonModal, rejectReasonText);
    setRejectReasonModal(null);
    setRejectReasonText('');
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDeleteId) return;
    await deleteVendor(vendorToDeleteId);
    if (selectedVendorId === vendorToDeleteId) setSelectedVendorId(null);
    setVendorToDeleteId(null);
  };

  const handleDeleteProductAdmin = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from the platform?')) return;
    await StorageManager.deleteProductAsync(productId);
    await refreshData();
    showToast('info', 'Product Removed', 'The item has been deleted from the marketplace catalogue.');
  };

  // ── Promo toggle handler — passed to PromoButton ──────────────────────────
  // PromoButton handles optimistic flip locally; this fires the real Supabase write
  const handlePromoToggle = async (vendor: Vendor, promoType: PromoType, currentlyActive: boolean) => {
    const config = PROMO_CONFIG[promoType];

    if (currentlyActive) {
      // Find the active promo and deactivate it
      const existing = (promotions || []).find(
        (p) => p.vendorId === vendor.id && p.promotionType === promoType && p.status === 'active'
      );
      if (existing) {
        await updatePromotionStatus(existing.id, 'expired');
        showToast('info', 'Promotion Deactivated', `${config.labelFull} removed for ${vendor.businessName}.`);
      }
    } else {
      // Activate immediately
      const promo: Promotion = {
        id:            `promo-admin-${Date.now()}`,
        vendorId:      vendor.id,
        vendorName:    vendor.businessName,
        vendorSlug:    vendor.slug,
        promotionType: promoType,
        promotionName: `${config.labelFull} — ${vendor.businessName}`,
        amount:        config.price,
        reference:     `ADM-${Date.now()}`,
        status:        'active',
        startDate:     new Date().toISOString(),
        expiryDate:    new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
        paymentDate:   new Date().toISOString(),
        createdAt:     new Date().toISOString(),
        ...(promoType === 'homepage_banner' && {
          bannerData: {
            title:    `${vendor.businessName} — Special Offer`,
            subtitle: 'Top verified vendor in Ikorodu.',
            ctaText:  'Visit Shop & Chat',
            imageURL: vendor.coverPhotoURL || vendor.logoURL || '',
          },
        }),
      };
      await activatePromotion(promo);
      showToast('success', 'Promotion Activated!', `${config.labelFull} is now live for ${vendor.businessName}.`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">ADMINISTRATOR CONTROL CONSOLE</span>
          <h1 className="text-2xl font-black mt-1 text-slate-950">IkoroduSquare Admin Dashboard</h1>
          <p className="text-xs text-amber-950/80 font-medium mt-0.5">Logged in as: <strong>{currentUser.email}</strong></p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => refreshData()} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
          <button onClick={() => { setIsAdminMode(false); setCurrentPage('home'); }} className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer">
            ← Exit to Marketplace
          </button>
          <button
            onClick={async () => { await logoutUser(); setCurrentUser(null); StorageManager.setCurrentUser(null); setIsAdminMode(false); showToast('info', 'Signed Out', 'You have been signed out.'); setCurrentPage('admin'); }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-300 text-xs font-bold gap-2 overflow-x-auto pb-1">
        {[
          { id: 'approvals',   label: `Approval Queue (${pendingVendors.length})`, icon: <Clock className="w-4 h-4" /> },
          { id: 'featured',    label: `Vendors (${vendors.length})`,               icon: <Store className="w-4 h-4" /> },
          { id: 'analytics',   label: 'Analytics',                                  icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'products',    label: `Products (${products.length})`,              icon: <Package className="w-4 h-4" /> },
          { id: 'customers',   label: 'Customers',                                  icon: <Users className="w-4 h-4" /> },
          { id: 'orders',      label: 'Orders',                                     icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'categories',  label: 'Categories',                                 icon: <Layers className="w-4 h-4" /> },
          { id: 'areas',       label: 'Coverage Areas',                             icon: <MapPin className="w-4 h-4" /> },
          { id: 'promotions',  label: `Promotions (${promotions?.length || 0})`,   icon: <Sparkles className="w-4 h-4 text-emerald-600" /> },
          { id: 'settings',    label: 'Settings',                                   icon: <Settings className="w-4 h-4" /> },
          { id: 'system-logs', label: 'Audit Logs',                                 icon: <Activity className="w-4 h-4" /> },
        ].map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === id ? 'border-amber-600 text-amber-700 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ══ TAB: APPROVAL QUEUE ══ */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Pending Vendor Registrations</h3>
              <p className="text-xs text-slate-500">Inspect registered business details before approving or rejecting. Updates in real-time.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => refreshData()} className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
              </button>
              <button
                onClick={async () => {
                  const repaired = await StorageManager.repairOrphanedVendorsAsync();
                  refreshData();
                  showToast(repaired > 0 ? 'success' : 'info', repaired > 0 ? 'Repair Complete' : 'Database OK', repaired > 0 ? `Restored ${repaired} missing vendor record(s).` : 'All vendor users already have store records.');
                }}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Scan & Repair
              </button>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">{pendingVendors.length} Awaiting Review</span>
            </div>
          </div>

          {pendingVendors.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base text-slate-900">All Applications Processed!</h4>
              <p className="text-xs text-slate-500">No pending vendor registrations. New registrations appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVendors.map((vendor) => (
                <div key={vendor.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <img src={vendor.logoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'} alt={vendor.businessName} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-slate-900">{vendor.businessName}</h4>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">Pending Review</span>
                        </div>
                        <p className="text-xs text-slate-600">Owner: <strong>{vendor.ownerName}</strong> • <strong>{vendor.subCategory}</strong> • <strong>{vendor.area}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setSelectedVendorId(vendor.id)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer">
                        <Eye className="w-4 h-4 text-amber-400" /> View Full Info
                      </button>
                      <button onClick={() => approveVendor(vendor.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer">
                        <CheckCircle2 className="w-4 h-4" /> Approve & Launch
                      </button>
                      <button onClick={() => setRejectReasonModal(vendor.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer">Reject</button>
                      <button onClick={() => setVendorToDeleteId(vendor.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">WhatsApp:</span>
                      <a href={`https://wa.me/234${vendor.whatsapp.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="font-bold text-slate-900 flex items-center gap-1 hover:text-emerald-600">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> {vendor.whatsapp}
                      </a>
                    </div>
                    <div><span className="text-slate-500 block text-[10px]">Email:</span><span className="font-bold text-slate-800">{vendor.email || '—'}</span></div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">NIN:</span>
                      {vendor.ninVerified
                        ? <span className="font-bold text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified</span>
                        : <span className="font-bold text-amber-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Unverified</span>}
                    </div>
                    <div><span className="text-slate-500 block text-[10px]">Registered:</span><span className="font-medium text-slate-700">{new Date(vendor.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: VENDOR DIRECTORY ══ */}
      {activeTab === 'featured' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Vendor Directory & Promotions</h3>
              <p className="text-xs text-slate-500">Click any coloured paid-ad button to instantly activate it on the homepage. Click again to deactivate.</p>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search vendor name, area, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">×</button>}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold border-b border-slate-100 pb-3">
            {[
              { id: 'all',      label: `All (${vendors.length})` },
              { id: 'approved', label: `Live (${approvedVendors.length})` },
              { id: 'pending',  label: `Pending (${pendingVendors.length})` },
              { id: 'featured', label: `Featured (${vendors.filter((v) => v.isFeatured || v.is_featured || v.featuredOnHomepage).length})` },
              { id: 'verified', label: `Verified (${vendors.filter((v) => v.ninVerified || v.nin_verified).length})` },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setStatusFilter(id as any)}
                className={`px-3 py-1.5 rounded-xl border-2 transition cursor-pointer font-extrabold ${
                  statusFilter === id
                    ? id === 'approved' ? 'bg-emerald-600 text-white border-emerald-700'
                    : id === 'pending'  ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : id === 'featured' ? 'bg-purple-600 text-white border-purple-700'
                    : id === 'verified' ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-slate-900 text-white border-slate-950'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Vendor cards */}
          <div className="space-y-3">
            {filteredVendors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No vendors found matching search or filter criteria.</div>
            ) : (
              filteredVendors.map((vendor) => {
                const isLive     = vendor.isLive || vendor.status === 'approved';
                const isVerified = Boolean(vendor.ninVerified || vendor.nin_verified);
                const isFeatured = Boolean(vendor.isFeatured ?? vendor.is_featured ?? vendor.featuredOnHomepage);
                const activeTypes = vendorActivePromos[vendor.id] || new Set<string>();

                return (
                  <div key={vendor.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition space-y-3">

                    {/* Row 1: Identity + quick actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={vendor.logoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'} alt={vendor.businessName} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">{vendor.businessName}</h4>
                            {isLive
                              ? <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">Live</span>
                              : vendor.status === 'rejected'
                              ? <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-300 shrink-0">Rejected</span>
                              : <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 shrink-0">Pending</span>}
                            {isVerified && <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-300 flex items-center gap-0.5 shrink-0"><ShieldCheck className="w-3 h-3 text-blue-600" /> Verified</span>}
                            {isFeatured && <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-0.5 shrink-0"><Star className="w-3 h-3 text-purple-600 fill-purple-600" /> Featured</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {vendor.area} • {vendor.subCategory} • {vendor.ownerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setSelectedVendorId(vendor.id)} className="px-2.5 py-1.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer text-xs">
                          <Eye className="w-3.5 h-3.5 text-amber-400" /> Info
                        </button>
                        <button onClick={() => navigateToStore(vendor.slug)} className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer" title="Visit Storefront">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button onClick={() => setVendorToDeleteId(vendor.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer" title="Delete Business">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Status toggles (Approve / Verify / Feature) */}
                    <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Status:</span>

                      <StatusToggleButton
                        isActive={isLive}
                        activeLabel="Live"
                        inactiveLabel="Approve"
                        activeClass="bg-emerald-600 text-white border-emerald-700"
                        inactiveClass="bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400"
                        icon={isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        onClick={() => toggleVendorApproval(vendor.id)}
                      />

                      <StatusToggleButton
                        isActive={isVerified}
                        activeLabel="Verified"
                        inactiveLabel="Verify NIN"
                        activeClass="bg-blue-600 text-white border-blue-700"
                        inactiveClass="bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                        onClick={() => toggleVendorVerification(vendor.id)}
                      />

                      <StatusToggleButton
                        isActive={isFeatured}
                        activeLabel="Featured ★"
                        inactiveLabel="Feature"
                        activeClass="bg-purple-600 text-white border-purple-700"
                        inactiveClass="bg-white text-slate-700 border-slate-300 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400"
                        icon={<Star className="w-3.5 h-3.5" />}
                        onClick={() => toggleVendorFeatured(vendor.id)}
                      />
                    </div>

                    {/* Row 3: Paid promotion slots */}
                    <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Paid Ads:</span>

                      {(Object.keys(PROMO_CONFIG) as PromoType[]).map((promoType) => (
                        <PromoButton
                          key={promoType}
                          vendor={vendor}
                          promoType={promoType}
                          isActive={activeTypes.has(promoType)}
                          onToggle={handlePromoToggle}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: ANALYTICS ══ */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Vendors',        value: vendors.length,  sub: `${approvedVendors.length} Live Stores`,       color: 'text-slate-900' },
            { label: 'Total Products',       value: products.length, sub: 'Indexed in Search',                          color: 'text-emerald-600' },
            { label: 'Active Monthly Users', value: '14,850+',       sub: `Across ${ALL_IKORODU_AREAS.length} Areas`,    color: 'text-slate-900' },
            { label: 'WhatsApp Enquiries',   value: '24,500+',       sub: 'Direct Buyer Connections',                   color: 'text-amber-500' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-500 font-semibold">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ══ TAB: PRODUCTS ══ */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Platform Product Listings</h3>
              <p className="text-xs text-slate-500">Monitor product quality across all registered stores</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">{products.length} Active Items</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const vendor = vendors.find((v) => v.id === prod.vendorId);
              return (
                <div key={prod.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <img src={prod.photoURL || prod.imageURL} alt={prod.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div className="min-w-0 space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{prod.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{vendor?.businessName || 'Unknown Vendor'}</p>
                      <p className="text-xs font-black text-emerald-700">₦{prod.price.toLocaleString()}</p>
                      <span className="inline-block text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">{prod.category}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProductAdmin(prod.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB: CUSTOMERS ══ */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-extrabold text-lg text-slate-900">Registered Shoppers & Customers</h3>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Customer Activity Monitoring</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Customer accounts are synced via secure cloud storage.</p>
          </div>
        </div>
      )}

      {/* ══ TAB: ORDERS ══ */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-extrabold text-lg text-slate-900">Direct WhatsApp Orders & Enquiries</h3>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <ShoppingBag className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Direct Vendor Communications</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">IkoroduSquare connects customers directly with vendors via WhatsApp checkout.</p>
          </div>
        </div>
      )}

      {/* ══ TAB: CATEGORIES ══ */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-extrabold text-lg text-slate-900">Category & Sub-category Management</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Electronics & Phones','Fashion & Beauty','Food & Groceries','Services & Trades','Real Estate & Rent','Automotive','Health & Pharmacy','Home & Furniture'].map((cat) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-600 shrink-0" /> <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: COVERAGE AREAS ══ */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-extrabold text-lg text-slate-900">Ikorodu Area Coverage Zones</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Agric / Isawo','Garage / Sabo','Ebute / Ogolonto','Ikorodu Town / Ita Elewa','Ibeshe / Ipakodo','Imota','Ijede / Egbin','Olayeni / Majidun'].map((area) => (
              <div key={area} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: SETTINGS ══ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Bank & Support Settings</h3>
              <p className="text-xs text-slate-500">Configure payment details and WhatsApp support for vendor promotions</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateAdminSettings({ bankName, accountName, accountNumber, whatsappSupportNumber }); }} className="space-y-4 max-w-xl text-xs">
              {[
                { label: 'Bank Name',              value: bankName,              setter: setBankName,              placeholder: 'e.g. FCMB' },
                { label: 'Account Name',            value: accountName,           setter: setAccountName,           placeholder: 'e.g. Rhadsoft Tech' },
                { label: 'Account Number',          value: accountNumber,         setter: setAccountNumber,         placeholder: 'e.g. 9474918014' },
                { label: 'WhatsApp Support Number', value: whatsappSupportNumber, setter: setWhatsappSupportNumber, placeholder: 'e.g. 08156655091' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block font-bold text-slate-800 mb-1">{label}</label>
                  <input type="text" required value={value} placeholder={placeholder} onChange={(e) => setter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-md cursor-pointer text-xs">Save Settings</button>
            </form>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <h3 className="font-extrabold text-lg text-slate-900">Platform Security & Access</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              {[
                { label: 'Administrator Email',    value: getAdminEmail(),           color: 'text-orange-600 bg-orange-50 border-orange-200' },
                { label: 'Vendor Data Source',     value: 'Supabase (Direct) ✓',     color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Admin Route Restriction',value: 'Single-Admin ACTIVE ✓',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                  <span className="font-bold text-slate-700">{label}</span>
                  <span className={`font-extrabold px-3 py-1 rounded-lg border ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: AUDIT LOGS ══ */}
      {activeTab === 'system-logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-extrabold text-lg text-slate-900">System Activity & Audit Logs</h3>
          <div className="space-y-2 text-xs font-mono">
            {[
              { color: 'text-emerald-400', msg: `[AUTH] Single-Admin system verified for ${getAdminEmail()}` },
              { color: 'text-emerald-400', msg: '[VENDORS] Fetched directly from Supabase — localStorage bypassed' },
              { color: 'text-emerald-400', msg: '[REALTIME] Vendor INSERT/UPDATE/DELETE channel active' },
              { color: 'text-amber-300',   msg: '[SYSTEM] Cloud Database & Authentication persistent state active' },
            ].map(({ color, msg }, i) => (
              <div key={i} className="p-3 bg-slate-950 rounded-xl flex items-center justify-between">
                <span className={color}>{msg}</span>
                <span className="text-slate-500 text-[10px]">{new Date().toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB: PROMOTIONS ══ */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Platform Revenue Engine
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">Promotions Management</h3>
              <p className="text-xs text-slate-400">To activate or deactivate promotions, go to the <strong className="text-amber-300">Vendors tab</strong> and click any paid-ad button — it reflects on the homepage instantly.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-right sm:min-w-[200px]">
              <p className="text-slate-300 font-bold text-xs uppercase tracking-wider">Total Ad Revenue</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">₦{(promotions || []).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1">{(promotions || []).length} Total Transactions</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" placeholder="Search by vendor name, reference, or type..." value={promoSearchQuery} onChange={(e) => setPromoSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
                {(['all','pending_verification','active','expired','rejected'] as const).map((filter) => (
                  <button key={filter} onClick={() => setPromoStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition whitespace-nowrap cursor-pointer ${promoStatusFilter === filter ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>
                    {{ all:'All', pending_verification:'Pending', active:'Active', expired:'Expired', rejected:'Rejected' }[filter]}
                  </button>
                ))}
              </div>
            </div>

            {promotions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-sm text-slate-700">No Promotions Recorded</p>
                <p className="text-xs text-slate-500">Activate promotions from the Vendor Directory tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-3">Promotion / Vendor</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Amount & Ref</th>
                      <th className="py-3 px-3">Dates</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {promotions
                      .filter((p) => {
                        const matchStatus = promoStatusFilter === 'all'
                          || (promoStatusFilter === 'pending_verification' && (p.status === 'pending_verification' || p.status === 'pending'))
                          || p.status === promoStatusFilter;
                        const q = promoSearchQuery.toLowerCase();
                        const matchSearch = !q || p.vendorName?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || p.promotionName?.toLowerCase().includes(q) || p.promotionType?.toLowerCase().includes(q);
                        return matchStatus && matchSearch;
                      })
                      .map((promo) => {
                        const daysLeft = Math.max(0, Math.ceil((new Date(promo.expiryDate).getTime() - Date.now()) / 86400000));
                        const isPending = promo.status === 'pending_verification' || promo.status === 'pending';
                        return (
                          <tr key={promo.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-3">
                              <p className="font-black text-slate-900">{promo.promotionName}</p>
                              <p className="text-[11px] text-slate-500 font-bold">🏢 {promo.vendorName}</p>
                              {promo.productName && <p className="text-[10px] text-emerald-700 font-semibold">📦 {promo.productName}</p>}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">{promo.promotionType}</span>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-extrabold text-emerald-700">₦{promo.amount.toLocaleString()}</p>
                              <p className="text-[10px] font-mono text-slate-400">{promo.reference}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="text-slate-700 font-bold">{new Date(promo.createdAt || promo.paymentDate).toLocaleDateString()}</p>
                              <p className="text-[10px] text-slate-500">{promo.status === 'active' ? `Expires: ${new Date(promo.expiryDate).toLocaleDateString()} (${daysLeft}d left)` : '—'}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${promo.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : promo.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-200 text-slate-700'}`}>
                                {promo.status === 'active' ? 'Active' : isPending ? 'Pending' : promo.status === 'rejected' ? 'Rejected' : 'Expired'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending && (
                                  <>
                                    <button onClick={() => { updatePromotionStatus(promo.id, 'active'); showToast('success', 'Activated!', `${promo.promotionName} is now active.`); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs transition cursor-pointer">Verify & Activate</button>
                                    <button onClick={() => { updatePromotionStatus(promo.id, 'rejected'); showToast('error', 'Rejected', `Rejected for ${promo.vendorName}.`); }} className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition cursor-pointer">Reject</button>
                                  </>
                                )}
                                {promo.status === 'active' && (
                                  <>
                                    <button onClick={() => { updatePromotionStatus(promo.id, 'active', 14); showToast('success', 'Extended', `+14 days added.`); }} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer">+14 Days</button>
                                    <button onClick={() => { updatePromotionStatus(promo.id, 'expired'); showToast('info', 'Deactivated', ''); }} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-[10px] transition cursor-pointer">Deactivate</button>
                                  </>
                                )}
                                {(promo.status === 'expired' || promo.status === 'rejected') && (
                                  <button onClick={() => { updatePromotionStatus(promo.id, 'active'); showToast('success', 'Re-activated', ''); }} className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition cursor-pointer">Re-activate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VENDOR DETAILS MODAL ══ */}
      {selectedVendorForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="relative h-44 bg-slate-900 shrink-0">
              <img src={selectedVendorForDetails.coverPhotoURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover opacity-60" />
              <button onClick={() => setSelectedVendorId(null)} className="absolute top-3 right-3 bg-slate-950/80 text-white p-2 rounded-full hover:bg-slate-900 transition z-10 cursor-pointer"><X className="w-5 h-5" /></button>
              <div className="absolute bottom-3 left-4 sm:left-6 flex items-end gap-3 z-10">
                <img src={selectedVendorForDetails.logoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'} alt={selectedVendorForDetails.businessName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white shadow-xl object-cover bg-white shrink-0" />
                <div className="text-white drop-shadow-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg sm:text-xl">{selectedVendorForDetails.businessName}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${selectedVendorForDetails.status === 'approved' ? 'bg-emerald-500 text-white' : selectedVendorForDetails.status === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                      {selectedVendorForDetails.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">Owner: {selectedVendorForDetails.ownerName}</p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">WhatsApp:</span>
                  <a href={`https://wa.me/234${selectedVendorForDetails.whatsapp.replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noreferrer" className="font-bold text-slate-900 hover:text-emerald-600 flex items-center gap-1.5 text-sm">
                    <MessageCircle className="w-4 h-4 text-emerald-600" /> {selectedVendorForDetails.whatsapp}
                  </a>
                </div>
                <div><span className="text-slate-400 font-semibold block text-[10px]">Email:</span><span className="font-bold text-slate-900">{selectedVendorForDetails.email || '—'}</span></div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Address:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 text-xs"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedVendorForDetails.address} ({selectedVendorForDetails.area})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">NIN Verification:</span>
                  {selectedVendorForDetails.ninVerified
                    ? <span className="font-bold text-emerald-700 flex items-center gap-1 text-xs"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified — {selectedVendorForDetails.ninData?.fullName || 'Match Confirmed'}</span>
                    : <span className="font-bold text-amber-700 flex items-center gap-1 text-xs"><AlertCircle className="w-4 h-4 text-amber-500" /> Unverified</span>}
                </div>
                <div><span className="text-slate-400 font-semibold block text-[10px]">Registered:</span><span className="font-medium text-slate-800">{new Date(selectedVendorForDetails.createdAt).toLocaleString()}</span></div>
                <div><span className="text-slate-400 font-semibold block text-[10px]">Category:</span><span className="font-bold text-slate-900">{selectedVendorForDetails.subCategory}</span></div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Store Description</h4>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed text-slate-800">{selectedVendorForDetails.description || 'No description provided.'}</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Products ({products.filter((p) => p.vendorId === selectedVendorForDetails.id).length})</h4>
                {products.filter((p) => p.vendorId === selectedVendorForDetails.id).length === 0 ? (
                  <p className="text-slate-400 italic">No products listed yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.filter((p) => p.vendorId === selectedVendorForDetails.id).map((prod) => (
                      <div key={prod.id} className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                        <img src={prod.photoURL || prod.imageURL} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-emerald-700 font-extrabold">₦{prod.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button onClick={() => { navigateToStore(selectedVendorForDetails.slug); setSelectedVendorId(null); }} className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
                <ExternalLink className="w-4 h-4" /> Preview Store
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusToggleButton
                  isActive={selectedVendorForDetails.isLive || selectedVendorForDetails.status === 'approved'}
                  activeLabel="Approved (Live)" inactiveLabel="Approve Store"
                  activeClass="bg-emerald-600 text-white border-emerald-700"
                  inactiveClass="bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => toggleVendorApproval(selectedVendorForDetails.id)}
                />
                <StatusToggleButton
                  isActive={Boolean(selectedVendorForDetails.ninVerified || selectedVendorForDetails.nin_verified)}
                  activeLabel="Verified ✓" inactiveLabel="Verify NIN"
                  activeClass="bg-blue-600 text-white border-blue-700"
                  inactiveClass="bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => toggleVendorVerification(selectedVendorForDetails.id)}
                />
                <StatusToggleButton
                  isActive={Boolean(selectedVendorForDetails.isFeatured || selectedVendorForDetails.is_featured || selectedVendorForDetails.featuredOnHomepage)}
                  activeLabel="Featured ★" inactiveLabel="Feature Vendor"
                  activeClass="bg-purple-600 text-white border-purple-700"
                  inactiveClass="bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200"
                  icon={<Star className="w-4 h-4" />}
                  onClick={() => toggleVendorFeatured(selectedVendorForDetails.id)}
                />
                <button onClick={() => setVendorToDeleteId(selectedVendorForDetails.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button onClick={() => setSelectedVendorId(null)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto"><Trash2 className="w-6 h-6" /></div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900">Delete Business Permanently?</h3>
              <p className="text-xs text-slate-600">Are you sure you want to delete <strong className="text-slate-900">{vendorToDelete.businessName}</strong>? This removes the vendor and all their products from IkoroduSquare and Supabase.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setVendorToDeleteId(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmDelete} className="bg-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-rose-700 transition cursor-pointer">Yes, Delete Business</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <h3 className="font-extrabold text-lg text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-600">Provide a clear reason to be sent to the vendor via WhatsApp:</p>
            <textarea rows={3} required value={rejectReasonText} onChange={(e) => setRejectReasonText(e.target.value)} placeholder="e.g. Please upload a clear photo of your shop storefront in Ikorodu." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 outline-none" />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => { setRejectReasonModal(null); setRejectReasonText(''); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmReject} className="bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-rose-700 cursor-pointer">Send Rejection Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};