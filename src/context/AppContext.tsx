/**
 * AppContext.tsx — Rewritten
 *
 * SINGLE SOURCE OF TRUTH: Supabase Auth.
 *
 * Auth lifecycle:
 *   1. Mount → supabase.auth.getSession() → resolveUserFromSupabase() → setCurrentUser()
 *   2. Any future auth event → onAuthStateChange → resolveUserFromSupabase() → setCurrentUser()
 *   3. Signed out → setCurrentUser(null)
 *
 * `isAuthLoading` is true until step 1 completes; components MUST NOT render
 * auth-gated content while it is true.
 *
 * Components MUST NOT call setCurrentUser() themselves.
 * Components MUST NOT read auth state from localStorage.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  User,
  Vendor,
  Product,
  Review,
  Enquiry,
  BannerAd,
  Promotion,
  PromotionStatus,
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
} from '../types';
import { StorageManager, rowToVendor } from '../data/mockStorage';
import { ApiService } from '../services/api';
import { supabase } from '../services/supabase';
import { Language, TRANSLATIONS } from '../data/translations';
import { isAdminEmail } from '../lib/admin';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeVendorSlug: string | null;
  setActiveVendorSlug: (slug: string | null) => void;
  navigateToStore: (slug: string) => void;

  currentUser: User | null;
  /**
   * @deprecated — Do NOT call this from components.
   * Auth state flows through Supabase → AppContext only.
   * Exposed only to satisfy legacy prop signatures.
   */
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

  /**
   * True while application data (vendors, products …) is being loaded.
   * Distinct from auth loading.
   */
  isLoading: boolean;

  /**
   * True while the Supabase session is being resolved on mount.
   * Protected routes MUST NOT render until this is false.
   */
  isAuthLoading: boolean;

  /**
   * True once the auth session has been resolved at least once.
   * Equivalent to !isAuthLoading after the initial resolution.
   */
  isAuthInitialized: boolean;

  searchType: 'business' | 'product';
  setSearchType: (type: 'business' | 'product') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;

  refreshData: () => void;
  toggleFavorite: (vendorId: string) => void;
  showToast: (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
  ) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;

  createPromotionRequest: (promo: Promotion) => Promise<void>;
  activatePromotion: (promo: Promotion) => Promise<void>;
  updatePromotionStatus: (
    id: string,
    newStatus: PromotionStatus,
    extendDays?: number,
  ) => Promise<void>;

  approveVendor: (vendorId: string) => Promise<void>;
  unapproveVendor: (vendorId: string) => Promise<void>;
  toggleVendorApproval: (vendorId: string) => Promise<void>;
  toggleVendorVerification: (vendorId: string) => Promise<void>;
  toggleVendorFeatured: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string, reason: string) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;

  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;

  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Route helpers ──────────────────────────────────────────────────────────────

/**
 * Derive the initial page/slug from the URL only.
 * Never reads auth state from localStorage — that caused the stale-dashboard bug.
 * Never restores 'dashboard', 'profile', or 'auth' from localStorage — those
 * pages are auth-gated and must be decided after the session resolves.
 */
function getInitialNav(): {
  page: string;
  slug: string | null;
  adminMode: boolean;
} {
  if (typeof window === 'undefined')
    return { page: 'home', slug: null, adminMode: false };

  // 1. Query params
  const params = new URLSearchParams(window.location.search);
  const storeQ = params.get('store') ?? params.get('vendor') ?? params.get('shop');
  if (storeQ)
    return {
      page: 'store',
      slug: decodeURIComponent(storeQ.trim()),
      adminMode: false,
    };
  const pageQ = params.get('page')?.toLowerCase();
  if (pageQ) {
    if (pageQ === 'admin' || pageQ.startsWith('admin/'))
      return { page: 'admin', slug: null, adminMode: true };
    // auth-gated pages are intentionally NOT restored from query param here;
    // they'll redirect correctly once auth resolves via the useEffect below.
  }

  // 2. Hash
  if (window.location.hash?.startsWith('#')) {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    const lower = raw.toLowerCase();
    if (lower === 'admin' || lower.startsWith('admin/'))
      return { page: 'admin', slug: null, adminMode: true };
    if (lower.startsWith('store/'))
      return {
        page: 'store',
        slug: decodeURIComponent(raw.substring(6).trim()),
        adminMode: false,
      };
    if (lower.startsWith('vendor/'))
      return {
        page: 'store',
        slug: decodeURIComponent(raw.substring(7).trim()),
        adminMode: false,
      };
    if (lower.startsWith('shop/'))
      return {
        page: 'store',
        slug: decodeURIComponent(raw.substring(5).trim()),
        adminMode: false,
      };
    // Supabase password-recovery token arrives via hash
    if (lower.includes('access_token') || lower.includes('type=recovery'))
      return { page: 'reset-password', slug: null, adminMode: false };
  }

  // 3. Pathname
  const path = window.location.pathname;
  const lower = path.toLowerCase();
  if (
    lower === '/admin' ||
    lower === '/admin/' ||
    lower.startsWith('/admin/')
  )
    return { page: 'admin', slug: null, adminMode: true };
  if (lower.startsWith('/store/'))
    return {
      page: 'store',
      slug: decodeURIComponent(path.substring(7).replace(/\/$/, '')),
      adminMode: false,
    };
  if (lower.startsWith('/vendor/'))
    return {
      page: 'store',
      slug: decodeURIComponent(path.substring(8).replace(/\/$/, '')),
      adminMode: false,
    };
  if (lower.startsWith('/shop/'))
    return {
      page: 'store',
      slug: decodeURIComponent(path.substring(6).replace(/\/$/, '')),
      adminMode: false,
    };

  // 4. Saved page from localStorage — only non-auth pages
  try {
    const savedPage = localStorage.getItem('ikorodusquare_last_page');
    const savedSlug = localStorage.getItem('ikorodusquare_last_slug');
    if (savedPage) {
      if (savedPage === 'admin')
        return { page: 'admin', slug: null, adminMode: true };
      if (savedPage === 'store' && savedSlug)
        return { page: 'store', slug: savedSlug, adminMode: false };
      if (savedPage === 'home')
        return { page: 'home', slug: null, adminMode: false };
      // 'dashboard', 'profile', 'auth' are intentionally excluded here.
      // Auth-gated pages are only navigated to AFTER isAuthLoading is false.
    }
  } catch {
    /* ignore */
  }

  return { page: 'home', slug: null, adminMode: false };
}

function persistNav(page: string, slug: string | null = null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ikorodusquare_last_page', page);
    if (slug) localStorage.setItem('ikorodusquare_last_slug', slug);
    else localStorage.removeItem('ikorodusquare_last_slug');
  } catch {
    /* ignore */
  }

  const target =
    page === 'admin'
      ? '/admin'
      : page === 'store' && slug
      ? `/store/${encodeURIComponent(slug)}`
      : page === 'dashboard'
      ? '/dashboard'
      : page === 'auth'
      ? '/auth'
      : page === 'profile'
      ? '/profile'
      : '/';

  if (
    window.location.pathname !== target ||
    window.location.hash !== ''
  ) {
    window.history.pushState({}, '', target);
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialNav = getInitialNav();

  // ── Navigation state ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPageState] = useState<string>(initialNav.page);
  const [activeVendorSlug, setActiveVendorSlug] = useState<string | null>(
    initialNav.slug,
  );
  const [isAdminMode, setIsAdminMode] = useState<boolean>(
    initialNav.adminMode,
  );

  // ── Auth state ─────────────────────────────────────────────────────────────
  //    isAuthLoading: true from mount until the first getSession() resolves.
  //    isAuthInitialized: flips to true once and stays true forever.
  //    currentUser: populated by resolveUserFromSupabase; null when signed out.
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ── Application data state ─────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() =>
    StorageManager.getSettings(),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchType, setSearchType] = useState<'business' | 'product'>(
    'business',
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ikorodusquare_lang');
      if (saved === 'yo' || saved === 'en') return saved as Language;
    }
    return 'en';
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', title: string, message: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5000,
      );
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined')
      localStorage.setItem('ikorodusquare_lang', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const langObj = TRANSLATIONS[language];
    return (
      (langObj && langObj[key]) ||
      defaultText ||
      TRANSLATIONS['en'][key] ||
      key
    );
  };

  const refreshData = useCallback(() => {
    StorageManager.checkAndSyncPromotionExpiries();
    setPromotions(StorageManager.getPromotions());
    setAdminSettings(StorageManager.getSettings());
    const v = StorageManager.getVendors();
    setVendors(v);
    setProducts(StorageManager.getProducts());
    setReviews(StorageManager.getReviews());
    setEnquiries(StorageManager.getEnquiries());
    setBanners(StorageManager.getBanners());
    setFavorites(StorageManager.getFavorites());
    setIsLoading(false);
  }, []);

  // ─── User resolution ─────────────────────────────────────────────────────────

  /**
   * Given a raw Supabase auth user, look up public.users and public.vendors,
   * then build a fully-typed User object.
   *
   * This is the ONLY place a User is constructed from auth data.
   */
  const resolveUserFromSupabase = useCallback(
    async (supaUser: {
      id: string;
      email?: string;
      email_confirmed_at?: string | null;
      phone?: string;
      created_at?: string;
      user_metadata?: Record<string, unknown>;
    }): Promise<User> => {
      const email = supaUser.email ?? '';
      const isAdmin = isAdminEmail(email);

      // 1. Vendor lookup: by user_id FK first, then by email
      let matchingVendor: Vendor | null = null;
      if (supabase) {
        try {
          const { data: vendorById } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', supaUser.id)
            .maybeSingle();

          if (vendorById) {
            matchingVendor = rowToVendor(
              vendorById as Record<string, unknown>,
            );
          } else if (email) {
            const { data: vendorByEmail } = await supabase
              .from('vendors')
              .select('*')
              .ilike('email', email)
              .maybeSingle();
            if (vendorByEmail)
              matchingVendor = rowToVendor(
                vendorByEmail as Record<string, unknown>,
              );
          }
        } catch (err) {
          console.warn(
            '[AppContext] resolveUserFromSupabase — vendor query warning:',
            err,
          );
          // Fallback to local cache
          const localVendors = StorageManager.getVendors();
          matchingVendor =
            localVendors.find(
              (v) =>
                v.email?.toLowerCase() === email.toLowerCase(),
            ) ?? null;
        }
      } else {
        const localVendors = StorageManager.getVendors();
        matchingVendor =
          localVendors.find(
            (v) => v.email?.toLowerCase() === email.toLowerCase(),
          ) ?? null;
      }

      // 2. public.users lookup
      let userRow: Record<string, unknown> | null = null;
      if (supabase) {
        try {
          const { data: uRow } = await supabase
            .from('users')
            .select('*')
            .eq('id', supaUser.id)
            .maybeSingle();
          if (uRow) userRow = uRow as Record<string, unknown>;
        } catch (err) {
          console.warn(
            '[AppContext] resolveUserFromSupabase — users query warning:',
            err,
          );
        }
      }

      // 3. Derive role
      const role: User['role'] = isAdmin
        ? 'admin'
        : matchingVendor
        ? 'vendor'
        : ((userRow?.role as User['role']) ??
            (supaUser.user_metadata?.role as User['role']) ??
            'customer');

      // 4. vendorId always comes from the DB record, never a generated string
      const vendorId: string | undefined = matchingVendor
        ? matchingVendor.id
        : (userRow?.vendor_id as string | undefined);

      // 5. Display name
      const name = isAdmin
        ? 'Platform Administrator'
        : matchingVendor
        ? matchingVendor.ownerName
        : (userRow?.name as string | undefined) ??
          (supaUser.user_metadata?.full_name as string | undefined) ??
          email.split('@')[0] ??
          'Ikorodu Shopper';

      const phone =
        matchingVendor?.phone ??
        matchingVendor?.whatsapp ??
        (userRow?.phone as string | undefined) ??
        supaUser.phone ??
        '';

      const area =
        matchingVendor?.area ??
        (userRow?.area as string | undefined) ??
        (supaUser.user_metadata?.area as string | undefined) ??
        '';

      return {
        id: supaUser.id,
        name,
        email: email || undefined,
        emailVerified: Boolean(supaUser.email_confirmed_at),
        phone,
        role,
        vendorId,
        area,
        createdAt:
          (userRow?.created_at as string | undefined) ??
          matchingVendor?.createdAt ??
          supaUser.created_at ??
          new Date().toISOString(),
      };
    },
    [],
  );

  // ─── Auth bootstrap ──────────────────────────────────────────────────────────

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    const bootstrap = async () => {
      // Start loading application data in parallel (doesn't block auth resolution)
      setIsLoading(true);
      void StorageManager.initFirestoreSync(() => refreshData());
      refreshData();

      if (!supabase) {
        // No Supabase — local-only mode
        setIsAuthLoading(false);
        setIsAuthInitialized(true);
        return;
      }

      // ── Step 1: Resolve existing session ─────────────────────────────────
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const resolved = await resolveUserFromSupabase(session.user);
          setCurrentUser(resolved);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('[AppContext] getSession error:', err);
        setCurrentUser(null);
      } finally {
        // CRITICAL: flip both flags in the same synchronous batch so
        // components never see isAuthLoading=false with isAuthInitialized=false.
        setIsAuthLoading(false);
        setIsAuthInitialized(true);
      }

      // ── Step 2: Subscribe to future auth changes ──────────────────────────
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[AppContext] onAuthStateChange:', event);

          if (event === 'PASSWORD_RECOVERY') {
            setCurrentPageState('reset-password');
            showToast(
              'info',
              'Reset Password',
              'Verification confirmed. Set your new password below.',
            );
            return;
          }

          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            return;
          }

          if (session?.user) {
            try {
              const resolved = await resolveUserFromSupabase(session.user);
              setCurrentUser(resolved);
            } catch (err) {
              console.error(
                '[AppContext] resolveUserFromSupabase error on auth change:',
                err,
              );
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        },
      );

      authSubscription = data.subscription;
    };

    void bootstrap();

    return () => {
      authSubscription?.unsubscribe();
    };
  }, [refreshData, resolveUserFromSupabase, showToast]);

  // ─── Post-auth navigation ──────────────────────────────────────────────────
  // Once auth resolves, redirect authenticated users who are on a neutral page
  // (home) to their natural landing page (dashboard / admin).
  useEffect(() => {
    if (!isAuthInitialized || !currentUser) return;

    const nonRedirectPages = ['store', 'admin', 'dashboard', 'profile', 'auth', 'reset-password', 'forgot-password'];
    if (nonRedirectPages.includes(currentPage)) return;

    if (currentUser.role === 'admin') {
      setCurrentPageState('admin');
      setIsAdminMode(true);
      persistNav('admin', null);
    } else if (currentUser.role === 'vendor') {
      // Only redirect to dashboard if currently on home; don't interrupt store browsing
      if (currentPage === 'home') {
        setCurrentPageState('dashboard');
        persistNav('dashboard', null);
      }
    }
  }, [isAuthInitialized, currentUser, currentPage]);

  // ─── URL / popstate sync ──────────────────────────────────────────────────

  useEffect(() => {
    const handleUrlChange = () => {
      const nav = getInitialNav();
      setCurrentPageState(nav.page);
      setActiveVendorSlug(nav.slug);
      if (nav.adminMode) setIsAdminMode(true);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Canonicalise initial URL
    const nav = getInitialNav();
    const target =
      nav.page === 'admin'
        ? '/admin'
        : nav.page === 'store' && nav.slug
        ? `/store/${encodeURIComponent(nav.slug)}`
        : nav.page === 'dashboard'
        ? '/dashboard'
        : nav.page === 'auth'
        ? '/auth'
        : nav.page === 'profile'
        ? '/profile'
        : '/';

    if (
      window.location.pathname !== target ||
      window.location.hash !== ''
    ) {
      window.history.replaceState({}, '', target);
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const activeVendor: Vendor | null = currentUser
    ? (vendors.find(
        (v) =>
          (currentUser.vendorId && v.id === currentUser.vendorId) ||
          (currentUser.email &&
            v.email?.toLowerCase() === currentUser.email.toLowerCase()),
      ) ?? null)
    : null;

  // ─── Navigation ────────────────────────────────────────────────────────────

  const setCurrentPage = useCallback(
    (page: string) => {
      const isEffectiveAdmin =
        isAdminMode || currentUser?.role === 'admin';
      const authGatedPages = ['dashboard', 'profile', 'user-profile'];

      // Block navigation to auth-gated pages while auth is still resolving.
      // The post-auth useEffect above will handle the redirect once resolved.
      if (isAuthLoading && authGatedPages.includes(page)) {
        return;
      }

      if (
        authGatedPages.includes(page) &&
        !currentUser &&
        !isEffectiveAdmin
      ) {
        showToast(
          'info',
          'Authentication Required',
          'Please sign in to access your dashboard or profile.',
        );
        setCurrentPageState('auth');
        persistNav('auth', null);
        return;
      }

      if (page === 'admin') setIsAdminMode(true);
      setCurrentPageState(page);
      persistNav(page, page === 'store' ? activeVendorSlug : null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [isAuthLoading, isAdminMode, currentUser, activeVendorSlug, showToast],
  );

  const navigateToStore = useCallback(
    (slug: string) => {
      setActiveVendorSlug(slug);
      setCurrentPageState('store');
      persistNav('store', slug);
      StorageManager.incrementVendorTap(
        vendors.find(
          (v) => v.slug.toLowerCase() === slug.toLowerCase(),
        )?.id ?? '',
        'profile',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [vendors],
  );

  // ─── Data mutations ─────────────────────────────────────────────────────────

  const updateAdminSettings = (settings: AdminSettings) => {
    StorageManager.saveSettings(settings);
    setAdminSettings(settings);
    showToast(
      'success',
      'Settings Saved',
      'Bank account and WhatsApp support settings updated.',
    );
  };

  const toggleFavorite = (vendorId: string) => {
    if (!currentUser) {
      showToast(
        'info',
        'Sign in Required',
        'Please sign in to save favourite businesses.',
      );
      setCurrentPage('auth');
      return;
    }
    const updated = StorageManager.toggleFavorite(vendorId);
    setFavorites(updated);
    showToast(
      'success',
      'Saved!',
      updated.includes(vendorId)
        ? 'Added to your favourites.'
        : 'Removed from favourites.',
    );
  };

  // ─── Promotions ─────────────────────────────────────────────────────────────

  const createPromotionRequest = async (promo: Promotion) => {
    StorageManager.createPromotionRequest(promo);
    refreshData();
  };

  const activatePromotion = async (promo: Promotion) => {
    StorageManager.activatePromotion(promo);
    refreshData();
    showToast(
      'success',
      'Promotion Active!',
      'Your promotion has been verified and activated.',
    );
  };

  const updatePromotionStatus = async (
    id: string,
    newStatus: PromotionStatus,
    extendDays = 0,
  ) => {
    StorageManager.updatePromotionStatus(id, newStatus, extendDays);
    refreshData();
    const label =
      newStatus === 'pending_verification'
        ? 'Pending Verification'
        : newStatus;
    showToast('info', 'Promotion Updated', `Status updated to ${label}.`);
  };

  // ─── Admin vendor actions ───────────────────────────────────────────────────

  const approveVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    const updated: Vendor = {
      ...v,
      status: 'approved',
      isLive: true,
      approvedAt: v.approvedAt ?? new Date().toISOString(),
    };
    StorageManager.updateVendor(updated);
    refreshData();
    const msg = `Congratulations ${v.ownerName}! Your business "${v.businessName}" on IkoroduSquare has been APPROVED. View your shop at: https://ikorodusquare.com.ng/store/${v.slug}`;
    await ApiService.sendWhatsAppNotification(v.whatsapp, msg);
    showToast('success', 'Vendor Approved', `"${v.businessName}" is now live.`);
  };

  const unapproveVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    StorageManager.updateVendor({ ...v, status: 'pending', isLive: false });
    refreshData();
    showToast(
      'info',
      'Vendor Unapproved',
      `"${v.businessName}" status set to pending.`,
    );
  };

  const toggleVendorApproval = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    if (v.isLive || v.status === 'approved') await unapproveVendor(vendorId);
    else await approveVendor(vendorId);
  };

  const toggleVendorVerification = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    const current = Boolean(v.ninVerified ?? v.nin_verified);
    const next = !current;
    StorageManager.updateVendor({
      ...v,
      ninVerified: next,
      nin_verified: next,
      ninData: next
        ? (v.ninData ?? {
            nin: '11111111111',
            fullName: v.ownerName,
            dob: '1990-01-01',
            verifiedAt: new Date().toISOString(),
          })
        : v.ninData,
    });
    refreshData();
    showToast(
      next ? 'success' : 'info',
      next ? 'Vendor Verified' : 'Verification Removed',
      `"${v.businessName}" ${next ? 'is now verified' : 'verification removed'}.`,
    );
  };

  const toggleVendorFeatured = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    const current = Boolean(
      v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage,
    );
    const next = !current;
    StorageManager.updateVendor({
      ...v,
      isFeatured: next,
      is_featured: next,
      featuredOnHomepage: next,
    });
    refreshData();
    showToast(
      next ? 'success' : 'info',
      next ? 'Vendor Featured' : 'Removed from Featured',
      `"${v.businessName}" ${next ? 'added to' : 'removed from'} homepage featured.`,
    );
  };

  const rejectVendor = async (vendorId: string, reason: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    if (!v) return;
    StorageManager.updateVendor({
      ...v,
      status: 'rejected',
      isLive: false,
    });
    refreshData();
    const msg = `Hello ${v.ownerName}, your application for "${v.businessName}" on IkoroduSquare requires changes. Reason: ${reason}.`;
    await ApiService.sendWhatsAppNotification(v.whatsapp, msg);
    showToast(
      'info',
      'Vendor Rejected',
      `Rejection notice sent via WhatsApp to ${v.businessName}.`,
    );
  };

  const deleteVendor = async (vendorId: string) => {
    const v = vendors.find((item) => item.id === vendorId);
    await StorageManager.deleteVendorAsync(vendorId);
    refreshData();
    showToast(
      'info',
      'Vendor Removed',
      `"${v?.businessName ?? 'Store'}" has been deleted.`,
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

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
        isAuthLoading,
        isAuthInitialized,
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

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};