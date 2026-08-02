import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { IKORODU_ZONES, ALL_IKORODU_AREAS, CATEGORY_GROUPS, ALL_SUBCATEGORIES, PROMOTION_PACKAGES } from '../data/ikoroduData';
import { Vendor, PromotionPackageInfo } from '../types';
import { InteractiveIkoroduMap } from '../components/InteractiveIkoroduMap';
import { FAQSection } from '../components/FAQSection';
import { PromotionCheckoutModal } from '../components/PromotionCheckoutModal';
import {
  Search,
  MapPin,
  Store,
  Package,
  MessageCircle,
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  PlusCircle,
  Users,
  Building2,
  Check,
  ExternalLink,
  Navigation,
  X,
  CreditCard,
  Clock,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    vendors,
    products,
    banners,
    promotions,
    currentUser,
    setCurrentPage,
    setShowSetupModal,
    showToast,
    searchType,
    setSearchType,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedArea,
    setSelectedArea,
    navigateToStore,
    toggleFavorite,
    favorites,
  } = useApp();

  const [selectedPromotionPackage, setSelectedPromotionPackage] = useState<PromotionPackageInfo | null>(null);
  const [showRegisterVendorPrompt, setShowRegisterVendorPrompt] = useState<boolean>(false);

  const handlePromoteClick = (pkg: PromotionPackageInfo) => {
    if (!currentUser) {
      showToast('info', 'Sign In Required', 'Please sign in to purchase promotional services.');
      setCurrentPage('auth');
      return;
    }

    const hasVendor = vendors.some(
      (v) => v.ownerEmail === currentUser.email || v.id === currentUser.vendorId
    );

    if (!hasVendor) {
      setShowRegisterVendorPrompt(true);
      return;
    }

    setSelectedPromotionPackage(pkg);
  };

  // Skeleton Loading State for Business Grid
  const [isGridLoading, setIsGridLoading] = useState<boolean>(true);
  const [nearMeActive, setNearMeActive] = useState<boolean>(false);
  const [nearMeLoading, setNearMeLoading] = useState<boolean>(false);
  const [vendorTab, setVendorTab] = useState<'featured' | 'all'>('featured');

  // Search History State (Local Storage)
  const SEARCH_HISTORY_KEY = 'ikorodusquare_search_history';
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Failed to parse search history:', e);
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save search history:', e);
      }
      return updated;
    });
  };

  const removeSearchTerm = (term: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove search term:', e);
      }
      return updated;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  };

  const handleToggleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setSelectedArea('All');
      showToast('info', 'Near Me Deactivated', 'Showing vendors across all 32 areas of Ikorodu.');
    } else {
      setNearMeLoading(true);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (_position) => {
            setNearMeLoading(false);
            setNearMeActive(true);
            const userArea = currentUser?.area || 'Ita Elewa';
            setSelectedArea(userArea);
            showToast('success', '📍 Near Me Active!', `Showing businesses closest to ${userArea}.`);
            const el = document.getElementById('results-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          },
          (_error) => {
            setNearMeLoading(false);
            setNearMeActive(true);
            const defaultArea = currentUser?.area || 'Ita Elewa';
            setSelectedArea(defaultArea);
            showToast('info', '📍 Near Me Active', `Showing businesses around central Ikorodu (${defaultArea}).`);
            const el = document.getElementById('results-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          },
          { timeout: 4000 }
        );
      } else {
        setNearMeLoading(false);
        setNearMeActive(true);
        const defaultArea = currentUser?.area || 'Ita Elewa';
        setSelectedArea(defaultArea);
        showToast('info', '📍 Near Me Active', `Showing businesses around central Ikorodu (${defaultArea}).`);
      }
    }
  };

  useEffect(() => {
    setIsGridLoading(true);
    const timer = setTimeout(() => {
      setIsGridLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedArea, searchType]);

  // Filter vendors based on active search controls (Keyword Search by Business Name, Category, SubCategory, Description, or Neighborhood Area)
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (v.status !== 'approved' || !v.isLive) return false;

      const matchesType = searchType === 'business';
      const query = searchQuery.trim().toLowerCase();

      const matchesQuery =
        !query ||
        v.businessName.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query) ||
        v.subCategory.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.area.toLowerCase().includes(query);

      const matchesCat = selectedCategory === 'All' || v.subCategory === selectedCategory || v.category === selectedCategory;
      const matchesArea = selectedArea === 'All' || v.area === selectedArea;

      return (searchType === 'business' ? matchesType : true) && matchesQuery && matchesCat && matchesArea;
    });
  }, [vendors, searchType, searchQuery, selectedCategory, selectedArea]);

  // Filter products based on active search controls
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesType = searchType === 'product';
      const matchesQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesArea = selectedArea === 'All' || p.vendorArea === selectedArea;

      return (searchType === 'product' ? matchesType : true) && matchesQuery && matchesCat && matchesArea;
    });
  }, [products, searchType, searchQuery, selectedCategory, selectedArea]);

  // Helper to check if vendor is explicitly featured or has an active paid promotion
  const isVendorFeatured = useCallback((v: Vendor) => {
    if (v.status !== 'approved' || !v.isLive) return false;
    const isExplicitlyFeatured = Boolean(v.featuredOnHomepage || v.isFeatured || v.is_featured || v.sponsoredCategorySlot);
    const hasActivePromotion = promotions.some(
      (p) =>
        p.vendorId === v.id &&
        (p.promotionType === 'sponsored_vendor' || p.promotionType === 'category_top_spot') &&
        p.status === 'active' &&
        new Date(p.expiryDate).getTime() > Date.now()
    );
    return isExplicitlyFeatured || hasActivePromotion;
  }, [promotions]);

  // Sponsored & Featured vendors (ONLY vendors manually assigned by Admin to Featured or having active paid promotion)
  const sponsoredVendor = useMemo(() => {
    return vendors.find((v) => isVendorFeatured(v));
  }, [vendors, isVendorFeatured]);

  const featuredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (!isVendorFeatured(v)) return false;
      const matchesCat = selectedCategory === 'All' || v.subCategory === selectedCategory || v.category === selectedCategory;
      const matchesArea = selectedArea === 'All' || v.area === selectedArea;
      return matchesCat && matchesArea;
    });
  }, [vendors, isVendorFeatured, selectedCategory, selectedArea]);
  const activeBanner = banners[0];

  // Open WhatsApp chat directly with pre-filled message
  const handleVendorWhatsApp = (e: React.MouseEvent, whatsapp: string, businessName: string) => {
    e.stopPropagation();
    const cleanPhone = whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi, I found your store on IkoroduSquare. I would like to enquire about your products and services.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleProductWhatsApp = (e: React.MouseEvent, vendor: Vendor | undefined, productName: string) => {
    e.stopPropagation();
    if (!vendor) return;
    const cleanPhone = vendor.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi, I found your store on IkoroduSquare. I am interested in your product called ${productName}. Please let me know the details and availability.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 space-y-12 pb-20">
      {/* 1. HERO SECTION */}
      <section className="bg-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.15)_0,transparent_70%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ikorodu’s Hyperlocal Directory & Marketplace
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ikorodu's Digital Market Square
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Find local businesses, shop authentic products, and connect directly on WhatsApp with verified vendors across all 32 areas of Ikorodu.
            </p>
          </div>

          {/* DUAL SEARCH BAR CONTAINER */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-slate-200 text-slate-900">
            {/* Search Toggle Tabs & Near Me Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-100 p-1.5 rounded-xl max-w-xl mx-auto">
              <div className="flex items-center gap-1 flex-1 min-w-[220px]">
                <button
                  onClick={() => setSearchType('business')}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                    searchType === 'business'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Find Business
                </button>
                <button
                  onClick={() => setSearchType('product')}
                  className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                    searchType === 'product'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Find Product
                </button>
              </div>

              {/* NEAR ME TOGGLE BUTTON */}
              <button
                onClick={handleToggleNearMe}
                disabled={nearMeLoading}
                className={`px-3 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition border shrink-0 ${
                  nearMeActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-2 ring-emerald-300'
                    : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-2xs'
                }`}
                title="Filter businesses by your location in Ikorodu"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${nearMeActive ? 'bg-white' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${nearMeActive ? 'bg-white' : 'bg-emerald-600'}`}></span>
                </span>
                <Navigation className="w-3.5 h-3.5" />
                <span>{nearMeLoading ? 'Locating...' : nearMeActive ? 'Near Me: ON' : 'Near Me'}</span>
              </button>
            </div>

            {/* Inputs & Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Keyword Search Input */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="main-search"
                  type="text"
                  placeholder={
                    searchType === 'business'
                      ? 'Search tailor, phone repair, pharmacy...'
                      : 'Search Senator outfit, solar inverter, Jollof...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) {
                        saveSearchTerm(searchQuery);
                      }
                      const el = document.getElementById('results-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-slate-800"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition"
                    title="Clear search text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-slate-700 font-medium truncate"
                >
                  <option value="All">All Categories</option>
                  {CATEGORY_GROUPS.map((grp) => (
                    <optgroup key={grp.name} label={grp.name}>
                      {grp.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Ikorodu Area Dropdown (All Ikorodu areas grouped) */}
              <div className="sm:col-span-3">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-slate-700 font-medium truncate"
                >
                  <option value="All">All {ALL_IKORODU_AREAS.length} Ikorodu Areas</option>
                  {IKORODU_ZONES.map((zone) => (
                    <optgroup key={zone.name} label={`── ${zone.name} ──`}>
                      {zone.areas.map((area) => (
                        <option key={area} value={area}>
                          📍 {area}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <div className="sm:col-span-1">
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      saveSearchTerm(searchQuery);
                    }
                    const el = document.getElementById('results-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full h-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl py-3 flex items-center justify-center transition shadow-sm"
                  title="Search Market"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* RECENT SEARCHES / SEARCH HISTORY */}
            {searchHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Recent Searches:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {searchHistory.map((term) => (
                    <div
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        saveSearchTerm(term);
                        const el = document.getElementById('results-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 text-slate-700 font-medium cursor-pointer transition border border-slate-200/80 group text-xs shadow-2xs"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => removeSearchTerm(term, e)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-slate-200/80 transition"
                        title="Remove from history"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={clearSearchHistory}
                    className="text-slate-400 hover:text-red-600 text-[11px] font-medium ml-auto transition hover:underline"
                    title="Clear search history"
                  >
                    Clear history
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HOMEPAGE BANNER ADVERTISEMENT SLOT */}
          {activeBanner && (
            <div className="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-amber-500/20 via-slate-800 to-emerald-900/40 rounded-3xl p-4 sm:p-6 border border-amber-400/30 shadow-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/3 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-slate-800 shrink-0 relative">
                <img
                  src={activeBanner.imageURL}
                  alt={activeBanner.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-md">
                  {activeBanner.badgeText}
                </span>
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  {activeBanner.sponsorName}
                </p>
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {activeBanner.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeBanner.subtitle}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (activeBanner.vendorSlug) navigateToStore(activeBanner.vendorSlug);
                    }}
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 fill-slate-950" />
                    {activeBanner.ctaText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. CATEGORY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Browse by Category</h2>
            <p className="text-xs text-slate-500">Explore trusted vendors across Ikorodu's key industries</p>
          </div>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              Reset Category
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORY_GROUPS.map((group) => {
            const isSelected = group.subcategories.includes(selectedCategory);
            return (
              <div
                key={group.name}
                onClick={() => setSelectedCategory(group.subcategories[0])}
                className={`p-4 rounded-xl border cursor-pointer transition text-left space-y-2 ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                    : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{group.name}</h3>
                  <p className="text-[11px] text-slate-500">{group.subcategories.length} subcategories</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subcategory Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full shrink-0 border transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Subcategories
          </button>
          {ALL_SUBCATEGORIES.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedCategory(sub)}
              className={`px-3 py-1.5 rounded-full shrink-0 border transition ${
                selectedCategory === sub
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED VENDORS & CATEGORY TOP SPOT */}
      {(() => {
        const isFiltering = Boolean(searchQuery.trim() || selectedCategory !== 'All' || selectedArea !== 'All');
        const activeVendorsList = isFiltering || vendorTab === 'all' ? filteredVendors : featuredVendors;

        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-2xl font-black text-slate-900">
                    {isFiltering
                      ? `Search Results (${filteredVendors.length})`
                      : vendorTab === 'featured'
                      ? `Featured Ikorodu Stores (${featuredVendors.length})`
                      : `Ikorodu Business Directory (${filteredVendors.length})`}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  {isFiltering
                    ? `Showing verified stores matching active search filters`
                    : vendorTab === 'featured'
                    ? 'Intentionally featured local businesses and active paid promotions'
                    : 'Complete directory of all approved local businesses in Ikorodu'}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                {!isFiltering && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => setVendorTab('featured')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        vendorTab === 'featured'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⭐ Featured ({featuredVendors.length})
                    </button>
                    <button
                      onClick={() => setVendorTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        vendorTab === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏪 All Directory ({filteredVendors.length})
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setCurrentPage('auth')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Get Featured <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vendor Grid */}
            <div id="results-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isGridLoading ? (
                /* Skeleton Loading State Cards for Perceived Performance */
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs animate-pulse flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-36 bg-slate-200 relative">
                        <div className="absolute top-3 left-3 w-20 h-5 bg-slate-300 rounded-full"></div>
                        <div className="absolute bottom-3 left-3 w-28 h-5 bg-slate-300 rounded-md"></div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="h-5 w-2/3 bg-slate-200 rounded-md"></div>
                          <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-md"></div>
                        <div className="h-3 w-4/5 bg-slate-200 rounded-md"></div>
                        <div className="pt-2">
                          <div className="h-6 w-32 bg-orange-100/60 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                      <div className="h-8 w-28 bg-emerald-200/50 rounded-xl"></div>
                    </div>
                  </div>
                ))
              ) : activeVendorsList.length === 0 ? (
                <div className="col-span-full bg-white p-10 rounded-3xl text-center border border-slate-200 space-y-3">
                  <Store className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {!isFiltering && vendorTab === 'featured'
                      ? 'No featured stores currently listed'
                      : 'No stores found in this area/category'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {!isFiltering && vendorTab === 'featured'
                      ? 'All approved businesses can be viewed in the complete Ikorodu Directory below.'
                      : `Try selecting "All ${ALL_IKORODU_AREAS.length} Ikorodu Areas" or "All Categories" to see all verified businesses.`}
                  </p>
                  <button
                    onClick={() => {
                      if (!isFiltering && vendorTab === 'featured') {
                        setVendorTab('all');
                      } else {
                        setSelectedCategory('All');
                        setSelectedArea('All');
                        setSearchQuery('');
                      }
                    }}
                    className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-700 transition"
                  >
                    {!isFiltering && vendorTab === 'featured' ? 'View All Store Directory' : 'Reset Search Filters'}
                  </button>
                </div>
              ) : (
                activeVendorsList.map((vendor) => {
                  const isFav = favorites.includes(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => navigateToStore(vendor.slug)}
                      className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-xl transition group cursor-pointer flex flex-col justify-between ${
                        vendor.sponsoredCategorySlot || vendor.featuredOnHomepage || vendor.isFeatured || vendor.is_featured
                          ? 'border-amber-300 ring-1 ring-amber-300'
                          : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Cover & Badges */}
                        <div className="h-36 bg-slate-200 relative overflow-hidden">
                          <img
                            src={vendor.coverPhotoURL}
                            alt={vendor.businessName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            {(vendor.sponsoredCategorySlot || vendor.featuredOnHomepage || vendor.isFeatured || vendor.is_featured) && (
                              <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-md">
                                {vendor.sponsoredCategorySlot ? 'Sponsored' : 'Featured'}
                              </span>
                            )}
                            <span className="bg-slate-900/80 backdrop-blur-xs text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                              {vendor.subCategory}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(vendor.id);
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                              isFav ? 'bg-rose-500 text-white' : 'bg-slate-900/60 text-white hover:bg-slate-900'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                          </button>

                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <MapPin className="w-3 h-3" /> {vendor.area}
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition line-clamp-1">
                                  {vendor.businessName}
                                </h3>
                                {(vendor.ninVerified || vendor.nin_verified) && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-2xs shrink-0">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{vendor.address}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-bold text-amber-900">{vendor.rating}</span>
                              <span className="text-[10px] text-amber-700">({vendor.reviewCount})</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {vendor.description}
                          </p>

                          {/* SPECIFIC IKORODU NEIGHBORHOOD LOCATION BADGE */}
                          <div className="pt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-orange-50 text-orange-900 border border-orange-200/80 shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span>📍 {vendor.area} Neighborhood</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        {(vendor.ninVerified || vendor.nin_verified) ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verified Shop</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                            <Store className="w-4 h-4 text-slate-400" />
                            <span>Listed Shop</span>
                          </div>
                        )}

                        <button
                          onClick={(e) => handleVendorWhatsApp(e, vendor.whatsapp, vendor.businessName)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          Chat WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })()}

      {/* 4. TRENDING PRODUCTS GRID */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h2 className="text-2xl font-black text-slate-900">Trending Products in Ikorodu</h2>
            </div>
            <p className="text-xs text-slate-500">Shop items listed by local vendors in Agric, Ita Elewa, Igbogbo & more</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((prod) => {
            const vendor = vendors.find((v) => v.id === prod.vendorId);
            return (
              <div
                key={prod.id}
                onClick={() => navigateToStore(prod.vendorSlug)}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Price */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    <img
                      src={prod.photoURL}
                      alt={prod.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs text-amber-300 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-amber-400/30">
                      ₦{prod.price.toLocaleString()}
                    </div>
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      📍 {prod.vendorArea}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      {prod.vendorName}
                    </p>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Contact Seller Button */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={(e) => handleProductWhatsApp(e, vendor, prod.name)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    Contact Seller
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SIDEBAR / BROWSEABLE IKORODU AREAS & PLATFORM STATS */}
      <section id="areas-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Areas List Grouped by Zone */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-extrabold text-slate-900">Explore All 32 Areas of Ikorodu</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {IKORODU_ZONES.map((zone) => (
                <div key={zone.name} className="space-y-2">
                  <h4 className="font-extrabold text-sm text-emerald-800 border-b border-emerald-100 pb-1">
                    {zone.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.areas.map((area) => (
                      <button
                        key={area}
                        onClick={() => {
                          setSelectedArea(area);
                          const el = document.getElementById('results-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                          selectedArea === area
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Stats Counter */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <TrendingUp className="w-4 h-4" /> Market Growth
              </div>
              <h3 className="text-2xl font-black">Ikorodu Square in Numbers</h3>
              <p className="text-xs text-slate-300 mt-1">
                Connecting buyers and sellers across Ikorodu every day.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-amber-400">1,420+</p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">Verified Vendors</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-emerald-400">5,800+</p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">Products Listed</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-emerald-400">24,500+</p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">WhatsApp Connections</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <p className="text-2xl font-black text-amber-400">32 / 32</p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">Areas Covered</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('auth')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-2xl shadow-md transition text-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Register Your Shop Today
            </button>
          </div>
        </div>
      </section>

      {/* 6. VENDOR PLANS & PAID ADD-ONS SECTION */}
      <section id="plans-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-black text-slate-900">Vendor Pricing Tiers</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Start for free forever or upgrade to boost your visibility across Ikorodu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Listing Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                Basic Listing
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">₦0</span>
                <span className="text-xs font-medium text-slate-500">/ forever free</span>
              </div>
              <p className="text-xs text-slate-600">Perfect for small artisans and new market entrants.</p>

              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Business Profile Page with Address & Map
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Up to 5 Product Catalogue Listings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Direct WhatsApp & Phone Contact Buttons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Customer Ratings & Star Reviews
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentPage('auth')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Get Started Free
            </button>
          </div>

          {/* Premium Store Card */}
          <div className="bg-gradient-to-b from-slate-900 to-emerald-950 text-white rounded-3xl p-8 border border-emerald-500/50 space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <span className="absolute top-4 right-4 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              POPULAR CHOICE
            </span>

            <div className="space-y-4">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase border border-emerald-500/30">
                Premium Store
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">₦5,000</span>
                <span className="text-xs font-medium text-emerald-200">/ per month</span>
              </div>
              <p className="text-xs text-slate-300">Maximise your sales and reach buyers in every zone.</p>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Everything in Basic + Unlimited Products
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Featured Placement in Search Results
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Homepage Visibility Boost & Verified Badge
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Detailed Store Analytics (Views & WhatsApp Taps)
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentPage('auth')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-md"
            >
              Subscribe Premium (₦5,000)
            </button>
          </div>
        </div>

        {/* Paid Add-ons Grid */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" /> Paid Promotional Add-ons
              </h3>
              <p className="text-xs text-slate-500">Boost your store's exposure across Ikorodu with automated 2-week campaign placements.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              14-Day Automated Duration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {PROMOTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.type}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <p className="font-black text-sm text-slate-900">{pkg.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-emerald-700 font-black text-lg">₦{pkg.price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-500">/ 2 Weeks</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-2 leading-relaxed">{pkg.description}</p>
                </div>

                <button
                  onClick={() => handlePromoteClick(pkg)}
                  className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {pkg.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotion Checkout Modal */}
      <PromotionCheckoutModal
        isOpen={!!selectedPromotionPackage}
        onClose={() => setSelectedPromotionPackage(null)}
        packageInfo={selectedPromotionPackage}
      />

      {/* Business Registration Required Modal */}
      {showRegisterVendorPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Building2 className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900">Vendor Account Required</h3>
              </div>
              <button
                onClick={() => setShowRegisterVendorPrompt(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-bold text-sm">Register Your Business First</p>
              <p className="text-slate-700">
                You need to register your business before purchasing promotional services.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRegisterVendorPrompt(false);
                  setShowSetupModal(true);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Register Your Business
              </button>
              <button
                onClick={() => setShowRegisterVendorPrompt(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. STORE SETUP SERVICE CARD & HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Assistance Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-3xl p-6 space-y-3 shadow-lg md:col-span-1 flex flex-col justify-between">
          <div>
            <span className="bg-slate-950 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Field Agent Onboarding
            </span>
            <h3 className="text-2xl font-black mt-2">Need Help Setting Up?</h3>
            <p className="text-xs font-medium text-slate-900 leading-relaxed mt-1">
              Our Ikorodu team comes physically to your shop to capture products, verify your NIN, and create your online store for <strong>₦10,000 - ₦25,000</strong>.
            </p>
          </div>
          <button
            onClick={() => setShowSetupModal(true)}
            className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Book Store Setup Service
          </button>
        </div>

        {/* How It Works (3 Steps) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 md:col-span-2 space-y-4 shadow-xs">
          <h3 className="font-black text-xl text-slate-900">How IkoroduSquare Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Search Area & Category</h4>
              <p className="text-xs text-slate-600">Select your area in Ikorodu to find nearby shops.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Explore Storefront</h4>
              <p className="text-xs text-slate-600">Browse products, view photos, prices, and reviews.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Chat Directly on WhatsApp</h4>
              <p className="text-xs text-slate-600">No middleman. Negotiate and order directly with vendors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQSection />
      </section>

      {/* 9. INTERACTIVE IKORODU MAP COMPONENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractiveIkoroduMap />
      </section>
    </div>
  );
};
