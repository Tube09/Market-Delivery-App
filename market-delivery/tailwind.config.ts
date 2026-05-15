// tailwind.config.ts
// ตั้งค่า Tailwind CSS สำหรับ Market Delivery App

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Dark Mode แบบ manual toggle
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // สีหลักของแอป
        primary: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#e74c3c',  // สีแดงหลัก
          700: '#c0392b',
          900: '#7f1d1d',
        },
        dark: {
          900: '#0f0f0f',
          800: '#1a1a2e',  // สีเข้มหลัก
          700: '#16213e',
          600: '#2d2d44',
        },
      },
      fontFamily: {
        // ใช้ฟอนต์ที่อ่านภาษาไทยได้ดี
        sans: ['Noto Sans Thai', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // ขนาด bottom navigation bar
      spacing: {
        'nav': '64px',
      },
    },
  },
  plugins: [],
}

export default config
