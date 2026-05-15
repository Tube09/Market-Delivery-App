// utils/index.ts
// ฟังก์ชันช่วยเหลือทั่วไปของแอป

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

// ===== CLASS NAME HELPER =====
// รวม Tailwind class อย่างถูกต้อง ไม่ conflict กัน
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== ราคา =====
// แสดงราคาในรูปแบบไทย เช่น ฿1,250.00
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(price)
}

// ===== วันที่ =====
// แสดงวันที่ภาษาไทย เช่น "15 มกราคม 2567"
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMMM yyyy', { locale: th })
}

// แสดงวันที่+เวลา เช่น "15 ม.ค. 67, 14:30 น."
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yy, HH:mm น.', { locale: th })
}

// แสดงเวลาสัมพัทธ์ เช่น "5 นาทีที่แล้ว"
export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: th,
  })
}

// ===== สถานะออเดอร์ =====
// แปลง status เป็นภาษาไทย
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:    'รอยืนยัน',
    confirmed:  'ยืนยันแล้ว',
    preparing:  'กำลังเตรียม',
    delivering: 'กำลังจัดส่ง',
    delivered:  'จัดส่งแล้ว',
    cancelled:  'ยกเลิก',
  }
  return labels[status] || status
}

// สีของ status badge
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800',
    confirmed:  'bg-blue-100 text-blue-800',
    preparing:  'bg-purple-100 text-purple-800',
    delivering: 'bg-orange-100 text-orange-800',
    delivered:  'bg-green-100 text-green-800',
    cancelled:  'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// ===== สถานะการชำระเงิน =====
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting:  'รอชำระเงิน',
    uploaded: 'อัปโหลดสลิปแล้ว',
    verified: 'ยืนยันแล้ว',
    rejected: 'ปฏิเสธ',
  }
  return labels[status] || status
}

// ===== ตรวจสอบ Image URL =====
export function getImageUrl(url?: string | null): string {
  if (!url) return '/icons/placeholder.png'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${url}`
}

// ===== สร้าง Order ID ที่อ่านง่าย =====
export function formatOrderId(id: string): string {
  // แสดงแค่ 8 ตัวสุดท้าย เช่น #A1B2C3D4
  return `#${id.slice(-8).toUpperCase()}`
}
