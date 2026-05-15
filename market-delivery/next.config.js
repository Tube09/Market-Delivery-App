// next.config.js
// ตั้งค่า Next.js พร้อม PWA สำหรับ Market Delivery App

const withPWA = require('next-pwa')({
  dest: 'public',           // โฟลเดอร์เก็บ service worker
  register: true,           // ลงทะเบียน service worker อัตโนมัติ
  skipWaiting: true,        // อัปเดต service worker ทันที
  disable: process.env.NODE_ENV === 'development', // ปิด PWA ใน dev mode
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // อนุญาต domain สำหรับรูปภาพจาก Supabase
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // เปิดใช้ Server Actions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = withPWA(nextConfig)
