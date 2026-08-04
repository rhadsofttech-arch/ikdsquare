import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Vendor, Product, Review, Enquiry, BannerAd, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { StorageManager, rowToVendor } from '../data/mockStorage';
import { ApiService } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Language, TRANSLATIONS } from '../data/translations';
import { isAdminEmail } from '../lib/admin';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeVendorSlug: string | null;
  setActiveVendorSlug: (slug: string | null) => void;
  navigateToStore: (slug: string) => void;

  // Authentication - Supabase is the ONLY source
  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthInitialized: boolean;

  // Data
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

  // Loading state
  isLoading: boolean;

  // Search & Filter
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

  // UI State
  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ============================================================
  // 1. AUTH STATE - Supabase is the ONLY source
  // ============================================================
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const authInitializedRef = useRef(false);

  // ============================================================
  // 2. APPLICATION STATE
  // ============================================================
  const [currentPage, setCurrentPageState] = useState<string>('home');
  const [activeVendorSlug, setActiveVendorSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => StorageManager.getSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search & Filter
  const [searchType, setSearchType] = useState<'business' | 'product'>('business');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');

  // UI
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Language
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ikorodusquare_lang');
      if (saved === 'yo' || saved === 'en') return saved;
    }
    return 'en';
  });

  // ============================================================
  // 3. NAVIGATION HELPERS
  // ============================================================
  const updateUrl = useCallback((page: string, slug: string | null = null) => {
    if (typeof window === 'undefined') return;

    let targetPath = '/';
    if (page === 'admin') targetPath = '/admin';
    else if (page === 'store' && slug) targetPath = `/store/${encodeURIComponent(slug)}`;
    else if (page === 'dashboard') targetPath = '/dashboard';
    else if (page === 'auth') targetPath = '/auth';
    else if (page === 'profile') targetPath = '/profile';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);

  const setCurrentPage = useCallback((page: string) => {
    // Protected routes check
    const protectedPages = ['dashboard', 'admin', 'profile'];
    if (protectedPages.includes(page) && !currentUser && page !== 'admin') {
      showToast('info', 'Authentication Required', 'Please sign in to access your dashboard.');
      setCurrentPageState('auth');
      updateUrl('auth', null);
      return;
    }

    setCurrentPageState(page);
    if (page === 'admin') setIsAdminMode(true);
    updateUrl(page, page === 'store' ? activeVendorSlug : null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentUser, activeVendorSlug, updateUrl]);

  const navigateToStore = useCallback((slug: string) => {
    setActiveVendorSlug(slug);
    setCurrentPageState('store');
    updateUrl('store', slug);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [updateUrl]);

  // ============================================================
  // 4. USER RESOLVER - Single source of truth
  // ============================================================
  const resolveUser = useCallback(async (supaUser: any): Promise<User | null> => {
    if (!supaUser) return null;

    const email = supaUser.email || '';
    const isAdmin = isAdminEmail(email);

    try {
      // Step 1: Get user from public.users table
      let userRow: any = null;
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data: uRow } = await supabase
            .from('users')
            .select('*')
            .eq('id', supaUser.id)
            .maybeSingle();
          if (uRow) userRow = uRow;
        } catch (e) {
          console.warn('[AppContext] User row fetch warning:', e);
        }
      }

      // Step 2: Get vendor record if exists
      let vendorRow: any = null;
      if (supabase && isSupabaseConfigured()) {
        try {
          // Try by user's vendor_id first
          if (userRow?.vendor_id) {
            const { data: vRow } = await supabase
              .from('vendors')
              .select('*')
              .eq('id', userRow.vendor_id)
              .maybeSingle();
            if (vRow) vendorRow = vRow;
          }

          // If no vendor found, try by email
          if (!vendorRow && email) {
            const { data: vRow } = await supabase
              .from('vendors')
              .select('*')
              .ilike('email', email)
              .maybeSingle();
            if (vRow) vendorRow = vRow;
          }
        } catch (e) {
          console.warn('[AppContext] Vendor fetch warning:', e);
        }
      }

      // Step 3: Fallback to local storage for vendor data
      let fallbackVendor: Vendor | null = null;
      if (!vendorRow) {
        const localVendors = StorageManager.getVendors();
        fallbackVendor = localVendors.find(v => v.email?.toLowerCase() === email.toLowerCase()) || null;
      }

      // Step 4: Build user object
      const vendor = vendorRow ? rowToVendor(vendorRow) : fallbackVendor;

      const role: 'admin' | 'vendor' | 'customer' = isAdmin
        ? 'admin'
        : vendor
        ? 'vendor'
        : (userRow?.role || 'customer');

      const name = isAdmin
        ? 'Platform Administrator'
        : vendor
        ? vendor.ownerName
        : userRow?.name || supaUser.user_metadata?.full_name || email.split('@')[0] || 'Ikorodu Shopper';

      const phone = vendor?.phone || vendor?.whatsapp || userRow?.phone || supaUser.phone || '';
      const area = vendor?.area || userRow?.area || supaUser.user_metadata?.area || '';

      return {
        id: supaUser.id,
        name,
        email: email || undefined,
        emailVerified: Boolean(supaUser.email_confirmed_at),
        phone,
        role,
        vendorId: vendor?.id || userRow?.vendor_id || undefined,
        area,
        createdAt: userRow?.created_at || vendor?.createdAt || supaUser.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('[AppContext] User resolution error:', error);
      // Fallback: create minimal user
      return {
        id: supaUser.id,
        name: supaUser.email?.split('@')[0] || 'User',
        email: supaUser.email,
        emailVerified: Boolean(supaUser.email_confirmed_at),
        phone: '',
        role: isAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      };
    }
  }, []);

  // ============================================================
  // 5. AUTH INITIALIZATION - Single source
  // ============================================================
  const initializeAuth = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[AppContext] Supabase not configured, using localStorage fallback');
      const localUser = StorageManager.getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
      }
      setIsAuthLoading(false);
      setIsAuthInitialized(true);
      authInitializedRef.current = true;
      return;
    }

    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const resolvedUser = await resolveUser(session.user);
        if (resolvedUser) {
          setCurrentUser(resolvedUser);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('[AppContext] Auth initialization error:', error);
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
      setIsAuthInitialized(true);
      authInitializedRef.current = true;
    }
  }, [resolveUser]);

  // ============================================================
  // 6. DATA INITIALIZATION
  // ============================================================
  const refreshData = useCallback(() => {
    StorageManager.checkAndSyncPromotionExpiries();
    setPromotions(StorageManager.getPromotions());
    setAdminSettings(StorageManager.getSettings());
    setVendors(StorageManager.getVendors());
    setProducts(StorageManager.getProducts());
    setReviews(StorageManager.getReviews());
    setEnquiries(StorageManager.getEnquiries());
    setBanners(StorageManager.getBanners());
    setFavorites(StorageManager.getFavorites());
  }, []);

  // ============================================================
  // 7. EFFECTS
  // ============================================================
  
  // Effect 1: Initialize everything on mount
  useEffect(() => {
    // Start data loading
    refreshData();
    
    // Start auth initialization
    initializeAuth();

    // Start Supabase realtime sync
    StorageManager.initFirestoreSync(() => {
      refreshData();
    });

    // Set loading to false after data loads
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth, refreshData]);

  // Effect 2: Supabase Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AppContext] Auth state change:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPageState('reset-password');
        showToast('info', 'Reset Password', 'Verification confirmed. Please set your new password.');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        // Clear any localStorage auth remnants
        try {
          localStorage.removeItem('ikorodusquare_current_user_v1');
        } catch (e) {
          // ignore
        }
        return;
      }

      // For any sign-in event (SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED)
      if (session?.user) {
        const resolvedUser = await resolveUser(session.user);
        if (resolvedUser) {
          setCurrentUser(resolvedUser);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resolveUser]);

  // Effect 3: Sync currentUser to localStorage for offline fallback only
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('ikorodusquare_current_user_v1', JSON.stringify(currentUser));
      } catch (e) {
        // ignore
      }
    }
  }, [currentUser]);

  // ============================================================
  // 8. DERIVED STATE
  // ============================================================
  const activeVendor = currentUser
    ? vendors.find(
        (v) =>
          (currentUser.vendorId && v.id === currentUser.vendorId) ||
          (currentUser.email && v.email?.toLowerCase() === currentUser.email.toLowerCase())
      ) || null
    : null;

  // ============================================================
  // 9. TOAST SYSTEM
  // ============================================================
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ============================================================
  // 10. LANGUAGE
  // ============================================================
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ikorodusquare_lang', lang);
    }
  }, []);

  const t = useCallback((key: string, defaultText?: string): string => {
    const langObj = TRANSLATIONS[language];
    if (langObj && langObj[key]) {
      return langObj[key];
    }
    return defaultText || TRANSLATIONS['en'][key] || key;
  }, [language]);

  // ============================================================
  // 11. FAVORITES
  // ============================================================
  const toggleFavorite = useCallback((vendorId: string) => {
    if (!currentUser) {
      showToast('info', 'Sign in Required', 'Please sign in to save favorites.');
      setCurrentPage('auth');
      return;
    }
    const updated = StorageManager.toggleFavorite(vendorId);
    setFavorites(updated);
    showToast('success', 'Updated', updated.includes(vendorId) ? 'Added to favorites.' : 'Removed from favorites.');
  }, [currentUser, showToast, setCurrentPage]);

  // ============================================================
  // 12. ADMIN ACTIONS
  // ============================================================
  const approveVendor = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) {
      showToast('error', 'Not Found', 'Vendor not found.');
      return;
    }

    try {
      const updatedVendor: Vendor = {
        ...v,
        status: 'approved',
        isLive: true,
        approvedAt: v.approvedAt || new Date().toISOString(),
      };

      StorageManager.updateVendor(updatedVendor);
      refreshData();

      const message = `Congratulations ${v.ownerName}! Your business "${v.businessName}" on IkoroduSquare has been APPROVED and is now live! View your shop at: https://ikorodusquare.com.ng/store/${v.slug}`;
      await ApiService.sendWhatsAppNotification(v.whatsapp, message);

      showToast('success', 'Vendor Approved', `"${v.businessName}" is now live.`);
    } catch (error) {
      console.error('[AppContext] approveVendor error:', error);
      showToast('error', 'Approval Failed', 'Could not approve vendor. Please try again.');
    }
  }, [vendors, refreshData, showToast]);

  const unapproveVendor = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) {
      showToast('error', 'Not Found', 'Vendor not found.');
      return;
    }

    try {
      const updatedVendor: Vendor = {
        ...v,
        status: 'pending',
        isLive: false,
      };

      StorageManager.updateVendor(updatedVendor);
      refreshData();
      showToast('info', 'Vendor Unapproved', `"${v.businessName}" set to pending.`);
    } catch (error) {
      console.error('[AppContext] unapproveVendor error:', error);
      showToast('error', 'Action Failed', 'Could not unapprove vendor.');
    }
  }, [vendors, refreshData, showToast]);

  const toggleVendorApproval = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) return;
    
    if (v.isLive || v.status === 'approved') {
      await unapproveVendor(vendorId);
    } else {
      await approveVendor(vendorId);
    }
  }, [vendors, approveVendor, unapproveVendor]);

  const toggleVendorVerification = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) {
      showToast('error', 'Not Found', 'Vendor not found.');
      return;
    }

    try {
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
        `"${v.businessName}" ${newStatus ? 'verified' : 'unverified'}.`
      );
    } catch (error) {
      console.error('[AppContext] toggleVendorVerification error:', error);
      showToast('error', 'Action Failed', 'Could not update verification status.');
    }
  }, [vendors, refreshData, showToast]);

  const toggleVendorFeatured = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) {
      showToast('error', 'Not Found', 'Vendor not found.');
      return;
    }

    try {
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
        `"${v.businessName}" ${newFeatured ? 'added to' : 'removed from'} featured.`
      );
    } catch (error) {
      console.error('[AppContext] toggleVendorFeatured error:', error);
      showToast('error', 'Action Failed', 'Could not update featured status.');
    }
  }, [vendors, refreshData, showToast]);

  const rejectVendor = useCallback(async (vendorId: string, reason: string) => {
    const v = vendors.find(item => item.id === vendorId);
    if (!v) {
      showToast('error', 'Not Found', 'Vendor not found.');
      return;
    }

    try {
      const updatedVendor: Vendor = {
        ...v,
        status: 'rejected',
        isLive: false,
      };

      StorageManager.updateVendor(updatedVendor);
      refreshData();

      const message = `Hello ${v.ownerName}, your application for "${v.businessName}" on IkoroduSquare requires changes. Reason: ${reason}. Please update your profile in your dashboard.`;
      await ApiService.sendWhatsAppNotification(v.whatsapp, message);

      showToast('info', 'Vendor Rejected', `Rejection notice sent to ${v.businessName}.`);
    } catch (error) {
      console.error('[AppContext] rejectVendor error:', error);
      showToast('error', 'Action Failed', 'Could not reject vendor.');
    }
  }, [vendors, refreshData, showToast]);

  const deleteVendor = useCallback(async (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId);
    try {
      await StorageManager.deleteVendorAsync(vendorId);
      refreshData();
      showToast('info', 'Vendor Removed', `"${v?.businessName || 'Store'}" has been deleted.`);
    } catch (error) {
      console.error('[AppContext] deleteVendor error:', error);
      showToast('error', 'Delete Failed', 'Could not delete vendor.');
    }
  }, [vendors, refreshData, showToast]);

  // ============================================================
  // 13. PROMOTION ACTIONS
  // ============================================================
  const createPromotionRequest = useCallback(async (promo: Promotion) => {
    try {
      StorageManager.createPromotionRequest(promo);
      refreshData();
      showToast('success', 'Promotion Requested', 'Your promotion request has been submitted for verification.');
    } catch (error) {
      console.error('[AppContext] createPromotionRequest error:', error);
      showToast('error', 'Request Failed', 'Could not create promotion request.');
    }
  }, [refreshData, showToast]);

  const activatePromotion = useCallback(async (promo: Promotion) => {
    try {
      StorageManager.activatePromotion(promo);
      refreshData();
      showToast('success', 'Promotion Active!', 'Your promotion has been activated.');
    } catch (error) {
      console.error('[AppContext] activatePromotion error:', error);
      showToast('error', 'Activation Failed', 'Could not activate promotion.');
    }
  }, [refreshData, showToast]);

  const updatePromotionStatus = useCallback(async (id: string, newStatus: PromotionStatus, extendDays: number = 0) => {
    try {
      StorageManager.updatePromotionStatus(id, newStatus, extendDays);
      refreshData();
      const readableStatus = newStatus === 'pending_verification' ? 'Pending Verification' : newStatus;
      showToast('info', 'Promotion Updated', `Status updated to ${readableStatus}.`);
    } catch (error) {
      console.error('[AppContext] updatePromotionStatus error:', error);
      showToast('error', 'Update Failed', 'Could not update promotion status.');
    }
  }, [refreshData, showToast]);

  // ============================================================
  // 14. SETTINGS
  // ============================================================
  const updateAdminSettings = useCallback((settings: AdminSettings) => {
    try {
      StorageManager.saveSettings(settings);
      setAdminSettings(settings);
      showToast('success', 'Settings Saved', 'Configuration updated.');
    } catch (error) {
      console.error('[AppContext] updateAdminSettings error:', error);
      showToast('error', 'Save Failed', 'Could not save settings.');
    }
  }, [showToast]);

  // ============================================================
  // 15. CONTEXT VALUE
  // ============================================================
  const value: AppContextType = {
    // Navigation
    currentPage,
    setCurrentPage,
    activeVendorSlug,
    setActiveVendorSlug,
    navigateToStore,

    // Authentication
    currentUser,
    isAuthLoading,
    isAuthInitialized,

    // Data
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

    // Loading
    isLoading: isLoading || isAuthLoading,

    // Search
    searchType,
    setSearchType,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedArea,
    setSelectedArea,

    // Actions
    refreshData,
    toggleFavorite,
    showToast,
    toasts,
    removeToast,

    // Promotions
    createPromotionRequest,
    activatePromotion,
    updatePromotionStatus,

    // Admin
    approveVendor,
    unapproveVendor,
    toggleVendorApproval,
    toggleVendorVerification,
    toggleVendorFeatured,
    rejectVendor,
    deleteVendor,

    // UI
    showSetupModal,
    setShowSetupModal,
    isAdminMode,
    setIsAdminMode,

    // Language
    language,
    setLanguage,
    t,
  };

  return (
    <AppContext.Provider value={value}>
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