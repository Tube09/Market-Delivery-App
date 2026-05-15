// types/index.ts
// Type definitions ทั้งหมดของแอป Market Delivery
// ใช้ TypeScript เพื่อป้องกัน bug และช่วย autocomplete

// ===== USER TYPES =====

export type UserRole = 'customer' | 'store' | 'admin'

export interface User {
  id: string                    // UUID จาก Supabase Auth
  email: string
  full_name: string
  phone: string
  address?: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

// ===== PRODUCT TYPES =====

export interface Product {
  id: string
  store_id: string
  name: string                  // ชื่อสินค้า
  description?: string          // คำอธิบาย
  price: number                 // ราคา (บาท)
  stock: number                 // จำนวนในสต๊อก
  category: string              // หมวดหมู่
  image_url?: string            // รูปสินค้า
  is_active: boolean            // เปิด/ปิดขาย
  created_at: string
  store?: Store                 // ข้อมูลร้านค้า (join)
}

// ===== STORE TYPES =====

export interface Store {
  id: string
  owner_id: string              // UUID ของเจ้าของร้าน
  name: string                  // ชื่อร้าน
  description?: string
  phone: string
  address: string
  logo_url?: string
  is_open: boolean              // เปิด/ปิดร้าน
  created_at: string
}

// ===== ORDER TYPES =====

export type OrderStatus =
  | 'pending'      // รอยืนยัน
  | 'confirmed'    // ยืนยันแล้ว
  | 'preparing'    // กำลังเตรียม
  | 'delivering'   // กำลังจัดส่ง
  | 'delivered'    // จัดส่งแล้ว
  | 'cancelled'    // ยกเลิก

export type PaymentStatus =
  | 'waiting'      // รอชำระเงิน
  | 'uploaded'     // อัปโหลดสลิปแล้ว
  | 'verified'     // ยืนยันการชำระแล้ว
  | 'rejected'     // ปฏิเสธ

export interface Order {
  id: string
  customer_id: string
  store_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: number          // ราคารวม
  delivery_address: string      // ที่อยู่จัดส่ง
  note?: string                 // หมายเหตุ
  created_at: string
  updated_at: string
  items?: OrderItem[]           // รายการสินค้า (join)
  payment?: Payment             // ข้อมูลการชำระ (join)
  customer?: User               // ข้อมูลลูกค้า (join)
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number              // จำนวน
  unit_price: number            // ราคาต่อชิ้น ณ เวลาสั่ง
  subtotal: number              // ราคารวมรายการนี้
  product?: Product             // ข้อมูลสินค้า (join)
}

// ===== PAYMENT TYPES =====

export interface Payment {
  id: string
  order_id: string
  amount: number
  slip_url?: string             // URL รูปสลิป
  status: PaymentStatus
  verified_by?: string          // admin ที่ตรวจสอบ
  verified_at?: string
  created_at: string
}

// ===== CART TYPES (client-side only) =====

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

// ===== NOTIFICATION TYPES =====

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ===== DASHBOARD TYPES =====

export interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_customers: number
  total_products: number
  pending_payments: number
  orders_today: number
}
