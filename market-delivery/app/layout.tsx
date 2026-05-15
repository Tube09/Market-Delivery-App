// app/layout.tsx
// Layout หลักของทั้งแอป

import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

// โหลดฟอนต์ภาษาไทย
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-thai',
})

export const metadata: Metadata = {
  title: 'Market Delivery | สั่งของส่งถึงบ้าน',
  description: 'สั่งอาหารและสินค้าส่งถึงบ้าน รวดเร็ว สะดวก',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Market Delivery',
  },
}

export const viewport: Viewport = {
  themeColor: '#e74c3c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
