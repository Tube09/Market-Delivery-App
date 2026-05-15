# 🛵 Market Delivery App

ระบบ Delivery Marketplace สำหรับ Solo Founder
สร้างด้วย Next.js 15 + Supabase + TypeScript

---

## 📦 โครงสร้างโปรเจกต์

```
market-delivery/
├── app/
│   ├── auth/
│   │   ├── login/          ← หน้า Login
│   │   └── register/       ← หน้าสมัครสมาชิก
│   ├── admin/
│   │   ├── dashboard/      ← Admin Dashboard ✅
│   │   ├── orders/         ← จัดการออเดอร์ ✅
│   │   ├── payments/       ← ตรวจสลิป ✅
│   │   ├── products/       ← จัดการสินค้า ✅
│   │   └── customers/      ← ข้อมูลลูกค้า ✅
│   ├── customer/
│   │   ├── home/           ← หน้าหลักลูกค้า
│   │   ├── cart/           ← ตะกร้าสินค้า
│   │   ├── checkout/       ← ชำระเงิน
│   │   └── orders/         ← ประวัติออเดอร์
│   └── store/
│       ├── dashboard/      ← Dashboard ร้านค้า
│       ├── products/       ← จัดการสินค้าร้าน
│       └── orders/         ← ออเดอร์ร้านค้า
├── components/             ← UI Components
├── lib/                    ← Supabase Client
├── services/               ← LINE Notify
├── types/                  ← TypeScript Types
├── utils/                  ← Helper Functions
├── middleware.ts            ← Route Protection ✅
└── supabase-schema.sql      ← Database Schema ✅
```

---

## 🚀 วิธีติดตั้งและรัน

### ขั้นที่ 1: ติดตั้ง Dependencies

```bash
npm install
```

### ขั้นที่ 2: ตั้งค่า Supabase

1. ไปที่ [supabase.com](https://supabase.com) และสร้างโปรเจกต์ใหม่
2. ไปที่ **SQL Editor** แล้วรัน `supabase-schema.sql` ทั้งหมด
3. ไปที่ **Project Settings → API** คัดลอก URL และ Keys

### ขั้นที่ 3: ตั้งค่า Environment Variables

```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env.local

# แก้ไขค่าใน .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LINE_NOTIFY_TOKEN=your-line-token
PROMPTPAY_NUMBER=0812345678
```

### ขั้นที่ 4: รันโปรเจกต์

```bash
npm run dev
```

เปิด http://localhost:3000

---

## 👤 สร้าง Admin Account

1. สมัครสมาชิกผ่านหน้า `/auth/register`
2. ไปที่ Supabase → Table Editor → users
3. แก้ไข `role` จาก `customer` เป็น `admin`
4. Login ใหม่ → จะ Redirect ไปหน้า Admin Dashboard

---

## 🎨 หน้าที่มีอยู่แล้ว

| หน้า | URL | สถานะ |
|------|-----|--------|
| Login | `/auth/login` | ✅ |
| Register | `/auth/register` | ✅ |
| Admin Dashboard | `/admin/dashboard` | ✅ |
| จัดการออเดอร์ | `/admin/orders` | ✅ |
| ตรวจสลิป | `/admin/payments` | ✅ |
| จัดการสินค้า | `/admin/products` | ✅ |
| ข้อมูลลูกค้า | `/admin/customers` | ✅ |

---

## 🚀 Deploy บน Vercel

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel

# ตั้งค่า Environment Variables ใน Vercel Dashboard
# Settings → Environment Variables → ใส่ค่าเดียวกับ .env.local
```

---

## 💡 Tips สำหรับมือใหม่

- **ถ้า Error "relation does not exist"** → รัน SQL Schema ใน Supabase ก่อน
- **ถ้า Login ไม่ได้** → ตรวจสอบ Supabase URL และ Key ใน .env.local
- **ถ้า Image ไม่แสดง** → ตรวจสอบ Storage Bucket ใน Supabase
- **LINE Notify ไม่ทำงาน** → ตรวจสอบ Token ที่ notify-bot.line.me
