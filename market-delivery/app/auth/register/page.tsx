'use client'
// app/auth/register/page.tsx
// หน้าสมัครสมาชิก

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShoppingBag, Loader2, ChevronLeft } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

// ===== Validation Schema =====
const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'กรุณาใส่ชื่อ-นามสกุล'),
  phone: z
    .string()
    .min(9, 'เบอร์โทรไม่ถูกต้อง')
    .regex(/^0[0-9]{8,9}$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง'),
  email: z
    .string()
    .min(1, 'กรุณาใส่อีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirm_password: z
    .string(),
  address: z
    .string()
    .min(10, 'กรุณาใส่ที่อยู่จัดส่ง'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirm_password'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  // ===== Handle Register =====
  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      // สมัครสมาชิกกับ Supabase Auth
      // ข้อมูลเพิ่มเติมจะถูกส่งผ่าน raw_user_meta_data
      // แล้ว Trigger จะสร้าง record ใน public.users อัตโนมัติ
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            address: data.address,
            role: 'customer', // ค่า default คือลูกค้า
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('อีเมลนี้ถูกใช้งานแล้ว')
        } else {
          toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
        return
      }

      toast.success('สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมล')
      router.push('/auth/login')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a1a2e] pt-12 pb-8 px-6">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-gray-400 mb-6"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">กลับ</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">สมัครสมาชิก</h1>
            <p className="text-gray-400 text-xs">Market Delivery</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ชื่อ-นามสกุล */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              ชื่อ-นามสกุล
            </label>
            <input
              {...register('full_name')}
              type="text"
              placeholder="สมชาย ใจดี"
              className="input-field"
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* เบอร์โทร */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              เบอร์โทรศัพท์
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="0812345678"
              className="input-field"
              inputMode="numeric"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* อีเมล */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              อีเมล
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="your@email.com"
              className="input-field"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* ที่อยู่จัดส่ง */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              ที่อยู่จัดส่ง
            </label>
            <textarea
              {...register('address')}
              placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด"
              className="input-field resize-none"
              rows={3}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* ยืนยันรหัสผ่าน */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('confirm_password')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="ใส่รหัสผ่านอีกครั้ง"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* ปุ่มสมัคร */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังสมัครสมาชิก...
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

        {/* ลิงก์ Login */}
        <div className="text-center mt-6 pb-8">
          <span className="text-gray-500 text-sm">มีบัญชีแล้ว? </span>
          <Link
            href="/auth/login"
            className="text-red-500 font-semibold text-sm"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}
