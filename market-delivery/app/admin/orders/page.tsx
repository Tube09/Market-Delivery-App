'use client'
// app/admin/orders/page.tsx
// หน้าจัดการออเดอร์ทั้งหมด สำหรับ Admin

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import {
  formatPrice, formatTimeAgo, formatOrderId,
  getOrderStatusLabel, getOrderStatusColor
} from '@/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'

// ตัวเลือกกรองสถานะ
const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'ทั้งหมด',      value: 'all' },
  { label: 'รอยืนยัน',    value: 'pending' },
  { label: 'ยืนยันแล้ว',  value: 'confirmed' },
  { label: 'กำลังเตรียม', value: 'preparing' },
  { label: 'กำลังส่ง',    value: 'delivering' },
  { label: 'สำเร็จ',      value: 'delivered' },
  { label: 'ยกเลิก',      value: 'cancelled' },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filtered, setFiltered] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  // กรองเมื่อ filter หรือ search เปลี่ยน
  useEffect(() => {
    let result = orders
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      result = result.filter(o => {
        const name = (o.customer as { full_name: string })?.full_name?.toLowerCase() ?? ''
        return name.includes(q) || o.id.includes(q)
      })
    }
    setFiltered(result)
  }, [orders, statusFilter, searchText])

  const loadOrders = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(full_name, phone),
          items:order_items(id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setOrders(data as Order[])
        setFiltered(data as Order[])
      }
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">จัดการออเดอร์</h1>
          <span className="ml-auto bg-white/10 text-white text-xs px-2.5 py-1 rounded-full">
            {filtered.length} รายการ
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, เลขออเดอร์..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-[#1a1a2e] text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10 mt-4">
            <Filter size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">ไม่พบออเดอร์</p>
          </div>
        ) : (
          filtered.map(order => {
            const customer = order.customer as { full_name: string; phone: string } | null
            const itemCount = (order.items as unknown[])?.length ?? 0
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="card flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-semibold text-gray-500">
                  {customer?.full_name?.[0] ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {customer?.full_name ?? 'ไม่ทราบชื่อ'}
                    </p>
                    <span className={`badge text-xs flex-shrink-0 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatOrderId(order.id)} · {itemCount} รายการ · {formatTimeAgo(order.created_at)}
                  </p>
                  <p className="text-xs font-semibold text-red-500 mt-1">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>

                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
