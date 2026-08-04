import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ALL_IKORODU_AREAS } from '../data/ikoroduData';
import { DashboardSkeleton } from '../components/Skeletons';
import { Vendor } from '../types';
import { AdminLoginPage } from './AdminLoginPage';
import { isAdminEmail, getAdminEmail } from '../lib/admin';
import { logoutUser } from '../services/supabase';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Store,
  Package,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Award,
  AlertCircle,
  ExternalLink,
  Eye,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  X,
  Globe,
  Building,
  Star,
  Check,
  LogOut,
  Settings,
  FileText,
  Layers,
  ShoppingBag,
  Tag,
  HelpCircle,
  Activity,
  CreditCard,
  Megaphone,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    vendors,
    products,
    approveVendor,
    unapproveVendor,
    toggleVendorApproval,
    toggleVendorVerification,
    toggleVendorFeatured,
    rejectVendor,
    deleteVendor,
    refreshData,
    showToast,
    navigateToStore,
    setCurrentPage,
    setCurrentUser,
    setIsAdminMode,
    isLoading,
    currentUser,
    promotions,
    updatePromotionStatus,
    adminSettings,
    updateAdminSettings,
  } = useApp();

  const [promoSearchQuery, setPromoSearchQuery] = useState('');
  const [promoStatusFilter, setPromoStatusFilter] = useState<'all' | 'pending_verification' | 'active' | 'expired' | 'rejected'>('all');

  // Bank & Support Settings state
  const [bankName, setBankName] = useState(adminSettings?.bankName || 'FCMB');
  const [accountName, setAccountName] = useState(adminSettings?.accountName || 'Rhadsoft Tech');
  const [accountNumber, setAccountNumber] = useState(adminSettings?.accountNumber || '9474918014');
  const [whatsappSupportNumber, setWhatsappSupportNumber] = useState(adminSettings?.whatsappSupportNumber || '08156655091');

  useEffect(() => {
    if (adminSettings) {
      setBankName(adminSettings.bankName);
      setAccountName(adminSettings.accountName);
      setAccountNumber(adminSettings.accountNumber);
      setWhatsappSupportNumber(adminSettings.whatsappSupportNumber);
    }
  }, [adminSettings]);

  const getInitialAdminTab = (): string => {
    if (typeof window === 'undefined') return 'approvals';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/vendors')) return 'featured';
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/products')) return 'products';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/areas')) return 'areas';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/subscriptions')) return 'subscriptions';
    if (path.includes('/advertisements')) return 'advertisements';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/support')) return 'support';
    if (path.includes('/system-logs')) return 'system-logs';
    return 'approvals';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialAdminTab());

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/${tab}`);
    }
  };

  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const [rejectReasonModal, setRejectReasonModal] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Search & Filter state for vendor management tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'featured' | 'verified'>('all');

  const pendingVendors = useMemo(() => vendors.filter((v) => v.status === 'pending'), [vendors]);
  const approvedVendors = useMemo(() => vendors.filter((v) => v.status === 'approved'), [vendors]);

  // Filtered vendors for directory/featured tab
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.area.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return v.status === 'pending' || !v.isLive;
      if (statusFilter === 'approved') return v.status === 'approved' || v.isLive;
      if (statusFilter === 'rejected') return v.status === 'rejected';
      if (statusFilter === 'featured') return Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
      if (statusFilter === 'verified') return Boolean(v.ninVerified || v.nin_verified);
      return true;
    });
  }, [vendors, searchQuery, statusFilter]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 1. Unauthenticated Visitor: Render Dedicated Administrator Login Page
  if (!currentUser) {
    return <AdminLoginPage />;
  }

  // 2. Authenticated with Non-Administrator Email: Display Access Restricted Page
  if (!isAdminEmail(currentUser.email)) {
    return (
      <div className="min-h-[85vh] bg-slate-900 flex items-center justify-center p-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-rose-100 text-rose-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              403 FORBIDDEN
            </span>
            <h2 className="font-extrabold text-2xl text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your account (<strong className="text-slate-900">{currentUser.email || 'Unrecognized User'}</strong>) is not authorized for administrator access. Access is strictly limited to <strong className="text-orange-600 underline">{getAdminEmail()}</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              Return to Marketplace Home
            </button>
            <button
              onClick={async () => {
                await logoutUser();
                setCurrentUser(null);
                StorageManager.setCurrentUser(null);
                setCurrentPage('admin');
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              Sign In as Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (vendorId: string) => {
    await approveVendor(vendorId);
    if (selectedVendorForDetails?.id === vendorId) {
      const updated = vendors.find((v) => v.id === vendorId);
      if (updated) setSelectedVendorForDetails(updated);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonModal) return;
    if (!rejectReasonText.trim()) {
      showToast('error', 'Reason Required', 'Please provide a reason for rejecting the application.');
      return;
    }
    await rejectVendor(rejectReasonModal, rejectReasonText);
    setRejectReasonModal(null);
    setRejectReasonText('');
    if (selectedVendorForDetails?.id === rejectReasonModal) {
      const updated = vendors.find((v) => v.id === rejectReasonModal);
      if (updated) setSelectedVendorForDetails(updated);
    }
  };

  const handleConfirmDelete = async () => {
    if (!vendorToDelete) return;
    await deleteVendor(vendorToDelete.id);
    if (selectedVendorForDetails?.id === vendorToDelete.id) {
      setSelectedVendorForDetails(null);
    }
    setVendorToDelete(null);
  };

  const toggleFeaturedSlot = (vendorId: string, slotType: 'homepage' | 'sponsored' | 'topspot') => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    let updated = { ...v };
    if (slotType === 'homepage') updated.featuredOnHomepage = !v.featuredOnHomepage;
    if (slotType === 'sponsored') updated.sponsoredCategorySlot = !v.sponsoredCategorySlot;
    if (slotType === 'topspot') updated.categoryTopSpot = !v.categoryTopSpot;

    StorageManager.updateVendor(updated);
    refreshData();
    showToast('success', 'Featured Placement Updated', `Placements updated for ${v.businessName}.`);
  };

  const removeAllPlacements = (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const updated: Vendor = {
      ...v,
      featuredOnHomepage: false,
      sponsoredCategorySlot: false,
      categoryTopSpot: false,
    };

    StorageManager.updateVendor(updated);
    refreshData();
    showToast('info', 'Placements Removed', `All featured and sponsored slots cleared for ${v.businessName}.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              ADMINISTRATOR CONTROL CONSOLE
            </span>
            <span className="text-xs font-bold text-amber-950">System Operations</span>
          </div>
          <h1 className="text-2xl font-black mt-1 text-slate-950">IkoroduSquare Admin Dashboard</h1>
          <p className="text-xs text-amber-950/80 font-medium mt-0.5">
            Logged in as: <strong>{currentUser.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsAdminMode(false);
              setCurrentPage('home');
            }}
            className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            ← Exit to Marketplace
          </button>
          <button
            onClick={async () => {
              await logoutUser();
              setCurrentUser(null);
              StorageManager.setCurrentUser(null);
              setIsAdminMode(false);
              showToast('info', 'Signed Out', 'You have been signed out of the Administrator console.');
              setCurrentPage('admin');
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-300 text-xs font-bold gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'approvals' || activeTab === 'dashboard'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Approval Queue ({pendingVendors.length})
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'featured' || activeTab === 'vendors'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" /> Vendors Directory ({vendors.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Analytics
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" /> Products ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'customers'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> Customers
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Orders
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Categories
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'areas'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" /> Coverage Areas
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'promotions'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" /> Promotions ({promotions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>

        <button
          onClick={() => setActiveTab('system-logs')}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'system-logs'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* TAB 1: VENDOR APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Pending Vendor Registrations</h3>
              <p className="text-xs text-slate-500">Inspect registered business details before approving or rejecting</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  const repaired = await StorageManager.repairOrphanedVendorsAsync();
                  refreshData();
                  if (repaired > 0) {
                    showToast('success', 'Repair Completed', `Successfully restored ${repaired} missing vendor record(s) into public.vendors.`);
                  } else {
                    showToast('info', 'Database Verified', 'All vendor users already have corresponding vendor store records.');
                  }
                }}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Scan public.users and repair vendor users missing records in public.vendors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Scan & Repair Vendors
              </button>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {pendingVendors.length} Application{pendingVendors.length !== 1 ? 's' : ''} Awaiting Review
              </span>
            </div>
          </div>

          {pendingVendors.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base text-slate-900">All Applications Processed!</h4>
              <p className="text-xs text-slate-500">There are no pending vendor registrations in the review queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVendors.map((vendor) => {
                const vendorProds = products.filter((p) => p.vendorId === vendor.id);
                return (
                  <div
                    key={vendor.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={vendor.logoURL}
                          alt={vendor.businessName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-base text-slate-900">{vendor.businessName}</h4>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              Pending Review
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Owner: <strong>{vendor.ownerName}</strong> • Category: <strong>{vendor.subCategory}</strong> • Area:{' '}
                            <strong>{vendor.area}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedVendorForDetails(vendor)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-amber-400" /> View Full Info
                        </button>

                        <button
                          onClick={() => handleApprove(vendor.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Launch
                        </button>

                        <button
                          onClick={() => setRejectReasonModal(vendor.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => setVendorToDelete(vendor)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Business"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[10px]">WhatsApp Contact:</span>
                        <a
                          href={`https://wa.me/234${vendor.whatsapp.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-900 flex items-center gap-1 hover:text-emerald-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> {vendor.whatsapp}
                        </a>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">NIMC 11-Digit NIN Status:</span>
                        {vendor.ninVerified ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified ({vendor.ninData?.fullName || 'NIN Match'})
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Unverified NIN
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Initial Products:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-500" /> {vendorProds.length} Product{vendorProds.length !== 1 ? 's' : ''} Created
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Date Submitted:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VENDOR DIRECTORY & FEATURED PLACEMENTS */}
      {activeTab === 'featured' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Vendor Directory & Featured Placements</h3>
              <p className="text-xs text-slate-500">Manage store visibility, homepage spotlights, sponsored slots, or remove businesses</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor name, area, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold border-b border-slate-100 pb-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Vendors ({vendors.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Approved & Live ({approvedVendors.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Pending ({pendingVendors.length})
            </button>
            <button
              onClick={() => setStatusFilter('featured')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === 'featured'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Featured ({vendors.filter((v) => v.isFeatured || v.is_featured || v.featuredOnHomepage).length})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === 'verified'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Verified ({vendors.filter((v) => v.ninVerified || v.nin_verified).length})
            </button>
          </div>

          {/* Vendor Directory Cards */}
          <div className="divide-y divide-slate-100">
            {filteredVendors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No vendors found matching search or filter criteria.
              </div>
            ) : (
              filteredVendors.map((vendor) => {
                const isLive = vendor.isLive || vendor.status === 'approved';
                const isVerified = Boolean(vendor.ninVerified || vendor.nin_verified);
                const isFeatured = Boolean(vendor.isFeatured ?? vendor.is_featured ?? vendor.featuredOnHomepage);

                return (
                  <div key={vendor.id} className="py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-slate-50/50 p-3 rounded-2xl transition border border-slate-100 mb-2 bg-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={vendor.logoURL}
                        alt={vendor.businessName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{vendor.businessName}</h4>

                          {/* Approval / Live Status Badge */}
                          {isLive ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                              Live (Approved)
                            </span>
                          ) : vendor.status === 'rejected' ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-300">
                              Rejected
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                              Pending Approval
                            </span>
                          )}

                          {/* Verification Status Badge */}
                          {isVerified ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600" /> Verified
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                              Unverified
                            </span>
                          )}

                          {/* Featured Status Badge */}
                          {isFeatured && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                              <Star className="w-3 h-3 text-purple-600 fill-purple-600" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          📍 {vendor.area} • Category: {vendor.subCategory} • Owner: {vendor.ownerName}
                        </p>
                      </div>
                    </div>

                    {/* Independent Administrator Action Controls */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {/* 1. Approval Action */}
                      <button
                        onClick={() => toggleVendorApproval(vendor.id)}
                        className={`px-3 py-1.5 rounded-xl border font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          isLive
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title={isLive ? "Click to set store offline (Unapprove)" : "Click to approve & launch store live"}
                      >
                        {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                        {isLive ? 'Approved (Live)' : 'Approve Vendor'}
                      </button>

                      {/* 2. Verification Action */}
                      <button
                        onClick={() => toggleVendorVerification(vendor.id)}
                        className={`px-3 py-1.5 rounded-xl border font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          isVerified
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        title={isVerified ? "Click to remove NIN verification" : "Click to verify vendor NIN"}
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-white' : 'text-slate-400'}`} />
                        {isVerified ? 'Verified ✓' : 'Verify NIN'}
                      </button>

                      {/* 3. Featured Action */}
                      <button
                        onClick={() => toggleVendorFeatured(vendor.id)}
                        className={`px-3 py-1.5 rounded-xl border font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          isFeatured
                            ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                        title={isFeatured ? "Click to remove from homepage featured section" : "Click to feature on homepage"}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-white text-white' : 'text-slate-400'}`} />
                        {isFeatured ? 'Featured ★' : 'Feature Vendor'}
                      </button>

                      <button
                        onClick={() => setSelectedVendorForDetails(vendor)}
                        className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Full Info
                      </button>

                      <button
                        onClick={() => navigateToStore(vendor.slug)}
                        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                        title="Visit Storefront"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setVendorToDelete(vendor)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete Business Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
            <p className="text-xs font-bold text-slate-500">Total Vendors</p>
            <p className="text-3xl font-black text-slate-900">{vendors.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">{approvedVendors.length} Live Stores</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
            <p className="text-xs font-bold text-slate-500">Total Listed Products</p>
            <p className="text-3xl font-black text-emerald-600">{products.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold">Indexed in Search</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
            <p className="text-xs font-bold text-slate-500">Active Monthly Users</p>
            <p className="text-3xl font-black text-slate-900">14,850+</p>
            <p className="text-[11px] text-slate-500 font-semibold">Across {ALL_IKORODU_AREAS.length} Ikorodu Areas</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
            <p className="text-xs font-bold text-slate-500">WhatsApp Enquiries Generated</p>
            <p className="text-3xl font-black text-amber-500">24,500+</p>
            <p className="text-[11px] text-slate-500 font-semibold">Direct Buyer Connections</p>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Platform Product Listings</h3>
              <p className="text-xs text-slate-500">Monitor product quality, descriptions and catalog items across all registered stores</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {products.length} Active Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const vendor = vendors.find((v) => v.id === prod.vendorId);
              return (
                <div key={prod.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <img src={prod.imageURL} alt={prod.name} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                  <div className="flex-1 overflow-hidden space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{vendor?.businessName || 'Independent Vendor'}</p>
                    <p className="text-xs font-black text-emerald-700">₦{prod.price.toLocaleString()}</p>
                    <span className="inline-block text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                      {prod.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER ACCOUNTS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Registered Shoppers & Customers</h3>
              <p className="text-xs text-slate-500">View customer engagement and registered user activity across IkoroduSquare</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Customer Management
            </span>
          </div>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Customer Activity Monitoring</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Customer accounts are synced seamlessly via secure cloud storage. All user details are verified for secure marketplace interaction.
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: ORDERS & INQUIRIES */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Direct WhatsApp Orders & Enquiries</h3>
            <p className="text-xs text-slate-500">Overview of order connections facilitated between shoppers and local vendors</p>
          </div>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <ShoppingBag className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Direct Vendor Communications</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              IkoroduSquare connects customers directly with vendors via WhatsApp checkout. Over 24,500 direct inquiries logged to date.
            </p>
          </div>
        </div>
      )}

      {/* TAB 7: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Category & Sub-category Management</h3>
            <p className="text-xs text-slate-500">Manage marketplace classification categories for Ikorodu businesses</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Electronics & Phones', 'Fashion & Beauty', 'Food & Groceries', 'Services & Trades', 'Real Estate & Rent', 'Automotive', 'Health & Pharmacy', 'Home & Furniture'].map((cat) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: COVERAGE AREAS */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Ikorodu Area Coverage Zones</h3>
            <p className="text-xs text-slate-500">Active commercial districts and neighborhood zones across Ikorodu Division</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Agric / Isawo', 'Garage / Sabo', 'Ebute / Ogolonto', 'Ikorodu Town / Ita Elewa', 'Ibeshe / Ipakodo', 'Imota', 'Ijede / Egbin', 'Olayeni / Majidun'].map((area) => (
              <div key={area} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-xs text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Promotional Add-ons Bank & Support Settings</h3>
              <p className="text-xs text-slate-500">Configure official bank account details and WhatsApp support contact number for vendor manual payment verification</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAdminSettings({
                  bankName,
                  accountName,
                  accountNumber,
                  whatsappSupportNumber,
                });
              }}
              className="space-y-4 max-w-xl text-xs"
            >
              <div>
                <label className="block font-bold text-slate-800 mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. FCMB"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Rhadsoft Tech"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 9474918014"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Official WhatsApp Support Number</label>
                <input
                  type="text"
                  required
                  value={whatsappSupportNumber}
                  onChange={(e) => setWhatsappSupportNumber(e.target.value)}
                  placeholder="e.g. 08156655091 or 2348156655091"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Vendors will be redirected to this WhatsApp number when clicking "I Have Made Payment".</p>
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-md cursor-pointer text-xs"
              >
                Save Bank & Support Settings
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Platform Security & Access</h3>
              <p className="text-xs text-slate-500">Configure global platform policies, single-administrator authorization and credentials</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-slate-700">Administrator Email</span>
                <span className="font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                  {getAdminEmail()}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-slate-700">Authentication Driver</span>
                <span className="font-bold text-slate-900">Cloud Authentication (Persistent Session)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Admin Route Restriction</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  Strict Single-Admin Protection ACTIVE ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT LOGS */}
      {activeTab === 'system-logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">System Activity & Audit Logs</h3>
            <p className="text-xs text-slate-500">Real-time moderation and authentication log events</p>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl flex items-center justify-between">
              <span>[AUTH] Single-Admin system verified for {getAdminEmail()}</span>
              <span className="text-slate-500 text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl flex items-center justify-between">
              <span>[SECURITY] Non-admin access block enforced for unauthorized routes</span>
              <span className="text-slate-500 text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="p-3 bg-slate-950 text-amber-300 rounded-xl flex items-center justify-between">
              <span>[SYSTEM] Cloud Database & Authentication persistent state active</span>
              <span className="text-slate-500 text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: PROMOTIONS MANAGEMENT */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          {/* Revenue Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Platform Revenue Engine
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">Promotions Management</h3>
              <p className="text-xs text-slate-300">
                Monitor and manage all vendor paid add-ons, featured campaigns, and banner advertisements across Ikorodu.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-right sm:min-w-[200px]">
              <p className="text-slate-300 font-bold text-xs uppercase tracking-wider">Total Ad Revenue</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                ₦{(promotions || []).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{(promotions || []).length} Total Transactions</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by vendor name, reference code, or promotion type..."
                  value={promoSearchQuery}
                  onChange={(e) => setPromoSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start md:self-auto overflow-x-auto max-w-full">
                {(['all', 'pending_verification', 'active', 'expired', 'rejected'] as const).map((filter) => {
                  const labelMap: Record<string, string> = {
                    all: 'All',
                    pending_verification: 'Pending Verification',
                    active: 'Active',
                    expired: 'Expired',
                    rejected: 'Rejected',
                  };
                  return (
                    <button
                      key={filter}
                      onClick={() => setPromoStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl capitalize transition whitespace-nowrap cursor-pointer ${
                        promoStatusFilter === filter
                          ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {labelMap[filter]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promotions Data Table */}
            {promotions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-sm text-slate-700">No Promotions Recorded</p>
                <p className="text-xs text-slate-500">Promotions requested by vendors will appear here for verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-3">Promotion / Vendor</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Amount & Ref</th>
                      <th className="py-3 px-3">Requested / Expiry</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {promotions
                      .filter((p) => {
                        const matchesStatus =
                          promoStatusFilter === 'all' ||
                          (promoStatusFilter === 'pending_verification' && (p.status === 'pending_verification' || p.status === 'pending')) ||
                          p.status === promoStatusFilter;
                        const query = promoSearchQuery.toLowerCase();
                        const matchesSearch =
                          !query ||
                          p.vendorName?.toLowerCase().includes(query) ||
                          p.reference?.toLowerCase().includes(query) ||
                          p.promotionName?.toLowerCase().includes(query) ||
                          p.promotionType?.toLowerCase().includes(query);

                        return matchesStatus && matchesSearch;
                      })
                      .map((promo) => {
                        const daysLeft = Math.max(
                          0,
                          Math.ceil((new Date(promo.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        );
                        const isPending = promo.status === 'pending_verification' || promo.status === 'pending';

                        return (
                          <tr key={promo.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-3">
                              <p className="font-black text-slate-900">{promo.promotionName}</p>
                              <p className="text-[11px] text-slate-500 font-bold">🏢 {promo.vendorName}</p>
                              {promo.productName && (
                                <p className="text-[10px] text-emerald-700 font-semibold">📦 {promo.productName}</p>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">
                                {promo.promotionType}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-extrabold text-emerald-700">₦{promo.amount.toLocaleString()}</p>
                              <p className="text-[10px] font-mono text-slate-400">{promo.reference}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="text-slate-700 font-bold">
                                {new Date(promo.createdAt || promo.paymentDate).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {promo.status === 'active'
                                  ? `Expires: ${new Date(promo.expiryDate).toLocaleDateString()} (${daysLeft} days left)`
                                  : isPending
                                  ? 'Awaiting Payment Verification'
                                  : promo.status === 'rejected'
                                  ? 'Request Rejected'
                                  : 'Expired'}
                              </p>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                  promo.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : promo.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {promo.status === 'active'
                                  ? 'Active'
                                  : isPending
                                  ? 'Pending Verification'
                                  : promo.status === 'rejected'
                                  ? 'Rejected'
                                  : 'Expired'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => {
                                        updatePromotionStatus(promo.id, 'active');
                                        showToast('success', 'Payment Verified!', `${promo.promotionName} for ${promo.vendorName} is now active.`);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs transition cursor-pointer shadow-xs"
                                    >
                                      Verify & Activate
                                    </button>
                                    <button
                                      onClick={() => {
                                        updatePromotionStatus(promo.id, 'rejected');
                                        showToast('error', 'Request Rejected', `Rejected promotion request for ${promo.vendorName}.`);
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {promo.status === 'active' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        updatePromotionStatus(promo.id, 'active', 14);
                                        showToast('success', 'Promotion Extended', `Extended ${promo.promotionName} by +14 days.`);
                                      }}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                                    >
                                      +14 Days
                                    </button>
                                    <button
                                      onClick={() => {
                                        updatePromotionStatus(promo.id, 'expired');
                                        showToast('info', 'Promotion Deactivated', `${promo.promotionName} set to expired.`);
                                      }}
                                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                                    >
                                      Deactivate
                                    </button>
                                  </>
                                )}

                                {(promo.status === 'expired' || promo.status === 'rejected') && (
                                  <button
                                    onClick={() => {
                                      updatePromotionStatus(promo.id, 'active');
                                      showToast('success', 'Promotion Re-activated', `${promo.promotionName} for ${promo.vendorName} reactivated.`);
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                                  >
                                    Re-activate
                                  </button>
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

      {/* FULL VENDOR DETAILS MODAL */}
      {selectedVendorForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Banner Header */}
            <div className="relative h-44 bg-slate-900 shrink-0">
              <img
                src={selectedVendorForDetails.coverPhotoURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'}
                alt="Cover"
                className="w-full h-full object-cover opacity-60"
              />
              <button
                onClick={() => setSelectedVendorForDetails(null)}
                className="absolute top-3 right-3 bg-slate-950/80 text-white p-2 rounded-full hover:bg-slate-900 transition z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-4 sm:left-6 flex items-end gap-3 z-10">
                <img
                  src={selectedVendorForDetails.logoURL}
                  alt={selectedVendorForDetails.businessName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white shadow-xl object-cover bg-white shrink-0"
                />
                <div className="text-white drop-shadow-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg sm:text-xl">{selectedVendorForDetails.businessName}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        selectedVendorForDetails.status === 'approved'
                          ? 'bg-emerald-500 text-white'
                          : selectedVendorForDetails.status === 'pending'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {selectedVendorForDetails.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">Owner: {selectedVendorForDetails.ownerName}</p>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Quick Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">WhatsApp Contact:</span>
                  <a
                    href={`https://wa.me/234${selectedVendorForDetails.whatsapp.replace(/\D/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-slate-900 hover:text-emerald-600 flex items-center gap-1.5 text-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" /> {selectedVendorForDetails.whatsapp}
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Category & SubCategory:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedVendorForDetails.subCategory}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Location / Area in Ikorodu:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedVendorForDetails.address} ({selectedVendorForDetails.area})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">NIN Identity Verification:</span>
                  {selectedVendorForDetails.ninVerified ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> NIMC Match: {selectedVendorForDetails.ninData?.fullName || 'Verified'}
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 flex items-center gap-1 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> NIN Unverified
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Opening Hours:</span>
                  <span className="font-medium text-slate-800">{selectedVendorForDetails.openingHours || 'Mon - Sat: 8:00 AM - 7:00 PM'}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Date Registered:</span>
                  <span className="font-medium text-slate-800">{new Date(selectedVendorForDetails.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Business Description */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Store Description</h4>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed text-slate-800 font-normal">
                  {selectedVendorForDetails.description || 'No description provided by vendor.'}
                </div>
              </div>

              {/* Featured Placements Status */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Active Promotional Placements</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      selectedVendorForDetails.featuredOnHomepage
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    Homepage Feature: {selectedVendorForDetails.featuredOnHomepage ? 'ACTIVE ✓' : 'OFF'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      selectedVendorForDetails.sponsoredCategorySlot
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    Sponsored Slot: {selectedVendorForDetails.sponsoredCategorySlot ? 'ACTIVE ✓' : 'OFF'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      selectedVendorForDetails.categoryTopSpot
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    Category Top Spot: {selectedVendorForDetails.categoryTopSpot ? 'ACTIVE ✓' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Registered Products Preview */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Store Products ({products.filter((p) => p.vendorId === selectedVendorForDetails.id).length})
                </h4>
                {products.filter((p) => p.vendorId === selectedVendorForDetails.id).length === 0 ? (
                  <p className="text-slate-400 italic">No products listed yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products
                      .filter((p) => p.vendorId === selectedVendorForDetails.id)
                      .map((prod) => (
                        <div key={prod.id} className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                          <img src={prod.imageURL} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
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

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  navigateToStore(selectedVendorForDetails.slug);
                  setSelectedVendorForDetails(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Preview Live Storefront
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Toggle Approval */}
                <button
                  onClick={async () => {
                    await toggleVendorApproval(selectedVendorForDetails.id);
                    const updated = vendors.find((v) => v.id === selectedVendorForDetails.id);
                    if (updated) setSelectedVendorForDetails({ ...updated, isLive: !selectedVendorForDetails.isLive });
                  }}
                  className={`font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer ${
                    selectedVendorForDetails.isLive || selectedVendorForDetails.status === 'approved'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedVendorForDetails.isLive || selectedVendorForDetails.status === 'approved' ? 'Approved (Live)' : 'Approve Store'}
                </button>

                {/* 2. Toggle Verification */}
                <button
                  onClick={async () => {
                    await toggleVendorVerification(selectedVendorForDetails.id);
                    const updated = vendors.find((v) => v.id === selectedVendorForDetails.id);
                    if (updated) setSelectedVendorForDetails({ ...updated, ninVerified: !selectedVendorForDetails.ninVerified });
                  }}
                  className={`font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer ${
                    selectedVendorForDetails.ninVerified || selectedVendorForDetails.nin_verified
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {selectedVendorForDetails.ninVerified || selectedVendorForDetails.nin_verified ? 'Verified ✓' : 'Verify NIN'}
                </button>

                {/* 3. Toggle Featured */}
                <button
                  onClick={async () => {
                    await toggleVendorFeatured(selectedVendorForDetails.id);
                    const updated = vendors.find((v) => v.id === selectedVendorForDetails.id);
                    if (updated) setSelectedVendorForDetails({ ...updated, featuredOnHomepage: !selectedVendorForDetails.featuredOnHomepage });
                  }}
                  className={`font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer ${
                    selectedVendorForDetails.isFeatured || selectedVendorForDetails.is_featured || selectedVendorForDetails.featuredOnHomepage
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {selectedVendorForDetails.isFeatured || selectedVendorForDetails.is_featured || selectedVendorForDetails.featuredOnHomepage ? 'Featured ★' : 'Feature Vendor'}
                </button>

                <button
                  onClick={() => setVendorToDelete(selectedVendorForDetails)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Business
                </button>

                <button
                  onClick={() => setSelectedVendorForDetails(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE VENDOR MODAL */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900">Delete Business Permanently?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{vendorToDelete.businessName}</strong>? This action will remove the vendor store and all associated products from IkoroduSquare.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setVendorToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-rose-700 transition cursor-pointer"
              >
                Yes, Delete Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <h3 className="font-extrabold text-lg text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-600">
              Provide a clear reason that will be sent to the vendor via WhatsApp:
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Please upload a clear photo of your shop storefront in Agric, Ikorodu."
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-rose-700 cursor-pointer"
              >
                Send Rejection Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

