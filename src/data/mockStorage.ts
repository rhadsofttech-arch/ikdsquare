import { Vendor, Product, Review, Enquiry, User, BannerAd, Order, DeliveryAddress, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_REVIEWS, INITIAL_BANNER_ADS, INITIAL_PROMOTIONS } from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const VENDORS_KEY = 'ikorodusquare_vendors_v1';
const PRODUCTS_KEY = 'ikorodusquare_products_v1';
const REVIEWS_KEY = 'ikorodusquare_reviews_v1';
const ENQUIRIES_KEY = 'ikorodusquare_enquiries_v1';
const USERS_KEY = 'ikorodusquare_users_v1';
const CURRENT_USER_KEY = 'ikorodusquare_current_user_v1';
const FAVORITES_KEY = 'ikorodusquare_favorites_v1';
const BANNERS_KEY = 'ikorodusquare_banners_v1';
const ORDERS_KEY = 'ikorodusquare_orders_v1';
const PROMOTIONS_KEY = 'ikorodusquare_promotions_v1';
const SETTINGS_KEY = 'ikorodusquare_settings_v2';

// ─── Delete-tracking keys ──────────────────────────────────────────────────
// These persist the IDs of seed records the admin has explicitly deleted so
// that getVendors() / getProducts() never re-inject them on the next read.
const DELETED_VENDOR_IDS_KEY  = 'ikorodusquare_deleted_vendor_ids';
const DELETED_PRODUCT_IDS_KEY = 'ikorodusquare_deleted_product_ids';

export const INITIAL_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'addr_1',
    title: 'Home (Agric)',
    streetAddress: '14 Hospital Road, off Agric Bus Stop',
    area: 'Agric',
    landmark: 'Opposite First Bank, Yellow Gate',
    phone: '08023456789',
    isDefault: true
  },
  {
    id: 'addr_2',
    title: 'Office (Sabo)',
    streetAddress: 'Suite 12, Sabo Modern Market Complex',
    area: 'Sabo Market',
    landmark: 'Near Zenith Bank ATM',
    phone: '08023456789',
    isDefault: false
  }
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
        vendorSlug: 'ikorodu-tech-gadget-hub'
      },
      {
        id: 'item_2',
        productId: 'p2',
        name: 'Type-C Fast Charging Cable (65W)',
        price: 3500,
        quantity: 2,
        vendorId: 'v1',
        vendorName: 'Ikorodu Tech & Gadget Hub',
        vendorSlug: 'ikorodu-tech-gadget-hub'
      }
    ],
    totalAmount: 31500,
    status: 'dispatched',
    deliveryAddress: INITIAL_DELIVERY_ADDRESSES[0],
    paymentMethod: 'pay_on_delivery',
    notes: 'Please call before heading down from Sabo Bus Stop.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
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
        vendorSlug: 'elegance-fabrics-ikorodu'
      }
    ],
    totalAmount: 18000,
    status: 'delivered',
    deliveryAddress: INITIAL_DELIVERY_ADDRESSES[1],
    paymentMethod: 'bank_transfer',
    notes: 'Delivered directly to shop office.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  }
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

// ─── Data Mappers between TypeScript and Supabase PostgreSQL schema ────────

export async function generateUniqueVendorSlug(businessName: string): Promise<string> {
  const baseSlug = (businessName || 'vendor-store')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'vendor-store';

  if (!supabase || !isSupabaseConfigured()) {
    const localVendors = StorageManager.getVendors();
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (localVendors.some((v) => v.slug?.toLowerCase() === uniqueSlug.toLowerCase())) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  }

  try {
    const { data: existingRows, error } = await supabase.from('vendors').select('slug');
    if (error) {
      console.error('❌ Error fetching existing vendor slugs from Supabase:', error.message, error.details, error.code, error.hint);
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

// ─── Internal helpers for delete-tracking ─────────────────────────────────

function getDeletedVendorIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_VENDOR_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistDeletedVendorId(vendorId: string): void {
  try {
    const ids = getDeletedVendorIds();
    ids.add(vendorId);
    localStorage.setItem(DELETED_VENDOR_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

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
    // ignore storage errors
  }
}

export class StorageManager {
  // Recovery script function: Repairs orphaned vendor users in public.users without corresponding public.vendors records
  static async repairOrphanedVendorsAsync(): Promise<number> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Repair Script]: Supabase not configured. Skipping orphan vendor repair.');
      return 0;
    }

    try {
      console.log('🔍 [Repair Script] Scanning public.users for vendor users without corresponding public.vendors records...');

      // 1. Fetch vendor users from public.users table
      const { data: vendorUsers, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'vendor');

      if (userErr) {
        console.error('❌ [Repair Script] Error querying public.users:', userErr.message, userErr.details, userErr.code, userErr.hint);
        return 0;
      }

      if (!vendorUsers || vendorUsers.length === 0) {
        console.log('ℹ️ [Repair Script] No vendor users found in public.users.');
        return 0;
      }

      // 2. Fetch existing vendors from public.vendors table
      const { data: existingVendorRows, error: vendorErr } = await supabase
        .from('vendors')
        .select('*');

      if (vendorErr) {
        console.error('❌ [Repair Script] Error querying public.vendors:', vendorErr.message, vendorErr.details, vendorErr.code, vendorErr.hint);
        return 0;
      }

      const existingVendors = (existingVendorRows || []).map(rowToVendor);
      const existingEmails = new Set(
        existingVendors.map((v) => v.email?.toLowerCase().trim()).filter(Boolean)
      );
      const existingVendorIds = new Set(
        existingVendors.map((v) => v.id).filter(Boolean)
      );
      const existingSlugs = new Set(
        existingVendors.map((v) => v.slug?.toLowerCase().trim()).filter(Boolean)
      );

      let repairedCount = 0;

      for (const u of vendorUsers) {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uVendorId = u.vendor_id;

        // Check if vendor already exists by email or vendor_id
        const vendorExists = (uEmail && existingEmails.has(uEmail)) || (uVendorId && existingVendorIds.has(uVendorId));

        if (vendorExists) {
          const existingVendor = existingVendors.find(
            (v) => (uEmail && v.email?.toLowerCase().trim() === uEmail) || (uVendorId && v.id === uVendorId)
          );
          if (existingVendor && u.vendor_id !== existingVendor.id) {
            console.log(`[Repair Script] Linking existing vendor ID "${existingVendor.id}" to user "${u.id}" in public.users...`);
            await supabase.from('users').update({ vendor_id: existingVendor.id }).eq('id', u.id);
          }
          continue;
        }

        console.warn(`⚠️ [Repair Script] Orphaned vendor user found! Email: "${u.email}", User ID: "${u.id}". Repairing...`);

        const rawName = u.name || (u.email ? u.email.split('@')[0] : 'Vendor Store');
        const baseSlug = rawName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'vendor-store';

        let uniqueSlug = baseSlug;
        let counter = 1;
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
          description: `${rawName} is a local vendor operating in ${u.area || 'Ikorodu'}, Ikorodu.`,
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
          analytics: {
            profileViews: 0,
            whatsappTaps: 0,
            productViews: 0,
            dailyViews: [],
          },
        };

        const row = vendorToRow(newVendorObj);
        const { data: insertedData, error: insertError } = await supabase
          .from('vendors')
          .upsert(row)
          .select();

        if (insertError) {
          console.error('❌ [Repair Script] Failed to insert missing vendor into public.vendors:', insertError.message, insertError.details, insertError.code, insertError.hint);
        } else {
          console.log('✅ [Repair Script] Successfully created missing vendor in public.vendors:', insertedData);
          repairedCount++;
          existingEmails.add(uEmail);
          existingVendorIds.add(newVendorId);
          await supabase.from('users').update({ vendor_id: newVendorId }).eq('id', u.id);
        }
      }

      if (repairedCount > 0) {
        console.log(`🎉 [Repair Script] Successfully repaired ${repairedCount} orphaned vendor user(s).`);
      } else {
        console.log('✅ [Repair Script] All vendor users already have corresponding vendor records in public.vendors.');
      }

      return repairedCount;
    } catch (err) {
      console.error('❌ [Repair Script] Exception running vendor repair script:', err);
      return 0;
    }
  }

  // Sync Supabase PostgreSQL data on boot
  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Supabase Sync Note]: Supabase URL/Key not configured. Operating with local storage cache.');
      return;
    }

    try {
      await this.repairOrphanedVendorsAsync();

      // 1. Fetch & Sync Vendors
      const { data: supaVendors, error: vErr } = await supabase.from('vendors').select('*');
      if (vErr) {
        console.error('Supabase fetch vendors error:', vErr);
      } else if (supaVendors && supaVendors.length > 0) {
        const fetched = supaVendors.map(rowToVendor);
        localStorage.setItem(VENDORS_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        console.log('[Supabase] Seeding initial vendors to Supabase...');
        for (const v of SEED_VENDORS) {
          await supabase.from('vendors').upsert(vendorToRow(v));
        }
      }

      // 2. Fetch & Sync Products
      const { data: supaProducts, error: pErr } = await supabase.from('products').select('*');
      if (pErr) {
        console.error('Supabase fetch products error:', pErr);
      } else if (supaProducts && supaProducts.length > 0) {
        const fetched = supaProducts.map(rowToProduct);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        console.log('[Supabase] Seeding initial products to Supabase...');
        for (const p of SEED_PRODUCTS) {
          await supabase.from('products').upsert(productToRow(p));
        }
      }

      // 3. Fetch & Sync Reviews
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (supaReviews && supaReviews.length > 0) {
        const fetched = supaReviews.map(rowToReview);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(fetched));
      } else {
        for (const r of SEED_REVIEWS) {
          await supabase.from('reviews').upsert(reviewToRow(r));
        }
      }

      // 4. Fetch & Sync Orders
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (supaOrders && supaOrders.length > 0) {
        const fetched = supaOrders.map(rowToOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(fetched));
      } else {
        for (const o of SEED_ORDERS) {
          await supabase.from('orders').upsert(orderToRow(o));
        }
      }

      // 5. Fetch & Sync Enquiries
      const { data: supaEnquiries } = await supabase.from('enquiries').select('*');
      if (supaEnquiries && supaEnquiries.length > 0) {
        const fetched = supaEnquiries.map(rowToEnquiry);
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(fetched));
        if (onUpdate) onUpdate();
      } else {
        for (const e of SEED_ENQUIRIES) {
          await supabase.from('enquiries').upsert(enquiryToRow(e));
        }
      }

      // Subscribe to Realtime Table Changes
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

    } catch (error) {
      console.warn('[Supabase Sync Note]: Operating with local cache fallback.', error);
    }
  }

  // ── FIXED: getVendors ────────────────────────────────────────────────────
  // Seed records the admin has explicitly deleted are tracked in
  // DELETED_VENDOR_IDS_KEY so they are never re-injected on subsequent reads.
  static getVendors(): Vendor[] {
    try {
      const data = localStorage.getItem(VENDORS_KEY);
      if (!data) {
        localStorage.setItem(VENDORS_KEY, JSON.stringify(SEED_VENDORS));
        return SEED_VENDORS;
      }

      const list: Vendor[] = JSON.parse(data);
      const existingIds    = new Set(list.map((v) => v.id));
      const deletedIds     = getDeletedVendorIds();

      let updated = false;
      for (const sv of SEED_VENDORS) {
        // Only re-inject a seed vendor when it is genuinely missing AND was
        // never explicitly deleted by the admin.
        if (!existingIds.has(sv.id) && !deletedIds.has(sv.id)) {
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
      const vId   = v.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return vSlug === cleanSlug || vName.includes(cleanSlug) || vId === cleanSlug;
    });
  }

  static getVendorById(id: string): Vendor | undefined {
    return this.getVendors().find((v) => v.id === id);
  }

  static async addVendorAsync(newVendor: Vendor): Promise<Vendor> {
    if (!newVendor.slug) {
      newVendor.slug = await generateUniqueVendorSlug(newVendor.businessName || 'vendor');
    }
    if (!newVendor.status) newVendor.status = 'pending';
    if (newVendor.isLive === undefined) newVendor.isLive = false;

    if (supabase) {
      try {
        if (newVendor.email) {
          const { data: existingSupaVendor } = await supabase
            .from('vendors')
            .select('*')
            .ilike('email', newVendor.email)
            .maybeSingle();

          if (existingSupaVendor) {
            newVendor.id = existingSupaVendor.id;
          }
        }

        const row = vendorToRow(newVendor);
        console.log('[Supabase] Inserting vendor to database table "vendors":', row.id, row.business_name, row.slug);
        
        const { data, error } = await supabase.from('vendors').upsert(row).select();

        if (error) {
          console.error('❌ Supabase vendor insert error:', error.message, error.details, error.code, error.hint);
          throw new Error(`Database vendor creation failed: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log('✅ Vendor record successfully created in Supabase database:', data[0]);
          newVendor = rowToVendor(data[0]);
        } else {
          console.warn('⚠️ Supabase vendor insert returned empty data response.');
        }
      } catch (error: any) {
        console.error('❌ Exception writing vendor to Supabase:', error);
        throw error;
      }
    }

    const vendors = this.getVendors();
    const existingIndex = vendors.findIndex(
      (v) => v.id === newVendor.id || (v.email && v.email.toLowerCase() === newVendor.email?.toLowerCase())
    );
    if (existingIndex !== -1) {
      vendors[existingIndex] = newVendor;
    } else {
      vendors.unshift(newVendor);
    }
    this.saveVendors(vendors);

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

    if (supabase) {
      try {
        await supabase.from('vendors').upsert(vendorToRow(updated));
      } catch (error) {
        console.error('Supabase update error (vendor):', error);
      }
    }
    return updated;
  }

  static updateVendor(updated: Vendor): Vendor {
    this.updateVendorAsync(updated);
    return updated;
  }

  // ── FIXED: deleteVendorAsync ─────────────────────────────────────────────
  // Persists the vendor ID (and all its product IDs) into the deleted-IDs
  // tombstone lists so getVendors() / getProducts() never re-inject them.
  static async deleteVendorAsync(vendorId: string): Promise<void> {
    // 1. Record the vendor ID as deleted before modifying the list
    persistDeletedVendorId(vendorId);

    // 2. Also tombstone every seed product belonging to this vendor
    const productsToRemove = this.getProducts().filter((p) => p.vendorId === vendorId);
    for (const p of productsToRemove) {
      persistDeletedProductId(p.id);
    }

    // 3. Remove from localStorage
    const vendors = this.getVendors().filter((v) => v.id !== vendorId);
    this.saveVendors(vendors);

    const products = this.getProducts().filter((p) => p.vendorId !== vendorId);
    this.saveProducts(products);

    // 4. Remove from Supabase
    if (supabase) {
      try {
        await supabase.from('vendors').delete().eq('id', vendorId);
        await supabase.from('products').delete().eq('vendor_id', vendorId);
      } catch (error) {
        console.error('Supabase delete error (vendor):', error);
      }
    }
  }

  static deleteVendor(vendorId: string): void {
    this.deleteVendorAsync(vendorId);
  }

  // ── FIXED: getProducts ───────────────────────────────────────────────────
  // Respects both the product-level and vendor-level deleted-ID tombstones so
  // seed products are never re-injected after deletion.
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
      }

      const list: Product[]      = JSON.parse(data);
      const existingIds          = new Set(list.map((p) => p.id));
      const deletedProductIds    = getDeletedProductIds();
      const deletedVendorIds     = getDeletedVendorIds();

      let updated = false;
      for (const sp of SEED_PRODUCTS) {
        // Re-inject only if: not already present AND not explicitly deleted
        // AND its parent vendor was not deleted.
        if (
          !existingIds.has(sp.id) &&
          !deletedProductIds.has(sp.id) &&
          !deletedVendorIds.has(sp.vendorId)
        ) {
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

    if (supabase) {
      try {
        await supabase.from('products').upsert(productToRow(product));
      } catch (error) {
        console.error('Supabase write error (product):', error);
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

    if (supabase) {
      try {
        await supabase.from('products').upsert(productToRow(updated));
      } catch (error) {
        console.error('Supabase update error (product):', error);
      }
    }
    return updated;
  }

  static updateProduct(updated: Product): Product {
    this.updateProductAsync(updated);
    return updated;
  }

  // ── FIXED: deleteProductAsync ────────────────────────────────────────────
  // Tombstones the product ID so getProducts() never re-injects it.
  static async deleteProductAsync(productId: string): Promise<void> {
    persistDeletedProductId(productId);

    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);

    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (error) {
        console.error('Supabase delete error (product):', error);
      }
    }
  }

  static deleteProduct(productId: string): void {
    this.deleteProductAsync(productId);
  }

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
        console.error('Supabase write error (review):', error);
      }
    }

    // Recalculate rating on vendor
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
        console.error('Supabase write error (enquiry):', error);
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
      if (supabase) {
        try {
          await supabase.from('enquiries').update({ read: true, read_status: true }).eq('id', id);
        } catch (error) {
          console.error('Supabase update error (enquiry read):', error);
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
      if (supabase) {
        try {
          await supabase.from('enquiries').update({
            reply_text: replyText,
            replied_at: target.repliedAt,
            read: true,
            read_status: true,
          }).eq('id', id);
        } catch (error) {
          console.error('Supabase update error (enquiry reply):', error);
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
        console.error('Supabase delete error (enquiry):', error);
      }
    }
  }

  static deleteEnquiry(id: string): void {
    this.deleteEnquiryAsync(id);
  }

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
          console.error('Supabase write error (user):', error);
        }
      }
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  static setCurrentUser(user: User | null): void {
    this.setCurrentUserAsync(user);
  }

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

  static getOrders(userId?: string): Order[] {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      if (!data) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
        return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
      }
      const all: Order[] = JSON.parse(data);
      if (userId) {
        return all.filter((o) => o.userId === userId || userId.startsWith('user_shopper') || userId.length > 5);
      }
      return all;
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
        console.error('Supabase write error (order):', error);
      }
    }
    return order;
  }

  static addOrder(order: Order): Order {
    this.addOrderAsync(order);
    return order;
  }

  static getUserAddresses(user?: User | null): DeliveryAddress[] {
    if (user?.savedAddresses && user.savedAddresses.length > 0) {
      return user.savedAddresses;
    }
    return INITIAL_DELIVERY_ADDRESSES;
  }

  static async saveUserAddressesAsync(user: User, addresses: DeliveryAddress[]): Promise<User> {
    const updatedUser: User = {
      ...user,
      savedAddresses: addresses,
    };
    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  static incrementVendorTap(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): void {
    const vendor = this.getVendorById(vendorId);
    if (!vendor) return;
    if (type === 'profile') vendor.analytics.profileViews += 1;
    if (type === 'whatsapp') vendor.analytics.whatsappTaps += 1;
    if (type === 'product') vendor.analytics.productViews += 1;
    this.updateVendor(vendor);
  }

  // ── ADMIN SETTINGS ───────────────────────────────────────────────────────

  static getSettings(): AdminSettings {
    try {
      try {
        localStorage.removeItem('ikorodusquare_settings');
        localStorage.removeItem('ikorodusquare_settings_v1');
      } catch {
        // ignore
      }

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
    if (supabase) {
      try {
        supabase.from('settings').upsert({ id: 'platform_settings', ...settings });
      } catch (e) {
        console.error('Supabase settings save error:', e);
      }
    }
  }

  // ── PROMOTION MANAGEMENT & AUTOMATED EXPIRY ──────────────────────────────

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

  static saveBanners(banners: BannerAd[]): void {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
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

    if (supabase) {
      try {
        supabase.from('promotions').upsert(promo);
      } catch (e) {
        console.error('Supabase write error (promotion request):', e);
      }
    }
  }

  static activatePromotion(promo: Promotion): void {
    const promotions = this.getPromotions();
    const existingIndex = promotions.findIndex((p) => p.id === promo.id);

    const startDate  = new Date().toISOString();
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

    const vendors  = this.getVendors();
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

    if (supabase) {
      try {
        supabase.from('promotions').upsert(updatedPromo);
      } catch (e) {
        console.error('Supabase write error (promotion):', e);
      }
    }
  }

  static checkAndSyncPromotionExpiries(): void {
    const promotions = this.getPromotions();
    const now = Date.now();
    let hasChanges = false;

    const vendors  = this.getVendors();
    const products = this.getProducts();
    let banners    = this.getBanners();

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      if (p.status === 'active') {
        const expiryTime = new Date(p.expiryDate).getTime();
        if (now >= expiryTime) {
          p.status = 'expired';
          hasChanges = true;

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
      p.startDate  = new Date().toISOString();
      p.expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
    }

    this.savePromotions(promotions);

    if (newStatus === 'active') {
      this.activatePromotion(p);
    } else {
      const vendors  = this.getVendors();
      const products = this.getProducts();
      let banners    = this.getBanners();

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

    if (supabase) {
      try {
        supabase.from('promotions').upsert(p);
      } catch (e) {
        console.error('Supabase update status error:', e);
      }
    }
  }
}