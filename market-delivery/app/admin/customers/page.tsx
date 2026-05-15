'use client'
// app/admin/customers/page.tsx
// หน้าดูรายชื่อลูกค้าทั้งหมด

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, Users, Phone, ShoppingBag } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/utils'
import type { User } from '@/types'
import toast from 'react-hot-toast'

// ข้อมูล Customer พร้อมสถิติออเดอร์
interface CustomerWithStats extends User {
  order_count: number
  total_spent: number
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [filtered, setFiltered] = useState<CustomerWithStats[]>([])
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<CustomerWithStats | null>(null)

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    if (!searchText.trim()) { setFiltered(customers); return }
    const q = searchText.toLowerCase()
    setFiltered(customers.filter(c =>
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    ))
  }, [customers, searchText])

  const loadCustomers = async () => {
    try {
      const supabase = getSupabaseClient()

      // ดึงลูกค้าทั้งหมด
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (error) throw error

      // ดึงสถิติออเดอร์แต่ละคน
      const customersWithStats = await Promise.all(
        (users ?? []).map(async (user) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('customer_id', user.id)
            .eq('payment_status', 'verified')

          return {
            ...user,
            order_count: orders?.length ?? 0,
            total_spent: orders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0,
          } as CustomerWithStats
        })
      )

      setCustomers(customersWithStats)
      setFiltered(customersWithStats)
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== หน้ารายละเอียดลูกค้า =====
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#1a1a2e] px-4 pt-12 pb-6">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 mb-4">
            <ChevronLeft size={20} />
            <span className="text-sm">กลับ</span>
          </button>
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2">
              {selected.full_name?.[0] ?? '?'}
            </div>
            <p className="text-white font-bold text-lg">{selected.full_name}</p>
            <p className="text-gray-400 text-sm">{selected.email}</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{selected.order_count}</p>
              <p className="text-xs text-gray-400 mt-1">ออเดอร์ทั้งหมด</p>
            </div>
            <div className="card text-center">
              <p className="text-lg font-bold text-red-500">{formatPrice(selected.total_spent)}</p>
              <p className="text-xs text-gray-400 mt-1">ยอดรวมทั้งหมด</p>
            </div>
          </div>

          {/* ข้อมูล */}
          <div className="card space-y-3">
            <p className="text-xs text-gray-400">ข้อมูลติดต่อ</p>
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700">{selected.phone ?? '-'}</p>
            </div>
            <div className="flex items-start gap-3">
              <ShoppingBag size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{selected.address ?? '-'}</p>
            </div>
            <p className="text-xs text-gray-400">
              สมัครสมาชิก: {formatDate(selected.created_at)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ===== หน้ารายชื่อลูกค้า =====
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1">ข้อมูลลูกค้า</h1>
          <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-full">
            {filtered.length} คน
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10 mt-4">
            <Users size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">ไม่พบลูกค้า</p>
          </div>
        ) : (
          filtered.map(customer => (
            <button
              key={customer.id}
              onClick={() => setSelected(customer)}
              className="card w-full text-left flex items-center gap-3 active:scale-95 transition-transform"
            >
              {/* Avatar */}
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-base font-bold text-gray-500 flex-shrink-0">
                {customer.full_name?.[0] ?? '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{customer.full_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{customer.phone ?? customer.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-500">{customer.order_count} ออเดอร์</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-semibold text-red-400">{formatPrice(customer.total_spent)}</span>
                </div>
              </div>

              <ChevronLeft size={16} className="text-gray-300 rotate-180 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
