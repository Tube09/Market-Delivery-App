// lib/supabase-server.ts
// Supabase Client สำหรับ Server Components และ API Routes

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ===== SERVER CLIENT =====
// ใช้ใน Server Components และ Route Handlers
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component ไม่สามารถ set cookies ได้ — ไม่เป็นไร
          }
        },
      },
    }
  )
}

// ===== ADMIN CLIENT =====
// ใช้สำหรับ Admin operations ที่ต้องการสิทธิ์พิเศษ
// ห้ามใช้ใน Client Side เด็ดขาด!
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key — เก็บเป็นความลับ
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
