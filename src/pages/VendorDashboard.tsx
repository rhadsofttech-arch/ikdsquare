import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ApiService } from '../services/api';
import { ProductModal } from '../components/ProductModal';
import { PromotionCheckoutModal } from '../components/PromotionCheckoutModal';
import { DashboardSkeleton } from '../components/Skeletons';
import { Product, Enquiry, Vendor, Promotion, PromotionPackageInfo } from '../types';
import { IKORODU_ZONES, ALL_IKORODU_AREAS, CATEGORY_GROUPS, PROMOTION_PACKAGES } from '../data/ikoroduData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard,
  Store,
  Package,
  MessageSquare,
  Star,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Eye,
  PhoneCall,
  X,
  MapPin,
  Check,
  Camera,
  Upload,
  CreditCard,
  RefreshCw,
  User,
  Building,
  FileText,
  Globe,
  Save,
  Image as ImageIcon,
  Instagram,
  Phone,
  ShoppingBag,
  Activity,
  Send,
  Search,
  Filter,
  MessageCircle,
  CornerDownRight,
  Reply,
} from 'lucide-react';

const PRESET_LOGOS = [
  { label: 'Fashion Boutique', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop' },
  { label: 'Tech & Repairs', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop' },
  { label: 'Food & Restaurant', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop' },
  { label: 'Beauty & Salon', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop' },
  { label: 'Hardware & Solar', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&auto=format&fit=crop' },
];

const PRESET_COVERS = [
  { label: 'Boutique Storefront', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop' },
  { label: 'Electronics Workshop', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&auto=format&fit=crop' },
  { label: 'Restaurant & Dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop' },
  { label: 'Beauty Salon Studio', url: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1200&auto=format&fit=crop' },
  { label: 'Supermarket & Retail', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&auto=format&fit=crop' },
];

export const VendorDashboard: React.FC = () => {
  const {
    activeVendor,
    currentUser,
    setCurrentUser,
    setCurrentPage,
    navigateToStore,
    refreshData,
    showToast,
    products,
    reviews,
    enquiries,
    promotions,
    adminSettings,
    isLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'enquiries' | 'reviews' | 'nin' | 'analytics' | 'settings' | 'promotions'
  >('dashboard');

  const [selectedPromoPackage, setSelectedPromoPackage] = useState<PromotionPackageInfo | null>(null);
  const [promoTabFilter, setPromoTabFilter] = useState<'all' | 'pending_verification' | 'active' | 'expired' | 'rejected'>('all');

  // Enquiries & Chat State
  const [replyingEnquiryId, setReplyingEnquiryId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [enquiryFilter, setEnquiryFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [enquirySearch, setEnquirySearch] = useState('');

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // NIN Modal State
  const [showNinModal, setShowNinModal] = useState(false);
  const [ninInput, setNinInput] = useState('');
  const [ninLoading, setNinLoading] = useState(false);
  const [ninResult, setNinResult] = useState<{
    success: boolean;
    message: string;
    data?: { fullName: string; dob: string };
  } | null>(null);

  // Profile Edit Form State
  const [formBusinessName, setFormBusinessName] = useState(activeVendor?.businessName || '');
  const [formOwnerName, setFormOwnerName] = useState(activeVendor?.ownerName || '');
  const [formWhatsapp, setFormWhatsapp] = useState(activeVendor?.whatsapp || '');
  const [formPhone, setFormPhone] = useState(activeVendor?.phone || activeVendor?.whatsapp || '');
  const [formCategory, setFormCategory] = useState(activeVendor?.category || 'Lifestyle');
  const [formSubCategory, setFormSubCategory] = useState(activeVendor?.subCategory || 'Fashion and Tailoring');
  const [formArea, setFormArea] = useState(activeVendor?.area || 'Ikorodu Central');
  const [formZone, setFormZone] = useState(activeVendor?.zone || 'Ikorodu Central zone');
  const [formAddress, setFormAddress] = useState(activeVendor?.address || '');
  const [formDescription, setFormDescription] = useState(activeVendor?.description || '');
  const [formLogoURL, setFormLogoURL] = useState(activeVendor?.logoURL || '');
  const [formCoverURL, setFormCoverURL] = useState(activeVendor?.coverPhotoURL || '');
  const [formOpeningHours, setFormOpeningHours] = useState(activeVendor?.openingHours || 'Mon - Sat: 8:00 AM - 7:00 PM');
  const [formInstagram, setFormInstagram] = useState(activeVendor?.instagram || '');



  useEffect(() => {
    if (activeVendor) {
      setFormBusinessName(activeVendor.businessName || '');
      setFormOwnerName(activeVendor.ownerName || '');
      setFormWhatsapp(activeVendor.whatsapp || '');
      setFormPhone(activeVendor.phone || activeVendor.whatsapp || '');
      setFormCategory(activeVendor.category || 'Lifestyle');
      setFormSubCategory(activeVendor.subCategory || 'Fashion and Tailoring');
      setFormArea(activeVendor.area || 'Ikorodu Central');
      setFormZone(activeVendor.zone || 'Ikorodu Central zone');
      setFormAddress(activeVendor.address || '');
      setFormDescription(activeVendor.description || '');
      setFormLogoURL(activeVendor.logoURL || '');
      setFormCoverURL(activeVendor.coverPhotoURL || '');
      setFormOpeningHours(activeVendor.openingHours || 'Mon - Sat: 8:00 AM - 7:00 PM');
      setFormInstagram(activeVendor.instagram || '');
    }
  }, [activeVendor]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const myPromotions = promotions.filter((p) => p.vendorId === activeVendor?.id);
  const myActivePromotions = myPromotions.filter((p) => p.status === 'active');
  const myPendingPromotions = myPromotions.filter((p) => p.status === 'pending_verification' || p.status === 'pending');
  const myExpiredPromotions = myPromotions.filter((p) => p.status === 'expired');
  const myRejectedPromotions = myPromotions.filter((p) => p.status === 'rejected');

  const getDaysRemaining = (expiryDateStr: string) => {
    const diffMs = new Date(expiryDateStr).getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Please select an image smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormLogoURL(event.target.result as string);
          showToast('success', 'Profile Picture Loaded!', 'Click "Save Profile Changes" below to apply.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Please select an image smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormCoverURL(event.target.result as string);
          showToast('success', 'Cover Photo Loaded!', 'Click "Save Profile Changes" below to apply.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor) return;

    if (!formBusinessName.trim() || !formOwnerName.trim() || !formAddress.trim() || !formWhatsapp.trim()) {
      showToast('error', 'Missing Required Fields', 'Please provide Business Name, Owner Name, Address, and WhatsApp number.');
      return;
    }

    const newSlug = formBusinessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const updatedVendor: Vendor = {
      ...activeVendor,
      businessName: formBusinessName,
      ownerName: formOwnerName,
      whatsapp: formWhatsapp,
      phone: formPhone || formWhatsapp,
      category: formCategory,
      subCategory: formSubCategory,
      area: formArea,
      zone: formZone,
      address: formAddress,
      description: formDescription,
      logoURL: formLogoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
      coverPhotoURL: formCoverURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop',
      openingHours: formOpeningHours,
      instagram: formInstagram,
      slug: newSlug || activeVendor.slug,
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();
    showToast('success', 'Store Profile Updated!', 'Your business profile, pictures, address and description have been updated.');
  };

  // Get vendor specific data
  const myProducts = useMemo(() => activeVendor ? products.filter((p) => p.vendorId === activeVendor.id) : [], [products, activeVendor]);
  const myReviews = useMemo(() => activeVendor ? reviews.filter((r) => r.vendorId === activeVendor.id) : [], [reviews, activeVendor]);
  const myEnquiries = useMemo(() => activeVendor ? StorageManager.getEnquiries(activeVendor.id) : [], [activeVendor, products]);
  const unreadEnquiries = useMemo(() => myEnquiries.filter((e) => !e.read).length, [myEnquiries]);

  // Filtered enquiries for tab
  const filteredEnquiries = useMemo(() => {
    return myEnquiries.filter((enq) => {
      if (enquiryFilter === 'unread' && enq.read) return false;
      if (enquiryFilter === 'replied' && !enq.replyText) return false;
      if (enquirySearch.trim()) {
        const q = enquirySearch.toLowerCase();
        const matchName = enq.customerName.toLowerCase().includes(q);
        const matchPhone = enq.customerPhone.includes(q);
        const matchMsg = enq.message.toLowerCase().includes(q);
        const matchProduct = enq.productName?.toLowerCase().includes(q);
        return matchName || matchPhone || matchMsg || matchProduct;
      }
      return true;
    });
  }, [myEnquiries, enquiryFilter, enquirySearch]);

  if (!currentUser || currentUser.role !== 'vendor' || !activeVendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-extrabold text-xl text-slate-900">Vendor Account Required</h3>
          <p className="text-xs text-slate-600">Please sign in as a registered vendor to view your store dashboard.</p>
          <button
            onClick={() => setCurrentPage('auth')}
            className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
          >
            Sign In / Register Vendor
          </button>
        </div>
      </div>
    );
  }

  const handleMarkEnquiryRead = (enqId: string) => {
    StorageManager.markEnquiryRead(enqId);
    refreshData();
    showToast('success', 'Marked as Read', 'Enquiry status updated.');
  };

  const handleSendDirectReply = (enq: Enquiry) => {
    const text = replyTextMap[enq.id]?.trim();
    if (!text) {
      showToast('error', 'Empty Reply', 'Please enter a reply message before submitting.');
      return;
    }

    StorageManager.replyEnquiry(enq.id, text);
    refreshData();
    showToast('success', 'Reply Saved!', `Your message to ${enq.customerName} has been recorded.`);
    setReplyTextMap((prev) => ({ ...prev, [enq.id]: '' }));
    setReplyingEnquiryId(null);
  };

  const handleWhatsAppReply = (enq: Enquiry) => {
    const text =
      replyTextMap[enq.id]?.trim() ||
      `Hello ${enq.customerName}, thank you for reaching out to ${activeVendor.businessName} on IkoroduSquare!`;
    const cleanPhone = enq.customerPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;

    StorageManager.replyEnquiry(enq.id, text);
    refreshData();

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
    showToast('success', 'Launching WhatsApp', `Opening chat with ${enq.customerName}...`);
  };

  const handleDeleteEnquiry = (enqId: string) => {
    if (confirm('Are you sure you want to delete this enquiry from your dashboard?')) {
      StorageManager.deleteEnquiry(enqId);
      refreshData();
      showToast('info', 'Enquiry Removed', 'Message deleted from list.');
    }
  };

  // Handle NIMC NIN Verification (PRD MANDATED MECHANIC)
  const handleVerifyNIN = async () => {
    if (ninInput.length !== 11) {
      showToast('error', 'Invalid NIN', 'NIN must be exactly 11 digits.');
      return;
    }

    setNinLoading(true);
    setNinResult(null);

    const res = await ApiService.verifyNIN(ninInput, activeVendor.ownerName);
    setNinLoading(false);
    setNinResult(res);

    if (res.success && res.data) {
      // Update vendor document
      const updated = {
        ...activeVendor,
        ninVerified: true,
        ninData: {
          nin: ninInput,
          fullName: res.data.fullName,
          dob: res.data.dob,
          verifiedAt: new Date().toISOString(),
        },
      };
      StorageManager.updateVendor(updated);
      refreshData();
      showToast('success', 'NIMC Identity Verified!', 'NIN match confirmed with NIMC government database.');
    } else {
      showToast('error', 'NIMC Verification Failed', res.message);
    }
  };

  const handleDeleteProduct = (prodId: string) => {
    if (confirm('Are you sure you want to delete this product listing?')) {
      StorageManager.deleteProduct(prodId);
      refreshData();
      showToast('info', 'Product Deleted', 'Item removed from your store catalogue.');
    }
  };

  const selectedCategoryGroup = CATEGORY_GROUPS.find((cg) => cg.name === formCategory);
  const availableSubcategories = selectedCategoryGroup
    ? selectedCategoryGroup.subcategories
    : CATEGORY_GROUPS[0].subcategories;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white p-5 space-y-6 shrink-0">
        {/* Vendor Header Info */}
        <div className="pb-4 border-b border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
              <img src={activeVendor.logoURL} alt={activeVendor.businessName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm text-white truncate">{activeVendor.businessName}</h3>
              <p className="text-[11px] text-slate-400 truncate">📍 {activeVendor.area}, Ikorodu</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Store Status:</span>
            {activeVendor.isLive ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Store is Live
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                Pending Approval
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'dashboard' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
          </button>

          <button
            onClick={() => navigateToStore(activeVendor.slug)}
            className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 hover:bg-slate-800 text-orange-400"
          >
            <Store className="w-4 h-4" /> View My Live Store <ExternalLink className="w-3 h-3 ml-auto" />
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition ${
              activeTab === 'products' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4" /> Catalogue Products
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
              {myProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition ${
              activeTab === 'enquiries' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" /> WhatsApp Enquiries
            </span>
            {unreadEnquiries > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                {unreadEnquiries}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition ${
              activeTab === 'reviews' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400" /> Customer Reviews
            </span>
            <span className="text-amber-400 font-bold">{activeVendor.rating}★</span>
          </button>

          {/* NIN Verification Menu Item marked as REQUIRED */}
          <button
            onClick={() => setActiveTab('nin')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition ${
              activeTab === 'nin'
                ? 'bg-amber-600 text-white font-bold'
                : activeVendor.ninVerified
                ? 'hover:bg-slate-800 text-slate-300'
                : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> NIN Verification
            </span>
            {activeVendor.ninVerified ? (
              <span className="text-green-400 text-[10px] font-bold">✓ Verified</span>
            ) : (
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                REQUIRED
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'settings' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" /> Edit Store Profile
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition ${
              activeTab === 'analytics' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Store Analytics
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition ${
              activeTab === 'promotions' ? 'bg-orange-600 text-white font-bold' : 'hover:bg-slate-800 text-amber-300'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Promotions & Add-ons
            </span>
            {myActivePromotions.length > 0 && (
              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                {myActivePromotions.length} Active
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentUser(null);
              setCurrentPage('home');
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 hover:bg-rose-950/60 text-rose-400 pt-4 border-t border-slate-800 mt-4"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </nav>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        {/* DYNAMIC SETUP PROGRESS / PENDING VS LIVE BANNER */}
        {!activeVendor.isLive ? (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-6 rounded-3xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  STORE NOT LIVE YET
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">Setup Progress (75% Complete)</h2>
                <p className="text-xs font-medium text-slate-900 mt-0.5">
                  Complete your NIN verification and add at least 1 product to unlock admin approval.
                </p>
              </div>

              <button
                onClick={() => setShowNinModal(true)}
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                {activeVendor.ninVerified ? 'NIN Verified ✓' : 'Verify NIN Now'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950/20 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-950 h-full rounded-full transition-all"
                style={{ width: activeVendor.ninVerified && myProducts.length > 0 ? '90%' : '60%' }}
              ></div>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-slate-950" /> Profile Details Done
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-slate-950" /> WhatsApp Verified
              </div>
              <div className="flex items-center gap-1.5">
                {activeVendor.ninVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-900" />
                )}
                <span>NIN Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-950" /> Admin Review Pending
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  STORE IS LIVE
                </span>
                <span className="text-xs text-emerald-300">Public URL:</span>
              </div>
              <h2 className="text-xl font-extrabold mt-1 text-white flex items-center gap-2">
                ikorodusquare.com.ng/store/{activeVendor.slug}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('settings')}
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 border border-emerald-700/60 shadow-sm"
              >
                <Settings className="w-4 h-4 text-emerald-300" /> Edit Store Profile
              </button>
              <button
                onClick={() => navigateToStore(activeVendor.slug)}
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 shadow-md"
              >
                <Store className="w-4 h-4 text-emerald-600" /> Open Online Shop
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* FEATURED SUMMARY CARDS: TOTAL VIEWS, ORDERS RECEIVED, RECENT ACTIVITY */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Store Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* SUMMARY CARD 1: TOTAL VIEWS */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Total Views</span>
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-slate-900">
                        {(activeVendor.analytics.profileViews + activeVendor.analytics.productViews).toLocaleString()}
                      </p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +18% this month
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Profile: <strong className="text-slate-800">{activeVendor.analytics.profileViews.toLocaleString()}</strong> • Products: <strong className="text-slate-800">{activeVendor.analytics.productViews.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Hyperlocal Ikorodu Visibility</span>
                    <span className="font-bold text-blue-600">High Traffic</span>
                  </div>
                </div>

                {/* SUMMARY CARD 2: ORDERS RECEIVED */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Orders Received</span>
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-emerald-700">
                        {(activeVendor.analytics.whatsappTaps + myEnquiries.length).toLocaleString()}
                      </p>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {unreadEnquiries > 0 ? `${unreadEnquiries} New` : 'Active Leads'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      WhatsApp Orders: <strong className="text-slate-800">{activeVendor.analytics.whatsappTaps.toLocaleString()}</strong> • Messages: <strong className="text-slate-800">{myEnquiries.length.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Direct WhatsApp & Chat Enquiries</span>
                    <span className="font-bold text-emerald-600">100% Direct</span>
                  </div>
                </div>

                {/* SUMMARY CARD 3: RECENT ACTIVITY */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Recent Activity</span>
                    <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-slate-900">
                        {myEnquiries.length + myReviews.length + myProducts.length}
                      </p>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                        Live Tracker
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {myEnquiries.length > 0
                        ? `Latest message from ${myEnquiries[0].customerName}`
                        : myReviews.length > 0
                        ? `Latest review: ${myReviews[0].rating}★ rating`
                        : `${myProducts.length} active products listed in catalogue`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Interaction History</span>
                    <span className="font-bold text-purple-600">Updated Real-Time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-xs text-slate-500 font-medium">Profile Views</p>
                <p className="text-2xl font-black text-slate-900">
                  {activeVendor.analytics.profileViews.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-xs text-slate-500 font-medium">WhatsApp Taps</p>
                <p className="text-2xl font-black text-emerald-600">
                  {activeVendor.analytics.whatsappTaps.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-xs text-slate-500 font-medium">Catalogue Products</p>
                <p className="text-2xl font-black text-slate-900">{myProducts.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-xs text-slate-500 font-medium">Customer Rating</p>
                <p className="text-2xl font-black text-amber-500">{activeVendor.rating} ★</p>
              </div>
            </div>

            {/* RECENT CUSTOMER ENQUIRIES PREVIEW */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">Recent Customer Messages & Enquiries</h3>
                    {unreadEnquiries > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        {unreadEnquiries} NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Messages sent directly by shoppers interested in your products</p>
                </div>
                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  View All Enquiries ({myEnquiries.length})
                </button>
              </div>

              {myEnquiries.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="font-bold text-xs text-slate-700">No customer messages received yet</p>
                  <p className="text-xs text-slate-500">Messages sent via "Chat with Vendor" on your store page will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myEnquiries.slice(0, 3).map((enq) => (
                    <div
                      key={enq.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 transition ${
                        !enq.read ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">
                          {enq.customerName} ({enq.customerPhone})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 italic">"{enq.message}"</p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {enq.productName ? (
                          <span className="text-orange-700 font-bold">📦 {enq.productName}</span>
                        ) : (
                          <span className="text-slate-400">Store Enquiry</span>
                        )}
                        <button
                          onClick={() => {
                            setActiveTab('enquiries');
                            setReplyingEnquiryId(enq.id);
                          }}
                          className="ml-auto text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" /> Reply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catalogue Quick Action & List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Your Store Catalogue</h3>
                  <p className="text-xs text-slate-500">Manage items displayed to Ikorodu customers</p>
                </div>
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setProductModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {myProducts.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">No products added yet</p>
                  <p className="text-xs text-slate-500">List your products so customers can find and buy from you.</p>
                  <button
                    onClick={() => {
                      setProductToEdit(null);
                      setProductModalOpen(true);
                    }}
                    className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                        <img src={prod.photoURL} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h4>
                        <p className="text-xs font-black text-emerald-700">₦{prod.price.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">{prod.available ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setProductToEdit(prod);
                            setProductModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Manage Catalogue Products</h3>
                <p className="text-xs text-slate-500">Products are immediately indexed in the search results</p>
              </div>
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setProductModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myProducts.map((prod) => (
                <div key={prod.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="h-40 bg-slate-200 relative">
                    <img src={prod.photoURL} alt={prod.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ₦{prod.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-emerald-700 font-bold">
                        {prod.available ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setProductToEdit(prod);
                            setProductModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: NIN VERIFICATION (MANDATED MECHANIC) */}
        {(activeTab === 'nin' || showNinModal) && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">NIMC National Identity Verification</h3>
                <p className="text-xs text-slate-500">Mandatory verification for all physical businesses operating in Ikorodu</p>
              </div>
            </div>

            {activeVendor.ninVerified ? (
              <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>NIMC Identity Verification Confirmed!</span>
                </div>
                <div className="text-xs text-emerald-900 space-y-1">
                  <p>
                    <strong>Verified Name:</strong> {activeVendor.ninData?.fullName || activeVendor.ownerName}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong> {activeVendor.ninData?.dob || '1990-06-18'}
                  </p>
                  <p>
                    <strong>Verified At:</strong> {new Date(activeVendor.ninData?.verifiedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Why is NIN Verification required?</p>
                  <p className="text-amber-800 leading-relaxed">
                    IkoroduSquare guarantees trust for local buyers. Verifying your 11-digit NIN unlocks your verified badge and protects against fraud.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Enter Your 11-Digit NIN Number *</label>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. 12345678901"
                      value={ninInput}
                      onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full pr-36 pl-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold tracking-wider text-slate-900"
                    />

                    {/* As soon as 11 digits are entered, Verify with NIMC button appears attached to right */}
                    {ninInput.length === 11 && (
                      <button
                        onClick={handleVerifyNIN}
                        disabled={ninLoading}
                        className="absolute right-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
                      >
                        {ninLoading ? (
                          <span className="animate-spin text-xs">🌀 Verifying...</span>
                        ) : (
                          'Verify with NIMC'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* NIN Verification Result Box */}
                {ninResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      ninResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <p className="font-bold">{ninResult.message}</p>
                    {ninResult.data && (
                      <div className="pt-2 border-t border-emerald-200 space-y-1">
                        <p>
                          <strong>NIMC Match Name:</strong> {ninResult.data.fullName}
                        </p>
                        <p>
                          <strong>NIMC DOB:</strong> {ninResult.data.dob}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: ANALYTICS (UNLOCKED OR BLURRED ACCORDING TO APPROVAL) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">Store Analytics</h3>
                <p className="text-xs text-slate-500">Track customer traffic, WhatsApp leads, and product clicks</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-xs relative overflow-hidden">
              {!activeVendor.isLive && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                  <Lock className="w-10 h-10 text-amber-400" />
                  <h4 className="font-extrabold text-lg">Detailed Analytics Locked</h4>
                  <p className="text-xs text-slate-300 max-w-sm">
                    Complete your NIN verification and await admin store approval to unlock live customer analytics.
                  </p>
                </div>
              )}

              <h4 className="font-bold text-sm text-slate-800">Daily Views & WhatsApp Lead Taps</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeVendor.analytics.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#059669" radius={[6, 6, 0, 0]} name="Profile Views" />
                    <Bar dataKey="taps" fill="#f59e0b" radius={[6, 6, 0, 0]} name="WhatsApp Taps" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">Customer Messages & Enquiries</h3>
                  {unreadEnquiries > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                      {unreadEnquiries} NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct enquiries from Ikorodu buyers seeking products, pricing, and store directions
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search name, phone, message..."
                    value={enquirySearch}
                    onChange={(e) => setEnquirySearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-48 sm:w-56"
                  />
                  {enquirySearch && (
                    <button
                      onClick={() => setEnquirySearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                  <button
                    onClick={() => setEnquiryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      enquiryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    All ({myEnquiries.length})
                  </button>
                  <button
                    onClick={() => setEnquiryFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      enquiryFilter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Unread ({unreadEnquiries})
                  </button>
                  <button
                    onClick={() => setEnquiryFilter('replied')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      enquiryFilter === 'replied' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Replied ({myEnquiries.filter((e) => e.replyText).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Enquiries List */}
            {filteredEnquiries.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-800">No enquiries match your view</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {enquirySearch
                    ? 'No messages found matching your search query. Try clearing the search box.'
                    : 'When buyers tap "Chat with Vendor" on your store profile or catalogue, messages appear here instantly.'}
                </p>
                {enquirySearch && (
                  <button
                    onClick={() => setEnquirySearch('')}
                    className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className={`p-5 rounded-2xl border transition space-y-3 ${
                      !enq.read
                        ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Customer Info & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-orange-400 font-black text-sm flex items-center justify-center shrink-0">
                          {enq.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">{enq.customerName}</span>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {enq.customerPhone}
                            </span>
                            {enq.customerArea && (
                              <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-200">
                                <MapPin className="w-3 h-3 text-emerald-600" /> {enq.customerArea}
                              </span>
                            )}
                          </div>
                          {enq.productName && (
                            <p className="text-xs font-semibold text-orange-700 mt-0.5 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-orange-500" />
                              Product Inquiry: <strong>{enq.productName}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(enq.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {!enq.read ? (
                          <button
                            onClick={() => handleMarkEnquiryRead(enq.id)}
                            className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-black px-2 py-1 rounded-lg transition"
                          >
                            ● New (Mark Read)
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                            Read
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Speech Bubble */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <p className="text-xs text-slate-700 font-medium leading-relaxed italic">"{enq.message}"</p>
                    </div>

                    {/* Recorded Reply Box (if already replied) */}
                    {enq.replyText && (
                      <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-emerald-900 font-extrabold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Your Saved Reply:
                          </span>
                          {enq.repliedAt && (
                            <span className="text-[10px] text-emerald-700 font-normal">
                              {new Date(enq.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-950 font-medium leading-relaxed">{enq.replyText}</p>
                      </div>
                    )}

                    {/* Expanded Reply Box Input */}
                    {replyingEnquiryId === enq.id ? (
                      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 animate-fade-in border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                            <Reply className="w-4 h-4" /> Type Reply to {enq.customerName}
                          </span>
                          <button
                            onClick={() => setReplyingEnquiryId(null)}
                            className="text-slate-400 hover:text-white text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={replyTextMap[enq.id] || ''}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [enq.id]: e.target.value })}
                          placeholder={`Hi ${enq.customerName}, thank you for your enquiry! Yes, we have this available in our store at ${activeVendor.address}...`}
                          className="w-full p-3 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 focus:ring-2 focus:ring-orange-500 outline-none leading-relaxed"
                        />

                        {/* Quick preset chips */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="text-slate-400">Quick Fill:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyTextMap({
                                ...replyTextMap,
                                [enq.id]: `Hello ${enq.customerName}, yes this item is available! You can visit our shop at ${activeVendor.address} today.`,
                              })
                            }
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700"
                          >
                            Available in Shop
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyTextMap({
                                ...replyTextMap,
                                [enq.id]: `Hi ${enq.customerName}, we offer doorstep delivery across ${enq.customerArea || 'Ikorodu'}. What time suits you?`,
                              })
                            }
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700"
                          >
                            Doorstep Delivery
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSendDirectReply(enq)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> Save Dashboard Reply
                          </button>
                          <button
                            onClick={() => handleWhatsAppReply(enq)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp Chat
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Action Toolbar */
                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReplyingEnquiryId(enq.id);
                              if (!replyTextMap[enq.id]) {
                                setReplyTextMap({
                                  ...replyTextMap,
                                  [enq.id]: `Hello ${enq.customerName}, thank you for reaching out to ${activeVendor.businessName}! `,
                                });
                              }
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition text-xs shadow-2xs"
                          >
                            <Reply className="w-3.5 h-3.5 text-orange-400" />
                            {enq.replyText ? 'Edit Reply' : 'Reply Message'}
                          </button>

                          <button
                            onClick={() => handleWhatsAppReply(enq)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition text-xs shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Reply via WhatsApp
                          </button>

                          <a
                            href={`tel:${enq.customerPhone}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl flex items-center gap-1 transition text-xs border border-slate-300"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-600" /> Call
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          {!enq.read && (
                            <button
                              onClick={() => handleMarkEnquiryRead(enq.id)}
                              className="text-slate-500 hover:text-slate-800 font-semibold text-xs py-1 px-2"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            className="text-rose-500 hover:text-rose-700 font-semibold text-xs py-1 px-2 flex items-center gap-1"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-lg text-slate-900">Customer Ratings & Feedback</h3>

            {myReviews.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <Star className="w-10 h-10 text-amber-300 mx-auto" />
                <p className="font-bold text-sm text-slate-700">No reviews yet</p>
                <p className="text-xs text-slate-500">Share your store link with happy customers in Ikorodu to build your rating.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{rev.userName} ({rev.userArea})</span>
                      <span className="text-amber-500 font-bold text-xs">{rev.rating} ★</span>
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: EDIT STORE PROFILE & MEDIA */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-8 shadow-xs max-w-4xl mx-auto">
            {/* Settings Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-2xl text-slate-900">Edit Store Profile & Media</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your business branding, profile picture, cover photo, address, and description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateToStore(activeVendor.slug)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition border border-slate-300 w-fit"
              >
                <Store className="w-4 h-4 text-orange-600" /> Preview Storefront
              </button>
            </div>

            {/* LIVE STORE HEADER PREVIEW CARD */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Profile Header Preview
              </label>
              <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white relative shadow-xs">
                {/* Cover Photo Banner */}
                <div className="h-40 sm:h-52 relative overflow-hidden bg-slate-900">
                  <img
                    src={formCoverURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Online Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-500/40">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                      </span>
                      <span>Online Now</span>
                    </span>
                  </div>
                </div>

                {/* Profile Logo & Vendor Details Below Banner */}
                <div className="p-4 sm:p-5 relative z-10 bg-white border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-10 sm:-mt-12">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-xl border-2 border-white overflow-hidden shrink-0 relative z-20">
                      <img
                        src={formLogoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop'}
                        alt="Logo Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>

                    <div className="space-y-1 pt-1 sm:pt-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-lg sm:text-xl text-slate-900">{formBusinessName || 'Your Business Name'}</h4>
                        {activeVendor.ninVerified && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {/* Single Address Line */}
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{formAddress || 'Physical Address in Ikorodu'}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 pt-0.5 font-medium">
                        Category: {formSubCategory} • {formOpeningHours || 'Mon - Sat: 8:00 AM - 7:00 PM'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* SECTION 1: MEDIA UPLOADS (PROFILE PICTURE & COVER PHOTO) */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Camera className="w-5 h-5 text-orange-600" />
                  <span>Store Branding & Photos</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PROFILE PICTURE / LOGO UPLOAD */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">Profile Picture / Logo</h5>
                        <p className="text-[11px] text-slate-500">PNG or JPG logo image</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                        <img
                          src={formLogoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop'}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>

                    {/* File Upload Button */}
                    <div>
                      <label className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs transition w-full justify-center">
                        <Upload className="w-4 h-4" /> Upload Profile Picture
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* URL input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Or Paste Image URL:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formLogoURL}
                        onChange={(e) => setFormLogoURL(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white text-slate-900"
                      />
                    </div>

                    {/* Sample presets */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Sample Avatars:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_LOGOS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormLogoURL(preset.url)}
                            className="text-[10px] bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* COVER PHOTO UPLOAD */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">Cover Banner Photo</h5>
                        <p className="text-[11px] text-slate-500">Wide storefront banner</p>
                      </div>
                      <div className="w-16 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                        <img
                          src={formCoverURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* File Upload Button */}
                    <div>
                      <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs transition w-full justify-center">
                        <Upload className="w-4 h-4 text-orange-400" /> Upload Cover Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* URL input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Or Paste Cover Image URL:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formCoverURL}
                        onChange={(e) => setFormCoverURL(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white text-slate-900"
                      />
                    </div>

                    {/* Sample presets */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Sample Banners:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COVERS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormCoverURL(preset.url)}
                            className="text-[10px] bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BUSINESS DETAILS */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Building className="w-5 h-5 text-orange-600" />
                  <span>Business Information & Category</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formBusinessName}
                      onChange={(e) => setFormBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Owner / Representative Name *</label>
                    <input
                      type="text"
                      required
                      value={formOwnerName}
                      onChange={(e) => setFormOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Industry Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        const group = CATEGORY_GROUPS.find((cg) => cg.name === e.target.value);
                        if (group && group.subcategories.length > 0) {
                          setFormSubCategory(group.subcategories[0]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-900"
                    >
                      {CATEGORY_GROUPS.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subcategory *</label>
                    <select
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-900"
                    >
                      {availableSubcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: LOCATION & CONTACT INFORMATION */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <span>Ikorodu Address & Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Physical Business Address in Ikorodu *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shop 4, Ita Elewa Market Road, Beside First Bank, Ikorodu"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ikorodu Zone *</label>
                    <select
                      value={formZone}
                      onChange={(e) => {
                        setFormZone(e.target.value);
                        const zoneObj = IKORODU_ZONES.find((z) => z.name === e.target.value);
                        if (zoneObj && zoneObj.areas.length > 0) {
                          setFormArea(zoneObj.areas[0]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-900"
                    >
                      {IKORODU_ZONES.map((zone) => (
                        <option key={zone.name} value={zone.name}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Neighborhood / Area *</label>
                    <select
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-900"
                    >
                      {(IKORODU_ZONES.find((z) => z.name === formZone)?.areas || ALL_IKORODU_AREAS).map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08031234567"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-emerald-700"
                    />
                    <p className="text-[10px] text-slate-500">Customers chat you directly on WhatsApp using this number.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Direct Phone Call Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 08029876543"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Operating Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. Mon - Sat: 8:00 AM - 7:00 PM"
                      value={formOpeningHours}
                      onChange={(e) => setFormOpeningHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Instagram Handle (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. @ikorodu_fashion_hub"
                      value={formInstagram}
                      onChange={(e) => setFormInstagram(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: BUSINESS DESCRIPTION */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span>Business Description & Services</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Store Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your business services, products offered, delivery capabilities in Ikorodu, and commitment to quality..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none leading-relaxed text-slate-900"
                  ></textarea>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-3.5 rounded-xl shadow-md transition text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}
        {/* TAB: PROMOTIONS & ADD-ONS */}
        {activeTab === 'promotions' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 14-Day Automated Ad Engine
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">Promotions & Promotional Add-ons</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Boost your business visibility across Ikorodu. Request featured spots, sponsored vendor cards, or homepage banners. Promotions are activated upon manual payment verification by the team.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs relative z-10">
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 font-semibold">Active Campaigns</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{myActivePromotions.length}</p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 font-semibold">Pending Verification</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{myPendingPromotions.length}</p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 font-semibold">Expired Campaigns</p>
                  <p className="text-xl font-black text-slate-400 mt-1">{myExpiredPromotions.length}</p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 font-semibold">Rejected Requests</p>
                  <p className="text-xl font-black text-rose-400 mt-1">{myRejectedPromotions.length}</p>
                </div>
              </div>
            </div>

            {/* Available Promotion Packages */}
            <div className="space-y-4">
              <h4 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Select Promotion Package
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {PROMOTION_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.type}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                        2 Weeks Campaign
                      </span>
                      <h5 className="font-extrabold text-sm text-slate-900 mt-1">{pkg.name}</h5>
                      <p className="text-emerald-700 font-black text-lg">₦{pkg.price.toLocaleString()}</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{pkg.description}</p>
                    </div>

                    <button
                      onClick={() => setSelectedPromoPackage(pkg)}
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-extrabold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {pkg.buttonLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion History Table & Status Filter */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-base text-slate-900">My Promotion Requests & History</h4>
                  <p className="text-xs text-slate-500">Track campaign verification statuses, expiry dates, and renew promotions.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
                  {(['all', 'pending_verification', 'active', 'expired', 'rejected'] as const).map((filter) => {
                    const labelMap: Record<string, string> = {
                      all: 'All',
                      pending_verification: 'Pending',
                      active: 'Active',
                      expired: 'Expired',
                      rejected: 'Rejected',
                    };
                    return (
                      <button
                        key={filter}
                        onClick={() => setPromoTabFilter(filter as any)}
                        className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                          promoTabFilter === filter
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

              {/* Items List */}
              {myPromotions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">No Promotions Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't requested any promotional add-ons yet. Select a package above to feature your store or products on the homepage.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPromotions
                    .filter((p) => {
                      if (promoTabFilter === 'all') return true;
                      if (promoTabFilter === 'pending_verification') return p.status === 'pending_verification' || p.status === 'pending';
                      return p.status === promoTabFilter;
                    })
                    .map((promo) => {
                      const daysLeft = getDaysRemaining(promo.expiryDate);
                      const matchingPkg = PROMOTION_PACKAGES.find((pkg) => pkg.type === promo.promotionType);
                      const isPending = promo.status === 'pending_verification' || promo.status === 'pending';

                      return (
                        <div
                          key={promo.id}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{promo.promotionName}</span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
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
                                  ? `Active • ${daysLeft} Days Left`
                                  : isPending
                                  ? 'Pending Verification'
                                  : promo.status === 'rejected'
                                  ? 'Rejected'
                                  : 'Expired'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Ref: <strong className="text-slate-700">{promo.reference}</strong></span>
                              <span>Amount: <strong className="text-emerald-700">₦{promo.amount.toLocaleString()}</strong></span>
                              {promo.productName && <span>Product: <strong className="text-slate-700">{promo.productName}</strong></span>}
                            </p>

                            <p className="text-[11px] text-slate-400">
                              Requested: {new Date(promo.createdAt || promo.paymentDate).toLocaleDateString()}
                              {promo.status === 'active' && ` • Expires: ${new Date(promo.expiryDate).toLocaleDateString()}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => {
                                  const cleanNum = (adminSettings?.whatsappSupportNumber || '08156655091').replace(/\D/g, '').replace(/^0/, '234');
                                  const msg = `Hello IkoroduSquare,\n\nI have made payment for a promotional package.\n\nBusiness Name:\n${promo.vendorName}\n\nPromotion Package:\n${promo.promotionName}\n\nAmount Paid:\n₦${promo.amount.toLocaleString()}\n\nPayment Reference:\n${promo.reference}\n\nKindly verify my payment and activate my promotion.\n\nThank you.`;
                                  window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                Notify Support on WhatsApp
                              </button>
                            )}
                            {(!isPending || promo.status === 'expired' || promo.status === 'rejected') && (
                              <button
                                onClick={() => {
                                  if (matchingPkg) {
                                    setSelectedPromoPackage(matchingPkg);
                                  } else {
                                    setSelectedPromoPackage(PROMOTION_PACKAGES[0]);
                                  }
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Request Again
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Render Product Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Promotion Checkout Modal */}
      <PromotionCheckoutModal
        isOpen={!!selectedPromoPackage}
        onClose={() => setSelectedPromoPackage(null)}
        packageInfo={selectedPromoPackage}
        initialVendor={activeVendor}
      />
    </div>
  );
};
