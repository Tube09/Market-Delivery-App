// lib/supabase.ts
// ตั้งค่า Supabase Client สำหรับ Market Delivery App
// มี 2 แบบ: Browser Client และ Server Client

import { createBrowserClient } from '@supabase/ssr'

// ===== BROWSER CLIENT =====
// ใช้ใน Client Components (มี 'use client')
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ===== SINGLETON สำหรับ Client Side =====
// ใช้ตัวแปรนี้ใน hooks และ services
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
