import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReviewModal } from '../components/ReviewModal';
import { VendorChatModal } from '../components/VendorChatModal';
import { VendorProfileSkeleton } from '../components/Skeletons';
import {
  MapPin,
  MessageCircle,
  Phone,
  Star,
  CheckCircle2,
  Package,
  Image as ImageIcon,
  MessageSquareQuote,
  Clock,
  Heart,
  Share2,
  ArrowLeft,
  Store,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const VendorProfilePage: React.FC = () => {
  const {
    activeVendorSlug,
    vendors,
    products,
    reviews,
    isLoading,
    navigateToStore,
    setCurrentPage,
    toggleFavorite,
    favorites,
    showToast,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'photos' | 'reviews'>('products');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatProductTopic, setChatProductTopic] = useState<string | undefined>(undefined);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Loading skeleton state while fetching data
  if (isLoading || (vendors.length === 0 && isLoading !== false)) {
    return <VendorProfileSkeleton />;
  }

  // 2. Flexible vendor matching by slug, id, or decoded name
  const rawSlug = (activeVendorSlug || '').toLowerCase().trim();
  const decodedSlug = decodeURIComponent(rawSlug);
  const cleanSlug = decodedSlug.replace(/[^a-z0-9]/g, '');

  let vendor = vendors.find((v) => {
    const vSlug = v.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const vName = v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const vId = v.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      v.slug.toLowerCase() === rawSlug ||
      v.slug.toLowerCase() === decodedSlug ||
      vSlug === cleanSlug ||
      vName.includes(cleanSlug) ||
      vId === cleanSlug
    );
  });

  // If activeVendorSlug is null or empty, fallback to first vendor
  if (!vendor && (!rawSlug || rawSlug === '')) {
    vendor = vendors[0];
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100 space-y-5">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-2xl text-slate-900 font-sans">Store Not Found</h3>
            <p className="text-sm text-slate-500 mt-2 font-sans">
              The vendor store "{activeVendorSlug || 'requested'}" could not be located on IkoroduSquare. It may have been updated or moved.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              Explore Ikorodu Marketplace
            </button>
            {vendors.length > 0 && (
              <button
                onClick={() => navigateToStore(vendors[0].slug)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs transition-all"
              >
                View Featured Store ({vendors[0].name})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const vendorProducts = products.filter((p) => p.vendorId === vendor.id);
  const vendorReviews = reviews.filter((r) => r.vendorId === vendor.id);
  const isFav = favorites.includes(vendor.id);

  const isOwner = Boolean(
    currentUser && (
      currentUser.vendorId === vendor.id ||
      (vendor.email && currentUser.email && vendor.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      currentUser.id === vendor.id
    )
  );

  // Related vendors in same area or category
  const relatedVendors = vendors.filter(
    (v) => v.id !== vendor.id && (v.area === vendor.area || v.category === vendor.category)
  );

  // Main WhatsApp pre-filled message (PRD mandated)
  const handleMainWhatsApp = () => {
    const cleanPhone = vendor.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi, I found your store on IkoroduSquare. I would like to enquire about your products and services.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Product specific WhatsApp pre-filled message (PRD mandated)
  const handleProductWhatsApp = (productName: string) => {
    const cleanPhone = vendor.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi, I found your store on IkoroduSquare. I am interested in your product called ${productName}. Please let me know the details and availability.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Direct shop share link generator
  const getStoreShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?store=${vendor?.slug || ''}`;
    }
    return `https://ikorodusquare.com.ng/?store=${vendor?.slug || ''}`;
  };

  const handleCopyShareLink = () => {
    const link = getStoreShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        showToast('success', 'Link Copied!', `Direct shop link for ${vendor.businessName} copied to clipboard.`);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {
        showToast('info', 'Shop Link', link);
      });
    } else {
      showToast('info', 'Shop Link', link);
    }
  };

  const handleNativeShare = async () => {
    const link = getStoreShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vendor.businessName} - IkoroduSquare`,
          text: `Check out ${vendor.businessName} located in ${vendor.area}, Ikorodu on IkoroduSquare!`,
          url: link,
        });
        return;
      } catch (e) {
        // Fallback to share modal if user cancels or native share unavailable
      }
    }
    setShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Back Button Bar */}
      <div className="bg-slate-900 text-white py-3 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 hover:text-emerald-400 transition font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Market Search
          </button>
          <span className="text-slate-400 hidden sm:inline">
            ikorodusquare.com.ng/store/{vendor.slug}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-full font-bold transition border border-slate-700 shadow-2xs"
              title="Share Shop Link"
            >
              <Share2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Share Shop</span>
            </button>
            <button
              onClick={() => toggleFavorite(vendor.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition ${
                isFav ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
              <span>{isFav ? 'Saved' : 'Save Store'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* COVER PHOTO & PROFILE HEADER */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        {/* Cover Photo Banner */}
        <div className="h-44 sm:h-64 md:h-72 bg-slate-900 relative overflow-hidden max-w-7xl mx-auto">
          <img
            src={vendor.coverPhotoURL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop'}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
          {/* Top-Right Online Status Badge on Cover */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
            <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-emerald-500/40 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Online Now</span>
            </span>
          </div>
        </div>

        {/* LOGO OVERLAPPING BOTTOM-LEFT & BUSINESS INFO STRICTLY BELOW COVER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-12 sm:-mt-16">
            {/* Profile Logo & Details Container */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 min-w-0 flex-1">
              {/* Profile Logo overlapping bottom-left of cover image */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-white p-1.5 shadow-xl border-4 border-white overflow-hidden shrink-0 relative z-20">
                <img
                  src={vendor.logoURL}
                  alt={vendor.businessName}
                  className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                />
              </div>

              {/* Business Details (Positioned beneath cover image with clean line wrapping and spacing) */}
              <div className="space-y-2 pt-1 sm:pt-0 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 break-words leading-tight">
                    {vendor.businessName}
                  </h1>
                  {(vendor.ninVerified || vendor.nin_verified) && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  )}
                  {vendor.isPremium && (
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>Premium</span>
                    </span>
                  )}
                </div>

                {/* Single Clean Address Line with Lucide MapPin */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 break-words">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{vendor.address}</span>
                </p>

                {/* Rating, Category & Opening Hours */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap pt-1">
                  <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {vendor.rating} ({vendor.reviewCount} reviews)
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md border border-slate-200">
                    Category: {vendor.subCategory}
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {vendor.openingHours || 'Mon - Sat: 8:00 AM - 7:00 PM'}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: Owner vs Visitor */}
            <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 shrink-0">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <Store className="w-4 h-4" />
                    Edit Store
                  </button>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <Package className="w-4 h-4 text-orange-400" />
                    Manage Products
                  </button>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition border border-slate-300"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-700" />
                    View Analytics
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleFavorite(vendor.id)}
                    className={`font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition border ${
                      isFav
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                    <span>{isFav ? 'Saved' : 'Save Store'}</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-2xs"
                    title="Share Shop Direct Link"
                  >
                    <Share2 className="w-4 h-4 text-orange-600" />
                    <span>Share</span>
                  </button>

                  <a
                    href={`tel:${vendor.phone || vendor.whatsapp}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-300"
                  >
                    <Phone className="w-4 h-4 text-slate-700" /> Call
                  </a>

                  <button
                    onClick={() => {
                      setChatProductTopic(undefined);
                      setChatModalOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 text-orange-400" />
                    Chat
                  </button>

                  <button
                    onClick={handleMainWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 text-sm font-bold gap-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'products'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> Products Catalogue ({vendorProducts.length})
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-3 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'photos'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Store Photos ({vendor.galleryPhotos?.length || 1})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'reviews'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" /> Customer Reviews ({vendorReviews.length})
          </button>
        </div>

        {/* TAB 1: PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="py-6 space-y-6">
            {vendorProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center border border-slate-200 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-800">Catalogue is being updated</p>
                <p className="text-xs text-slate-500">Contact the vendor directly on WhatsApp for full inventory.</p>
                <button
                  onClick={handleMainWhatsApp}
                  className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2"
                >
                  Ask Vendor on WhatsApp
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendorProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-48 bg-slate-100 relative">
                        <img src={prod.photoURL} alt={prod.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs text-amber-300 font-black text-sm px-3 py-1 rounded-xl border border-amber-400/30">
                          ₦{prod.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <h3 className="font-extrabold text-base text-slate-900">{prod.name}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{prod.description}</p>
                      </div>
                    </div>

                    {/* Contact Seller Buttons */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setChatProductTopic(prod.name);
                          setChatModalOpen(true);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                        Chat Vendor
                      </button>

                      <button
                        onClick={() => handleProductWhatsApp(prod.name)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="py-6 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">Store Showcase & Work Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="aspect-video sm:aspect-square bg-slate-200 rounded-2xl overflow-hidden">
                <img src={vendor.coverPhotoURL} alt="Store front" className="w-full h-full object-cover" />
              </div>
              {vendor.galleryPhotos?.map((photo, idx) => (
                <div key={idx} className="aspect-video sm:aspect-square bg-slate-200 rounded-2xl overflow-hidden">
                  <img src={photo} alt={`Showcase ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="py-6 space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Customer Reviews</h3>
                <p className="text-xs text-slate-500">Read what local Ikorodu residents say about {vendor.businessName}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                Leave a Review
              </button>
            </div>

            {vendorReviews.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center border border-slate-200 space-y-2">
                <p className="font-bold text-sm text-slate-800">Be the first to review {vendor.businessName}!</p>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Write First Review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {vendorReviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                          {rev.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{rev.userName}</p>
                          <p className="text-[10px] text-slate-500">📍 {rev.userArea}</p>
                        </div>
                      </div>
                      <span className="text-amber-500 font-bold text-xs">{rev.rating} ★</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FULL ABOUT & LOCATION SECTION */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-lg text-slate-900">About {vendor.businessName}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{vendor.description}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Location & Contact Info</h3>
            <div className="text-xs space-y-2.5 text-slate-700">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{vendor.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{vendor.phone || vendor.whatsapp}</span>
              </p>
              {vendor.openingHours && (
                <p className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>{vendor.openingHours}</span>
                </p>
              )}
              {vendor.instagram && (
                <p className="flex items-center gap-2 text-indigo-600 font-medium">
                  <span className="font-bold">IG:</span>
                  <a
                    href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {vendor.instagram.startsWith('@') ? vendor.instagram : `@${vendor.instagram}`}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* STRIP SHOWING OTHER BUSINESSES IN SAME AREA & CATEGORY */}
        {relatedVendors.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
            <h3 className="font-extrabold text-xl text-slate-900">
              Other Businesses in {vendor.area} & {vendor.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedVendors.slice(0, 3).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigateToStore(rel.slug)}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 cursor-pointer transition flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                    <img src={rel.logoURL} alt={rel.businessName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{rel.businessName}</h4>
                    <p className="text-[10px] text-slate-500 truncate">📍 {rel.area}</p>
                    <p className="text-[10px] text-amber-600 font-bold">{rel.rating} ★</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FIXED BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-2.5 shadow-2xl flex items-center gap-2">
        {isOwner ? (
          <>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex-1 bg-orange-600 active:bg-orange-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Store className="w-4 h-4" />
              Edit Store
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex-1 bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Package className="w-4 h-4 text-orange-400" />
              Manage Products
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleNativeShare}
              className="p-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-2xl text-slate-800 border border-slate-300 transition shrink-0"
              title="Share Store Link"
            >
              <Share2 className="w-5 h-5 text-orange-600" />
            </button>

            <a
              href={`tel:${vendor.phone || vendor.whatsapp}`}
              className="p-3 bg-slate-100 rounded-2xl text-slate-800 border border-slate-300 shrink-0"
            >
              <Phone className="w-5 h-5" />
            </a>

            <button
              onClick={() => {
                setChatProductTopic(undefined);
                setChatModalOpen(true);
              }}
              className="flex-1 bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <MessageSquare className="w-4 h-4 text-orange-400" />
              Chat
            </button>

            <button
              onClick={handleMainWhatsApp}
              className="flex-1 bg-emerald-600 active:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              WhatsApp
            </button>
          </>
        )}
      </div>

      {/* Share Shop Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 p-1 border border-orange-200 shrink-0 overflow-hidden">
                <img src={vendor.logoURL} alt={vendor.businessName} className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{vendor.businessName}</h3>
                <p className="text-xs text-slate-500 font-medium">📍 {vendor.area}, Ikorodu</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Direct Shop Link
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                <input
                  type="text"
                  readOnly
                  value={getStoreShareUrl()}
                  className="bg-transparent text-xs text-slate-700 font-mono flex-1 outline-none px-2 truncate"
                />
                <button
                  onClick={handleCopyShareLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-600">Share directly to Social Media:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${vendor.businessName} in ${vendor.area}, Ikorodu on IkoroduSquare: ${getStoreShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getStoreShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${vendor.businessName} on IkoroduSquare!`)}&url=${encodeURIComponent(getStoreShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>X (Twitter)</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getStoreShareUrl())}&text=${encodeURIComponent(`Check out ${vendor.businessName} on IkoroduSquare!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold p-2.5 rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Vendor Chat Modal */}
      <VendorChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        vendor={vendor}
        initialProduct={chatProductTopic}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        vendorId={vendor.id}
        vendorName={vendor.businessName}
      />
    </div>
  );
};
