'use client'
// app/auth/login/page.tsx
// หน้า Login — ลูกค้า/ร้านค้า/แอดมิน เข้าสู่ระบบที่นี่

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShoppingBag, Loader2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

// ===== Validation Schema =====
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณาใส่อีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // ===== Handle Login =====
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      // Login กับ Supabase Auth
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // แปล error เป็นภาษาไทย
        if (error.message.includes('Invalid login credentials')) {
          toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else {
          toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
        return
      }

      // ดึง role ของ user
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      toast.success('เข้าสู่ระบบสำเร็จ!')

      // Redirect ตาม role
      if (userData?.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (userData?.role === 'store') {
        router.push('/store/dashboard')
      } else {
        router.push('/customer/home')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ส่วนบน — Logo และหัวเรื่อง */}
      <div className="bg-[#1a1a2e] pt-16 pb-12 px-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Market Delivery</h1>
        <p className="text-gray-400 text-sm mt-1">สั่งของส่งถึงบ้าน</p>
      </div>

      {/* ส่วนล่าง — Form */}
      <div className="flex-1 -mt-6 bg-gray-50 rounded-t-3xl px-6 pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">เข้าสู่ระบบ</h2>
        <p className="text-gray-400 text-sm mb-6">ยินดีต้อนรับกลับมา!</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
                placeholder="••••••••"
                className="input-field pr-12"
                autoComplete="current-password"
              />
              {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
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

          {/* ลืมรหัสผ่าน */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-red-500 font-medium"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          {/* ปุ่ม Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        {/* ลิงก์สมัครสมาชิก */}
        <div className="text-center mt-6">
          <span className="text-gray-500 text-sm">ยังไม่มีบัญชี? </span>
          <Link
            href="/auth/register"
            className="text-red-500 font-semibold text-sm"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  )
}
