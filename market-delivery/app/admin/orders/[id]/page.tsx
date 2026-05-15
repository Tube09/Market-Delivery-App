'use client'
// app/admin/orders/[id]/page.tsx
// หน้ารายละเอียดออเดอร์ + เปลี่ยนสถานะ

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Phone, MapPin, Package, CheckCircle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import {
  formatPrice, formatDateTime, formatOrderId,
  getOrderStatusLabel, getOrderStatusColor, getImageUrl
} from '@/utils'
import { notifyOrderStatusChanged } from '@/services/line-notify'
import type { Order, OrderItem, OrderStatus } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

// ลำดับสถานะที่เปลี่ยนได้
const STATUS_FLOW: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'delivering', 'delivered'
]

const STATUS_ACTIONS: Record<string, { label: string; next: OrderStatus; color: string }> = {
  pending:    { label: 'ยืนยันออเดอร์',    next: 'confirmed',  color: 'bg-blue-500' },
  confirmed:  { label: 'เริ่มเตรียมสินค้า', next: 'preparing',  color: 'bg-purple-500' },
  preparing:  { label: 'ส่งมอบให้ไรเดอร์', next: 'delivering', color: 'bg-orange-500' },
  delivering: { label: 'ยืนยันจัดส่งแล้ว', next: 'delivered',  color: 'bg-green-500' },
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => { loadOrder() }, [orderId])

  const loadOrder = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(full_name, phone, address),
          items:order_items(
            *,
            product:products(name, image_url, price)
          ),
          payment:payments(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data as Order)
    } catch {
      toast.error('ไม่พบออเดอร์')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  // ===== เปลี่ยนสถานะออเดอร์ =====
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return
    setIsUpdating(true)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)

      if (error) throw error

      // แจ้งเตือน LINE
      const customerName = (order.customer as { full_name: string })?.full_name ?? 'ลูกค้า'
      await notifyOrderStatusChanged(order.id, newStatus, customerName)

      toast.success(`อัปเดตสถานะเป็น "${getOrderStatusLabel(newStatus)}" แล้ว`)
      await loadOrder() // โหลดข้อมูลใหม่
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsUpdating(false)
    }
  }

  // ===== ยกเลิกออเดอร์ =====
  const handleCancel = async () => {
    if (!order) return
    if (!confirm('ยืนยันการยกเลิกออเดอร์นี้?')) return

    setIsUpdating(true)
    try {
      const supabase = getSupabaseClient()
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      toast.success('ยกเลิกออเดอร์แล้ว')
      await loadOrder()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const customer = order.customer as { full_name: string; phone: string; address: string } | null
  const items = order.items as (OrderItem & { product: { name: string; image_url?: string } })[]
  const currentAction = STATUS_ACTIONS[order.status]
  const statusIndex = STATUS_FLOW.indexOf(order.status as OrderStatus)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-gray-400 text-xs">รายละเอียดออเดอร์</p>
            <h1 className="text-white font-bold">{formatOrderId(order.id)}</h1>
          </div>
          <span className={`badge ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-8">

        {/* Progress Bar */}
        {order.status !== 'cancelled' && (
          <div className="card">
            <p className="text-xs text-gray-400 mb-3">ความคืบหน้า</p>
            <div className="flex items-center">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    i <= statusIndex ? 'bg-red-500' : 'bg-gray-200'
                  }`} />
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < statusIndex ? 'bg-red-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {STATUS_FLOW.map((s, i) => (
                <p key={s} className={`text-[9px] ${i <= statusIndex ? 'text-red-500 font-semibold' : 'text-gray-300'}`}>
                  {getOrderStatusLabel(s)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ข้อมูลลูกค้า */}
        <div className="card">
          <p className="text-xs text-gray-400 mb-3">ข้อมูลลูกค้า</p>
          <p className="font-semibold text-gray-800">{customer?.full_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Phone size={13} className="text-gray-400" />
            <p className="text-sm text-gray-600">{customer?.phone}</p>
          </div>
          <div className="flex items-start gap-2 mt-1.5">
            <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">{order.delivery_address}</p>
          </div>
          {order.note && (
            <div className="mt-2 bg-amber-50 rounded-lg p-2">
              <p className="text-xs text-amber-700">หมายเหตุ: {order.note}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">{formatDateTime(order.created_at)}</p>
        </div>

        {/* รายการสินค้า */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400">รายการสินค้า ({items?.length ?? 0} รายการ)</p>
          </div>
          <div className="space-y-3">
            {items?.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {/* รูปสินค้า */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product?.image_url ? (
                    <Image
                      src={getImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      width={40} height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* สรุปราคา */}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>ค่าสินค้า</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>ค่าจัดส่ง</span>
              <span className="text-green-600">ฟรี</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800">
              <span>รวมทั้งหมด</span>
              <span className="text-red-500">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* สถานะการชำระเงิน */}
        <div className="card">
          <p className="text-xs text-gray-400 mb-2">การชำระเงิน</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">PromptPay</p>
            <span className={`badge ${
              order.payment_status === 'verified'
                ? 'bg-green-100 text-green-700'
                : order.payment_status === 'uploaded'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {order.payment_status === 'verified' ? 'ชำระแล้ว'
               : order.payment_status === 'uploaded' ? 'รอตรวจสอบ'
               : 'รอชำระเงิน'}
            </span>
          </div>
        </div>

        {/* ปุ่มเปลี่ยนสถานะ */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="space-y-2">
            {currentAction && (
              <button
                onClick={() => handleUpdateStatus(currentAction.next)}
                disabled={isUpdating}
                className={`w-full ${currentAction.color} text-white font-semibold
                           py-3.5 rounded-2xl flex items-center justify-center gap-2
                           active:scale-95 transition-transform disabled:opacity-50`}
              >
                <CheckCircle size={18} />
                {currentAction.label}
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="w-full bg-red-50 text-red-500 border border-red-200 font-semibold
                         py-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-50 text-sm"
            >
              ยกเลิกออเดอร์
            </button>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="card text-center py-4">
            <CheckCircle size={28} className="text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-semibold text-sm">ออเดอร์เสร็จสมบูรณ์</p>
          </div>
        )}
      </div>
    </div>
  )
}
