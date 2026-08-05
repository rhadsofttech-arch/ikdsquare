import { Vendor, Product, Review, Enquiry, User, BannerAd, Order, DeliveryAddress, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_REVIEWS, INITIAL_BANNER_ADS, INITIAL_PROMOTIONS } from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const FAVORITES_KEY = 'ikorodusquare_favorites_v1';

export const INITIAL_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  { id: 'addr_1', title: 'Home (Agric)', streetAddress: '14 Hospital Road, off Agric Bus Stop', area: 'Agric', landmark: 'Opposite First Bank, Yellow Gate', phone: '08023456789', isDefault: true },
  { id: 'addr_2', title: 'Office (Sabo)', streetAddress: 'Suite 12, Sabo Modern Market Complex', area: 'Sabo Market', landmark: 'Near Zenith Bank ATM', phone: '08023456789', isDefault: false },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord_101', orderNumber: 'IKD-2026-8812', userId: 'user_shopper_1',
    customerName: 'Babatunde Adeleke', customerPhone: '08023456789',
    vendorId: 'v1', vendorName: 'Ikorodu Tech & Gadget Hub', vendorSlug: 'ikorodu-tech-gadget-hub',
    vendorWhatsapp: '2348031234567', vendorArea: 'Sabo Market',
    items: [
      { id: 'item_1', productId: 'p1', name: 'Oraimo FreePods 4 Wireless Earbuds', price: 24500, quantity: 1, vendorId: 'v1', vendorName: 'Ikorodu Tech & Gadget Hub', vendorSlug: 'ikorodu-tech-gadget-hub' },
      { id: 'item_2', productId: 'p2', name: 'Type-C Fast Charging Cable (65W)', price: 3500, quantity: 2, vendorId: 'v1', vendorName: 'Ikorodu Tech & Gadget Hub', vendorSlug: 'ikorodu-tech-gadget-hub' },
    ],
    totalAmount: 31500, status: 'dispatched', deliveryAddress: { id: 'addr_1', title: 'Home (Agric)', streetAddress: '14 Hospital Road, off Agric Bus Stop', area: 'Agric', landmark: 'Opposite First Bank, Yellow Gate', phone: '08023456789', isDefault: true },
    paymentMethod: 'pay_on_delivery', notes: 'Please call before heading down from Sabo Bus Stop.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'ord_102', orderNumber: 'IKD-2026-7740', userId: 'user_shopper_1',
    customerName: 'Babatunde Adeleke', customerPhone: '08023456789',
    vendorId: 'v2', vendorName: 'Elegance Fabrics & Ready-to-Wear', vendorSlug: 'elegance-fabrics-ikorodu',
    vendorWhatsapp: '2348029876543', vendorArea: 'Garage Roundabout',
    items: [
      { id: 'item_3', productId: 'p3', name: 'Designer Ankara Material (6 Yards)', price: 18000, quantity: 1, vendorId: 'v2', vendorName: 'Elegance Fabrics & Ready-to-Wear', vendorSlug: 'elegance-fabrics-ikorodu' },
    ],
    totalAmount: 18000, status: 'delivered', deliveryAddress: { id: 'addr_2', title: 'Office (Sabo)', streetAddress: 'Suite 12, Sabo Modern Market Complex', area: 'Sabo Market', landmark: 'Near Zenith Bank ATM', phone: '08023456789', isDefault: false },
    paymentMethod: 'bank_transfer', notes: 'Delivered directly to shop office.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

export const SEED_ENQUIRIES: Enquiry[] = [
  { id: 'enq_101', vendorId: 'v1', customerName: 'Babatunde Adeleke', customerPhone: '08023456789', customerArea: 'Agric', productName: 'Oraimo FreePods 4 Wireless Earbuds', message: 'Hello! Is this Oraimo FreePods 4 original with warranty? Can you deliver to Agric Bus stop today?', createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), read: false, readStatus: false },
  { id: 'enq_102', vendorId: 'v1', customerName: 'Kemi Olaleye', customerPhone: '08145556677', customerArea: 'Sabo Market', message: 'Good afternoon! Do you have fast charging powerbanks (20,000mAh) available in your Sabo shop?', createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), read: true, readStatus: true, replyText: 'Yes Kemi! We have original Oraimo 20k mAh in stock at Sabo shop. You can visit or call us directly.', repliedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString() },
];

// ── Data Mappers ───────────────────────────────────────────────────────────

export async function generateUniqueVendorSlug(businessName: string): Promise<string> {
  const baseSlug = (businessName || 'vendor-store').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'vendor-store';
  if (!supabase || !isSupabaseConfigured()) {
    const localVendors = await StorageManager.getVendorsAsync();
    let uniqueSlug = baseSlug; let counter = 1;
    while (localVendors.some((v) => v.slug?.toLowerCase() === uniqueSlug.toLowerCase())) { uniqueSlug = `${baseSlug}-${counter}`; counter++; }
    return uniqueSlug;
  }
  try {
    const { data: existingRows } = await supabase.from('vendors').select('slug');
    const existingSlugs = new Set((existingRows || []).map((r: any) => r.slug?.toLowerCase().trim()).filter(Boolean));
    let uniqueSlug = baseSlug; let counter = 1;
    while (existingSlugs.has(uniqueSlug.toLowerCase())) { uniqueSlug = `${baseSlug}-${counter}`; counter++; }
    return uniqueSlug;
  } catch (err) {
    return `${baseSlug}-${Date.now()}`;
  }
}

export function vendorToRow(v: Vendor) {
  const isFeaturedVal = Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
  return {
    id: v.id, slug: v.slug, business_name: v.businessName, owner_name: v.ownerName,
    email: v.email, email_verified: v.emailVerified, whatsapp: v.whatsapp, phone: v.phone,
    category: v.category, sub_category: v.subCategory, area: v.area, zone: v.zone,
    description: v.description, address: v.address, cover_photo_url: v.coverPhotoURL,
    logo_url: v.logoURL, status: v.status, is_live: v.isLive, is_premium: v.isPremium,
    nin_verified: v.ninVerified ?? v.nin_verified ?? false, is_featured: isFeaturedVal,
    created_at: v.createdAt, rating: v.rating, review_count: v.reviewCount, analytics: v.analytics,
  };
}

export function rowToVendor(r: any): Vendor {
  const isFeaturedVal = Boolean(r.is_featured ?? r.isFeatured ?? r.featuredOnHomepage ?? false);
  const ninVerifiedVal = Boolean(r.nin_verified ?? r.ninVerified ?? false);
  return {
    id: r.id, slug: r.slug,
    businessName: r.business_name || r.businessName || '',
    ownerName: r.owner_name || r.ownerName || '',
    email: r.email || '', emailVerified: r.email_verified ?? r.emailVerified ?? false,
    whatsapp: r.whatsapp || '', phone: r.phone || '',
    category: r.category || 'Lifestyle', subCategory: r.sub_category || r.subCategory || '',
    area: r.area || 'Agric', zone: r.zone || 'East zone',
    description: r.description || '', address: r.address || '',
    coverPhotoURL: r.cover_photo_url || r.coverPhotoURL || '',
    logoURL: r.logo_url || r.logoURL || '',
    status: r.status || 'approved', isLive: r.is_live ?? r.isLive ?? true,
    isPremium: r.is_premium ?? r.isPremium ?? false,
    ninVerified: ninVerifiedVal, nin_verified: ninVerifiedVal,
    isFeatured: isFeaturedVal, is_featured: isFeaturedVal, featuredOnHomepage: isFeaturedVal,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    rating: r.rating ? Number(r.rating) : 5.0, reviewCount: r.review_count ?? r.reviewCount ?? 0,
    analytics: r.analytics || { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] },
  };
}

function productToRow(p: Product) {
  return {
    id: p.id, vendor_id: p.vendorId, vendor_name: p.vendorName, vendor_slug: p.vendorSlug,
    vendor_area: p.vendorArea || '', name: p.name, description: p.description, price: p.price,
    category: p.category, image_url: p.photoURL, is_available: p.available,
    is_featured: p.featured ?? false, created_at: p.createdAt,
  };
}

function rowToProduct(r: any): Product {
  return {
    id: r.id, vendorId: r.vendor_id || r.vendorId || '',
    vendorName: r.vendor_name || r.vendorName || '',
    vendorSlug: r.vendor_slug || r.vendorSlug || '',
    vendorArea: r.vendor_area || r.vendorArea || 'Agric',
    name: r.name || '', description: r.description || '', price: Number(r.price || 0),
    category: r.category || '',
    photoURL: r.image_url || r.photoURL || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    available: r.is_available ?? r.available ?? true,
    featured: r.is_featured ?? r.featured ?? false,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

function reviewToRow(r: Review) {
  return { id: r.id, vendor_id: r.vendorId, user_name: r.userName, user_area: r.userArea || '', rating: r.rating, comment: r.comment, created_at: r.createdAt };
}

function rowToReview(r: any): Review {
  return {
    id: r.id, vendorId: r.vendor_id || r.vendorId || '',
    userName: r.user_name || r.userName || 'Anonymous',
    userArea: r.user_area || r.userArea || 'Ikorodu',
    rating: Number(r.rating || 5), comment: r.comment || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

function orderToRow(o: Order) {
  return {
    id: o.id, order_number: o.orderNumber, user_id: o.userId, customer_name: o.customerName,
    customer_phone: o.customerPhone, vendor_id: o.vendorId, vendor_name: o.vendorName,
    vendor_slug: o.vendorSlug, vendor_whatsapp: o.vendorWhatsapp, vendor_area: o.vendorArea,
    items: o.items, total_amount: o.totalAmount, status: o.status,
    delivery_address: o.deliveryAddress, payment_method: o.paymentMethod,
    notes: o.notes, created_at: o.createdAt, updated_at: o.updatedAt,
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id, orderNumber: r.order_number || r.orderNumber || '',
    userId: r.user_id || r.userId || '', customerName: r.customer_name || r.customerName || '',
    customerPhone: r.customer_phone || r.customerPhone || '',
    vendorId: r.vendor_id || r.vendorId || '', vendorName: r.vendor_name || r.vendorName || '',
    vendorSlug: r.vendor_slug || r.vendorSlug || '',
    vendorWhatsapp: r.vendor_whatsapp || r.vendorWhatsapp || '',
    vendorArea: r.vendor_area || r.vendorArea || '', items: r.items || [],
    totalAmount: Number(r.total_amount || r.totalAmount || 0), status: r.status || 'pending',
    deliveryAddress: r.delivery_address || r.deliveryAddress,
    paymentMethod: r.payment_method || r.paymentMethod || 'pay_on_delivery',
    notes: r.notes || '', createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function enquiryToRow(e: Enquiry) {
  return {
    id: e.id, vendor_id: e.vendorId, customer_name: e.customerName, customer_phone: e.customerPhone,
    customer_area: e.customerArea, product_name: e.productName, message: e.message,
    created_at: e.createdAt, read: e.read, read_status: e.readStatus,
    reply_text: e.replyText, replied_at: e.repliedAt,
  };
}

function rowToEnquiry(r: any): Enquiry {
  return {
    id: r.id, vendorId: r.vendor_id || r.vendorId || '',
    customerName: r.customer_name || r.customerName || '',
    customerPhone: r.customer_phone || r.customerPhone || '',
    customerArea: r.customer_area || r.customerArea || '',
    productName: r.product_name || r.productName,
    message: r.message || '', createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    read: r.read ?? false, readStatus: r.read_status ?? r.readStatus ?? false,
    replyText: r.reply_text || r.replyText, repliedAt: r.replied_at || r.repliedAt,
  };
}

function userToRow(u: User) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    vendor_id: u.vendorId, email_verified: u.emailVerified, area: u.area,
    saved_addresses: u.savedAddresses, created_at: u.createdAt,
  };
}

// ── FIX: bannerToRow / rowToBanner mappers (snake_case for DB) ────────────
function bannerToRow(b: BannerAd) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    image_url: b.imageURL,
    cta_text: b.ctaText,
    link_url: b.linkURL,
    sponsor_name: b.sponsorName,
    badge_text: b.badgeText,
    promotion_id: b.promotionId,
  };
}

function rowToBanner(r: any): BannerAd {
  return {
    id: r.id,
    title: r.title || '',
    subtitle: r.subtitle || '',
    imageURL: r.image_url || r.imageURL || '',
    ctaText: r.cta_text || r.ctaText || 'Visit Shop',
    linkURL: r.link_url || r.linkURL || '/',
    sponsorName: r.sponsor_name || r.sponsorName || '',
    badgeText: r.badge_text || r.badgeText || '',
    promotionId: r.promotion_id || r.promotionId,
  };
}

// ── StorageManager ─────────────────────────────────────────────────────────
export class StorageManager {
  static onVendorChange: (() => void) | null = null;

  static async repairOrphanedVendorsAsync(): Promise<number> {
    if (!supabase || !isSupabaseConfigured()) return 0;
    try {
      const { data: vendorUsers, error: userErr } = await supabase.from('users').select('*').eq('role', 'vendor');
      if (userErr || !vendorUsers || vendorUsers.length === 0) return 0;
      const { data: existingVendorRows } = await supabase.from('vendors').select('*');
      const existingVendors = (existingVendorRows || []).map(rowToVendor);
      const existingEmails = new Set(existingVendors.map((v) => v.email?.toLowerCase().trim()).filter(Boolean));
      const existingVendorIds = new Set(existingVendors.map((v) => v.id).filter(Boolean));
      const existingSlugs = new Set(existingVendors.map((v) => v.slug?.toLowerCase().trim()).filter(Boolean));
      let repairedCount = 0;
      for (const u of vendorUsers) {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uVendorId = u.vendor_id;
        const vendorExists = (uEmail && existingEmails.has(uEmail)) || (uVendorId && existingVendorIds.has(uVendorId));
        if (vendorExists) {
          const existingVendor = existingVendors.find((v) => (uEmail && v.email?.toLowerCase().trim() === uEmail) || (uVendorId && v.id === uVendorId));
          if (existingVendor && u.vendor_id !== existingVendor.id) {
            await supabase.from('users').update({ vendor_id: existingVendor.id }).eq('id', u.id);
          }
          continue;
        }
        const rawName = u.name || (u.email ? u.email.split('@')[0] : 'Vendor Store');
        const baseSlug = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'vendor-store';
        let uniqueSlug = baseSlug; let counter = 1;
        while (existingSlugs.has(uniqueSlug.toLowerCase())) { uniqueSlug = `${baseSlug}-${counter}`; counter++; }
        existingSlugs.add(uniqueSlug.toLowerCase());
        const newVendorId = uVendorId || ('v-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
        const newVendorObj: Vendor = {
          id: newVendorId, slug: uniqueSlug, businessName: rawName, ownerName: rawName,
          email: u.email || '', emailVerified: true, whatsapp: u.phone || '', phone: u.phone || '',
          category: 'Lifestyle', subCategory: 'General Merchant', area: u.area || 'Ikorodu',
          zone: 'East zone', description: `${rawName} is a local vendor operating in ${u.area || 'Ikorodu'}, Ikorodu.`,
          address: `${u.area || 'Ikorodu'}, Ikorodu, Lagos State`,
          coverPhotoURL: 'https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=1000&q=80',
          logoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          status: 'pending', isLive: false, isPremium: false, ninVerified: false, isFeatured: false,
          createdAt: u.created_at || new Date().toISOString(), rating: 5.0, reviewCount: 0,
          analytics: { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] },
        };
        const { error: insertError } = await supabase.from('vendors').upsert(vendorToRow(newVendorObj)).select();
        if (!insertError) {
          repairedCount++;
          existingEmails.add(uEmail);
          existingVendorIds.add(newVendorId);
          await supabase.from('users').update({ vendor_id: newVendorId }).eq('id', u.id);
        }
      }
      return repairedCount;
    } catch (err) {
      console.error('[Repair Script] Exception:', err);
      return 0;
    }
  }

  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) return;
    try {
      await this.repairOrphanedVendorsAsync();
      const { data: supaVendors } = await supabase.from('vendors').select('*');
      if (!supaVendors || supaVendors.length === 0) {
        for (const v of SEED_VENDORS) await supabase.from('vendors').upsert(vendorToRow(v));
      }
      if (onUpdate) onUpdate();
      const { data: supaProducts } = await supabase.from('products').select('*');
      if (!supaProducts || supaProducts.length === 0) {
        for (const p of SEED_PRODUCTS) await supabase.from('products').upsert(productToRow(p));
      }
      if (onUpdate) onUpdate();
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (!supaReviews || supaReviews.length === 0) {
        for (const r of SEED_REVIEWS) await supabase.from('reviews').upsert(reviewToRow(r));
      }
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (!supaOrders || supaOrders.length === 0) {
        for (const o of SEED_ORDERS) await supabase.from('orders').upsert(orderToRow(o));
      }
      const { data: supaEnquiries } = await supabase.from('enquiries').select('*');
      if (!supaEnquiries || supaEnquiries.length === 0) {
        for (const e of SEED_ENQUIRIES) await supabase.from('enquiries').upsert(enquiryToRow(e));
      }
      if (onUpdate) onUpdate();
      // ── FIX: Seed banners table with proper snake_case mapper ──────────
      const { data: supaBanners } = await supabase.from('banners').select('*');
      if (!supaBanners || supaBanners.length === 0) {
        for (const b of INITIAL_BANNER_ADS) await supabase.from('banners').upsert(bannerToRow(b));
      }
      // ── FIX: Seed settings table with snake_case columns ──────────────
      const { data: supaSettings } = await supabase.from('settings').select('*').eq('id', 'platform_settings').maybeSingle();
      if (!supaSettings) {
        await supabase.from('settings').upsert({
          id: 'platform_settings',
          bank_name: DEFAULT_ADMIN_SETTINGS.bankName,
          account_name: DEFAULT_ADMIN_SETTINGS.accountName,
          account_number: DEFAULT_ADMIN_SETTINGS.accountNumber,
          whatsapp_support_number: DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber,
        });
      }
      supabase.channel('public:vendors').on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => { if (onUpdate) onUpdate(); }).subscribe();
      supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { if (onUpdate) onUpdate(); }).subscribe();
    } catch (error) {
      console.warn('[Supabase Sync Note]: Error initializing sync:', error);
    }
  }

  // ── VENDORS ───────────────────────────────────────────────────────────────
  static async getVendorsAsync(): Promise<Vendor[]> {
    if (!supabase || !isSupabaseConfigured()) return SEED_VENDORS;
    try {
      const { data, error } = await supabase.from('vendors').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const v of SEED_VENDORS) await supabase.from('vendors').upsert(vendorToRow(v));
        return SEED_VENDORS;
      }
      return data.map(rowToVendor);
    } catch (e) { return SEED_VENDORS; }
  }
  static getVendors(): Vendor[] { return SEED_VENDORS; }
  static saveVendors(_: Vendor[]): void {}

  static async getVendorBySlugAsync(slug: string): Promise<Vendor | undefined> {
    if (!slug) return undefined;
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('vendors').select('*').ilike('slug', slug).maybeSingle();
        if (data) return rowToVendor(data);
      } catch (e) {}
    }
    const vendors = await this.getVendorsAsync();
    return vendors.find((v) => v.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug || v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSlug));
  }
  static getVendorBySlug(slug: string): Vendor | undefined {
    const cleanSlug = (slug || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    return SEED_VENDORS.find((v) => v.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug);
  }

  static async getVendorByIdAsync(id: string): Promise<Vendor | undefined> {
    if (!id) return undefined;
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('vendors').select('*').eq('id', id).maybeSingle();
        if (data) return rowToVendor(data);
      } catch (e) {}
    }
    return (await this.getVendorsAsync()).find((v) => v.id === id);
  }
  static getVendorById(id: string): Vendor | undefined { return SEED_VENDORS.find((v) => v.id === id); }

  static async addVendorAsync(newVendor: Vendor): Promise<Vendor> {
    if (!newVendor.slug) newVendor.slug = await generateUniqueVendorSlug(newVendor.businessName || 'vendor');
    if (!newVendor.status) newVendor.status = 'pending';
    if (newVendor.isLive === undefined) newVendor.isLive = false;
    if (supabase) {
      try {
        if (newVendor.email) {
          const { data: existing } = await supabase.from('vendors').select('*').ilike('email', newVendor.email).maybeSingle();
          if (existing) { newVendor.id = existing.id; }
        }
        const { data, error } = await supabase.from('vendors').upsert(vendorToRow(newVendor)).select();
        if (error) throw new Error(`Vendor creation failed: ${error.message}`);
        if (data && data.length > 0) newVendor = rowToVendor(data[0]);
      } catch (error: any) { throw error; }
    }
    if (this.onVendorChange) this.onVendorChange();
    return newVendor;
  }
  static addVendor(newVendor: Vendor): Vendor { this.addVendorAsync(newVendor); return newVendor; }

  static async updateVendorAsync(updated: Vendor): Promise<Vendor> {
    if (supabase) {
      try { await supabase.from('vendors').upsert(vendorToRow(updated)); }
      catch (error) { console.error('Supabase update error (vendor):', error); }
    }
    if (this.onVendorChange) this.onVendorChange();
    return updated;
  }
  static updateVendor(updated: Vendor): Vendor { this.updateVendorAsync(updated); return updated; }

  static async deleteVendorAsync(vendorId: string): Promise<void> {
    if (supabase) {
      try { await supabase.from('vendors').delete().eq('id', vendorId); await supabase.from('products').delete().eq('vendor_id', vendorId); }
      catch (error) { console.error('Supabase delete error (vendor):', error); }
    }
    if (this.onVendorChange) this.onVendorChange();
  }
  static deleteVendor(vendorId: string): void { this.deleteVendorAsync(vendorId); }

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
  static async getProductsAsync(): Promise<Product[]> {
    if (!supabase || !isSupabaseConfigured()) return SEED_PRODUCTS;
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const p of SEED_PRODUCTS) await supabase.from('products').upsert(productToRow(p));
        return SEED_PRODUCTS;
      }
      return data.map(rowToProduct);
    } catch (e) { return SEED_PRODUCTS; }
  }
  static getProducts(): Product[] { return SEED_PRODUCTS; }
  static saveProducts(_: Product[]): void {}

  static async addProductAsync(product: Product): Promise<Product> {
    if (supabase) { try { await supabase.from('products').upsert(productToRow(product)); } catch (e) { console.error('Supabase write error (product):', e); } }
    return product;
  }
  static addProduct(product: Product): Product { this.addProductAsync(product); return product; }

  static async updateProductAsync(updated: Product): Promise<Product> {
    if (supabase) { try { await supabase.from('products').upsert(productToRow(updated)); } catch (e) { console.error('Supabase update error (product):', e); } }
    return updated;
  }
  static updateProduct(updated: Product): Product { this.updateProductAsync(updated); return updated; }

  static async deleteProductAsync(productId: string): Promise<void> {
    if (supabase) { try { await supabase.from('products').delete().eq('id', productId); } catch (e) { console.error('Supabase delete error (product):', e); } }
  }
  static deleteProduct(productId: string): void { this.deleteProductAsync(productId); }

  // ── REVIEWS ───────────────────────────────────────────────────────────────
  static async getReviewsAsync(): Promise<Review[]> {
    if (!supabase || !isSupabaseConfigured()) return SEED_REVIEWS;
    try {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const r of SEED_REVIEWS) await supabase.from('reviews').upsert(reviewToRow(r));
        return SEED_REVIEWS;
      }
      return data.map(rowToReview);
    } catch (e) { return SEED_REVIEWS; }
  }
  static getReviews(): Review[] { return SEED_REVIEWS; }

  static async addReviewAsync(review: Review): Promise<Review> {
    if (supabase) { try { await supabase.from('reviews').upsert(reviewToRow(review)); } catch (e) { console.error('Supabase write error (review):', e); } }
    const allReviews = await this.getReviewsAsync();
    const vendorReviews = allReviews.filter((r) => r.vendorId === review.vendorId);
    const avg = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / (vendorReviews.length || 1);
    const vendor = await this.getVendorByIdAsync(review.vendorId);
    if (vendor) { vendor.rating = parseFloat(avg.toFixed(1)); vendor.reviewCount = vendorReviews.length; await this.updateVendorAsync(vendor); }
    return review;
  }
  static addReview(review: Review): Review { this.addReviewAsync(review); return review; }

  // ── ENQUIRIES ─────────────────────────────────────────────────────────────
  static async getEnquiriesAsync(vendorIdOrSlug?: string): Promise<Enquiry[]> {
    if (!supabase || !isSupabaseConfigured()) return vendorIdOrSlug ? SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug) : SEED_ENQUIRIES;
    try {
      const { data, error } = await supabase.from('enquiries').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const e of SEED_ENQUIRIES) await supabase.from('enquiries').upsert(enquiryToRow(e));
        return vendorIdOrSlug ? SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug) : SEED_ENQUIRIES;
      }
      let all = data.map(rowToEnquiry).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (vendorIdOrSlug) {
        const vendor = (await this.getVendorBySlugAsync(vendorIdOrSlug)) || (await this.getVendorByIdAsync(vendorIdOrSlug));
        const matchIds = new Set([vendorIdOrSlug, vendor?.id, vendor?.slug, vendor?.whatsapp, vendor?.phone].filter((val): val is string => Boolean(val)));
        return all.filter((e) => matchIds.has(e.vendorId));
      }
      return all;
    } catch (e) { return SEED_ENQUIRIES; }
  }
  static getEnquiries(vendorIdOrSlug?: string): Enquiry[] { return vendorIdOrSlug ? SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug) : SEED_ENQUIRIES; }

  static async addEnquiryAsync(enquiry: Enquiry): Promise<Enquiry> {
    if (supabase) { try { await supabase.from('enquiries').upsert(enquiryToRow(enquiry)); } catch (e) { console.error('Supabase write error (enquiry):', e); } }
    return enquiry;
  }
  static addEnquiry(enquiry: Enquiry): Enquiry { this.addEnquiryAsync(enquiry); return enquiry; }

  static async markEnquiryReadAsync(id: string): Promise<void> {
    if (supabase) { try { await supabase.from('enquiries').update({ read: true, read_status: true }).eq('id', id); } catch (e) { console.error('Supabase update error (enquiry read):', e); } }
  }
  static markEnquiryRead(id: string): void { this.markEnquiryReadAsync(id); }

  static async replyEnquiryAsync(id: string, replyText: string): Promise<Enquiry | null> {
    const repliedAt = new Date().toISOString();
    if (supabase) { try { await supabase.from('enquiries').update({ reply_text: replyText, replied_at: repliedAt, read: true, read_status: true }).eq('id', id); } catch (e) { console.error('Supabase update error (enquiry reply):', e); } }
    return null;
  }
  static replyEnquiry(id: string, replyText: string): Enquiry | null { this.replyEnquiryAsync(id, replyText); return null; }

  static async deleteEnquiryAsync(id: string): Promise<void> {
    if (supabase) { try { await supabase.from('enquiries').delete().eq('id', id); } catch (e) { console.error('Supabase delete error (enquiry):', e); } }
  }
  static deleteEnquiry(id: string): void { this.deleteEnquiryAsync(id); }

  // ── USERS ─────────────────────────────────────────────────────────────────
  static async getCurrentUserAsync(): Promise<User | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const { data: uRow } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
      if (!uRow) return null;
      return { id: uRow.id, name: uRow.name || session.user.email?.split('@')[0] || 'User', email: uRow.email || session.user.email || '', phone: uRow.phone || '', role: uRow.role || 'shopper', vendorId: uRow.vendor_id || uRow.vendorId, emailVerified: uRow.email_verified ?? true, area: uRow.area || 'Ikorodu', savedAddresses: uRow.saved_addresses || uRow.savedAddresses || [], createdAt: uRow.created_at || new Date().toISOString() };
    } catch (e) { return null; }
  }
  static getCurrentUser(): User | null { return null; }

  static async setCurrentUserAsync(user: User | null): Promise<void> {
    if (user && supabase) { try { await supabase.from('users').upsert(userToRow(user)); } catch (e) { console.error('Supabase write error (user):', e); } }
  }
  static setCurrentUser(user: User | null): void { this.setCurrentUserAsync(user); }

  // ── FAVORITES (localStorage only) ─────────────────────────────────────────
  static getFavorites(): string[] {
    try { const data = localStorage.getItem(FAVORITES_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
  }
  static toggleFavorite(vendorId: string): string[] {
    const favs = this.getFavorites();
    const idx = favs.indexOf(vendorId);
    if (idx === -1) favs.push(vendorId); else favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
  }

  // ── BANNERS ───────────────────────────────────────────────────────────────
  // FIX: use rowToBanner mapper so camelCase fields populate correctly in UI
  static async getBannersAsync(): Promise<BannerAd[]> {
    if (!supabase || !isSupabaseConfigured()) return INITIAL_BANNER_ADS;
    try {
      const { data, error } = await supabase.from('banners').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const b of INITIAL_BANNER_ADS) await supabase.from('banners').upsert(bannerToRow(b));
        return INITIAL_BANNER_ADS;
      }
      return data.map(rowToBanner);
    } catch (e) { return INITIAL_BANNER_ADS; }
  }
  static getBanners(): BannerAd[] { return INITIAL_BANNER_ADS; }

  // FIX: use bannerToRow mapper for snake_case DB write
  static saveBanners(banners: BannerAd[]): void {
    if (supabase) {
      (async () => { for (const b of banners) { try { await supabase.from('banners').upsert(bannerToRow(b)); } catch (e) { console.error('saveBanners error:', e); } } })();
    }
  }

  // ── ORDERS ────────────────────────────────────────────────────────────────
  static async getOrdersAsync(userId?: string): Promise<Order[]> {
    if (!supabase || !isSupabaseConfigured()) return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
    try {
      let query = supabase.from('orders').select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (!userId && (!data || data.length === 0)) for (const o of SEED_ORDERS) await supabase.from('orders').upsert(orderToRow(o));
        return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
      }
      return data.map(rowToOrder);
    } catch (e) { return SEED_ORDERS; }
  }
  static getOrders(userId?: string): Order[] { return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS; }

  static async addOrderAsync(order: Order): Promise<Order> {
    if (supabase) { try { await supabase.from('orders').upsert(orderToRow(order)); } catch (e) { console.error('Supabase write error (order):', e); } }
    return order;
  }
  static addOrder(order: Order): Order { this.addOrderAsync(order); return order; }

  static getUserAddresses(user?: User | null): DeliveryAddress[] {
    if (user?.savedAddresses && user.savedAddresses.length > 0) return user.savedAddresses;
    return INITIAL_DELIVERY_ADDRESSES;
  }
  static async saveUserAddressesAsync(user: User, addresses: DeliveryAddress[]): Promise<User> {
    const updatedUser: User = { ...user, savedAddresses: addresses };
    await this.setCurrentUserAsync(updatedUser);
    return updatedUser;
  }

  static async incrementVendorTapAsync(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('vendors').select('analytics').eq('id', vendorId).maybeSingle();
      if (!data) return;
      const analytics = data.analytics || { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] };
      if (type === 'profile') analytics.profileViews = (analytics.profileViews || 0) + 1;
      if (type === 'whatsapp') analytics.whatsappTaps = (analytics.whatsappTaps || 0) + 1;
      if (type === 'product') analytics.productViews = (analytics.productViews || 0) + 1;
      await supabase.from('vendors').update({ analytics }).eq('id', vendorId);
    } catch (e) { console.error('incrementVendorTapAsync error:', e); }
  }
  static incrementVendorTap(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): void { this.incrementVendorTapAsync(vendorId, type); }

  // ── ADMIN SETTINGS ────────────────────────────────────────────────────────
  // FIX: read snake_case columns from Supabase settings table
  static async getSettingsAsync(): Promise<AdminSettings> {
    if (!supabase || !isSupabaseConfigured()) return DEFAULT_ADMIN_SETTINGS;
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'platform_settings').maybeSingle();
      if (error || !data) {
        await supabase.from('settings').upsert({
          id: 'platform_settings',
          bank_name: DEFAULT_ADMIN_SETTINGS.bankName,
          account_name: DEFAULT_ADMIN_SETTINGS.accountName,
          account_number: DEFAULT_ADMIN_SETTINGS.accountNumber,
          whatsapp_support_number: DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber,
        });
        return DEFAULT_ADMIN_SETTINGS;
      }
      return {
        bankName:             data.bank_name              || DEFAULT_ADMIN_SETTINGS.bankName,
        accountName:          data.account_name           || DEFAULT_ADMIN_SETTINGS.accountName,
        accountNumber:        data.account_number         || DEFAULT_ADMIN_SETTINGS.accountNumber,
        whatsappSupportNumber: data.whatsapp_support_number || DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber,
      };
    } catch (e) { return DEFAULT_ADMIN_SETTINGS; }
  }
  static getSettings(): AdminSettings { return DEFAULT_ADMIN_SETTINGS; }

  // FIX: write snake_case columns to Supabase settings table
  static async saveSettingsAsync(settings: AdminSettings): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('settings').upsert({
          id: 'platform_settings',
          bank_name: settings.bankName,
          account_name: settings.accountName,
          account_number: settings.accountNumber,
          whatsapp_support_number: settings.whatsappSupportNumber,
        });
      } catch (e) { console.error('saveSettingsAsync error:', e); }
    }
  }
  static saveSettings(settings: AdminSettings): void {
    if (supabase) {
      supabase.from('settings').upsert({
        id: 'platform_settings',
        bank_name: settings.bankName,
        account_name: settings.accountName,
        account_number: settings.accountNumber,
        whatsapp_support_number: settings.whatsappSupportNumber,
      }).then(() => {}).catch((e) => console.error('saveSettings error:', e));
    }
  }

  // ── PROMOTIONS ────────────────────────────────────────────────────────────
  static async getPromotionsAsync(): Promise<Promotion[]> {
    if (!supabase || !isSupabaseConfigured()) return INITIAL_PROMOTIONS;
    try {
      const { data, error } = await supabase.from('promotions').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) for (const p of INITIAL_PROMOTIONS) await supabase.from('promotions').upsert(p);
        return INITIAL_PROMOTIONS;
      }
      return data;
    } catch (e) { return INITIAL_PROMOTIONS; }
  }
  static getPromotions(): Promotion[] { return INITIAL_PROMOTIONS; }

  static savePromotions(promotions: Promotion[]): void {
    if (supabase) { (async () => { for (const p of promotions) { try { await supabase.from('promotions').upsert(p); } catch (e) {} } })(); }
  }

  // FIX: async version of createPromotionRequest (was missing)
  static async createPromotionRequestAsync(promo: Promotion): Promise<void> {
    if (supabase) { try { await supabase.from('promotions').upsert(promo); } catch (e) { console.error('createPromotionRequestAsync error:', e); } }
  }
  static createPromotionRequest(promo: Promotion): void {
    if (supabase) { supabase.from('promotions').upsert(promo).then(() => {}).catch((e) => console.error('createPromotionRequest error:', e)); }
  }

  static async activatePromotionAsync(promo: Promotion): Promise<void> {
    const startDate  = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
    const updatedPromo: Promotion = { ...promo, status: 'active', startDate, expiryDate };

    const vendors  = await this.getVendorsAsync();
    const products = await this.getProductsAsync();

    if (updatedPromo.promotionType === 'sponsored_vendor') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) { v.isFeatured = true; v.is_featured = true; v.featuredOnHomepage = true; await this.updateVendorAsync(v); }

    } else if (updatedPromo.promotionType === 'category_top_spot') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) { (v as any).categoryTopSpot = true; await this.updateVendorAsync(v); }

    } else if (updatedPromo.promotionType === 'featured_product' && updatedPromo.productId) {
      const p = products.find((prod) => prod.id === updatedPromo.productId);
      if (p) { p.featured = true; await this.updateProductAsync(p); }

    } else if (updatedPromo.promotionType === 'homepage_banner') {
      const banners = await this.getBannersAsync();
      const existingBanner = banners.find((b) => b.promotionId === updatedPromo.id);
      if (!existingBanner && supabase) {
        const v = vendors.find((v) => v.id === updatedPromo.vendorId);
        const newBanner: BannerAd = {
          id: 'banner-promo-' + Date.now(),
          title:       updatedPromo.bannerData?.title    || `${updatedPromo.vendorName} — Special Store Spotlight`,
          subtitle:    updatedPromo.bannerData?.subtitle  || 'Top verified vendor in Ikorodu.',
          imageURL:    updatedPromo.bannerData?.imageURL  || v?.coverPhotoURL || v?.logoURL || 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80',
          ctaText:     updatedPromo.bannerData?.ctaText   || 'Visit Shop & Chat',
          linkURL:     `/store/${updatedPromo.vendorSlug || v?.slug || ''}`,
          sponsorName: updatedPromo.vendorName,
          badgeText:   'FEATURED SPONSOR',
          promotionId: updatedPromo.id,
        };
        // FIX: use bannerToRow mapper for snake_case DB write
        await supabase.from('banners').upsert(bannerToRow(newBanner));
      }
    }

    if (supabase) { try { await supabase.from('promotions').upsert(updatedPromo); } catch (e) { console.error('Supabase write error (promotion):', e); } }
  }
  static activatePromotion(promo: Promotion): void { this.activatePromotionAsync(promo); }

  static async checkAndSyncPromotionExpiriesAsync(): Promise<void> {
    const promotions = await this.getPromotionsAsync();
    const now        = Date.now();
    const vendors    = await this.getVendorsAsync();
    const products   = await this.getProductsAsync();

    for (const p of promotions) {
      if (p.status === 'active' && new Date(p.expiryDate).getTime() <= now) {
        p.status = 'expired';
        const hasOther = (type: string) => promotions.some((o) => o.id !== p.id && o.vendorId === p.vendorId && o.promotionType === type && o.status === 'active');

        if (p.promotionType === 'sponsored_vendor' && !hasOther('sponsored_vendor')) {
          const v = vendors.find((v) => v.id === p.vendorId);
          if (v) { v.isFeatured = false; v.is_featured = false; v.featuredOnHomepage = false; await this.updateVendorAsync(v); }
        } else if (p.promotionType === 'category_top_spot' && !hasOther('category_top_spot')) {
          const v = vendors.find((v) => v.id === p.vendorId);
          if (v) { (v as any).categoryTopSpot = false; await this.updateVendorAsync(v); }
        } else if (p.promotionType === 'featured_product' && p.productId) {
          const hasOtherFeat = promotions.some((o) => o.id !== p.id && o.productId === p.productId && o.promotionType === 'featured_product' && o.status === 'active');
          if (!hasOtherFeat) { const prod = products.find((pr) => pr.id === p.productId); if (prod) { prod.featured = false; await this.updateProductAsync(prod); } }
        } else if (p.promotionType === 'homepage_banner' && supabase) {
          // FIX: banner was stored with promotion_id (snake_case) via bannerToRow — delete matches correctly
          await supabase.from('banners').delete().eq('promotion_id', p.id);
        }

        if (supabase) await supabase.from('promotions').upsert(p);
      }
    }
  }
  static checkAndSyncPromotionExpiries(): void { this.checkAndSyncPromotionExpiriesAsync(); }

  static async updatePromotionStatusAsync(id: string, newStatus: PromotionStatus, extendDays: number = 0): Promise<void> {
    const promotions = await this.getPromotionsAsync();
    const p = promotions.find((item) => item.id === id);
    if (!p) return;

    p.status = newStatus;
    if (extendDays > 0) {
      p.expiryDate = new Date(Math.max(new Date(p.expiryDate).getTime(), Date.now()) + extendDays * 86400 * 1000).toISOString();
    }

    if (newStatus === 'active') {
      p.startDate  = new Date().toISOString();
      p.expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
      await this.activatePromotionAsync(p);
    } else {
      const vendors  = await this.getVendorsAsync();
      const products = await this.getProductsAsync();
      const hasOther = (type: string) => promotions.some((o) => o.id !== p.id && o.vendorId === p.vendorId && o.promotionType === type && o.status === 'active');

      if (p.promotionType === 'sponsored_vendor' && !hasOther('sponsored_vendor')) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) { v.isFeatured = false; v.is_featured = false; v.featuredOnHomepage = false; await this.updateVendorAsync(v); }
      } else if (p.promotionType === 'category_top_spot' && !hasOther('category_top_spot')) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) { (v as any).categoryTopSpot = false; await this.updateVendorAsync(v); }
      } else if (p.promotionType === 'featured_product' && p.productId) {
        const hasOtherFeat = promotions.some((o) => o.id !== p.id && o.productId === p.productId && o.promotionType === 'featured_product' && o.status === 'active');
        if (!hasOtherFeat) { const prod = products.find((pr) => pr.id === p.productId); if (prod) { prod.featured = false; await this.updateProductAsync(prod); } }
      } else if (p.promotionType === 'homepage_banner' && supabase) {
        await supabase.from('banners').delete().eq('promotion_id', p.id);
      }
    }

    if (supabase) { try { await supabase.from('promotions').upsert(p); } catch (e) { console.error('Supabase update status error:', e); } }
  }
  static updatePromotionStatus(id: string, newStatus: PromotionStatus, extendDays: number = 0): void { this.updatePromotionStatusAsync(id, newStatus, extendDays); }
}