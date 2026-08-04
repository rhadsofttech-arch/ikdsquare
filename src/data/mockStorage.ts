/**
 * mockStorage.ts — Pure Application Data Store
 *
 * AUTH RESPONSIBILITIES: NONE.
 * This module manages only application data (vendors, products, reviews,
 * enquiries, banners, orders, promotions, settings, favourites).
 *
 * Authentication state flows exclusively through:
 *   Supabase Auth → AppContext.resolveUserFromSupabase → currentUser
 *
 * Removed:
 *   - getCurrentUser()
 *   - setCurrentUser() / setCurrentUserAsync()
 *   - CURRENT_USER_KEY
 *   - Any session persistence
 */

import {
  Vendor,
  Product,
  Review,
  Enquiry,
  BannerAd,
  Order,
  DeliveryAddress,
  Promotion,
  PromotionStatus,
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
} from '../types';
import {
  SEED_VENDORS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
  INITIAL_BANNER_ADS,
  INITIAL_PROMOTIONS,
} from './ikoroduData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// ─── Storage keys ──────────────────────────────────────────────────────────────

const VENDORS_KEY     = 'ikorodusquare_vendors_v1';
const PRODUCTS_KEY    = 'ikorodusquare_products_v1';
const REVIEWS_KEY     = 'ikorodusquare_reviews_v1';
const ENQUIRIES_KEY   = 'ikorodusquare_enquiries_v1';
const FAVORITES_KEY   = 'ikorodusquare_favorites_v1';
const BANNERS_KEY     = 'ikorodusquare_banners_v1';
const ORDERS_KEY      = 'ikorodusquare_orders_v1';
const PROMOTIONS_KEY  = 'ikorodusquare_promotions_v1';
const SETTINGS_KEY    = 'ikorodusquare_settings_v2';

// ─── Seed data ─────────────────────────────────────────────────────────────────

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
    message:
      'Good afternoon! Do you have fast charging powerbanks (20,000mAh) available in your Sabo shop?',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    read: true,
    readStatus: true,
    replyText: 'Yes Kemi! We have original Oraimo 20k mAh in stock at Sabo shop.',
    repliedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
  },
];

// ─── Row mappers ───────────────────────────────────────────────────────────────

export function vendorToRow(v: Vendor): Record<string, unknown> {
  const isFeatured = Boolean(v.isFeatured ?? v.is_featured ?? v.featuredOnHomepage);
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
    is_featured: isFeatured,
    created_at: v.createdAt,
    rating: v.rating,
    review_count: v.reviewCount,
    analytics: v.analytics,
  };
}

export function rowToVendor(r: Record<string, unknown>): Vendor {
  const isFeatured = Boolean(
    r.is_featured ?? r.isFeatured ?? r.featuredOnHomepage ?? false,
  );
  const ninVerified = Boolean(r.nin_verified ?? r.ninVerified ?? false);
  return {
    id: r.id as string,
    slug: r.slug as string,
    businessName: (r.business_name ?? r.businessName ?? '') as string,
    ownerName: (r.owner_name ?? r.ownerName ?? '') as string,
    email: (r.email ?? '') as string,
    emailVerified: Boolean(r.email_verified ?? r.emailVerified ?? false),
    whatsapp: (r.whatsapp ?? '') as string,
    phone: (r.phone ?? '') as string,
    category: (r.category ?? 'Lifestyle') as string,
    subCategory: (r.sub_category ?? r.subCategory ?? '') as string,
    area: (r.area ?? 'Agric') as string,
    zone: (r.zone ?? 'East zone') as string,
    description: (r.description ?? '') as string,
    address: (r.address ?? '') as string,
    coverPhotoURL: (r.cover_photo_url ?? r.coverPhotoURL ?? '') as string,
    logoURL: (r.logo_url ?? r.logoURL ?? '') as string,
    status: (r.status ?? 'approved') as Vendor['status'],
    isLive: Boolean(r.is_live ?? r.isLive ?? true),
    isPremium: Boolean(r.is_premium ?? r.isPremium ?? false),
    ninVerified,
    nin_verified: ninVerified,
    isFeatured,
    is_featured: isFeatured,
    featuredOnHomepage: isFeatured,
    createdAt: (r.created_at ?? r.createdAt ?? new Date().toISOString()) as string,
    rating: r.rating ? Number(r.rating) : 5.0,
    reviewCount: (r.review_count ?? r.reviewCount ?? 0) as number,
    analytics: (r.analytics ?? {
      profileViews: 0,
      whatsappTaps: 0,
      productViews: 0,
      dailyViews: [],
    }) as Vendor['analytics'],
  };
}

function productToRow(p: Product): Record<string, unknown> {
  return {
    id: p.id,
    vendor_id: p.vendorId,
    vendor_name: p.vendorName,
    vendor_slug: p.vendorSlug,
    vendor_area: p.vendorArea ?? '',
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

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    vendorId: (r.vendor_id ?? r.vendorId ?? '') as string,
    vendorName: (r.vendor_name ?? r.vendorName ?? '') as string,
    vendorSlug: (r.vendor_slug ?? r.vendorSlug ?? '') as string,
    vendorArea: (r.vendor_area ?? r.vendorArea ?? 'Agric') as string,
    name: (r.name ?? '') as string,
    description: (r.description ?? '') as string,
    price: Number(r.price ?? 0),
    category: (r.category ?? '') as string,
    photoURL: (
      r.image_url ??
      r.photoURL ??
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
    ) as string,
    available: Boolean(r.is_available ?? r.available ?? true),
    featured: Boolean(r.is_featured ?? r.featured ?? false),
    createdAt: (r.created_at ?? r.createdAt ?? new Date().toISOString()) as string,
  };
}

function reviewToRow(r: Review): Record<string, unknown> {
  return {
    id: r.id,
    vendor_id: r.vendorId,
    user_name: r.userName,
    user_area: r.userArea ?? '',
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt,
  };
}

function rowToReview(r: Record<string, unknown>): Review {
  return {
    id: r.id as string,
    vendorId: (r.vendor_id ?? r.vendorId ?? '') as string,
    userName: (r.user_name ?? r.userName ?? 'Anonymous') as string,
    userArea: (r.user_area ?? r.userArea ?? 'Ikorodu') as string,
    rating: Number(r.rating ?? 5),
    comment: (r.comment ?? '') as string,
    createdAt: (r.created_at ?? r.createdAt ?? new Date().toISOString()) as string,
  };
}

function orderToRow(o: Order): Record<string, unknown> {
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

function rowToOrder(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    orderNumber: (r.order_number ?? r.orderNumber ?? '') as string,
    userId: (r.user_id ?? r.userId ?? '') as string,
    customerName: (r.customer_name ?? r.customerName ?? '') as string,
    customerPhone: (r.customer_phone ?? r.customerPhone ?? '') as string,
    vendorId: (r.vendor_id ?? r.vendorId ?? '') as string,
    vendorName: (r.vendor_name ?? r.vendorName ?? '') as string,
    vendorSlug: (r.vendor_slug ?? r.vendorSlug ?? '') as string,
    vendorWhatsapp: (r.vendor_whatsapp ?? r.vendorWhatsapp ?? '') as string,
    vendorArea: (r.vendor_area ?? r.vendorArea ?? '') as string,
    items: (r.items ?? []) as Order['items'],
    totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
    status: (r.status ?? 'pending') as Order['status'],
    deliveryAddress: (r.delivery_address ?? r.deliveryAddress) as DeliveryAddress,
    paymentMethod: (
      r.payment_method ?? r.paymentMethod ?? 'pay_on_delivery'
    ) as Order['paymentMethod'],
    notes: (r.notes ?? '') as string,
    createdAt: (r.created_at ?? r.createdAt ?? new Date().toISOString()) as string,
    updatedAt: (r.updated_at ?? r.updatedAt ?? new Date().toISOString()) as string,
  };
}

function enquiryToRow(e: Enquiry): Record<string, unknown> {
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

function rowToEnquiry(r: Record<string, unknown>): Enquiry {
  return {
    id: r.id as string,
    vendorId: (r.vendor_id ?? r.vendorId ?? '') as string,
    customerName: (r.customer_name ?? r.customerName ?? '') as string,
    customerPhone: (r.customer_phone ?? r.customerPhone ?? '') as string,
    customerArea: (r.customer_area ?? r.customerArea ?? '') as string,
    productName: (r.product_name ?? r.productName) as string | undefined,
    message: (r.message ?? '') as string,
    createdAt: (r.created_at ?? r.createdAt ?? new Date().toISOString()) as string,
    read: Boolean(r.read ?? false),
    readStatus: Boolean(r.read_status ?? r.readStatus ?? false),
    replyText: (r.reply_text ?? r.replyText) as string | undefined,
    repliedAt: (r.replied_at ?? r.repliedAt) as string | undefined,
  };
}

// ─── StorageManager ────────────────────────────────────────────────────────────

export class StorageManager {

  // ── Supabase sync on boot ──────────────────────────────────────────────────

  /**
   * Pull application data from Supabase into localStorage cache.
   * This is a DATA operation, never an AUTH operation.
   * Call once on app mount from AppContext; the `onUpdate` callback
   * triggers a React state refresh after each table is loaded.
   */
  static async initFirestoreSync(onUpdate?: () => void): Promise<void> {
    if (!supabase || !isSupabaseConfigured()) {
      console.log('[StorageManager] Supabase not configured — using localStorage cache.');
      return;
    }

    try {
      // Vendors
      const { data: supaVendors, error: vErr } = await supabase
        .from('vendors')
        .select('*');
      if (vErr) {
        console.error('[StorageManager] fetch vendors error:', vErr);
      } else if (supaVendors && supaVendors.length > 0) {
        localStorage.setItem(
          VENDORS_KEY,
          JSON.stringify(supaVendors.map(rowToVendor)),
        );
        onUpdate?.();
      } else {
        for (const v of SEED_VENDORS) {
          await supabase.from('vendors').upsert(vendorToRow(v));
        }
      }

      // Products
      const { data: supaProducts, error: pErr } = await supabase
        .from('products')
        .select('*');
      if (pErr) {
        console.error('[StorageManager] fetch products error:', pErr);
      } else if (supaProducts && supaProducts.length > 0) {
        localStorage.setItem(
          PRODUCTS_KEY,
          JSON.stringify(supaProducts.map(rowToProduct)),
        );
        onUpdate?.();
      } else {
        for (const p of SEED_PRODUCTS) {
          await supabase.from('products').upsert(productToRow(p));
        }
      }

      // Reviews
      const { data: supaReviews } = await supabase.from('reviews').select('*');
      if (supaReviews && supaReviews.length > 0) {
        localStorage.setItem(
          REVIEWS_KEY,
          JSON.stringify(supaReviews.map(rowToReview)),
        );
      } else {
        for (const r of SEED_REVIEWS) {
          await supabase.from('reviews').upsert(reviewToRow(r));
        }
      }

      // Orders
      const { data: supaOrders } = await supabase.from('orders').select('*');
      if (supaOrders && supaOrders.length > 0) {
        localStorage.setItem(
          ORDERS_KEY,
          JSON.stringify(supaOrders.map(rowToOrder)),
        );
      } else {
        for (const o of SEED_ORDERS) {
          await supabase.from('orders').upsert(orderToRow(o));
        }
      }

      // Enquiries
      const { data: supaEnquiries } = await supabase
        .from('enquiries')
        .select('*');
      if (supaEnquiries && supaEnquiries.length > 0) {
        localStorage.setItem(
          ENQUIRIES_KEY,
          JSON.stringify(supaEnquiries.map(rowToEnquiry)),
        );
        onUpdate?.();
      } else {
        for (const e of SEED_ENQUIRIES) {
          await supabase.from('enquiries').upsert(enquiryToRow(e));
        }
      }

      // Realtime subscriptions — data only, never auth
      supabase
        .channel('public:vendors')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vendors' },
          async () => {
            const { data } = await supabase!.from('vendors').select('*');
            if (data) {
              localStorage.setItem(
                VENDORS_KEY,
                JSON.stringify(data.map(rowToVendor)),
              );
              onUpdate?.();
            }
          },
        )
        .subscribe();

      supabase
        .channel('public:products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          async () => {
            const { data } = await supabase!.from('products').select('*');
            if (data) {
              localStorage.setItem(
                PRODUCTS_KEY,
                JSON.stringify(data.map(rowToProduct)),
              );
              onUpdate?.();
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.warn(
        '[StorageManager] Supabase sync warning — falling back to cache:',
        err,
      );
    }
  }

  // ── Vendors ────────────────────────────────────────────────────────────────

  static getVendors(): Vendor[] {
    try {
      const raw = localStorage.getItem(VENDORS_KEY);
      if (!raw) {
        localStorage.setItem(VENDORS_KEY, JSON.stringify(SEED_VENDORS));
        return SEED_VENDORS;
      }
      const list: Vendor[] = JSON.parse(raw);
      const ids = new Set(list.map((v) => v.id));
      let changed = false;
      for (const sv of SEED_VENDORS) {
        if (!ids.has(sv.id)) {
          list.push(sv);
          changed = true;
        }
      }
      if (changed) localStorage.setItem(VENDORS_KEY, JSON.stringify(list));
      return list;
    } catch {
      return SEED_VENDORS;
    }
  }

  static saveVendors(vendors: Vendor[]): void {
    localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
  }

  static getVendorBySlug(slug: string): Vendor | undefined {
    const clean = (slug ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
    return this.getVendors().find((v) => {
      const vs = v.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const vn = v.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return vs === clean || vn.includes(clean);
    });
  }

  static getVendorById(id: string): Vendor | undefined {
    return this.getVendors().find((v) => v.id === id);
  }

  /**
   * Upsert a vendor atomically: write to Supabase first, then sync local cache.
   * Uses the Supabase-returned row as the source of truth for the ID.
   */
  static async addVendorAsync(newVendor: Vendor): Promise<Vendor> {
    let canonical = { ...newVendor };

    if (supabase) {
      try {
        // Prevent duplicate: check by email first
        if (canonical.email) {
          const { data: existing } = await supabase
            .from('vendors')
            .select('id')
            .ilike('email', canonical.email)
            .maybeSingle();
          if (existing?.id && existing.id !== canonical.id) {
            // Adopt the canonical DB id so local cache stays consistent
            canonical = { ...canonical, id: existing.id as string };
          }
        }

        const { data, error } = await supabase
          .from('vendors')
          .upsert(vendorToRow(canonical))
          .select();

        if (error) {
          console.error(
            '[StorageManager] vendor upsert error:',
            error.message,
            error.code,
          );
        } else if (data?.length) {
          canonical = rowToVendor(data[0] as Record<string, unknown>);
        }
      } catch (err) {
        console.error('[StorageManager] vendor upsert exception:', err);
      }
    }

    const vendors = this.getVendors();
    const idx = vendors.findIndex(
      (v) =>
        v.id === canonical.id ||
        (v.email &&
          v.email.toLowerCase() === canonical.email?.toLowerCase()),
    );
    if (idx !== -1) vendors[idx] = canonical;
    else vendors.unshift(canonical);
    this.saveVendors(vendors);

    return canonical;
  }

  static addVendor(newVendor: Vendor): Vendor {
    // Fire-and-forget; callers that need the canonical ID should use the async variant
    void this.addVendorAsync(newVendor);
    return newVendor;
  }

  static async updateVendorAsync(updated: Vendor): Promise<Vendor> {
    const vendors = this.getVendors();
    const idx = vendors.findIndex((v) => v.id === updated.id);
    if (idx !== -1) {
      vendors[idx] = updated;
      this.saveVendors(vendors);
    }

    if (supabase) {
      try {
        await supabase.from('vendors').upsert(vendorToRow(updated));
      } catch (err) {
        console.error('[StorageManager] vendor update error:', err);
      }
    }
    return updated;
  }

  static updateVendor(updated: Vendor): Vendor {
    void this.updateVendorAsync(updated);
    return updated;
  }

  static async deleteVendorAsync(vendorId: string): Promise<void> {
    this.saveVendors(
      this.getVendors().filter((v) => v.id !== vendorId),
    );
    this.saveProducts(
      this.getProducts().filter((p) => p.vendorId !== vendorId),
    );

    if (supabase) {
      try {
        await supabase.from('vendors').delete().eq('id', vendorId);
        await supabase.from('products').delete().eq('vendor_id', vendorId);
      } catch (err) {
        console.error('[StorageManager] vendor delete error:', err);
      }
    }
  }

  static deleteVendor(vendorId: string): void {
    void this.deleteVendorAsync(vendorId);
  }

  // ── Products ───────────────────────────────────────────────────────────────

  static getProducts(): Product[] {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (!raw) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
      }
      const list: Product[] = JSON.parse(raw);
      const ids = new Set(list.map((p) => p.id));
      let changed = false;
      for (const sp of SEED_PRODUCTS) {
        if (!ids.has(sp.id)) {
          list.push(sp);
          changed = true;
        }
      }
      if (changed) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
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
      } catch (err) {
        console.error('[StorageManager] product write error:', err);
      }
    }
    return product;
  }

  static addProduct(product: Product): Product {
    void this.addProductAsync(product);
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
      } catch (err) {
        console.error('[StorageManager] product update error:', err);
      }
    }
    return updated;
  }

  static updateProduct(updated: Product): Product {
    void this.updateProductAsync(updated);
    return updated;
  }

  static async deleteProductAsync(productId: string): Promise<void> {
    this.saveProducts(
      this.getProducts().filter((p) => p.id !== productId),
    );
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (err) {
        console.error('[StorageManager] product delete error:', err);
      }
    }
  }

  static deleteProduct(productId: string): void {
    void this.deleteProductAsync(productId);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  static getReviews(): Review[] {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      if (!raw) {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(SEED_REVIEWS));
        return SEED_REVIEWS;
      }
      return JSON.parse(raw) as Review[];
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
      } catch (err) {
        console.error('[StorageManager] review write error:', err);
      }
    }

    // Recalculate vendor rating
    const vendorReviews = reviews.filter((r) => r.vendorId === review.vendorId);
    const avg =
      vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
    const vendor = this.getVendorById(review.vendorId);
    if (vendor) {
      vendor.rating = parseFloat(avg.toFixed(1));
      vendor.reviewCount = vendorReviews.length;
      this.updateVendor(vendor);
    }
    return review;
  }

  static addReview(review: Review): Review {
    void this.addReviewAsync(review);
    return review;
  }

  // ── Enquiries ──────────────────────────────────────────────────────────────

  static getEnquiries(vendorIdOrSlug?: string): Enquiry[] {
    try {
      const raw = localStorage.getItem(ENQUIRIES_KEY);
      let all: Enquiry[] = raw ? (JSON.parse(raw) as Enquiry[]) : [];
      if (all.length === 0) {
        all = SEED_ENQUIRIES;
        localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(all));
      }
      all.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (vendorIdOrSlug) {
        const vendor = this.getVendors().find(
          (v) =>
            v.id === vendorIdOrSlug || v.slug === vendorIdOrSlug,
        );
        const matchIds = new Set(
          [
            vendorIdOrSlug,
            vendor?.id,
            vendor?.slug,
            vendor?.whatsapp,
            vendor?.phone,
          ].filter((x): x is string => Boolean(x)),
        );
        return all.filter((e) => matchIds.has(e.vendorId));
      }
      return all;
    } catch {
      return SEED_ENQUIRIES;
    }
  }

  static async addEnquiryAsync(enquiry: Enquiry): Promise<Enquiry> {
    const list = this.getEnquiries();
    list.unshift(enquiry);
    localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(list));
    if (supabase) {
      try {
        await supabase.from('enquiries').upsert(enquiryToRow(enquiry));
      } catch (err) {
        console.error('[StorageManager] enquiry write error:', err);
      }
    }
    return enquiry;
  }

  static addEnquiry(enquiry: Enquiry): Enquiry {
    void this.addEnquiryAsync(enquiry);
    return enquiry;
  }

  static async markEnquiryReadAsync(id: string): Promise<void> {
    const list = this.getEnquiries();
    const target = list.find((e) => e.id === id);
    if (target) {
      target.read = true;
      target.readStatus = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(list));
      if (supabase) {
        try {
          await supabase
            .from('enquiries')
            .update({ read: true, read_status: true })
            .eq('id', id);
        } catch (err) {
          console.error('[StorageManager] enquiry read update error:', err);
        }
      }
    }
  }

  static markEnquiryRead(id: string): void {
    void this.markEnquiryReadAsync(id);
  }

  static async replyEnquiryAsync(
    id: string,
    replyText: string,
  ): Promise<Enquiry | null> {
    const list = this.getEnquiries();
    const target = list.find((e) => e.id === id);
    if (target) {
      target.replyText = replyText;
      target.repliedAt = new Date().toISOString();
      target.read = true;
      target.readStatus = true;
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(list));
      if (supabase) {
        try {
          await supabase
            .from('enquiries')
            .update({
              reply_text: replyText,
              replied_at: target.repliedAt,
              read: true,
              read_status: true,
            })
            .eq('id', id);
        } catch (err) {
          console.error('[StorageManager] enquiry reply error:', err);
        }
      }
      return target;
    }
    return null;
  }

  static replyEnquiry(id: string, replyText: string): Enquiry | null {
    void this.replyEnquiryAsync(id, replyText);
    return null;
  }

  static async deleteEnquiryAsync(id: string): Promise<void> {
    localStorage.setItem(
      ENQUIRIES_KEY,
      JSON.stringify(this.getEnquiries().filter((e) => e.id !== id)),
    );
    if (supabase) {
      try {
        await supabase.from('enquiries').delete().eq('id', id);
      } catch (err) {
        console.error('[StorageManager] enquiry delete error:', err);
      }
    }
  }

  static deleteEnquiry(id: string): void {
    void this.deleteEnquiryAsync(id);
  }

  // ── Favourites ─────────────────────────────────────────────────────────────

  static getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(vendorId: string): string[] {
    const favs = this.getFavorites();
    const idx = favs.indexOf(vendorId);
    if (idx === -1) favs.push(vendorId);
    else favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
  }

  // ── Banners ────────────────────────────────────────────────────────────────

  static getBanners(): BannerAd[] {
    try {
      const raw = localStorage.getItem(BANNERS_KEY);
      if (!raw) {
        localStorage.setItem(BANNERS_KEY, JSON.stringify(INITIAL_BANNER_ADS));
        return INITIAL_BANNER_ADS;
      }
      return JSON.parse(raw) as BannerAd[];
    } catch {
      return INITIAL_BANNER_ADS;
    }
  }

  static saveBanners(banners: BannerAd[]): void {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  static getOrders(userId?: string): Order[] {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (!raw) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(SEED_ORDERS));
        return userId
          ? SEED_ORDERS.filter((o) => o.userId === userId)
          : SEED_ORDERS;
      }
      const all: Order[] = JSON.parse(raw);
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
      } catch (err) {
        console.error('[StorageManager] order write error:', err);
      }
    }
    return order;
  }

  static addOrder(order: Order): Order {
    void this.addOrderAsync(order);
    return order;
  }

  static getUserAddresses(
    user?: { savedAddresses?: DeliveryAddress[] } | null,
  ): DeliveryAddress[] {
    return user?.savedAddresses?.length
      ? user.savedAddresses
      : INITIAL_DELIVERY_ADDRESSES;
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  static incrementVendorTap(
    vendorId: string,
    type: 'profile' | 'whatsapp' | 'product',
  ): void {
    const vendor = this.getVendorById(vendorId);
    if (!vendor) return;
    if (type === 'profile') vendor.analytics.profileViews += 1;
    if (type === 'whatsapp') vendor.analytics.whatsappTaps += 1;
    if (type === 'product') vendor.analytics.productViews += 1;
    this.updateVendor(vendor);
  }

  // ── Admin settings ─────────────────────────────────────────────────────────

  static getSettings(): AdminSettings {
    try {
      // Clean up stale keys from older versions
      try {
        localStorage.removeItem('ikorodusquare_settings');
        localStorage.removeItem('ikorodusquare_settings_v1');
      } catch {
        /* ignore */
      }

      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        return DEFAULT_ADMIN_SETTINGS;
      }
      const settings = JSON.parse(raw) as AdminSettings;

      // Migrate stale default values
      let dirty = false;
      if (!settings.bankName || settings.bankName.includes('Moniepoint')) {
        settings.bankName = DEFAULT_ADMIN_SETTINGS.bankName;
        dirty = true;
      }
      if (!settings.accountName || settings.accountName === 'IkoroduSquare') {
        settings.accountName = DEFAULT_ADMIN_SETTINGS.accountName;
        dirty = true;
      }
      if (
        !settings.accountNumber ||
        settings.accountNumber === '8123456789'
      ) {
        settings.accountNumber = DEFAULT_ADMIN_SETTINGS.accountNumber;
        dirty = true;
      }
      if (
        !settings.whatsappSupportNumber ||
        settings.whatsappSupportNumber === '2348031234567'
      ) {
        settings.whatsappSupportNumber =
          DEFAULT_ADMIN_SETTINGS.whatsappSupportNumber;
        dirty = true;
      }
      if (dirty)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      return settings;
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  static saveSettings(settings: AdminSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (supabase) {
      try {
        void supabase
          .from('settings')
          .upsert({ id: 'platform_settings', ...settings });
      } catch (err) {
        console.error('[StorageManager] settings save error:', err);
      }
    }
  }

  // ── Promotions ─────────────────────────────────────────────────────────────

  static getPromotions(): Promotion[] {
    try {
      const raw = localStorage.getItem(PROMOTIONS_KEY);
      if (!raw) {
        localStorage.setItem(
          PROMOTIONS_KEY,
          JSON.stringify(INITIAL_PROMOTIONS),
        );
        return INITIAL_PROMOTIONS;
      }
      return JSON.parse(raw) as Promotion[];
    } catch {
      return INITIAL_PROMOTIONS;
    }
  }

  static savePromotions(promotions: Promotion[]): void {
    localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(promotions));
  }

  static createPromotionRequest(promo: Promotion): void {
    const list = this.getPromotions();
    const idx = list.findIndex((p) => p.id === promo.id);
    if (idx >= 0) list[idx] = promo;
    else list.unshift(promo);
    this.savePromotions(list);
    if (supabase) {
      try {
        void supabase.from('promotions').upsert(promo);
      } catch (err) {
        console.error('[StorageManager] promotion request write error:', err);
      }
    }
  }

  static activatePromotion(promo: Promotion): void {
    const list = this.getPromotions();
    const idx = list.findIndex((p) => p.id === promo.id);
    const startDate = new Date().toISOString();
    const expiryDate = new Date(
      Date.now() + 14 * 86_400 * 1000,
    ).toISOString();
    const updated: Promotion = {
      ...promo,
      status: 'active',
      startDate,
      expiryDate,
    };

    if (idx >= 0) list[idx] = updated;
    else list.unshift(updated);
    this.savePromotions(list);

    const vendors = this.getVendors();
    const products = this.getProducts();

    if (updated.promotionType === 'sponsored_vendor') {
      const v = vendors.find((v) => v.id === updated.vendorId);
      if (v) {
        v.sponsoredCategorySlot = true;
        v.isFeatured = true;
        v.is_featured = true;
        v.featuredOnHomepage = true;
        this.updateVendor(v);
      }
    } else if (updated.promotionType === 'category_top_spot') {
      const v = vendors.find((v) => v.id === updated.vendorId);
      if (v) {
        v.categoryTopSpot = true;
        this.updateVendor(v);
      }
    } else if (
      updated.promotionType === 'featured_product' &&
      updated.productId
    ) {
      const p = products.find((p) => p.id === updated.productId);
      if (p) {
        p.featured = true;
        this.updateProduct(p);
      }
    } else if (updated.promotionType === 'homepage_banner') {
      const banners = this.getBanners();
      if (!banners.find((b) => b.promotionId === updated.id)) {
        const v = vendors.find((v) => v.id === updated.vendorId);
        const newBanner: BannerAd = {
          id: `banner-promo-${Date.now()}`,
          title:
            updated.bannerData?.title ??
            `${updated.vendorName} — Special Store Spotlight`,
          subtitle:
            updated.bannerData?.subtitle ??
            'Top verified vendor in Ikorodu.',
          imageURL:
            updated.bannerData?.imageURL ??
            v?.logoURL ??
            'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80',
          ctaText:
            updated.bannerData?.ctaText ?? 'Visit Shop & Chat',
          linkURL: `/store/${updated.vendorSlug ?? v?.slug ?? ''}`,
          sponsorName: updated.vendorName,
          badgeText: 'FEATURED SPONSOR',
          promotionId: updated.id,
        };
        banners.unshift(newBanner);
        this.saveBanners(banners);
      }
    }

    if (supabase) {
      try {
        void supabase.from('promotions').upsert(updated);
      } catch (err) {
        console.error(
          '[StorageManager] promotion activate write error:',
          err,
        );
      }
    }
  }

  static checkAndSyncPromotionExpiries(): void {
    const promotions = this.getPromotions();
    const now = Date.now();
    let changed = false;
    const vendors = this.getVendors();
    const products = this.getProducts();
    let banners = this.getBanners();

    for (const p of promotions) {
      if (p.status !== 'active') continue;
      if (now < new Date(p.expiryDate).getTime()) continue;

      p.status = 'expired';
      changed = true;

      const hasOther = (type: Promotion['promotionType']) =>
        promotions.some(
          (o) =>
            o.id !== p.id &&
            o.vendorId === p.vendorId &&
            o.promotionType === type &&
            o.status === 'active',
        );

      if (
        p.promotionType === 'sponsored_vendor' &&
        !hasOther('sponsored_vendor')
      ) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) {
          v.sponsoredCategorySlot = false;
          v.isFeatured = false;
          v.is_featured = false;
          v.featuredOnHomepage = false;
          this.updateVendor(v);
        }
      } else if (
        p.promotionType === 'category_top_spot' &&
        !hasOther('category_top_spot')
      ) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) {
          v.categoryTopSpot = false;
          this.updateVendor(v);
        }
      } else if (p.promotionType === 'featured_product' && p.productId) {
        const hasOtherProduct = promotions.some(
          (o) =>
            o.id !== p.id &&
            o.productId === p.productId &&
            o.promotionType === 'featured_product' &&
            o.status === 'active',
        );
        if (!hasOtherProduct) {
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

    if (changed) this.savePromotions(promotions);
  }

  static updatePromotionStatus(
    id: string,
    newStatus: PromotionStatus,
    extendDays = 0,
  ): void {
    const promotions = this.getPromotions();
    const p = promotions.find((item) => item.id === id);
    if (!p) return;

    p.status = newStatus;
    if (extendDays > 0) {
      const base = Math.max(new Date(p.expiryDate).getTime(), Date.now());
      p.expiryDate = new Date(
        base + extendDays * 86_400 * 1000,
      ).toISOString();
    }
    if (newStatus === 'active') {
      p.startDate = new Date().toISOString();
      p.expiryDate = new Date(
        Date.now() + 14 * 86_400 * 1000,
      ).toISOString();
    }

    this.savePromotions(promotions);

    if (newStatus === 'active') {
      this.activatePromotion(p);
    } else {
      const vendors = this.getVendors();
      const products = this.getProducts();
      let banners = this.getBanners();

      const hasOther = (type: Promotion['promotionType']) =>
        promotions.some(
          (o) =>
            o.id !== p.id &&
            o.vendorId === p.vendorId &&
            o.promotionType === type &&
            o.status === 'active',
        );

      if (
        p.promotionType === 'sponsored_vendor' &&
        !hasOther('sponsored_vendor')
      ) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) {
          v.sponsoredCategorySlot = false;
          v.isFeatured = false;
          v.is_featured = false;
          v.featuredOnHomepage = false;
          this.updateVendor(v);
        }
      } else if (
        p.promotionType === 'category_top_spot' &&
        !hasOther('category_top_spot')
      ) {
        const v = vendors.find((v) => v.id === p.vendorId);
        if (v) {
          v.categoryTopSpot = false;
          this.updateVendor(v);
        }
      } else if (p.promotionType === 'featured_product' && p.productId) {
        const hasOtherProduct = promotions.some(
          (o) =>
            o.id !== p.id &&
            o.productId === p.productId &&
            o.promotionType === 'featured_product' &&
            o.status === 'active',
        );
        if (!hasOtherProduct) {
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
        void supabase.from('promotions').upsert(p);
      } catch (err) {
        console.error(
          '[StorageManager] promotion status update error:',
          err,
        );
      }
    }
  }
}