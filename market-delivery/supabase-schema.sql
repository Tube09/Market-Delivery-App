-- ============================================================
-- Market Delivery App — Supabase Database Schema
-- รันคำสั่งนี้ใน Supabase SQL Editor ทีละ section
-- ============================================================

-- ========== SECTION 1: EXTENSIONS ==========
-- เปิดใช้ Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== SECTION 2: USERS TABLE ==========
-- ตารางผู้ใช้งาน (เชื่อมกับ Supabase Auth)

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'store', 'admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ทำให้ updated_at อัปเดตอัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========== SECTION 3: STORES TABLE ==========
-- ตารางร้านค้า

CREATE TABLE public.stores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  logo_url    TEXT,
  is_open     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========== SECTION 4: PRODUCTS TABLE ==========
-- ตารางสินค้า

CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    TEXT NOT NULL DEFAULT 'ทั่วไป',
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Index สำหรับค้นหาสินค้า
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- ========== SECTION 5: ORDERS TABLE ==========
-- ตารางออเดอร์

CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES public.users(id),
  store_id         UUID NOT NULL REFERENCES public.stores(id),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','preparing','delivering','delivered','cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'waiting'
                   CHECK (payment_status IN ('waiting','uploaded','verified','rejected')),
  total_amount     DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Index สำหรับดึงออเดอร์
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_store_id    ON public.orders(store_id);
CREATE INDEX idx_orders_status      ON public.orders(status);
CREATE INDEX idx_orders_created_at  ON public.orders(created_at DESC);

-- ========== SECTION 6: ORDER_ITEMS TABLE ==========
-- ตารางรายการสินค้าในออเดอร์

CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal    DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ========== SECTION 7: PAYMENTS TABLE ==========
-- ตารางการชำระเงิน

CREATE TABLE public.payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  amount      DECIMAL(10, 2) NOT NULL,
  slip_url    TEXT,                           -- URL รูปสลิปจาก Supabase Storage
  status      TEXT NOT NULL DEFAULT 'waiting'
              CHECK (status IN ('waiting','uploaded','verified','rejected')),
  verified_by UUID REFERENCES public.users(id), -- Admin ที่ตรวจสอบ
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========== SECTION 8: NOTIFICATIONS TABLE ==========
-- ตารางการแจ้งเตือน

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- ========== SECTION 9: ROW LEVEL SECURITY (RLS) ==========
-- กำหนดสิทธิ์การเข้าถึงข้อมูล

-- เปิด RLS ทุกตาราง
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- ---- USERS POLICIES ----
-- ดูข้อมูลตัวเอง
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- อัปเดตข้อมูลตัวเอง
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin ดูได้ทั้งหมด
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- PRODUCTS POLICIES ----
-- ทุกคนดูสินค้าที่ active ได้
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (is_active = true);

-- เจ้าของร้านจัดการสินค้าของตัวเอง
CREATE POLICY "products_store_owner" ON public.products
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- ---- ORDERS POLICIES ----
-- ลูกค้าดูออเดอร์ของตัวเอง
CREATE POLICY "orders_customer_select" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

-- ลูกค้าสร้างออเดอร์
CREATE POLICY "orders_customer_insert" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ร้านค้าดูออเดอร์ของร้านตัวเอง
CREATE POLICY "orders_store_select" ON public.orders
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- ร้านค้าอัปเดตสถานะออเดอร์ของตัวเอง
CREATE POLICY "orders_store_update" ON public.orders
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Admin ดูและจัดการทั้งหมด
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- PAYMENTS POLICIES ----
-- ลูกค้าดูและอัปโหลดสลิปออเดอร์ตัวเอง
CREATE POLICY "payments_customer" ON public.payments
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

-- Admin จัดการทั้งหมด
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- NOTIFICATIONS POLICIES ----
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ========== SECTION 10: STORAGE BUCKETS ==========
-- สร้าง Storage Bucket สำหรับเก็บรูปภาพ

-- Bucket สำหรับรูปสินค้า (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);

-- Bucket สำหรับสลิปโอนเงิน (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('slips', 'slips', false);

-- Bucket สำหรับ Logo ร้านค้า (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stores', 'stores', true);

-- Storage Policies
CREATE POLICY "products_images_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

CREATE POLICY "slips_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'slips' AND auth.role() = 'authenticated'
  );

CREATE POLICY "slips_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'slips' AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- เจ้าของออเดอร์ดูสลิปตัวเองได้
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ========== SECTION 11: AUTO-CREATE USER PROFILE ==========
-- สร้าง user record อัตโนมัติเมื่อ signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'ผู้ใช้ใหม่'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========== SECTION 12: DASHBOARD VIEW ==========
-- View สำหรับ Admin Dashboard

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.orders) AS total_orders,
  (SELECT COALESCE(SUM(total_amount), 0)
   FROM public.orders
   WHERE payment_status = 'verified') AS total_revenue,
  (SELECT COUNT(*) FROM public.users WHERE role = 'customer') AS total_customers,
  (SELECT COUNT(*) FROM public.products WHERE is_active = true) AS total_products,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'uploaded') AS pending_payments,
  (SELECT COUNT(*) FROM public.orders
   WHERE created_at >= CURRENT_DATE) AS orders_today;

-- ========== DONE! ==========
-- Schema พร้อมใช้งานแล้ว
-- ขั้นตอนต่อไป: ตั้งค่า .env.local แล้วรัน npm run dev
