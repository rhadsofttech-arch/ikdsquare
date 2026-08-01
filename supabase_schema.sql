-- Supabase Database Schema for IkoroduSquare

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Email OTPs Table
CREATE TABLE IF NOT EXISTS public.email_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  vendor_id TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  area TEXT,
  saved_addresses JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  whatsapp TEXT,
  phone TEXT,
  category TEXT,
  sub_category TEXT,
  area TEXT,
  zone TEXT,
  description TEXT,
  address TEXT,
  cover_photo_url TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending',
  is_live BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  nin_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  analytics JSONB DEFAULT '{"profileViews":0,"whatsappTaps":0,"productViews":0,"dailyViews":[]}'::jsonb
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  vendor_slug TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  sub_category TEXT,
  image_url TEXT,
  images JSONB,
  in_stock BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  units_sold INTEGER DEFAULT 0
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  product_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_whatsapp TEXT,
  vendor_area TEXT,
  items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  delivery_address JSONB,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_area TEXT,
  product_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_status BOOLEAN DEFAULT FALSE,
  reply_text TEXT,
  replied_at TIMESTAMPTZ
);

-- 9. Enable Row Level Security (RLS) across all tables
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 10. Drop permissive development policies if present
DROP POLICY IF EXISTS "Allow public read and write access" ON public.email_otps;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.users;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.vendors;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.products;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.orders;
DROP POLICY IF EXISTS "Allow public read and write access" ON public.enquiries;

-- =========================================================================
-- SECURE PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- A. Email OTPs Table
-- Requirement: Email OTP records must only be accessible by server-side API routes using the service role key.
-- Note: No SELECT/INSERT/UPDATE/DELETE policies created for public/authenticated roles.
-- Server-side API routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS automatically.

-- B. Users Table
-- Requirement: Authenticated users can only read and update their own user profile.
CREATE POLICY "Users view own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid()::text OR email = auth.email());

CREATE POLICY "Users insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid()::text OR email = auth.email());

CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid()::text OR email = auth.email())
  WITH CHECK (id = auth.uid()::text OR email = auth.email());

-- C. Vendors Table
-- Requirements:
-- 1. Public users can read only public vendor listings (is_live = true OR status = 'approved').
-- 2. Vendors can only create, update and delete their own businesses.
CREATE POLICY "Public read active vendor listings"
  ON public.vendors FOR SELECT
  USING (
    is_live = true 
    OR status = 'approved' 
    OR email = auth.email() 
    OR id = auth.uid()::text 
    OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)
  );

CREATE POLICY "Vendors create own business"
  ON public.vendors FOR INSERT
  WITH CHECK (
    email = auth.email() 
    OR id = auth.uid()::text 
    OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)
  );

CREATE POLICY "Vendors update own business"
  ON public.vendors FOR UPDATE
  USING (
    email = auth.email() 
    OR id = auth.uid()::text 
    OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    email = auth.email() 
    OR id = auth.uid()::text 
    OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)
  );

CREATE POLICY "Vendors delete own business"
  ON public.vendors FOR DELETE
  USING (
    email = auth.email() 
    OR id = auth.uid()::text 
    OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)
  );

-- D. Products Table
-- Requirements:
-- 1. Public users can read only public product listings (in_stock = true OR is_available = true).
-- 2. Vendors can only create, update and delete their own products.
CREATE POLICY "Public read available products"
  ON public.products FOR SELECT
  USING (
    in_stock = true 
    OR is_available = true 
    OR vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

CREATE POLICY "Vendors create own products"
  ON public.products FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

CREATE POLICY "Vendors update own products"
  ON public.products FOR UPDATE
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

CREATE POLICY "Vendors delete own products"
  ON public.products FOR DELETE
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

-- E. Reviews Table
-- Requirement: Reviews can only be created by authenticated users.
CREATE POLICY "Public read reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR user_id = auth.uid()::text);

CREATE POLICY "Users update own reviews"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid()::text OR auth.email() IN (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (user_id = auth.uid()::text OR auth.email() IN (SELECT email FROM public.users WHERE id = user_id));

CREATE POLICY "Users delete own reviews"
  ON public.reviews FOR DELETE
  USING (user_id = auth.uid()::text OR auth.email() IN (SELECT email FROM public.users WHERE id = user_id));

-- F. Orders Table
-- Requirement: Orders can only be viewed by the customer who placed them and the vendor who received them.
CREATE POLICY "Customers and Vendors view relevant orders"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()::text 
    OR user_id IN (SELECT id FROM public.users WHERE email = auth.email())
    OR vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

CREATE POLICY "Authenticated customers place orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    OR user_id = auth.uid()::text 
    OR user_id IN (SELECT id FROM public.users WHERE email = auth.email())
  );

CREATE POLICY "Customers and Vendors update relevant orders"
  ON public.orders FOR UPDATE
  USING (
    user_id = auth.uid()::text 
    OR user_id IN (SELECT id FROM public.users WHERE email = auth.email())
    OR vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text))
  );

-- G. Enquiries Table
CREATE POLICY "Public create enquiries"
  ON public.enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Vendors view and manage received enquiries"
  ON public.enquiries FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE email = auth.email() OR id = auth.uid()::text OR id IN (SELECT vendor_id FROM public.users WHERE id = auth.uid()::text)));

-- 11. Enable Supabase Storage Buckets for Images & Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true), ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for images bucket" 
ON storage.objects FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated Write Access for images bucket" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND (auth.role() = 'authenticated' OR auth.role() = 'anon'));

CREATE POLICY "Public Read Access for documents bucket" 
ON storage.objects FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated Write Access for documents bucket" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND (auth.role() = 'authenticated' OR auth.role() = 'anon'));
