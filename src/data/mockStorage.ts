import { Vendor, Product, Review, Enquiry, User, BannerAd, Order, DeliveryAddress, Promotion, PromotionStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from '../types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_REVIEWS, INITIAL_BANNER_ADS, INITIAL_PROMOTIONS } from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const FAVORITES_KEY = 'ikorodusquare_favorites_v1';

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

// Data Mappers between TypeScript and Supabase PostgreSQL schema
export async function generateUniqueVendorSlug(businessName: string): Promise<string> {
  const baseSlug = (businessName || 'vendor-store')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'vendor-store';

  if (!supabase || !isSupabaseConfigured()) {
    const localVendors = await StorageManager.getVendorsAsync();
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

export class StorageManager {
  static onVendorChange: (() => void) | null = null;

  // Recovery script function: Repairs orphaned vendor users in public.users without corresponding public.vendors records
  static async repairOrphanedVendorsAsync(): Promise<number> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Repair Script]: Supabase not configured. Skipping orphan vendor repair.');
      return 0;
    }

    try {
      console.log('🔍 [Repair Script] Scanning public.users for vendor users without corresponding public.vendors records...');

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

        console.warn(`⚠️ [Repair Script] Orphaned vendor user found! Email: "${u.email}", User ID: "${u.id}". Repairing and creating record in public.vendors...`);

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

  // Sync Supabase PostgreSQL data on boot — NO localStorage usage
  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[Supabase Sync Note]: Supabase URL/Key not configured.');
      return;
    }

    try {
      await this.repairOrphanedVendorsAsync();

      // 1. Fetch & Seed Vendors
      const { data: supaVendors, error: vErr } = await supabase.from('vendors').select('*');
      if (vErr) {
        console.error('Supabase fetch vendors error:', vErr);
      } else if (supaVendors && supaVendors.length > 0) {
        if (onUpdate) onUpdate();
      } else {
        console.log('[Supabase] Seeding initial vendors to Supabase...');
        for (const v of SEED_VENDORS) {
          await supabase.from('vendors').upsert(vendorToRow(v));
        }
        if (onUpdate) onUpdate();
      }

      // 2. Fetch & Seed Products
      const { data: supaProducts, error: pErr } = await supabase.from('products').select('*');
      if (pErr) {
        console.error('Supabase fetch products error:', pErr);
      } else if (supaProducts && supaProducts.length > 0) {
        if (onUpdate) onUpdate();
      } else {
        console.log('[Supabase] Seeding initial products to Supabase...');
        for (const p of SEED_PRODUCTS) {
          await supabase.from('products').upsert(productToRow(p));
        }
        if (onUpdate) onUpdate();
      }

      // 3. Fetch & Seed Reviews
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (supaReviews && supaReviews.length > 0) {
        if (onUpdate) onUpdate();
      } else {
        for (const r of SEED_REVIEWS) {
          await supabase.from('reviews').upsert(reviewToRow(r));
        }
        if (onUpdate) onUpdate();
      }

      // 4. Fetch & Seed Orders
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (supaOrders && supaOrders.length > 0) {
        if (onUpdate) onUpdate();
      } else {
        for (const o of SEED_ORDERS) {
          await supabase.from('orders').upsert(orderToRow(o));
        }
        if (onUpdate) onUpdate();
      }

      // 5. Fetch & Seed Enquiries
      const { data: supaEnquiries } = await supabase.from('enquiries').select('*');
      if (supaEnquiries && supaEnquiries.length > 0) {
        if (onUpdate) onUpdate();
      } else {
        for (const e of SEED_ENQUIRIES) {
          await supabase.from('enquiries').upsert(enquiryToRow(e));
        }
        if (onUpdate) onUpdate();
      }

      // Subscribe to Realtime Table Changes (trigger onUpdate callback directly)
      supabase
        .channel('public:vendors')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, async () => {
          if (onUpdate) onUpdate();
        })
        .subscribe();

      supabase
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
          if (onUpdate) onUpdate();
        })
        .subscribe();

    } catch (error) {
      console.warn('[Supabase Sync Note]: Error initializing sync:', error);
    }
  }

  // --- VENDORS ---

  static async getVendorsAsync(): Promise<Vendor[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return SEED_VENDORS;
    }
    try {
      const { data, error } = await supabase.from('vendors').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const v of SEED_VENDORS) {
            await supabase.from('vendors').upsert(vendorToRow(v));
          }
        }
        return SEED_VENDORS;
      }
      return data.map(rowToVendor);
    } catch (e) {
      console.error('getVendorsAsync error:', e);
      return SEED_VENDORS;
    }
  }

  static getVendors(): Vendor[] {
    return SEED_VENDORS;
  }

  static saveVendors(_vendors: Vendor[]): void {
    // Sync stub — no localStorage write
  }

  static async getVendorBySlugAsync(slug: string): Promise<Vendor | undefined> {
    if (!slug) return undefined;
    const raw = slug.toLowerCase().trim();
    const cleanSlug = raw.replace(/[^a-z0-9]/g, '');
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('vendors').select('*').ilike('slug', slug).maybeSingle();
        if (data) return rowToVendor(data);
      } catch (e) {
        console.error('getVendorBySlugAsync error:', e);
      }
    }
    const vendors = await this.getVendorsAsync();
    return vendors.find((v) => {
      const vSlug = v.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vName = v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vId = v.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return vSlug === cleanSlug || vName.includes(cleanSlug) || vId === cleanSlug;
    });
  }

  static getVendorBySlug(slug: string): Vendor | undefined {
    const raw = (slug || '').toLowerCase().trim();
    const cleanSlug = raw.replace(/[^a-z0-9]/g, '');
    return SEED_VENDORS.find((v) => {
      const vSlug = v.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vName = v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vId = v.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return vSlug === cleanSlug || vName.includes(cleanSlug) || vId === cleanSlug;
    });
  }

  static async getVendorByIdAsync(id: string): Promise<Vendor | undefined> {
    if (!id) return undefined;
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('vendors').select('*').eq('id', id).maybeSingle();
        if (data) return rowToVendor(data);
      } catch (e) {
        console.error('getVendorByIdAsync error:', e);
      }
    }
    const vendors = await this.getVendorsAsync();
    return vendors.find((v) => v.id === id);
  }

  static getVendorById(id: string): Vendor | undefined {
    return SEED_VENDORS.find((v) => v.id === id);
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
        }
      } catch (error: any) {
        console.error('❌ Exception writing vendor to Supabase:', error);
        throw error;
      }
    }

    if (this.onVendorChange) {
      this.onVendorChange();
    }

    return newVendor;
  }

  static addVendor(newVendor: Vendor): Vendor {
    this.addVendorAsync(newVendor);
    return newVendor;
  }

  static async updateVendorAsync(updated: Vendor): Promise<Vendor> {
    if (supabase) {
      try {
        await supabase.from('vendors').upsert(vendorToRow(updated));
      } catch (error) {
        console.error('Supabase update error (vendor):', error);
      }
    }
    if (this.onVendorChange) {
      this.onVendorChange();
    }
    return updated;
  }

  static updateVendor(updated: Vendor): Vendor {
    this.updateVendorAsync(updated);
    return updated;
  }

  static async deleteVendorAsync(vendorId: string): Promise<void> {
    if (supabase) {
      try {
        await supabase.from('vendors').delete().eq('id', vendorId);
        await supabase.from('products').delete().eq('vendor_id', vendorId);
      } catch (error) {
        console.error('Supabase delete error (vendor):', error);
      }
    }
    if (this.onVendorChange) {
      this.onVendorChange();
    }
  }

  static deleteVendor(vendorId: string): void {
    this.deleteVendorAsync(vendorId);
  }

  // --- PRODUCTS ---

  static async getProductsAsync(): Promise<Product[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return SEED_PRODUCTS;
    }
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const p of SEED_PRODUCTS) {
            await supabase.from('products').upsert(productToRow(p));
          }
        }
        return SEED_PRODUCTS;
      }
      return data.map(rowToProduct);
    } catch (e) {
      console.error('getProductsAsync error:', e);
      return SEED_PRODUCTS;
    }
  }

  static getProducts(): Product[] {
    return SEED_PRODUCTS;
  }

  static saveProducts(_products: Product[]): void {
    // Sync stub
  }

  static async addProductAsync(product: Product): Promise<Product> {
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

  static async deleteProductAsync(productId: string): Promise<void> {
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

  // --- REVIEWS ---

  static async getReviewsAsync(): Promise<Review[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return SEED_REVIEWS;
    }
    try {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const r of SEED_REVIEWS) {
            await supabase.from('reviews').upsert(reviewToRow(r));
          }
        }
        return SEED_REVIEWS;
      }
      return data.map(rowToReview);
    } catch (e) {
      console.error('getReviewsAsync error:', e);
      return SEED_REVIEWS;
    }
  }

  static getReviews(): Review[] {
    return SEED_REVIEWS;
  }

  static async addReviewAsync(review: Review): Promise<Review> {
    if (supabase) {
      try {
        await supabase.from('reviews').upsert(reviewToRow(review));
      } catch (error) {
        console.error('Supabase write error (review):', error);
      }
    }

    const allReviews = await this.getReviewsAsync();
    const vendorReviews = allReviews.filter((r) => r.vendorId === review.vendorId);
    const avg = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / (vendorReviews.length || 1);
    const vendor = await this.getVendorByIdAsync(review.vendorId);
    if (vendor) {
      vendor.rating = parseFloat(avg.toFixed(1));
      vendor.reviewCount = vendorReviews.length;
      await this.updateVendorAsync(vendor);
    }

    return review;
  }

  static addReview(review: Review): Review {
    this.addReviewAsync(review);
    return review;
  }

  // --- ENQUIRIES ---

  static async getEnquiriesAsync(vendorIdOrSlug?: string): Promise<Enquiry[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return vendorIdOrSlug
        ? SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug)
        : SEED_ENQUIRIES;
    }
    try {
      const { data, error } = await supabase.from('enquiries').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const e of SEED_ENQUIRIES) {
            await supabase.from('enquiries').upsert(enquiryToRow(e));
          }
        }
        return vendorIdOrSlug
          ? SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug)
          : SEED_ENQUIRIES;
      }
      let all = data.map(rowToEnquiry);
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (vendorIdOrSlug) {
        const vendor = (await this.getVendorBySlugAsync(vendorIdOrSlug)) || (await this.getVendorByIdAsync(vendorIdOrSlug));
        const matchIds = new Set(
          [vendorIdOrSlug, vendor?.id, vendor?.slug, vendor?.whatsapp, vendor?.phone].filter(
            (val): val is string => Boolean(val)
          )
        );
        return all.filter((e) => matchIds.has(e.vendorId));
      }
      return all;
    } catch (e) {
      console.error('getEnquiriesAsync error:', e);
      return SEED_ENQUIRIES;
    }
  }

  static getEnquiries(vendorIdOrSlug?: string): Enquiry[] {
    if (vendorIdOrSlug) {
      return SEED_ENQUIRIES.filter((e) => e.vendorId === vendorIdOrSlug);
    }
    return SEED_ENQUIRIES;
  }

  static async addEnquiryAsync(enquiry: Enquiry): Promise<Enquiry> {
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
    if (supabase) {
      try {
        await supabase.from('enquiries').update({ read: true, read_status: true }).eq('id', id);
      } catch (error) {
        console.error('Supabase update error (enquiry read):', error);
      }
    }
  }

  static markEnquiryRead(id: string): void {
    this.markEnquiryReadAsync(id);
  }

  static async replyEnquiryAsync(id: string, replyText: string): Promise<Enquiry | null> {
    const repliedAt = new Date().toISOString();
    if (supabase) {
      try {
        await supabase.from('enquiries').update({
          reply_text: replyText,
          replied_at: repliedAt,
          read: true,
          read_status: true,
        }).eq('id', id);
      } catch (error) {
        console.error('Supabase update error (enquiry reply):', error);
      }
    }
    return null;
  }

  static replyEnquiry(id: string, replyText: string): Enquiry | null {
    this.replyEnquiryAsync(id, replyText);
    return null;
  }

  static async deleteEnquiryAsync(id: string): Promise<void> {
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

  // --- USERS ---

  static async getCurrentUserAsync(): Promise<User | null> {
    if (!supabase || !isSupabaseConfigured()) {
      return null;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const { data: uRow } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
      if (!uRow) return null;
      return {
        id: uRow.id,
        name: uRow.name || session.user.email?.split('@')[0] || 'User',
        email: uRow.email || session.user.email || '',
        phone: uRow.phone || '',
        role: uRow.role || 'shopper',
        vendorId: uRow.vendor_id || uRow.vendorId,
        emailVerified: uRow.email_verified ?? true,
        area: uRow.area || 'Ikorodu',
        savedAddresses: uRow.saved_addresses || uRow.savedAddresses || [],
        createdAt: uRow.created_at || new Date().toISOString(),
      };
    } catch (e) {
      console.error('getCurrentUserAsync exception:', e);
      return null;
    }
  }

  static getCurrentUser(): User | null {
    return null;
  }

  static async setCurrentUserAsync(user: User | null): Promise<void> {
    if (user && supabase) {
      try {
        await supabase.from('users').upsert(userToRow(user));
      } catch (error) {
        console.error('Supabase write error (user):', error);
      }
    }
  }

  static setCurrentUser(user: User | null): void {
    this.setCurrentUserAsync(user);
  }

  // --- FAVORITES (STAYS IN LOCALSTORAGE) ---

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

  // --- BANNERS ---

  static async getBannersAsync(): Promise<BannerAd[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return INITIAL_BANNER_ADS;
    }
    try {
      const { data, error } = await supabase.from('banners').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const b of INITIAL_BANNER_ADS) {
            await supabase.from('banners').upsert(b);
          }
        }
        return INITIAL_BANNER_ADS;
      }
      return data;
    } catch (e) {
      console.error('getBannersAsync error:', e);
      return INITIAL_BANNER_ADS;
    }
  }

  static getBanners(): BannerAd[] {
    return INITIAL_BANNER_ADS;
  }

  static saveBanners(banners: BannerAd[]): void {
    if (supabase) {
      (async () => {
        for (const b of banners) {
          try {
            await supabase.from('banners').upsert(b);
          } catch (e) {
            console.error('saveBanners error:', e);
          }
        }
      })();
    }
  }

  // --- ORDERS ---

  static async getOrdersAsync(userId?: string): Promise<Order[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
    }
    try {
      let query = supabase.from('orders').select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (!userId && (!data || data.length === 0)) {
          for (const o of SEED_ORDERS) {
            await supabase.from('orders').upsert(orderToRow(o));
          }
        }
        return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
      }
      return data.map(rowToOrder);
    } catch (e) {
      console.error('getOrdersAsync error:', e);
      return SEED_ORDERS;
    }
  }

  static getOrders(userId?: string): Order[] {
    return userId ? SEED_ORDERS.filter((o) => o.userId === userId) : SEED_ORDERS;
  }

  static async addOrderAsync(order: Order): Promise<Order> {
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
    await this.setCurrentUserAsync(updatedUser);
    return updatedUser;
  }

  static async incrementVendorTapAsync(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('vendors').select('*').eq('id', vendorId).maybeSingle();
      if (!data) return;
      const vendor = rowToVendor(data);
      if (!vendor.analytics) {
        vendor.analytics = { profileViews: 0, whatsappTaps: 0, productViews: 0, dailyViews: [] };
      }
      if (type === 'profile') vendor.analytics.profileViews = (vendor.analytics.profileViews || 0) + 1;
      if (type === 'whatsapp') vendor.analytics.whatsappTaps = (vendor.analytics.whatsappTaps || 0) + 1;
      if (type === 'product') vendor.analytics.productViews = (vendor.analytics.productViews || 0) + 1;
      await supabase.from('vendors').update({ analytics: vendor.analytics }).eq('id', vendorId);
    } catch (e) {
      console.error('incrementVendorTapAsync error:', e);
    }
  }

  static incrementVendorTap(vendorId: string, type: 'profile' | 'whatsapp' | 'product'): void {
    this.incrementVendorTapAsync(vendorId, type);
  }

  // --- ADMIN SETTINGS ---

  static async getSettingsAsync(): Promise<AdminSettings> {
    if (!supabase || !isSupabaseConfigured()) {
      return DEFAULT_ADMIN_SETTINGS;
    }
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'platform_settings').maybeSingle();
      if (error || !data) {
        await supabase.from('settings').upsert({ id: 'platform_settings', ...DEFAULT_ADMIN_SETTINGS });
        return DEFAULT_ADMIN_SETTINGS;
      }
      return {
        bankName: data.bankName || DEFAULT_ADMIN_SETTINGS.bankName,
        accountName: data.accountName || DEFAULT_ADMIN_SETTINGS.accountName,
        accountNumber: data.accountNumber || DEFAULT_ADMIN_SETTINGS.accountNumber,
        whatsappSupportNumber: data.whatsappSupportNumber || DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber,
      };
    } catch (e) {
      console.error('getSettingsAsync error:', e);
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  static getSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS;
  }

  static saveSettings(settings: AdminSettings): void {
    if (supabase) {
      try {
        supabase.from('settings').upsert({ id: 'platform_settings', ...settings });
      } catch (e) {
        console.error('Supabase settings save error:', e);
      }
    }
  }

  // --- PROMOTION MANAGEMENT & AUTOMATED EXPIRY ---

  static async getPromotionsAsync(): Promise<Promotion[]> {
    if (!supabase || !isSupabaseConfigured()) {
      return INITIAL_PROMOTIONS;
    }
    try {
      const { data, error } = await supabase.from('promotions').select('*');
      if (error || !data || data.length === 0) {
        if (!data || data.length === 0) {
          for (const p of INITIAL_PROMOTIONS) {
            await supabase.from('promotions').upsert(p);
          }
        }
        return INITIAL_PROMOTIONS;
      }
      return data;
    } catch (e) {
      console.error('getPromotionsAsync error:', e);
      return INITIAL_PROMOTIONS;
    }
  }

  static getPromotions(): Promotion[] {
    return INITIAL_PROMOTIONS;
  }

  static savePromotions(promotions: Promotion[]): void {
    if (supabase) {
      (async () => {
        for (const p of promotions) {
          try {
            await supabase.from('promotions').upsert(p);
          } catch (e) {
            console.error('savePromotions error:', e);
          }
        }
      })();
    }
  }

  static createPromotionRequest(promo: Promotion): void {
    if (supabase) {
      try {
        supabase.from('promotions').upsert(promo);
      } catch (e) {
        console.error('Supabase write error (promotion request):', e);
      }
    }
  }

  static async activatePromotionAsync(promo: Promotion): Promise<void> {
    const startDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString();

    const updatedPromo: Promotion = {
      ...promo,
      status: 'active',
      startDate,
      expiryDate,
    };

    const vendors = await this.getVendorsAsync();
    const products = await this.getProductsAsync();

    if (updatedPromo.promotionType === 'sponsored_vendor') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) {
        v.sponsoredCategorySlot = true;
        v.isFeatured = true;
        v.is_featured = true;
        v.featuredOnHomepage = true;
        await this.updateVendorAsync(v);
      }
    } else if (updatedPromo.promotionType === 'category_top_spot') {
      const v = vendors.find((v) => v.id === updatedPromo.vendorId);
      if (v) {
        v.categoryTopSpot = true;
        await this.updateVendorAsync(v);
      }
    } else if (updatedPromo.promotionType === 'featured_product' && updatedPromo.productId) {
      const p = products.find((prod) => prod.id === updatedPromo.productId);
      if (p) {
        p.featured = true;
        await this.updateProductAsync(p);
      }
    } else if (updatedPromo.promotionType === 'homepage_banner') {
      const banners = await this.getBannersAsync();
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
        if (supabase) {
          await supabase.from('banners').upsert(newBanner);
        }
      }
    }

    if (supabase) {
      try {
        await supabase.from('promotions').upsert(updatedPromo);
      } catch (e) {
        console.error('Supabase write error (promotion):', e);
      }
    }
  }

  static activatePromotion(promo: Promotion): void {
    this.activatePromotionAsync(promo);
  }

  static async checkAndSyncPromotionExpiriesAsync(): Promise<void> {
    const promotions = await this.getPromotionsAsync();
    const now = Date.now();

    const vendors = await this.getVendorsAsync();
    const products = await this.getProductsAsync();

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      if (p.status === 'active') {
        const expiryTime = new Date(p.expiryDate).getTime();
        if (now >= expiryTime) {
          p.status = 'expired';

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
                await this.updateVendorAsync(v);
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
                await this.updateVendorAsync(v);
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
                await this.updateProductAsync(prod);
              }
            }
          } else if (p.promotionType === 'homepage_banner') {
            if (supabase) {
              await supabase.from('banners').delete().eq('promotion_id', p.id);
            }
          }

          if (supabase) {
            await supabase.from('promotions').upsert(p);
          }
        }
      }
    }
  }

  static checkAndSyncPromotionExpiries(): void {
    this.checkAndSyncPromotionExpiriesAsync();
  }

  static async updatePromotionStatusAsync(id: string, newStatus: PromotionStatus, extendDays: number = 0): Promise<void> {
    const promotions = await this.getPromotionsAsync();
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
      await this.activatePromotionAsync(p);
    } else {
      const vendors = await this.getVendorsAsync();
      const products = await this.getProductsAsync();

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
            await this.updateVendorAsync(v);
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
            await this.updateVendorAsync(v);
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
            await this.updateProductAsync(prod);
          }
        }
      } else if (p.promotionType === 'homepage_banner') {
        if (supabase) {
          await supabase.from('banners').delete().eq('promotion_id', p.id);
        }
      }

      await this.checkAndSyncPromotionExpiriesAsync();
    }

    if (supabase) {
      try {
        await supabase.from('promotions').upsert(p);
      } catch (e) {
        console.error('Supabase update status error:', e);
      }
    }
  }

  static updatePromotionStatus(id: string, newStatus: PromotionStatus, extendDays: number = 0): void {
    this.updatePromotionStatusAsync(id, newStatus, extendDays);
  }
}
