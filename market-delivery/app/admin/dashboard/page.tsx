'use client'
// app/admin/dashboard/page.tsx
// หน้า Admin Dashboard — ดูภาพรวมของทั้งระบบ

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Users, Package, CreditCard,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  LogOut, Bell, ChevronRight
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { formatPrice, formatTimeAgo, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import type { DashboardStats, Order } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [pendingPayments, setPendingPayments] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ===== โหลดข้อมูล Dashboard =====
  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const supabase = getSupabaseClient()

      // ดึง Stats จาก View
      const { data: statsData } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()

      if (statsData) setStats(statsData)

      // ดึง 10 ออเดอร์ล่าสุด
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(full_name, phone),
          items:order_items(id)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersData) setRecentOrders(ordersData as Order[])

      // ดึงออเดอร์ที่รอตรวจสลิป
      const { data: pendingData } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(full_name, phone),
          payment:payments(slip_url, amount)
        `)
        .eq('payment_status', 'uploaded')
        .order('created_at', { ascending: false })
        .limit(5)

      if (pendingData) setPendingPayments(pendingData as Order[])

    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== Logout =====
  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== Header ===== */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm">แผงควบคุม</p>
            <h1 className="text-white text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center"
            >
              <LogOut size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* ===== Stats Grid ===== */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShoppingBag size={20} />}
            label="ออเดอร์ทั้งหมด"
            value={stats?.total_orders ?? 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="ยอดขายรวม"
            value={formatPrice(stats?.total_revenue ?? 0)}
            color="bg-green-500"
            isString
          />
          <StatCard
            icon={<Users size={20} />}
            label="ลูกค้าทั้งหมด"
            value={stats?.total_customers ?? 0}
            color="bg-purple-500"
          />
          <StatCard
            icon={<Package size={20} />}
            label="สินค้าทั้งหมด"
            value={stats?.total_products ?? 0}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="px-4 py-4">

        {/* แจ้งเตือนสลิปรอตรวจ */}
        {(stats?.pending_payments ?? 0) > 0 && (
          <Link
            href="/admin/payments"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                มีสลิปรอตรวจ {stats?.pending_payments} รายการ
              </p>
              <p className="text-amber-600 text-xs mt-0.5">กดเพื่อตรวจสอบ</p>
            </div>
            <ChevronRight size={18} className="text-amber-400" />
          </Link>
        )}

        {/* Today Stats */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">วันนี้</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.orders_today ?? 0}</p>
              <p className="text-xs text-blue-400 mt-0.5">ออเดอร์</p>
            </div>
          </div>
        </div>

        {/* Menu Links */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MenuLink href="/admin/orders" icon={<ShoppingBag size={20} />} label="จัดการออเดอร์" color="text-blue-500" bg="bg-blue-50" />
          <MenuLink href="/admin/payments" icon={<CreditCard size={20} />} label="ตรวจสลิป" color="text-green-500" bg="bg-green-50" />
          <MenuLink href="/admin/products" icon={<Package size={20} />} label="จัดการสินค้า" color="text-orange-500" bg="bg-orange-50" />
          <MenuLink href="/admin/customers" icon={<Users size={20} />} label="ลูกค้า" color="text-purple-500" bg="bg-purple-50" />
        </div>

        {/* ===== สลิปรอตรวจ ===== */}
        {pendingPayments.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">สลิปรอตรวจสอบ</h2>
              <Link href="/admin/payments" className="text-red-500 text-sm">ดูทั้งหมด</Link>
            </div>
            <div className="space-y-3">
              {pendingPayments.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/payments/${order.id}`}
                  className="card flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {(order.customer as { full_name: string })?.full_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(order.total_amount)} · {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700">รอตรวจ</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== ออเดอร์ล่าสุด ===== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">ออเดอร์ล่าสุด</h2>
            <Link href="/admin/orders" className="text-red-500 text-sm">ดูทั้งหมด</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="card flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {(order.customer as { full_name: string })?.full_name}
                    </p>
                    <span className={`badge text-xs ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{formatTimeAgo(order.created_at)}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-xs font-medium text-gray-600">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}

            {recentOrders.length === 0 && (
              <div className="card text-center py-8">
                <CheckCircle size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">ยังไม่มีออเดอร์</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Sub-components =====

function StatCard({
  icon, label, value, color, isString
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  isString?: boolean
}) {
  return (
    <div className="bg-white/10 rounded-2xl p-4">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-3`}>
        <span className="text-white">{icon}</span>
      </div>
      <p className="text-white font-bold text-lg leading-none">
        {isString ? value : value.toLocaleString('th-TH')}
      </p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  )
}

function MenuLink({
  href, icon, label, color, bg
}: {
  href: string
  icon: React.ReactNode
  label: string
  color: string
  bg: string
}) {
  return (
    <Link
      href={href}
      className="card flex flex-col items-center justify-center py-5 gap-2 active:scale-95 transition-transform"
    >
      <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>
        <span className={color}>{icon}</span>
      </div>
      <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
    </Link>
  )
}
