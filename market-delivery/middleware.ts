// middleware.ts
// ป้องกัน Route ที่ต้องการ Login
// ถ้ายังไม่ได้ Login จะ Redirect ไปหน้า Login อัตโนมัติ

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // สร้าง Supabase client สำหรับ middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ดึง session ปัจจุบัน
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ===== Routes ที่ต้อง Login =====
  const protectedPaths = ['/customer', '/store', '/admin']
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected && !user) {
    // ยังไม่ได้ Login → ไปหน้า Login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // ===== ป้องกัน Admin Route =====
  if (path.startsWith('/admin') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      // ไม่ใช่ Admin → ไปหน้า Home ของลูกค้า
      return NextResponse.redirect(new URL('/customer/home', request.url))
    }
  }

  // ===== ป้องกัน Store Route =====
  if (path.startsWith('/store') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'store' && userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/customer/home', request.url))
    }
  }

  // ===== ถ้า Login แล้วเข้าหน้า Auth → Redirect ออก =====
  if (path.startsWith('/auth') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirectMap: Record<string, string> = {
      admin:    '/admin/dashboard',
      store:    '/store/dashboard',
      customer: '/customer/home',
    }

    const dest = redirectMap[userData?.role ?? 'customer'] ?? '/customer/home'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

// กำหนด path ที่ middleware ทำงาน
export const config = {
  matcher: [
    '/admin/:path*',
    '/store/:path*',
    '/customer/:path*',
    '/auth/:path*',
  ],
}
