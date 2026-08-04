import {
  Vendor, Product, Review, Enquiry, User, BannerAd, Order,
  DeliveryAddress, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS,
} from '../types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_REVIEWS, INITIAL_BANNER_ADS, INITIAL_PROMOTIONS } from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// ── localStorage keys (vendors intentionally excluded — they live in Supabase) ─
const PRODUCTS_KEY   = 'ikorodusquare_products_v1';
const REVIEWS_KEY    = 'ikorodusquare_reviews_v1';
const ENQUIRIES_KEY  = 'ikorodusquare_enquiries_v1';
const USERS_KEY      = 'ikorodusquare_users_v1';
const CURRENT_USER_KEY = 'ikorodusquare_current_user_v1';
const FAVORITES_KEY  = 'ikorodusquare_favorites_v1';
const BANNERS_KEY    = 'ikorodusquare_banners_v1';
const ORDERS_KEY     = 'ikorodusquare_orders_v1';
const PROMOTIONS_KEY = 'ikorodusquare_promotions_v1';
const SETTINGS_KEY   = 'ikorodusquare_settings_v2';

// Product-level soft-delete tombstone (vendors are hard-deleted from Supabase)
const DELETED_PRODUCT_IDS_KEY = 'ikorodusquare_deleted_product_ids';

export const INITIAL_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'addr_1',
    title: 'Home (Agric)',
    streetAddress: '14 Hospital Road, off Agric Bus Stop',
    area: 'Agric',
    landmark: 'Opposite First Bank, Yellow Gate',
    phone: '08023456789',
    isDefault: true,
  },
  {
    id: 'addr_2',
    title: 'Office (Sabo)',
    streetAddress: 'Suite 12, Sabo Modern Market Complex',
    area: 'Sabo Market',
    landmark: 'Near Zenith Bank ATM',
    phone: '08023456789',
    isDefault: false,
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'IKD-2026-8812',
    userId: 'user_shopper_1',
    customerName: 'Babatunde Adeleke',
    customerPhone: '08023456789',
    vendorId: 'v1',
    vendorName: 'Ikorodu Tech & Gadget Hub',
    vendorSlug: 'ikorodu-tech-gadget-hub',
    vendorWhatsapp: '2348031234567',
    vendorArea: 'Sabo Market',
    items: [
      {
        id: 'item_1',
        productId: 'p1',
        name: 'Oraimo FreePods 4 Wireless Earbuds',
        price: 24500,
        quantity: 1,
        vendorId: 'v1',
        vendorName: 'Ikorodu Tech & Gadget Hub',
        vendorSlug: 'ikorodu-tech-gadget-hub',
      },
      {
        id: 'item_2',
        productId: 'p2',
        name: 'Type-C Fast Charging Cable (65W)',
        price: 3500,
        quantity: 2,
        vendorId: 'v1',
        vendorName: 'Ikorodu Tech & Gadget Hub',
        vendorSlug: 'ikorodu-tech-gadget-hub',
      },
    ],
    totalAmount: 31500,
    status: 'dispatched',
    deliveryAddress: INITIAL_DELIVERY_ADDRESSES[0],
    paymentMethod: 'pay_on_delivery',
    notes: 'Please call before heading down from Sabo Bus Stop.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'ord_102',
    orderNumber: 'IKD-2026-7740',
    userId: 'user_shopper_1',
    customerName: 'Babatunde Adeleke',
    customerPhone: '08023456789',
    vendorId: 'v2',
    vendorName: 'Elegance Fabrics & Ready-to-Wear',
    vendorSlug: 'elegance-fabrics-ikorodu',
    vendorWhatsapp: '2348029876543',
    vendorArea: 'Garage Roundabout',
    items: [
      {
        id: 'item_3',
        productId: 'p3',
        name: 'Designer Ankara Material (6 Yards)',
        price: 18000,
        quantity: 1,
        vendorId: 'v2',
        vendorName: 'Elegance Fabrics & Ready-to-Wear',
        vendorSlug: 'elegance-fabrics-ikorodu',
      },
    ],
    totalAmount: 18000,
    status: 'delivered',
    deliveryAddress: INITIAL_DELIVERY_ADDRESSES[1],
    paymentMethod: 'bank_transfer',
    notes: 'Delivered directly to shop office.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
];

export const SEED_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq_101',
    vendorId: 'v1',
    customerName: 'Babatunde Adeleke',
    customerPhone: '08023456789',
    customerArea: 'Agric',
    productName: 'Oraimo FreePods 4 Wireless Earbuds',
    message: 'Hello! Is this Oraimo FreePods 4 original with warranty? Can you deliver to Agric Bus stop today?',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    read: false,
    readStatus: false,
  },
  {
    id: 'enq_102',
    vendorId: 'v1',
    customerName: 'Kemi Olaleye',
    customerPhone: '08145556677',
    customerArea: 'Sabo Market',
    message: 'Good afternoon! Do you have fast charging powerbanks (20,000mAh) available in your Sabo shop?',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    read: true,
    readStatus: true,
    replyText: 'Yes Kemi! We have original Oraimo 20k mAh in stock at Sabo shop. You can visit or call us directly.',
    repliedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
  },
];

// ── Product soft-delete helpers ────────────────────────────────────────────
function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCT_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistDeletedProductId(productId: string): void {
  try {
    const ids = getDeletedProductIds();
    ids.add(productId);
    localStorage.setItem(DELETED_PRODUCT_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

// ── Data mappers ───────────────────────────────────────────────────────────

export async function generateUniqueVendorSlug(businessName: string): Promise<string> {
  const baseSlug = (businessName || 'vendor-store')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'vendor-store';

  if (!supabase || !isSupabaseConfigured()) {
    // Fallback: check against seed vendors only
    const usedSlugs = new Set(SEED_VENDORS.map((v) => v.slug?.toLowerCase()));
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(uniqueSlug.toLowerCase())) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  }

  try {
    const { data: existingRows, error } = await supabase.from('vendors').select('slug');
    if (error) {
      console.error('❌ Error fetching vendor slugs:', error.message);
    }
    const existingSlugs = new Set(
      (existingRows || []).map((r: any) => r.slug?.toLowerCase().trim()).filter(Boolean)
    );
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.has(uniqueSlug.toLowerCase())) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  } catch (err) {
    console.error('❌ Exception generating unique slug:', err);
    return `${baseSlug}-${Date.now()}`;
  }
}

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
    status: v.status || 'pending',
    is_live: v.isLive ?? false,
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
    status: (r.status as Vendor['status']) || 'pending',
    isLive: r.is_live ?? r.isLive ?? false,
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

function userToRow(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    vendor_id: u.vendorId,
    email_verified: u.emailVerified,
    area: u.area,
    saved_addresses: u.savedAddresses,
    created_at: u.createdAt,
  };
}

// ── StorageManager ─────────────────────────────────────────────────────────
export class StorageManager {

  // ── Orphan repair ─────────────────────────────────────────────────────────
  static async repairOrphanedVendorsAsync(): Promise<number> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Repair]: Supabase not configured, skipping.');
      return 0;
    }

    try {
      const { data: vendorUsers, error: userErr } = await supabase
        .from('users').select('*').eq('role', 'vendor');

      if (userErr || !vendorUsers || vendorUsers.length === 0) return 0;

      const { data: existingVendorRows } = await supabase.from('vendors').select('*');
      const existingVendors   = (existingVendorRows || []).map(rowToVendor);
      const existingEmails    = new Set(existingVendors.map((v) => v.email?.toLowerCase().trim()).filter(Boolean));
      const existingVendorIds = new Set(existingVendors.map((v) => v.id).filter(Boolean));
      const existingSlugs     = new Set(existingVendors.map((v) => v.slug?.toLowerCase().trim()).filter(Boolean));

      let repairedCount = 0;

      for (const u of vendorUsers) {
        const uEmail    = (u.email || '').toLowerCase().trim();
        const uVendorId = u.vendor_id;

        const vendorExists =
          (uEmail && existingEmails.has(uEmail)) ||
          (uVendorId && existingVendorIds.has(uVendorId));

        if (vendorExists) {
          const existingVendor = existingVendors.find(
            (v) =>
              (uEmail && v.email?.toLowerCase().trim() === uEmail) ||
              (uVendorId && v.id === uVendorId)
          );
          if (existingVendor && u.vendor_id !== existingVendor.id) {
            await supabase.from('users').update({ vendor_id: existingVendor.id }).eq('id', u.id);
          }
          continue;
        }

        console.warn(`⚠️ [Repair] Orphaned vendor user: ${u.email} (${u.id})`);

        const rawName  = u.name || (u.email ? u.email.split('@')[0] : 'Vendor Store');
        const baseSlug = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'vendor-store';

        let uniqueSlug = baseSlug;
        let counter    = 1;
        while (existingSlugs.has(uniqueSlug.toLowerCase())) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        existingSlugs.add(uniqueSlug.toLowerCase());

        const newVendorId = uVendorId || ('v-' + Date.now() + '-' + Math.floor(Math.random() * 1000));

        const newVendorObj: Vendor = {
          id: newVendorId,
          slug: uniqueSlug,
          businessName: rawName,
          ownerName: rawName,
          email: u.email || '',
          emailVerified: true,
          whatsapp: u.phone || '',
          phone: u.phone || '',
          category: 'Lifestyle',
          subCategory: 'General Merchant',
          area: u.area || 'Ikorodu',
          zone: 'East zone',
          description: `${rawName} is a local vendor in ${u.area || 'Ikorodu'}, Ikorodu.`,
          address: `${u.area || 'Ikorodu'}, Ikorodu, Lagos State`,
          coverPhotoURL: 'https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=1000&q=80',
          logoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          status: 'pending',
          isLive: false,
          isPremium: false,
          ninVerified: false,
          isFeatured: false,
          createdAt: u.created_at || new Date().toISOString(),
          rating: 5.0,
          reviewCount: 0,
          analytics: { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] },
        };

        const { error: insertError } = await supabase.from('vendors').upsert(vendorToRow(newVendorObj));
        if (insertError) {
          console.error('❌ [Repair] Failed to insert vendor:', insertError.message);
        } else {
          repairedCount++;
          existingEmails.add(uEmail);
          existingVendorIds.add(newVendorId);
          await supabase.from('users').update({ vendor_id: newVendorId }).eq('id', u.id);
        }
      }

      return repairedCount;
    } catch (err) {
      console.error('❌ [Repair] Exception:', err);
      return 0;
    }
  }

  // ── initFirestoreSync — handles products, reviews, orders, enquiries only ─
  // IMPORTANT: vendors are intentionally NOT handled here.
  // Vendor state is managed exclusively by AppContext via fetchVendorsFromSupabase()
  // and the realtime channel in AppContext. This prevents the double-write
  // localStorage→Supabase→localStorage race condition.
  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Sync] Supabase not configured. Using localStorage fallback.');
      return;
    }

    try {
      // Run orphan repair silently in background
      this.repairOrphanedVendorsAsync().catch((e) =>
        console.warn('[Repair] Background repair warning:', e)
      );

      // Seed vendors to Supabase only if the table is empty (first-time setup)
      const { data: vendorCheck, error: vcErr } = await supabase
        .from('vendors').select('id').limit(1);
      if (!vcErr && (!vendorCheck || vendorCheck.length === 0)) {
        console.log('[Sync] Seeding initial vendors to Supabase...');
        for (const v of SEED_VENDORS) {
          await supabase.from('vendors').upsert(vendorToRow(v));
        }
      }
      // NOTE: We do NOT write vendors to localStorage here.
      // AppContext fetches vendors directly from Supabase on boot.

      // Products
      const { data: supaProducts, error: pErr } = await supabase.from('products').select('*');
      if (pErr) {
        console.error('[Sync] products fetch error:', pErr.message);
      } else if (supaProducts && supaProducts.length > 0) {
        const deletedProductIds = getDeletedProductIds();
        const fetched = supaProducts
          .map(rowToProduct)
          .filter((p: Product) => !deletedProductIds.has(p.id));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        console.log('[Sync] Seeding initial products...');
        for (const p of SEED_PRODUCTS) {
          await supabase.from('products').upsert(productToRow(p));
        }
      }

      // Reviews
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (supaReviews && supaReviews.length > 0) {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(supaReviews.map(rowToReview)));
      } else {
        for (const r of SEED_REVIEWS) {
          await supabase.from('reviews').upsert(reviewToRow(r));
        }
      }

      // Orders
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (supaOrders && supaOrders.length > 0) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(supaOrders.map(rowToOrder)));
      } else {
        for (const o of SEED_ORDERS) {
          await supabase.from('orders').upsert(orderToRow(o));
        }
      }

      // Enquiries
      const { data: supaEnquiries } = await supabase.from('enquiries').select('*');
      if (supaEnquiries && supaEnquiries.length > 0) {
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(supaEnquiries.map(rowToEnquiry)));
        if (onUpdate) onUpdate();
      } else {
        for (const e of SEED_ENQUIRIES) {
          await supabase.from('enquiries').upsert(enquiryToRow(e));
        }
      }

      // Realtime for products only — vendors are handled in AppContext
      supabase
        .channel('storage:products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          async () => {
            const { data } = await supabase.from('products').select('*');
            if (data) {
              const deletedProductIds = getDeletedProductIds();
              const fresh = data
                .map(rowToProduct)
                .filter((p: Product) => !deletedProductIds.has(p.id));
              localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fresh));
              if (onUpdate) onUpdate();
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.warn('[Sync] Operating with localStorage fallback:', error);
    }
  }

  // ── Vendors — all methods write directly to Supabase ─────────────────────
  // getVendors() is kept as a fallback only (used by auth resolution etc.)
  // The main vendor list in the UI comes from AppContext's fetchVendorsFromSupabase().

  static getVendors(): Vendor[] {
    // This method is only used as a fallback when Supabase is unavailable.
    // Do NOT use this to populate the main vendor list in the UI.
    return SEED_VENDORS;
  }

  static getVendorBySlug(slug: string): Vendor | undefined {
    // Sync fallback — in production AppContext holds the authoritative list
    return SEED_VENDORS.find((v) => v.slug.toLowerCase() === slug.toLowerCase());
  }

  static getVendorById(id: string): Vendor | undefined {
    return SEED_VENDORS.find((v) => v.id === id);
  }

  static async addVendorAsync(newVendor: Vendor): Promise<Vendor> {
    if (!newVendor.slug) {
      newVendor.slug = await generateUniqueVendorSlug(newVendor.businessName || 'vendor');
    }
    // Always start as pending — admin must approve
    newVendor.status  = newVendor.status || 'pending';
    newVendor.isLive  = newVendor.isLive ?? false;

    if (!supabase) {
      console.warn('[addVendorAsync] Supabase not available');
      return newVendor;
    }

    // Check if vendor with this email already exists
    if (newVendor.email) {
      const { data: existing } = await supabase
        .from('vendors')
        .select('*')
        .ilike('email', newVendor.email)
        .maybeSingle();

      if (existing) {
        console.log('[addVendorAsync] Vendor with this email already exists, returning existing.');
        newVendor.id = existing.id;
        return rowToVendor(existing);
      }
    }

    const row = vendorToRow(newVendor);
    // Belt-and-suspenders: explicitly set status and is_live on the row
    row.status  = 'pending';
    row.is_live = false;

    console.log('[addVendorAsync] Writing new vendor to Supabase:', row.id, row.business_name, row.slug);

    const { data, error } = await supabase.from('vendors').upsert(row).select();

    if (error) {
      console.error('❌ [addVendorAsync] Supabase insert error:', error.message, error.details);
      throw new Error(`Vendor creation failed: ${error.message}`);
    }

    if (data && data.length > 0) {
      console.log('✅ [addVendorAsync] Vendor created in Supabase:', data[0].id);
      return rowToVendor(data[0]);
    }

    console.warn('⚠️ [addVendorAsync] Supabase returned empty data, returning original object.');
    return newVendor;
    // NOTE: We do NOT write to localStorage here.
    // AppContext's realtime INSERT handler picks up the new row and updates state.
  }

  static addVendor(newVendor: Vendor): Vendor {
    this.addVendorAsync(newVendor).catch((e) => console.error('[addVendor] async error:', e));
    return newVendor;
  }

  static async updateVendorAsync(updated: Vendor): Promise<Vendor> {
    if (!supabase) {
      console.warn('[updateVendorAsync] Supabase not available');
      return updated;
    }

    const row = vendorToRow(updated);
    const { data, error } = await supabase.from('vendors').upsert(row).select();

    if (error) {
      console.error('❌ [updateVendorAsync] Supabase update error:', error.message);
      throw new Error(`Vendor update failed: ${error.message}`);
    }

    if (data && data.length > 0) {
      const savedVendor = rowToVendor(data[0]);
      console.log('✅ [updateVendorAsync] Vendor updated in Supabase:', savedVendor.id);
      return savedVendor;
    }

    return updated;
    // NOTE: No localStorage write. AppContext's realtime UPDATE handler
    // receives the change and patches React state.
  }

  static updateVendor(updated: Vendor): Vendor {
    this.updateVendorAsync(updated).catch((e) => console.error('[updateVendor] async error:', e));
    return updated;
  }

  static async deleteVendorAsync(vendorId: string): Promise<void> {
    if (!supabase) {
      console.warn('[deleteVendorAsync] Supabase not available');
      return;
    }

    // Delete products belonging to this vendor from Supabase
    await supabase.from('products').delete().eq('vendor_id', vendorId);
    // Delete the vendor from Supabase
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId);

    if (error) {
      console.error('❌ [deleteVendorAsync] Supabase delete error:', error.message);
      throw new Error(`Vendor delete failed: ${error.message}`);
    }

    console.log('✅ [deleteVendorAsync] Vendor deleted from Supabase:', vendorId);
    // NOTE: No localStorage write. AppContext's realtime DELETE handler
    // removes the vendor from React state automatically.
  }

  static deleteVendor(vendorId: string): void {
    this.deleteVendorAsync(vendorId).catch((e) => console.error('[deleteVendor] async error:', e));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
      }
      const list: Product[] = JSON.parse(data);
      const existingIds     = new Set(list.map((p) => p.id));
      const deletedProductIds = getDeletedProductIds();

      let updated = false;
      for (const sp of SEED_PRODUCTS) {
        if (!existingIds.has(sp.id) && !deletedProductIds.has(sp.id)) {
          list.push(sp);
          updated = true;
        }
      }
      if (updated) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
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

    if (supabase) {
      try {
        await supabase.from('products').upsert(productToRow(product));
      } catch (error) {
        console.error('[addProductAsync] Supabase error:', error);
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
    const idx      = products.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      products[idx] = updated;
      this.saveProducts(products);
    }

    if (supabase) {
      try {
        await supabase.from('products').upsert(productToRow(updated));
      } catch (error) {
        console.error('[updateProductAsync] Supabase error:', error);
      }
    }
    return updated;
  }

  static updateProduct(updated: Product): Product {
    this.updateProductAsync(updated);
    return updated;
  }

  static async deleteProductAsync(productId: string): Promise<void> {
    persistDeletedProductId(productId);
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);

    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (error) {
        console.error('[deleteProductAsync] Supabase error:', error);
      }
    }
  }

  static deleteProduct(productId: string): void {
    this.deleteProductAsync(productId);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

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

    if (supabase) {
      try {
        await supabase.from('reviews').upsert(reviewToRow(review));
      } catch (error) {
        console.error('[addReviewAsync] Supabase error:', error);
      }
    }

    // Recalculate vendor rating — update Supabase directly
    const vendorReviews = reviews.filter((r) => r.vendorId === review.vendorId);
    const avg = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
    if (supabase) {
      try {
        await supabase.from('vendors').update({
          rating: parseFloat(avg.toFixed(1)),
          review_count: vendorReviews.length,
        }).eq('id', review.vendorId);
      } catch (e) {
        console.error('[addReviewAsync] Rating update error:', e);
      }
    }

    return review;
  }

  static addReview(review: Review): Review {
    this.addReviewAsync(review);
    return review;
  }

  // ── Enquiries ─────────────────────────────────────────────────────────────

  static getEnquiries(vendorIdOrSlug?: string): Enquiry[] {
    try {
      const data = localStorage.getItem(ENQUIRIES_KEY);
      let all: Enquiry[] = data ? JSON.parse(data) : [];
      if (all.length === 0) {
        all = SEED_ENQUIRIES;
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(SEED_ENQUIRIES));
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (vendorIdOrSlug) {
        return all.filter((e) => e.vendorId === vendorIdOrSlug);
      }
      return all;
    } catch {
      return SEED_ENQUIRIES;
    }
  }

  static async addEnquiryAsync(enquiry: Enquiry): Promise<Enquiry> {
    const enquiries = this.getEnquiries();
    enquiries.unshift(enquiry);
    localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));

    if (supabase) {
      try {
        await supabase.from('enquiries').upsert(enquiryToRow(enquiry));
      } catch (error) {
        console.error('[addEnquiryAsync] Supabase error:', error);
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
    const target    = enquiries.find((e) => e.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
      if (supabase) {
        try {
          await supabase.from('enquiries').update({ read: true, read_status: true }).eq('id', id);
        } catch (error) {
          console.error('[markEnquiryReadAsync] Supabase error:', error);
        }
      }
    }
  }

  static markEnquiryRead(id: string): void {
    this.markEnquiryReadAsync(id);
  }

  static async replyEnquiryAsync(id: string, replyText: string): Promise<Enquiry | null> {
    const enquiries = this.getEnquiries();
    const target    = enquiries.find((e) => e.id === id);
    if (target) {
      target.replyText  = replyText;
      target.repliedAt  = new Date().toISOString();
      target.read       = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
      if (supabase) {
        try {
          await supabase.from('enquiries').update({
            reply_text: replyText,
            replied_at: target.repliedAt,
            read: true,
            read_status: true,
          }).eq('id', id);
        } catch (error) {
          console.error('[replyEnquiryAsync] Supabase error:', error);
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
    if (supabase) {
      try {
        await supabase.from('enquiries').delete().eq('id', id);
      } catch (error) {
        console.error('[deleteEnquiryAsync] Supabase error:', error);
      }
    }
  }

  static deleteEnquiry(id: string): void {
    this.deleteEnquiryAsync(id);
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  static getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async setCurrentUserAsync(user: User | null): Promise<void> {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      if (supabase) {
        try {
          await supabase.from('users').upsert(userToRow(user));
        } catch (error) {
          console.error('[setCurrentUserAsync] Supabase error:', error);
        }
      }
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  static setCurrentUser(user: User | null): void {
    this.setCurrentUserAsync(user);
  }

  // ── Favourites ────────────────────────────────────────────────────────────

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
    const idx  = favs.indexOf(vendorId);
    if (idx === -1) favs.push(vendorId);
    else favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
  }

  // ── Banners ───────────────────────────────────────────────────────────────

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

  // ── Orders ────────────────────────────────────────────────────────────────

  static getOrders(userId?: string): Order[] {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      if (!data) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
        return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
      }
      const all: Order[] = JSON.parse(data);
      return userId ? all.filter((o) => o.userId === userId) : all;
    } catch {
      return SEED_ORDERS;
    }
  }

  static async addOrderAsync(order: Order): Promise<Order> {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    if (supabase) {
      try {
        await supabase.from('orders').upsert(orderToRow(order));
      } catch (error) {
        console.error('[addOrderAsync] Supabase error:', error);
      }
    }
    return order;
  }

  static addOrder(order: Order): Order {
    this.addOrderAsync(order);
    return order;
  }

  // ── Addresses ─────────────────────────────────────────────────────────────

  static getUserAddresses(user?: User | null): DeliveryAddress[] {
    if (user?.savedAddresses && user.savedAddresses.length > 0) return user.savedAddresses;
    return INITIAL_DELIVERY_ADDRESSES;
  }

  static async saveUserAddressesAsync(user: User, addresses: DeliveryAddress[]): Promise<User> {
    const updatedUser: User = { ...user, savedAddresses: addresses };
    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  static incrementVendorTap(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): void {
    if (!vendorId || !supabase) return;
    // Fire-and-forget: increment the appropriate analytics counter in Supabase
    const field = type === 'profile'
      ? 'analytics->profileViews'
      : type === 'whatsapp'
      ? 'analytics->whatsappTaps'
      : 'analytics->productViews';
    // Use a raw increment via RPC if available, otherwise skip (analytics are non-critical)
    supabase.rpc('increment_vendor_analytics', { vendor_id: vendorId, field_name: type })
      .catch(() => {
        // Silently ignore if RPC doesn't exist yet
      });
  }

  // ── Admin settings ─────────────────────────────────────────────────────────

  static getSettings(): AdminSettings {
    try {
      try {
        localStorage.removeItem('ikorodusquare_settings');
        localStorage.removeItem('ikorodusquare_settings_v1');
      } catch { /* ignore */ }

      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        return DEFAULT_ADMIN_SETTINGS;
      }
      const settings = JSON.parse(data);

      let needsMigration = false;
      if (!settings.bankName || settings.bankName.includes('Moniepoint')) { settings.bankName = DEFAULT_ADMIN_SETTINGS.bankName; needsMigration = true; }
      if (!settings.accountName || settings.accountName === 'IkoroduSquare') { settings.accountName = DEFAULT_ADMIN_SETTINGS.accountName; needsMigration = true; }
      if (!settings.accountNumber || settings.accountNumber === '8123456789') { settings.accountNumber = DEFAULT_ADMIN_SETTINGS.accountNumber; needsMigration = true; }
      if (!settings.whatsappSupportNumber || settings.whatsappSupportNumber === '2348031234567') { settings.whatsappSupportNumber = DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber; needsMigration = true; }

      if (needsMigration) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return settings;
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  static saveSettings(settings: AdminSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (supabase) {
      try {
        supabase.from('settings').upsert({ id: 'platform_settings', ...settings });
      } catch (e) {
        console.error('[saveSettings] Supabase error:', e);
      }
    }
  }

  // ── Promotions ────────────────────────────────────────────────────────────

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
    const promotions    = this.getPromotions();
    const existingIndex = promotions.findIndex((p) => p.id === promo.id);
    if (existingIndex >= 0) promotions[existingIndex] = promo;
    else promotions.unshift(promo);
    this.savePromotions(promotions);

    if (supabase) {
      try { supabase.from('promotions').upsert(promo); }
      catch (e) { console.error('[createPromotionRequest] Supabase error:', e); }
    }
  }

  static activatePromotion(promo: Promotion): void {
    const promotions = this.getPromotions();
    const existingIndex = promotions.findIndex((p) => p.id === promo.id);

    const startDate  = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
    const updatedPromo: Promotion = { ...promo, status: 'active', startDate, expiryDate };

    if (existingIndex >= 0) promotions[existingIndex] = updatedPromo;
    else promotions.unshift(updatedPromo);
    this.savePromotions(promotions);

    // Update vendor featured flags directly in Supabase
    if (supabase) {
      if (updatedPromo.promotionType === 'sponsored_vendor') {
        supabase.from('vendors').update({
          is_featured: true,
          sponsored_category_slot: true,
        }).eq('id', updatedPromo.vendorId).catch(console.error);
      } else if (updatedPromo.promotionType === 'category_top_spot') {
        supabase.from('vendors').update({
          category_top_spot: true,
        }).eq('id', updatedPromo.vendorId).catch(console.error);
      } else if (updatedPromo.promotionType === 'featured_product' && updatedPromo.productId) {
        const products = this.getProducts();
        const p = products.find((prod) => prod.id === updatedPromo.productId);
        if (p) { p.featured = true; this.updateProduct(p); }
      } else if (updatedPromo.promotionType === 'homepage_banner') {
        const banners = this.getBanners();
        if (!banners.find((b) => b.promotionId === updatedPromo.id)) {
          const newBanner: BannerAd = {
            id: 'banner-promo-' + Date.now(),
            title: updatedPromo.bannerData?.title || `${updatedPromo.vendorName} — Special Store Spotlight`,
            subtitle: updatedPromo.bannerData?.subtitle || 'Top verified vendor in Ikorodu.',
            imageURL: updatedPromo.bannerData?.imageURL || 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80',
            ctaText: updatedPromo.bannerData?.ctaText || 'Visit Shop & Chat',
            linkURL: `/store/${updatedPromo.vendorSlug || ''}`,
            sponsorName: updatedPromo.vendorName,
            badgeText: 'FEATURED SPONSOR',
            promotionId: updatedPromo.id,
          };
          banners.unshift(newBanner);
          this.saveBanners(banners);
        }
      }

      supabase.from('promotions').upsert(updatedPromo).catch(console.error);
    }
  }

  static checkAndSyncPromotionExpiries(): void {
    const promotions = this.getPromotions();
    const now        = Date.now();
    let hasChanges   = false;
    let banners      = this.getBanners();

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      if (p.status === 'active' && new Date(p.expiryDate).getTime() <= now) {
        p.status   = 'expired';
        hasChanges = true;

        if (p.promotionType === 'homepage_banner') {
          banners = banners.filter((b) => b.promotionId !== p.id);
          this.saveBanners(banners);
        }

        if (supabase) {
          supabase.from('promotions').update({ status: 'expired' }).eq('id', p.id).catch(console.error);
        }
      }
    }

    if (hasChanges) this.savePromotions(promotions);
  }

  static updatePromotionStatus(id: string, newStatus: PromotionStatus, extendDays: number = 0): void {
    const promotions = this.getPromotions();
    const p          = promotions.find((item) => item.id === id);
    if (!p) return;

    p.status = newStatus;
    if (extendDays > 0) {
      const currentExpiry = new Date(p.expiryDate).getTime();
      p.expiryDate = new Date(Math.max(currentExpiry, Date.now()) + extendDays * 86400 * 1000).toISOString();
    }
    if (newStatus === 'active') {
      p.startDate  = new Date().toISOString();
      p.expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
    }

    this.savePromotions(promotions);

    if (newStatus === 'active') {
      this.activatePromotion(p);
    } else {
      if (p.promotionType === 'homepage_banner') {
        const banners = this.getBanners().filter((b) => b.promotionId !== p.id);
        this.saveBanners(banners);
      }
    }

    if (supabase) {
      supabase.from('promotions').upsert(p).catch(console.error);
    }
  }
}