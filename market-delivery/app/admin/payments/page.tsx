'use client'
// app/admin/payments/page.tsx
// หน้าตรวจสอบสลิปการโอนเงิน

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, XCircle, ChevronLeft, CreditCard } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { formatPrice, formatTimeAgo, formatOrderId } from '@/utils'
import { notifyOrderStatusChanged } from '@/services/line-notify'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadPendingPayments()
  }, [])

  // ===== โหลดสลิปรอตรวจ =====
  const loadPendingPayments = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(full_name, phone),
          payment:payments(*)
        `)
        .eq('payment_status', 'uploaded')
        .order('created_at', { ascending: true }) // เรียงจากเก่าสุด (FIFO)

      if (data) setOrders(data as Order[])
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== ยืนยันการชำระเงิน =====
  const handleVerify = async (orderId: string, approved: boolean) => {
    setIsProcessing(true)
    try {
      const supabase = getSupabaseClient()

      // อัปเดตสถานะ payment
      await supabase
        .from('payments')
        .update({
          status: approved ? 'verified' : 'rejected',
          verified_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)

      // อัปเดตสถานะ order
      await supabase
        .from('orders')
        .update({
          payment_status: approved ? 'verified' : 'rejected',
          status: approved ? 'confirmed' : 'pending',
        })
        .eq('id', orderId)

      // แจ้งเตือน LINE
      const customerName = (selected?.customer as { full_name: string })?.full_name ?? 'ลูกค้า'
      await notifyOrderStatusChanged(orderId, approved ? 'confirmed' : 'cancelled', customerName)

      toast.success(approved ? 'ยืนยันการชำระเงินแล้ว!' : 'ปฏิเสธการชำระเงิน')

      // รีโหลดข้อมูล
      setSelected(null)
      await loadPendingPayments()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== หน้ารายละเอียด (เมื่อเลือกออเดอร์) =====
  if (selected) {
    const payment = selected.payment as { slip_url?: string; amount: number } | null
    const customer = selected.customer as { full_name: string; phone: string } | null

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#1a1a2e] px-4 pt-12 pb-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-gray-400 mb-4"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">กลับ</span>
          </button>
          <h1 className="text-white font-bold text-lg">ตรวจสอบสลิป</h1>
          <p className="text-gray-400 text-sm">{formatOrderId(selected.id)}</p>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* ข้อมูลลูกค้า */}
          <div className="card">
            <p className="text-xs text-gray-400 mb-2">ข้อมูลลูกค้า</p>
            <p className="font-semibold text-gray-800">{customer?.full_name}</p>
            <p className="text-sm text-gray-500 mt-1">{customer?.phone}</p>
            <p className="text-sm font-bold text-red-500 mt-2">
              ยอดที่ต้องชำระ: {formatPrice(selected.total_amount)}
            </p>
          </div>

          {/* รูปสลิป */}
          <div className="card">
            <p className="text-xs text-gray-400 mb-3">รูปสลิปโอนเงิน</p>
            {payment?.slip_url ? (
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={payment.slip_url}
                  alt="สลิปโอนเงิน"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 text-sm">ไม่พบรูปสลิป</p>
              </div>
            )}
          </div>

          {/* ปุ่มยืนยัน/ปฏิเสธ */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVerify(selected.id, false)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 bg-red-50 text-red-600
                         font-semibold py-3.5 rounded-2xl border border-red-200
                         active:scale-95 transition-transform disabled:opacity-50"
            >
              <XCircle size={18} />
              ปฏิเสธ
            </button>
            <button
              onClick={() => handleVerify(selected.id, true)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 bg-green-500 text-white
                         font-semibold py-3.5 rounded-2xl
                         active:scale-95 transition-transform disabled:opacity-50"
            >
              <CheckCircle size={18} />
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== หน้ารายการสลิปรอตรวจ =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 mb-4">
          <ChevronLeft size={20} />
          <span className="text-sm">กลับ</span>
        </button>
        <h1 className="text-white font-bold text-xl">ตรวจสอบสลิป</h1>
        <p className="text-gray-400 text-sm mt-1">
          รอตรวจสอบ {orders.length} รายการ
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">ไม่มีสลิปรอตรวจสอบ</p>
            <p className="text-gray-400 text-sm mt-1">ทุกอย่างเรียบร้อย!</p>
          </div>
        ) : (
          orders.map((order) => {
            const customer = order.customer as { full_name: string; phone: string } | null
            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className="card w-full text-left flex items-center gap-3 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard size={22} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{customer?.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatOrderId(order.id)} · {formatTimeAgo(order.created_at)}
                  </p>
                  <p className="text-sm font-bold text-red-500 mt-1">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
                <span className="badge bg-amber-100 text-amber-700 flex-shrink-0">รอตรวจ</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
