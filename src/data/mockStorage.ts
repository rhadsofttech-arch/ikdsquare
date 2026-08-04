import { Vendor, Product, Review, Enquiry, User, BannerAd, Order, DeliveryAddress, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_REVIEWS, INITIAL_BANNER_ADS, INITIAL_PROMOTIONS } from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const VENDORS_KEY = 'ikorodusquare_vendors_v1';
const PRODUCTS_KEY = 'ikorodusquare_products_v1';
const REVIEWS_KEY = 'ikorodusquare_reviews_v1';
const ENQUIRIES_KEY = 'ikorodusquare_enquiries_v1';
const USERS_KEY = 'ikorodusquare_users_v1';
const FAVORITES_KEY = 'ikorodusquare_favorites_v1';
const BANNERS_KEY = 'ikorodusquare_banners_v1';
const ORDERS_KEY = 'ikorodusquare_orders_v1';
const PROMOTIONS_KEY = 'ikorodusquare_promotions_v1';
const SETTINGS_KEY = 'ikorodusquare_settings_v2';

// ═══════════════════════════════════════════════════════════════
// NOTE: Authentication state has been REMOVED from StorageManager
// ═══════════════════════════════════════════════════════════════
// - getCurrentUser() - REMOVED
// - setCurrentUserAsync() - REMOVED  
// - setCurrentUser() - REMOVED
// - CURRENT_USER_KEY - REMOVED
//
// Authentication is now managed EXCLUSIVELY by AppContext using Supabase
// ═══════════════════════════════════════════════════════════════

// Data Mappers (unchanged)
export function vendorToRow(v: Vendor) {
  const isFeaturedVal = Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
  return {
    id: v.id,
    slug: v.slug,
    business_name: v.businessName,
    owner_name: v.ownerName,
    email: v.email,
    email_verified: v.emailVerified,
    whatsapp: v.whatsapp,
    phone: v.phone,
    category: v.category,
    sub_category: v.subCategory,
    area: v.area,
    zone: v.zone,
    description: v.description,
    address: v.address,
    cover_photo_url: v.coverPhotoURL,
    logo_url: v.logoURL,
    status: v.status,
    is_live: v.isLive,
    is_premium: v.isPremium,
    nin_verified: v.ninVerified ?? v.nin_verified ?? false,
    is_featured: isFeaturedVal,
    created_at: v.createdAt,
    rating: v.rating,
    review_count: v.reviewCount,
    analytics: v.analytics,
  };
}

export function rowToVendor(r: any): Vendor {
  const isFeaturedVal = Boolean(r.is_featured ?? r.isFeatured ?? r.featuredOnHomepage ?? false);
  const ninVerifiedVal = Boolean(r.nin_verified ?? r.ninVerified ?? false);
  return {
    id: r.id,
    slug: r.slug,
    businessName: r.business_name || r.businessName || '',
    ownerName: r.owner_name || r.ownerName || '',
    email: r.email || '',
    emailVerified: r.email_verified ?? r.emailVerified ?? false,
    whatsapp: r.whatsapp || '',
    phone: r.phone || '',
    category: r.category || 'Lifestyle',
    subCategory: r.sub_category || r.subCategory || '',
    area: r.area || 'Agric',
    zone: r.zone || 'East zone',
    description: r.description || '',
    address: r.address || '',
    coverPhotoURL: r.cover_photo_url || r.coverPhotoURL || '',
    logoURL: r.logo_url || r.logoURL || '',
    status: r.status || 'approved',
    isLive: r.is_live ?? r.isLive ?? true,
    isPremium: r.is_premium ?? r.isPremium ?? false,
    ninVerified: ninVerifiedVal,
    nin_verified: ninVerifiedVal,
    isFeatured: isFeaturedVal,
    is_featured: isFeaturedVal,
    featuredOnHomepage: isFeaturedVal,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    rating: r.rating ? Number(r.rating) : 5.0,
    reviewCount: r.review_count ?? r.reviewCount ?? 0,
    analytics: r.analytics || { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] },
  };
}

function productToRow(p: Product) {
  return {
    id: p.id,
    vendor_id: p.vendorId,
    vendor_name: p.vendorName,
    vendor_slug: p.vendorSlug,
    vendor_area: p.vendorArea || '',
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    image_url: p.photoURL,
    is_available: p.available,
    is_featured: p.featured ?? false,
    created_at: p.createdAt,
  };
}

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    vendorId: r.vendor_id || r.vendorId || '',
    vendorName: r.vendor_name || r.vendorName || '',
    vendorSlug: r.vendor_slug || r.vendorSlug || '',
    vendorArea: r.vendor_area || r.vendorArea || 'Agric',
    name: r.name || '',
    description: r.description || '',
    price: Number(r.price || 0),
    category: r.category || '',
    photoURL: r.image_url || r.photoURL || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    available: r.is_available ?? r.available ?? true,
    featured: r.is_featured ?? r.featured ?? false,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

function reviewToRow(r: Review) {
  return {
    id: r.id,
    vendor_id: r.vendorId,
    user_name: r.userName,
    user_area: r.userArea || '',
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt,
  };
}

function rowToReview(r: any): Review {
  return {
    id: r.id,
    vendorId: r.vendor_id || r.vendorId || '',
    userName: r.user_name || r.userName || 'Anonymous',
    userArea: r.user_area || r.userArea || 'Ikorodu',
    rating: Number(r.rating || 5),
    comment: r.comment || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

function orderToRow(o: Order) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    user_id: o.userId,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    vendor_id: o.vendorId,
    vendor_name: o.vendorName,
    vendor_slug: o.vendorSlug,
    vendor_whatsapp: o.vendorWhatsapp,
    vendor_area: o.vendorArea,
    items: o.items,
    total_amount: o.totalAmount,
    status: o.status,
    delivery_address: o.deliveryAddress,
    payment_method: o.paymentMethod,
    notes: o.notes,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number || r.orderNumber || '',
    userId: r.user_id || r.userId || '',
    customerName: r.customer_name || r.customerName || '',
    customerPhone: r.customer_phone || r.customerPhone || '',
    vendorId: r.vendor_id || r.vendorId || '',
    vendorName: r.vendor_name || r.vendorName || '',
    vendorSlug: r.vendor_slug || r.vendorSlug || '',
    vendorWhatsapp: r.vendor_whatsapp || r.vendorWhatsapp || '',
    vendorArea: r.vendor_area || r.vendorArea || '',
    items: r.items || [],
    totalAmount: Number(r.total_amount || r.totalAmount || 0),
    status: r.status || 'pending',
    deliveryAddress: r.delivery_address || r.deliveryAddress,
    paymentMethod: r.payment_method || r.paymentMethod || 'pay_on_delivery',
    notes: r.notes || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function enquiryToRow(e: Enquiry) {
  return {
    id: e.id,
    vendor_id: e.vendorId,
    customer_name: e.customerName,
    customer_phone: e.customerPhone,
    customer_area: e.customerArea,
    product_name: e.productName,
    message: e.message,
    created_at: e.createdAt,
    read: e.read,
    read_status: e.readStatus,
    reply_text: e.replyText,
    replied_at: e.repliedAt,
  };
}

function rowToEnquiry(r: any): Enquiry {
  return {
    id: r.id,
    vendorId: r.vendor_id || r.vendorId || '',
    customerName: r.customer_name || r.customerName || '',
    customerPhone: r.customer_phone || r.customerPhone || '',
    customerArea: r.customer_area || r.customerArea || '',
    productName: r.product_name || r.productName,
    message: r.message || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    read: r.read ?? false,
    readStatus: r.read_status ?? r.readStatus ?? false,
    replyText: r.reply_text || r.replyText,
    repliedAt: r.replied_at || r.repliedAt,
  };
}

// ============================================================
// STORAGE MANAGER - Application Data Only (No Auth)
// ============================================================
export class StorageManager {
  // ============================================================
  // INIT
  // ============================================================
  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[StorageManager] Supabase not configured. Operating with local storage.');
      return;
    }

    try {
      // 1. Vendors
      const { data: supaVendors, error: vErr } = await supabase.from('vendors').select('*');
      if (vErr) {
        console.error('[StorageManager] Vendor fetch error:', vErr);
      } else if (supaVendors && supaVendors.length > 0) {
        const fetched = supaVendors.map(rowToVendor);
        localStorage.setItem(VENDORS_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        console.log('[StorageManager] Seeding vendors to Supabase...');
        for (const v of SEED_VENDORS) {
          await supabase.from('vendors').upsert(vendorToRow(v));
        }
      }

      // 2. Products
      const { data: supaProducts, error: pErr } = await supabase.from('products').select('*');
      if (pErr) {
        console.error('[StorageManager] Product fetch error:', pErr);
      } else if (supaProducts && supaProducts.length > 0) {
        const fetched = supaProducts.map(rowToProduct);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        console.log('[StorageManager] Seeding products to Supabase...');
        for (const p of SEED_PRODUCTS) {
          await supabase.from('products').upsert(productToRow(p));
        }
      }

      // 3. Reviews
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (supaReviews && supaReviews.length > 0) {
        const fetched = supaReviews.map(rowToReview);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(fetched));
      } else {
        for (const r of SEED_REVIEWS) {
          await supabase.from('reviews').upsert(reviewToRow(r));
        }
      }

      // 4. Orders
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (supaOrders && supaOrders.length > 0) {
        const fetched = supaOrders.map(rowToOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(fetched));
      }

      // 5. Enquiries
      const { data: supaEnquiries } = await supabase.from('enquiries').select('*');
      if (supaEnquiries && supaEnquiries.length > 0) {
        const fetched = supaEnquiries.map(rowToEnquiry);
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      }

      // Realtime subscriptions
      supabase
        .channel('public:vendors')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, async () => {
          const { data } = await supabase.from('vendors').select('*');
          if (data) {
            localStorage.setItem(VENDORS_KEY, JSON.stringify(data.map(rowToVendor)));
            if (onUpdate) onUpdate();
          }
        })
        .subscribe();

      supabase
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
          const { data } = await supabase.from('products').select('*');
          if (data) {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.map(rowToProduct)));
            if (onUpdate) onUpdate();
          }
        })
        .subscribe();

      supabase
        .channel('public:enquiries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, async () => {
          const { data } = await supabase.from('enquiries').select('*');
          if (data) {
            localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(data.map(rowToEnquiry)));
            if (onUpdate) onUpdate();
          }
        })
        .subscribe();

    } catch (error) {
      console.warn('[StorageManager] Sync warning:', error);
    }
  }

  // ============================================================
  // VENDORS
  // ============================================================
  static getVendors(): Vendor[] {
    try {
      const data = localStorage.getItem(VENDORS_KEY);
      if (!data) {
        localStorage.setItem(VENDORS_KEY, JSON.stringify(SEED_VENDORS));
        return SEED_VENDORS;
      }
      const list: Vendor[] = JSON.parse(data);
      const existingIds = new Set(list.map((v) => v.id));
      let updated = false;
      for (const sv of SEED_VENDORS) {
        if (!existingIds.has(sv.id)) {
          list.push(sv);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(VENDORS_KEY, JSON.stringify(list));
      }
      return list;
    } catch {
      return SEED_VENDORS;
    }
  }

  static saveVendors(vendors: Vendor[]): void {
    localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
  }

  static getVendorBySlug(slug: string): Vendor | undefined {
    const raw = (slug || '').toLowerCase().trim();
    const cleanSlug = raw.replace(/[^a-z0-9]/g, '');
    return this.getVendors().find((v) => {
      const vSlug = v.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vName = v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vId = v.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return vSlug === cleanSlug || vName.includes(cleanSlug) || vId === cleanSlug;
    });
  }

  static getVendorById(id: string): Vendor | undefined {
    return this.getVendors().find((v) => v.id === id);
  }

  static async addVendorAsync(newVendor: Vendor): Promise<Vendor> {
    // Check for existing vendor by email to prevent duplicates
    const existing = this.getVendors().find(
      (v) => v.email && v.email.toLowerCase() === newVendor.email?.toLowerCase()
    );

    if (existing) {
      console.log('[StorageManager] Vendor already exists, updating instead of creating duplicate:', existing.id);
      const merged = { ...existing, ...newVendor };
      return this.updateVendorAsync(merged);
    }

    // Save to local storage
    const vendors = this.getVendors();
    const existingIndex = vendors.findIndex((v) => v.id === newVendor.id);
    if (existingIndex !== -1) {
      vendors[existingIndex] = newVendor;
    } else {
      vendors.unshift(newVendor);
    }
    this.saveVendors(vendors);

    // Sync to Supabase
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('vendors').upsert(vendorToRow(newVendor));
        if (error) {
          console.error('[StorageManager] Supabase vendor upsert error:', error);
        } else {
          console.log('[StorageManager] Vendor synced to Supabase:', newVendor.id);
        }
      } catch (error) {
        console.error('[StorageManager] Supabase vendor upsert exception:', error);
      }
    }

    return newVendor;
  }

  static addVendor(newVendor: Vendor): Vendor {
    this.addVendorAsync(newVendor);
    return newVendor;
  }

  static async updateVendorAsync(updated: Vendor): Promise<Vendor> {
    const vendors = this.getVendors();
    const index = vendors.findIndex((v) => v.id === updated.id);
    if (index !== -1) {
      vendors[index] = updated;
      this.saveVendors(vendors);
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('vendors').upsert(vendorToRow(updated));
      } catch (error) {
        console.error('[StorageManager] Supabase vendor update error:', error);
      }
    }
    return updated;
  }

  static updateVendor(updated: Vendor): Vendor {
    this.updateVendorAsync(updated);
    return updated;
  }

  static async deleteVendorAsync(vendorId: string): Promise<void> {
    const vendors = this.getVendors().filter((v) => v.id !== vendorId);
    this.saveVendors(vendors);

    const products = this.getProducts().filter((p) => p.vendorId !== vendorId);
    this.saveProducts(products);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('vendors').delete().eq('id', vendorId);
        await supabase.from('products').delete().eq('vendor_id', vendorId);
      } catch (error) {
        console.error('[StorageManager] Supabase vendor delete error:', error);
      }
    }
  }

  static deleteVendor(vendorId: string): void {
    this.deleteVendorAsync(vendorId);
  }

  // ============================================================
  // PRODUCTS
  // ============================================================
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
      }
      const list: Product[] = JSON.parse(data);
      const existingIds = new Set(list.map((p) => p.id));
      let updated = false;
      for (const sp of SEED_PRODUCTS) {
        if (!existingIds.has(sp.id)) {
          list.push(sp);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
      }
      return list;
    } catch {
      return SEED_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  static async addProductAsync(product: Product): Promise<Product> {
    const products = this.getProducts();
    products.unshift(product);
    this.saveProducts(products);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('products').upsert(productToRow(product));
      } catch (error) {
        console.error('[StorageManager] Supabase product add error:', error);
      }
    }
    return product;
  }

  static addProduct(product: Product): Product {
    this.addProductAsync(product);
    return product;
  }

  static async updateProductAsync(updated: Product): Promise<Product> {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      products[idx] = updated;
      this.saveProducts(products);
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('products').upsert(productToRow(updated));
      } catch (error) {
        console.error('[StorageManager] Supabase product update error:', error);
      }
    }
    return updated;
  }

  static updateProduct(updated: Product): Product {
    this.updateProductAsync(updated);
    return updated;
  }

  static async deleteProductAsync(productId: string): Promise<void> {
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (error) {
        console.error('[StorageManager] Supabase product delete error:', error);
      }
    }
  }

  static deleteProduct(productId: string): void {
    this.deleteProductAsync(productId);
  }

  // ============================================================
  // REVIEWS
  // ============================================================
  static getReviews(): Review[] {
    try {
      const data = localStorage.getItem(REVIEWS_KEY);
      if (!data) {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(SEED_REVIEWS));
        return SEED_REVIEWS;
      }
      return JSON.parse(data);
    } catch {
      return SEED_REVIEWS;
    }
  }

  static async addReviewAsync(review: Review): Promise<Review> {
    const reviews = this.getReviews();
    reviews.unshift(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('reviews').upsert(reviewToRow(review));
      } catch (error) {
        console.error('[StorageManager] Supabase review add error:', error);
      }
    }

    // Recalculate rating
    const vendorReviews = reviews.filter((r) => r.vendorId === review.vendorId);
    const avg = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
    const vendor = this.getVendorById(review.vendorId);
    if (vendor) {
      vendor.rating = parseFloat(avg.toFixed(1));
      vendor.reviewCount = vendorReviews.length;
      this.updateVendor(vendor);
    }

    return review;
  }

  static addReview(review: Review): Review {
    this.addReviewAsync(review);
    return review;
  }

  // ============================================================
  // ENQUIRIES
  // ============================================================
  static getEnquiries(vendorIdOrSlug?: string): Enquiry[] {
    try {
      const data = localStorage.getItem(ENQUIRIES_KEY);
      let all: Enquiry[] = data ? JSON.parse(data) : [];
      if (all.length === 0) {
        all = [];
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify([]));
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (vendorIdOrSlug) {
        const vendor = this.getVendors().find((v) => v.id === vendorIdOrSlug || v.slug === vendorIdOrSlug);
        const matchIds = new Set(
          [vendorIdOrSlug, vendor?.id, vendor?.slug, vendor?.whatsapp, vendor?.phone].filter(
            (val): val is string => Boolean(val)
          )
        );
        return all.filter((e) => matchIds.has(e.vendorId));
      }
      return all;
    } catch {
      return [];
    }
  }

  static async addEnquiryAsync(enquiry: Enquiry): Promise<Enquiry> {
    const enquiries = this.getEnquiries();
    enquiries.unshift(enquiry);
    localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('enquiries').upsert(enquiryToRow(enquiry));
      } catch (error) {
        console.error('[StorageManager] Supabase enquiry add error:', error);
      }
    }
    return enquiry;
  }

  static addEnquiry(enquiry: Enquiry): Enquiry {
    this.addEnquiryAsync(enquiry);
    return enquiry;
  }

  static async markEnquiryReadAsync(id: string): Promise<void> {
    const enquiries = this.getEnquiries();
    const target = enquiries.find((e) => e.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('enquiries').update({ read: true, read_status: true }).eq('id', id);
        } catch (error) {
          console.error('[StorageManager] Supabase enquiry read update error:', error);
        }
      }
    }
  }

  static markEnquiryRead(id: string): void {
    this.markEnquiryReadAsync(id);
  }

  static async replyEnquiryAsync(id: string, replyText: string): Promise<Enquiry | null> {
    const enquiries = this.getEnquiries();
    const target = enquiries.find((e) => e.id === id);
    if (target) {
      target.replyText = replyText;
      target.repliedAt = new Date().toISOString();
      target.read = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('enquiries').update({
            reply_text: replyText,
            replied_at: target.repliedAt,
            read: true,
            read_status: true,
          }).eq('id', id);
        } catch (error) {
          console.error('[StorageManager] Supabase enquiry reply update error:', error);
        }
      }
      return target;
    }
    return null;
  }

  static replyEnquiry(id: string, replyText: string): Enquiry | null {
    this.replyEnquiryAsync(id, replyText);
    return null;
  }

  static async deleteEnquiryAsync(id: string): Promise<void> {
    const enquiries = this.getEnquiries().filter((e) => e.id !== id);
    localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('enquiries').delete().eq('id', id);
      } catch (error) {
        console.error('[StorageManager] Supabase enquiry delete error:', error);
      }
    }
  }

  static deleteEnquiry(id: string): void {
    this.deleteEnquiryAsync(id);
  }

  // ============================================================
  // FAVORITES
  // ============================================================
  static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(vendorId: string): string[] {
    const favs = this.getFavorites();
    const idx = favs.indexOf(vendorId);
    if (idx === -1) {
      favs.push(vendorId);
    } else {
      favs.splice(idx, 1);
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
  }

  // ============================================================
  // BANNERS
  // ============================================================
  static getBanners(): BannerAd[] {
    try {
      const data = localStorage.getItem(BANNERS_KEY);
      if (!data) {
        localStorage.setItem(BANNERS_KEY, JSON.stringify(INITIAL_BANNER_ADS));
        return INITIAL_BANNER_ADS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BANNER_ADS;
    }
  }

  static saveBanners(banners: BannerAd[]): void {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
  }

  // ============================================================
  // ORDERS
  // ============================================================
  static getOrders(userId?: string): Order[] {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      if (!data) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
        return [];
      }
      const all: Order[] = JSON.parse(data);
      if (userId) {
        return all.filter((o) => o.userId === userId);
      }
      return all;
    } catch {
      return [];
    }
  }

  static async addOrderAsync(order: Order): Promise<Order> {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('orders').upsert(orderToRow(order));
      } catch (error) {
        console.error('[StorageManager] Supabase order add error:', error);
      }
    }
    return order;
  }

  static addOrder(order: Order): Order {
    this.addOrderAsync(order);
    return order;
  }

  // ============================================================
  // ANALYTICS
  // ============================================================
  static incrementVendorTap(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): void {
    const vendor = this.getVendorById(vendorId);
    if (!vendor) return;
    if (type === 'profile') vendor.analytics.profileViews += 1;
    if (type === 'whatsapp') vendor.analytics.whatsappTaps += 1;
    if (type === 'product') vendor.analytics.productViews += 1;
    this.updateVendor(vendor);
  }

  // ============================================================
  // ADMIN SETTINGS
  // ============================================================
  static getSettings(): AdminSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        return DEFAULT_ADMIN_SETTINGS;
      }
      const settings = JSON.parse(data);
      let needsMigration = false;
      if (!settings.bankName || settings.bankName.includes('Moniepoint')) {
        settings.bankName = DEFAULT_ADMIN_SETTINGS.bankName;
        needsMigration = true;
      }
      if (!settings.accountName || settings.accountName === 'IkoroduSquare') {
        settings.accountName = DEFAULT_ADMIN_SETTINGS.accountName;
        needsMigration = true;
      }
      if (!settings.accountNumber || settings.accountNumber === '8123456789') {
        settings.accountNumber = DEFAULT_ADMIN_SETTINGS.accountNumber;
        needsMigration = true;
      }
      if (!settings.whatsappSupportNumber || settings.whatsappSupportNumber === '2348031234567') {
        settings.whatsappSupportNumber = DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber;
        needsMigration = true;
      }
      if (needsMigration) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
      return settings;
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  static saveSettings(settings: AdminSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (supabase && isSupabaseConfigured()) {
      try {
        supabase.from('settings').upsert({ id: 'platform_settings', ...settings });
      } catch (e) {
        console.error('[StorageManager] Supabase settings save error:', e);
      }
    }
  }

  // ============================================================
  // PROMOTIONS
  // ============================================================
  static getPromotions(): Promotion[] {
    try {
      const data = localStorage.getItem(PROMOTIONS_KEY);
      if (!data) {
        localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(INITIAL_PROMOTIONS));
        return INITIAL_PROMOTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PROMOTIONS;
    }
  }

  static savePromotions(promotions: Promotion[]): void {
    localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(promotions));
  }

  static createPromotionRequest(promo: Promotion): void {
    const promotions = this.getPromotions();
    const existingIndex = promotions.findIndex((p) => p.id === promo.id);
    if (existingIndex >= 0) {
      promotions[existingIndex] = promo;
    } else {
      promotions.unshift(promo);
    }
    this.savePromotions(promotions);

    if (supabase && isSupabaseConfigured()) {
      try {
        supabase.from('promotions').upsert(promo);
      } catch (e) {
        console.error('[StorageManager] Supabase promotion create error:', e);
      }
    }
  }

  static activatePromotion(promo: Promotion): void {
    const promotions = this.getPromotions();
    const existingIndex = promotions.findIndex((p) => p.id === promo.id);

    const startDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();

    const updatedPromo: Promotion = {
      ...promo,
      status: 'active',
      startDate,
      expiryDate,
    };

    if (existingIndex >= 0) {
      promotions[existingIndex] = updatedPromo;
    } else {
      promotions.unshift(updatedPromo);
    }

    this.savePromotions(promotions);

    // Sync promotion side effects
    const vendors = this.getVendors();
    const products = this.getProducts();

    if (updatedPromo.promotionType === 'sponsored_vendor') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) {
        v.sponsoredCategorySlot = true;
        v.isFeatured = true;
        v.is_featured = true;
        v.featuredOnHomepage = true;
        this.updateVendor(v);
      }
    } else if (updatedPromo.promotionType === 'category_top_spot') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) {
        v.categoryTopSpot = true;
        this.updateVendor(v);
      }
    } else if (updatedPromo.promotionType === 'featured_product' && updatedPromo.productId) {
      const p = products.find((prod) => prod.id === updatedPromo.productId);
      if (p) {
        p.featured = true;
        this.updateProduct(p);
      }
    } else if (updatedPromo.promotionType === 'homepage_banner') {
      const banners = this.getBanners();
      const existingBanner = banners.find((b) => b.promotionId === updatedPromo.id);
      if (!existingBanner) {
        const v = vendors.find((v) => v.id === updatedPromo.vendorId);
        const newBanner: BannerAd = {
          id: 'banner-promo-' + Date.now(),
          title: updatedPromo.bannerData?.title || `${updatedPromo.vendorName} — Special Store Spotlight`,
          subtitle: updatedPromo.bannerData?.subtitle || `Top verified vendor in Ikorodu. Check out exclusive offers today.`,
          imageURL: updatedPromo.bannerData?.imageURL || v?.logoURL || 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80',
          ctaText: updatedPromo.bannerData?.ctaText || 'Visit Shop & Chat',
          linkURL: `/store/${updatedPromo.vendorSlug || v?.slug || ''}`,
          sponsorName: updatedPromo.vendorName,
          badgeText: 'FEATURED SPONSOR',
          promotionId: updatedPromo.id,
        };
        banners.unshift(newBanner);
        this.saveBanners(banners);
      }
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        supabase.from('promotions').upsert(updatedPromo);
      } catch (e) {
        console.error('[StorageManager] Supabase promotion activate error:', e);
      }
    }
  }

  static checkAndSyncPromotionExpiries(): void {
    const promotions = this.getPromotions();
    const now = Date.now();
    let hasChanges = false;

    const vendors = this.getVendors();
    const products = this.getProducts();
    let banners = this.getBanners();

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      if (p.status === 'active') {
        const expiryTime = new Date(p.expiryDate).getTime();
        if (now >= expiryTime) {
          p.status = 'expired';
          hasChanges = true;

          // Remove promotion effects
          if (p.promotionType === 'sponsored_vendor') {
            const hasOtherActive = promotions.some(
              (other) => other.id !== p.id && other.vendorId === p.vendorId && other.promotionType === 'sponsored_vendor' && other.status === 'active'
            );
            if (!hasOtherActive) {
              const v = vendors.find((v) => v.id === p.vendorId);
              if (v) {
                v.sponsoredCategorySlot = false;
                v.isFeatured = false;
                v.is_featured = false;
                v.featuredOnHomepage = false;
                this.updateVendor(v);
              }
            }
          } else if (p.promotionType === 'category_top_spot') {
            const hasOtherActive = promotions.some(
              (other) => other.id !== p.id && other.vendorId === p.vendorId && other.promotionType === 'category_top_spot' && other.status === 'active'
            );
            if (!hasOtherActive) {
              const v = vendors.find((v) => v.id === p.vendorId);
              if (v) {
                v.categoryTopSpot = false;
                this.updateVendor(v);
              }
            }
          } else if (p.promotionType === 'featured_product' && p.productId) {
            const hasOtherActive = promotions.some(
              (other) => other.id !== p.id && other.productId === p.productId && other.promotionType === 'featured_product' && other.status === 'active'
            );
            if (!hasOtherActive) {
              const prod = products.find((pr) => pr.id === p.productId);
              if (prod) {
                prod.featured = false;
                this.updateProduct(prod);
              }
            }
          } else if (p.promotionType === 'homepage_banner') {
            banners = banners.filter((b) => b.promotionId !== p.id);
            this.saveBanners(banners);
          }
        }
      }
    }

    if (hasChanges) {
      this.savePromotions(promotions);
    }
  }

  static updatePromotionStatus(id: string, newStatus: PromotionStatus, extendDays: number = 0): void {
    const promotions = this.getPromotions();
    const p = promotions.find((item) => item.id === id);
    if (!p) return;

    p.status = newStatus;
    if (extendDays > 0) {
      const currentExpiry = new Date(p.expiryDate).getTime();
      const newExpiry = new Date(Math.max(currentExpiry, Date.now()) + extendDays * 86400 * 1000).toISOString();
      p.expiryDate = newExpiry;
    }

    if (newStatus === 'active') {
      p.startDate = new Date().toISOString();
      p.expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
    }

    this.savePromotions(promotions);

    if (newStatus === 'active') {
      this.activatePromotion(p);
    } else {
      // Remove side effects for non-active statuses
      const vendors = this.getVendors();
      const products = this.getProducts();
      let banners = this.getBanners();

      if (p.promotionType === 'sponsored_vendor') {
        const hasOtherActive = promotions.some(
          (other) => other.id !== p.id && other.vendorId === p.vendorId && other.promotionType === 'sponsored_vendor' && other.status === 'active'
        );
        if (!hasOtherActive) {
          const v = vendors.find((v) => v.id === p.vendorId);
          if (v) {
            v.sponsoredCategorySlot = false;
            v.isFeatured = false;
            v.is_featured = false;
            v.featuredOnHomepage = false;
            this.updateVendor(v);
          }
        }
      } else if (p.promotionType === 'category_top_spot') {
        const hasOtherActive = promotions.some(
          (other) => other.id !== p.id && other.vendorId === p.vendorId && other.promotionType === 'category_top_spot' && other.status === 'active'
        );
        if (!hasOtherActive) {
          const v = vendors.find((v) => v.id === p.vendorId);
          if (v) {
            v.categoryTopSpot = false;
            this.updateVendor(v);
          }
        }
      } else if (p.promotionType === 'featured_product' && p.productId) {
        const hasOtherActive = promotions.some(
          (other) => other.id !== p.id && other.productId === p.productId && other.promotionType === 'featured_product' && other.status === 'active'
        );
        if (!hasOtherActive) {
          const prod = products.find((pr) => pr.id === p.productId);
          if (prod) {
            prod.featured = false;
            this.updateProduct(prod);
          }
        }
      } else if (p.promotionType === 'homepage_banner') {
        banners = banners.filter((b) => b.promotionId !== p.id);
        this.saveBanners(banners);
      }

      this.checkAndSyncPromotionExpiries();
    }

    if (supabase && isSupabaseConfigured()) {
      try {
        supabase.from('promotions').upsert(p);
      } catch (e) {
        console.error('[StorageManager] Supabase promotion status update error:', e);
      }
    }
  }
}