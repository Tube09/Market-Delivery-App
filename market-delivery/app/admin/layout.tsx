// app/admin/layout.tsx
// Layout สำหรับทุกหน้า Admin

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Market Delivery',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin layout เรียบง่าย — navigation อยู่ในแต่ละ page component
  // เพื่อรองรับการแสดงผลบนมือถือที่ดีที่สุด
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
