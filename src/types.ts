export type UserRole = 'customer' | 'vendor' | 'admin';

export interface DeliveryAddress {
  id: string;
  title: string;
  streetAddress: string;
  area: string;
  landmark?: string;
  phone: string;
  isDefault?: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorWhatsapp: string;
  vendorArea: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'pay_on_delivery' | 'bank_transfer' | 'card';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
  phone: string;
  role: UserRole;
  area?: string;
  avatarURL?: string;
  phoneVerified?: boolean;
  savedAddresses?: DeliveryAddress[];
  vendorId?: string;
  createdAt: string;
}

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorArea: string;
  name: string;
  description: string;
  price: number; // in Naira (₦)
  category: string;
  photoURL: string;
  available: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  vendorId: string;
  userName: string;
  userArea?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

export interface Enquiry {
  id: string;
  vendorId: string;
  customerName: string;
  customerPhone: string;
  customerArea?: string;
  productName?: string;
  message: string;
  createdAt: string;
  read: boolean;
  readStatus: boolean;
  replyText?: string;
  repliedAt?: string;
}

export type VendorMessage = Enquiry;

export interface Vendor {
  id: string;
  slug: string;
  businessName: string;
  ownerName: string;
  whatsapp: string;
  phone?: string;
  email?: string;
  emailVerified?: boolean;
  category: string;
  subCategory: string;
  area: string;
  zone: string;
  description: string;
  address: string;
  coverPhotoURL: string;
  logoURL: string;
  galleryPhotos?: string[];
  openingHours?: string;
  instagram?: string;
  facebook?: string;
  status: VendorStatus;
  isLive: boolean;
  isPremium: boolean;
  premiumExpiry?: string;
  ninVerified: boolean;
  nin_verified?: boolean;
  ninData?: {
    nin: string;
    fullName: string;
    dob: string;
    verifiedAt: string;
  };
  isFeatured?: boolean;
  is_featured?: boolean;
  featuredOnHomepage?: boolean;
  sponsoredCategorySlot?: boolean;
  categoryTopSpot?: boolean;
  createdAt: string;
  approvedAt?: string;
  rating: number;
  reviewCount: number;
  analytics: {
    profileViews: number;
    whatsappTaps: number;
    productViews: number;
    dailyViews: { date: string; views: number; taps: number }[];
  };
}

export interface IkoroduZone {
  name: string;
  areas: string[];
}

export interface CategoryGroup {
  name: string;
  subcategories: string[];
  iconName: string;
}

export interface OTPState {
  email?: string;
  phoneNumber?: string;
  sent: boolean;
  verified: boolean;
  attemptsLeft: number;
  expiresAt: number | null;
  error?: string;
}

export interface BannerAd {
  id: string;
  title: string;
  subtitle: string;
  vendorSlug?: string;
  imageURL: string;
  ctaText: string;
  linkURL: string;
  sponsorName: string;
  badgeText: string;
  promotionId?: string;
}

export type PromotionType = 'featured_product' | 'sponsored_vendor' | 'category_top_spot' | 'homepage_banner';

export type PromotionStatus = 'pending_verification' | 'active' | 'expired' | 'rejected' | 'pending' | 'cancelled';

export interface Promotion {
  id: string;
  promotionType: PromotionType;
  promotionName: string;
  vendorId: string;
  vendorName: string;
  vendorSlug?: string;
  productId?: string;
  productName?: string;
  bannerData?: {
    title: string;
    subtitle: string;
    imageURL: string;
    ctaText?: string;
  };
  reference: string;
  amount: number;
  currency: string;
  paymentDate: string;
  startDate: string;
  expiryDate: string;
  status: PromotionStatus;
  userEmail?: string;
  createdAt: string;
}

export interface PromotionPackageInfo {
  type: PromotionType;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  buttonLabel: string;
}

export interface AdminSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  whatsappSupportNumber: string;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  bankName: 'FCMB',
  accountName: 'Rhadsoft Tech',
  accountNumber: '9474918014',
  whatsappSupportNumber: '08156655091',
};


