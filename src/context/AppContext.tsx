import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vendor, Product, Review, Enquiry, BannerAd, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { StorageManager, rowToVendor } from '../data/mockStorage';
import { ApiService } from '../services/api';
import { supabase } from '../services/supabase';
import { Language, TRANSLATIONS } from '../data/translations';
import { isAdminEmail } from '../lib/admin';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeVendorSlug: string | null;
  setActiveVendorSlug: (slug: string | null) => void;
  navigateToStore: (slug: string) => void;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeVendor: Vendor | null;
  
  vendors: Vendor[];
  products: Product[];
  reviews: Review[];
  enquiries: Enquiry[];
  banners: BannerAd[];
  favorites: string[];
  promotions: Promotion[];
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: AdminSettings) => void;

  // Loading state for Firestore & initial sync
  isLoading: boolean;

  // Search & Filter State
  searchType: 'business' | 'product';
  setSearchType: (type: 'business' | 'product') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;

  // Actions
  refreshData: () => void;
  toggleFavorite: (vendorId: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;

  // Promotion Actions
  createPromotionRequest: (promo: Promotion) => Promise<void>;
  activatePromotion: (promo: Promotion) => Promise<void>;
  updatePromotionStatus: (id: string, newStatus: PromotionStatus, extendDays?: number) => Promise<void>;

  // Admin Actions
  approveVendor: (vendorId: string) => Promise<void>;
  unapproveVendor: (vendorId: string) => Promise<void>;
  toggleVendorApproval: (vendorId: string) => Promise<void>;
  toggleVendorVerification: (vendorId: string) => Promise<void>;
  toggleVendorFeatured: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string, reason: string) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;

  // Store Setup Modal State
  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;

  // Admin Mode Toggle for quick testing
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;

  // Language Translation State
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialPageAndSlug = () => {
    if (typeof window === 'undefined') return { page: 'home', slug: null, adminMode: false };

    // 1. Check Query Params (?store=slug or ?vendor=slug or ?shop=slug)
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const storeQuery = searchParams.get('store') || searchParams.get('vendor') || searchParams.get('shop');
      if (storeQuery) {
        return { page: 'store', slug: decodeURIComponent(storeQuery.trim()), adminMode: false };
      }
      const pageQuery = searchParams.get('page');
      if (pageQuery) {
        const p = pageQuery.toLowerCase();
        if (p === 'admin' || p.startsWith('admin/')) return { page: 'admin', slug: null, adminMode: true };
        if (p === 'dashboard' || p === 'vendor-dashboard') return { page: 'dashboard', slug: null, adminMode: false };
        if (p === 'profile' || p === 'user-profile') return { page: 'profile', slug: null, adminMode: false };
        if (p === 'auth' || p === 'login') return { page: 'auth', slug: null, adminMode: false };
        if (p === 'forgot-password' || p === 'forgot') return { page: 'forgot-password', slug: null, adminMode: false };
        if (p === 'reset-password' || p === 'reset') return { page: 'reset-password', slug: null, adminMode: false };
      }
    }

    // 2. Check Hash (#/admin, #/store/slug, #/vendor/slug, #/dashboard, etc.)
    if (window.location.hash && window.location.hash.startsWith('#')) {
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      const hashLower = rawHash.toLowerCase();
      if (hashLower === 'admin' || hashLower.startsWith('admin/')) {
        return { page: 'admin', slug: null, adminMode: true };
      }
      if (hashLower.startsWith('store/')) {
        const slug = decodeURIComponent(rawHash.substring(6).trim());
        return { page: 'store', slug: slug || null, adminMode: false };
      }
      if (hashLower.startsWith('vendor/')) {
        const slug = decodeURIComponent(rawHash.substring(7).trim());
        return { page: 'store', slug: slug || null, adminMode: false };
      }
      if (hashLower.startsWith('shop/')) {
        const slug = decodeURIComponent(rawHash.substring(5).trim());
        return { page: 'store', slug: slug || null, adminMode: false };
      }
      if (hashLower === 'auth' || hashLower === 'login') {
        return { page: 'auth', slug: null, adminMode: false };
      }
      if (hashLower === 'forgot-password' || hashLower === 'forgot') {
        return { page: 'forgot-password', slug: null, adminMode: false };
      }
      if (hashLower === 'reset-password' || hashLower === 'reset' || hashLower.includes('access_token')) {
        return { page: 'reset-password', slug: null, adminMode: false };
      }
      if (hashLower === 'dashboard' || hashLower === 'vendor-dashboard') {
        return { page: 'dashboard', slug: null, adminMode: false };
      }
      if (hashLower === 'profile' || hashLower === 'user-profile') {
        return { page: 'profile', slug: null, adminMode: false };
      }
      if (hashLower === 'home' || hashLower === '') {
        return { page: 'home', slug: null, adminMode: false };
      }
    }

    // 3. Check Pathname (/admin, /admin/..., /store/slug, /vendor/slug, etc.)
    const path = window.location.pathname;
    const pathLower = path.toLowerCase();
    if (pathLower === '/admin' || pathLower === '/admin/' || pathLower.startsWith('/admin/')) {
      return { page: 'admin', slug: null, adminMode: true };
    }
    if (pathLower.startsWith('/store/')) {
      const slug = decodeURIComponent(path.substring(7).trim().replace(/\/$/, ''));
      return { page: 'store', slug: slug || null, adminMode: false };
    }
    if (pathLower.startsWith('/vendor/')) {
      const slug = decodeURIComponent(path.substring(8).trim().replace(/\/$/, ''));
      return { page: 'store', slug: slug || null, adminMode: false };
    }
    if (pathLower.startsWith('/shop/')) {
      const slug = decodeURIComponent(path.substring(6).trim().replace(/\/$/, ''));
      return { page: 'store', slug: slug || null, adminMode: false };
    }
    if (pathLower === '/auth' || pathLower === '/login') {
      return { page: 'auth', slug: null, adminMode: false };
    }
    if (pathLower === '/dashboard' || pathLower === '/vendor-dashboard') {
      return { page: 'dashboard', slug: null, adminMode: false };
    }
    if (pathLower === '/profile' || pathLower === '/user-profile') {
      return { page: 'profile', slug: null, adminMode: false };
    }

    // 4. Fallback to localStorage saved page state
    try {
      const savedPage = localStorage.getItem('ikorodusquare_last_page');
      const savedSlug = localStorage.getItem('ikorodusquare_last_slug');
      if (savedPage) {
        if (savedPage === 'admin') return { page: 'admin', slug: null, adminMode: true };
        if (savedPage === 'store' && savedSlug) return { page: 'store', slug: savedSlug, adminMode: false };
        if (['auth', 'dashboard', 'profile', 'home'].includes(savedPage)) {
          return { page: savedPage, slug: null, adminMode: false };
        }
      }
    } catch (e) {
      console.error('Failed to read saved page from localStorage', e);
    }

    return { page: 'home', slug: null, adminMode: false };
  };

  const updateUrlAndStorage = (page: string, slug: string | null = null) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('ikorodusquare_last_page', page);
      if (slug) {
        localStorage.setItem('ikorodusquare_last_slug', slug);
      } else {
        localStorage.removeItem('ikorodusquare_last_slug');
      }
    } catch (e) {
      console.error('Failed to save route state to localStorage', e);
    }

    let targetPath = '/';
    if (page === 'admin') targetPath = '/admin';
    else if (page === 'store' && slug) targetPath = `/store/${encodeURIComponent(slug)}`;
    else if (page === 'dashboard') targetPath = '/dashboard';
    else if (page === 'auth') targetPath = '/auth';
    else if (page === 'profile') targetPath = '/profile';
    else targetPath = '/';

    if (window.location.pathname !== targetPath || window.location.hash !== '') {
      window.history.pushState({}, '', targetPath);
    }
  };

  const initialNav = getInitialPageAndSlug();
  const [currentPage, setCurrentPageState] = useState<string>(initialNav.page);
  const [activeVendorSlug, setActiveVendorSlug] = useState<string | null>(initialNav.slug);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => StorageManager.getSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search & Filter State
  const [searchType, setSearchType] = useState<'business' | 'product'>('business');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');

  // Admin & Modal & Language
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(initialNav.adminMode);
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ikorodusquare_lang');
      if (saved === 'yo' || saved === 'en') return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ikorodusquare_lang', lang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langObj = TRANSLATIONS[language];
    if (langObj && langObj[key]) {
      return langObj[key];
    }
    return defaultText || TRANSLATIONS['en'][key] || key;
  };

  const setCurrentPage = (page: string) => {
    // Route Protection for authenticated pages
    const isEffectiveAdmin = isAdminMode || currentUser?.role === 'admin';
    const protectedPages = ['dashboard', 'admin', 'profile', 'user-profile'];
    if (protectedPages.includes(page) && !currentUser && !isEffectiveAdmin && page !== 'admin') {
      showToast('info', 'Authentication Required', 'Please sign in to access your dashboard or profile.');
      setCurrentPageState('auth');
      updateUrlAndStorage('auth', null);
      return;
    }

    setCurrentPageState(page);
    if (page === 'admin') {
      setIsAdminMode(true);
    }
    updateUrlAndStorage(page, page === 'store' ? activeVendorSlug : null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const refreshData = () => {
    StorageManager.checkAndSyncPromotionExpiries();
    setPromotions(StorageManager.getPromotions());
    setAdminSettings(StorageManager.getSettings());
    setVendors(StorageManager.getVendors());
    setProducts(StorageManager.getProducts());
    setReviews(StorageManager.getReviews());
    setEnquiries(StorageManager.getEnquiries());
    setBanners(StorageManager.getBanners());
    setFavorites(StorageManager.getFavorites());
  };

  const updateAdminSettings = (settings: AdminSettings) => {
    StorageManager.saveSettings(settings);
    setAdminSettings(settings);
    showToast('success', 'Settings Saved', 'Bank account and WhatsApp support settings updated.');
  };

  const createPromotionRequest = async (promo: Promotion) => {
    StorageManager.createPromotionRequest(promo);
    refreshData();
  };

  const activatePromotion = async (promo: Promotion) => {
    StorageManager.activatePromotion(promo);
    refreshData();
    showToast('success', 'Promotion Active!', 'Your promotion has been verified and activated.');
  };

  const updatePromotionStatus = async (id: string, newStatus: PromotionStatus, extendDays: number = 0) => {
    StorageManager.updatePromotionStatus(id, newStatus, extendDays);
    refreshData();
    const readableStatus = newStatus === 'pending_verification' ? 'Pending Verification' : newStatus;
    showToast('info', 'Promotion Updated', `Promotion status updated to ${readableStatus}.`);
  };

  const resolveUserFromSupabase = async (supaUser: any): Promise<User> => {
    const email = supaUser.email || '';
    const isAdmin = isAdminEmail(email);

    // Direct DB lookup for vendor record matching email
    let matchingVendor: Vendor | null = null;
    if (supabase) {
      try {
        const { data: supaVendor } = await supabase
          .from('vendors')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        if (supaVendor) {
          matchingVendor = rowToVendor(supaVendor);
        }
      } catch (e) {
        console.warn('Supabase vendor resolution query warning:', e);
      }
    }

    if (!matchingVendor) {
      const localVendors = StorageManager.getVendors();
      matchingVendor = localVendors.find((v) => v.email?.toLowerCase() === email.toLowerCase()) || null;
    }

    // Direct DB lookup for users table record
    let supaUserRow: any = null;
    if (supabase) {
      try {
        const { data: uRow } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaUser.id)
          .maybeSingle();
        if (uRow) supaUserRow = uRow;
      } catch (e) {
        console.warn('Supabase user row resolution query warning:', e);
      }
    }

    const role: 'admin' | 'vendor' | 'customer' = isAdmin
      ? 'admin'
      : matchingVendor
      ? 'vendor'
      : (supaUserRow?.role || supaUser.user_metadata?.role || 'customer');

    const vendorId = matchingVendor ? matchingVendor.id : (supaUserRow?.vendor_id || undefined);

    const name = isAdmin
      ? 'Platform Administrator'
      : matchingVendor
      ? matchingVendor.ownerName
      : supaUserRow?.name || supaUser.user_metadata?.full_name || email.split('@')[0] || 'Ikorodu Shopper';

    const phone = matchingVendor?.phone || matchingVendor?.whatsapp || supaUserRow?.phone || supaUser.phone || '';
    const area = matchingVendor?.area || supaUserRow?.area || supaUser.user_metadata?.area || '';

    return {
      id: supaUser.id,
      name,
      email: email || undefined,
      emailVerified: Boolean(supaUser.email_confirmed_at),
      phone,
      role,
      vendorId,
      area,
      createdAt: supaUserRow?.created_at || matchingVendor?.createdAt || supaUser.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    let isMounted = true;
    refreshData();

    let authComplete = false;
    let syncComplete = false;

    const checkHydrationComplete = () => {
      if (authComplete && syncComplete && isMounted) {
        setIsLoading(false);
      }
    };

    // Safety fallback timer so loading never hangs if offline or delayed
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2500);

    // Initial Database Sync (Supabase / Storage)
    StorageManager.initFirestoreSync(() => {
      if (isMounted) {
        refreshData();
        syncComplete = true;
        checkHydrationComplete();
      }
    }).then(() => {
      if (isMounted) {
        refreshData();
        syncComplete = true;
        checkHydrationComplete();
      }
    }).catch((e) => {
      console.warn('[Hydration Sync Warning]:', e);
      if (isMounted) {
        syncComplete = true;
        checkHydrationComplete();
      }
    });

    // Initial Supabase Auth session restoration
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user && isMounted) {
          const syncedUser = await resolveUserFromSupabase(session.user);
          if (isMounted) setCurrentUser(syncedUser);
        } else if (isMounted) {
          setCurrentUser(null);
        }
        authComplete = true;
        checkHydrationComplete();
      }).catch((e) => {
        console.warn('[Hydration Auth Error]:', e);
        if (isMounted) {
          authComplete = true;
          checkHydrationComplete();
        }
      });

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setCurrentPageState('reset-password');
          showToast('info', 'Reset Password', 'Verification code confirmed. Please set your new password below.');
          return;
        }

        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          return;
        }

        if (session?.user) {
          const syncedUser = await resolveUserFromSupabase(session.user);
          if (isMounted) setCurrentUser(syncedUser);
        } else {
          if (isMounted) setCurrentUser(null);
        }
      });
      authSubscription = data.subscription;
    } else {
      authComplete = true;
      checkHydrationComplete();
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const nav = getInitialPageAndSlug();
      setCurrentPageState(nav.page);
      setActiveVendorSlug(nav.slug);
      if (nav.adminMode) setIsAdminMode(true);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Initial sync of route & storage
    if (typeof window !== 'undefined') {
      const nav = getInitialPageAndSlug();
      let targetPath = '/';
      if (nav.page === 'admin') targetPath = '/admin';
      else if (nav.page === 'store' && nav.slug) targetPath = `/store/${encodeURIComponent(nav.slug)}`;
      else if (nav.page === 'dashboard') targetPath = '/dashboard';
      else if (nav.page === 'auth') targetPath = '/auth';
      else if (nav.page === 'profile') targetPath = '/profile';

      if (window.location.pathname !== targetPath || window.location.hash !== '') {
        window.history.replaceState({}, '', targetPath);
      }
      try {
        localStorage.setItem('ikorodusquare_last_page', nav.page);
        if (nav.slug) localStorage.setItem('ikorodusquare_last_slug', nav.slug);
      } catch (e) {
        console.error('Failed to sync state to localStorage', e);
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Derived active vendor if logged in vendor or viewing store
  const activeVendor = currentUser
    ? vendors.find(
        (v) =>
          (currentUser.vendorId && v.id === currentUser.vendorId) ||
          (currentUser.email && v.email && v.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (v.userId && v.userId === currentUser.id) ||
          (v.user_id && v.user_id === currentUser.id)
      ) || null
    : null;

  const navigateToStore = (slug: string) => {
    setActiveVendorSlug(slug);
    setCurrentPageState('store');
    updateUrlAndStorage('store', slug);
    StorageManager.incrementVendorTap(
      vendors.find((v) => v.slug.toLowerCase() === slug.toLowerCase())?.id || '',
      'profile'
    );
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleFavorite = (vendorId: string) => {
    if (!currentUser) {
      showToast('info', 'Sign in Required', 'Please sign in or register to save favourite businesses.');
      setCurrentPage('auth');
      return;
    }
    const updated = StorageManager.toggleFavorite(vendorId);
    setFavorites(updated);
    showToast('success', 'Saved!', updated.includes(vendorId) ? 'Added to your favourites.' : 'Removed from favourites.');
  };

  const approveVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const updatedVendor: Vendor = {
      ...v,
      status: 'approved',
      isLive: true,
      approvedAt: v.approvedAt || new Date().toISOString(),
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();

    // Send WhatsApp notification via Sendchamp API bridge
    const message = `Congratulations ${v.ownerName}! Your business "${v.businessName}" on IkoroduSquare has been APPROVED and is now live to thousands of customers across Ikorodu! View your shop at: https://ikorodusquare.com.ng/store/${v.slug}`;
    await ApiService.sendWhatsAppNotification(v.whatsapp, message);

    showToast('success', 'Vendor Approved', `"${v.businessName}" is now live and public.`);
  };

  const unapproveVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const updatedVendor: Vendor = {
      ...v,
      status: 'pending',
      isLive: false,
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();

    showToast('info', 'Vendor Unapproved', `"${v.businessName}" status set to pending.`);
  };

  const toggleVendorApproval = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    if (v.isLive || v.status === 'approved') {
      await unapproveVendor(vendorId);
    } else {
      await approveVendor(vendorId);
    }
  };

  const toggleVendorVerification = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const currentStatus = Boolean(v.ninVerified || v.nin_verified);
    const newStatus = !currentStatus;

    const updatedVendor: Vendor = {
      ...v,
      ninVerified: newStatus,
      nin_verified: newStatus,
      ninData: newStatus
        ? (v.ninData || {
            nin: '11111111111',
            fullName: v.ownerName,
            dob: '1990-01-01',
            verifiedAt: new Date().toISOString(),
          })
        : v.ninData,
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();

    showToast(
      newStatus ? 'success' : 'info',
      newStatus ? 'Vendor Verified' : 'Verification Removed',
      `"${v.businessName}" ${newStatus ? 'is now verified' : 'verification removed'}.`
    );
  };

  const toggleVendorFeatured = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const currentFeatured = Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
    const newFeatured = !currentFeatured;

    const updatedVendor: Vendor = {
      ...v,
      isFeatured: newFeatured,
      is_featured: newFeatured,
      featuredOnHomepage: newFeatured,
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();

    showToast(
      newFeatured ? 'success' : 'info',
      newFeatured ? 'Vendor Featured' : 'Removed from Featured',
      `"${v.businessName}" ${newFeatured ? 'added to' : 'removed from'} homepage Featured Businesses.`
    );
  };

  const rejectVendor = async (vendorId: string, reason: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;

    const updatedVendor: Vendor = {
      ...v,
      status: 'rejected',
      isLive: false,
    };

    StorageManager.updateVendor(updatedVendor);
    refreshData();

    // Send WhatsApp rejection notification
    const message = `Hello ${v.ownerName}, your application for "${v.businessName}" on IkoroduSquare requires changes. Reason: ${reason}. Please update your profile in your dashboard.`;
    await ApiService.sendWhatsAppNotification(v.whatsapp, message);

    showToast('info', 'Vendor Application Rejected', `Rejection notice sent via WhatsApp to ${v.businessName}.`);
  };

  const deleteVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    await StorageManager.deleteVendorAsync(vendorId);
    refreshData();
    showToast('info', 'Vendor Removed', `"${v?.businessName || 'Store'}" has been deleted from IkoroduSquare.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        activeVendorSlug,
        setActiveVendorSlug,
        navigateToStore,
        currentUser,
        setCurrentUser,
        activeVendor,
        vendors,
        products,
        reviews,
        enquiries,
        banners,
        favorites,
        promotions,
        adminSettings,
        updateAdminSettings,
        isLoading,
        searchType,
        setSearchType,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedArea,
        setSelectedArea,
        refreshData,
        toggleFavorite,
        showToast,
        toasts,
        removeToast,
        createPromotionRequest,
        activatePromotion,
        updatePromotionStatus,
        approveVendor,
        unapproveVendor,
        toggleVendorApproval,
        toggleVendorVerification,
        toggleVendorFeatured,
        rejectVendor,
        deleteVendor,
        showSetupModal,
        setShowSetupModal,
        isAdminMode,
        setIsAdminMode,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
