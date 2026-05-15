'use client'
// app/admin/products/page.tsx
// หน้าจัดการสินค้าทั้งหมด

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronLeft, Plus, Search, Edit2, Trash2,
  Package, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { formatPrice, getImageUrl } from '@/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => { loadProducts() }, [])

  useEffect(() => {
    if (!searchText.trim()) { setFiltered(products); return }
    const q = searchText.toLowerCase()
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ))
  }, [products, searchText])

  const loadProducts = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) { setProducts(data as Product[]); setFiltered(data as Product[]) }
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== Toggle เปิด/ปิดสินค้า =====
  const handleToggleActive = async (product: Product) => {
    try {
      const supabase = getSupabaseClient()
      await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      toast.success(product.is_active ? 'ปิดสินค้าแล้ว' : 'เปิดสินค้าแล้ว')
      await loadProducts()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // ===== ลบสินค้า =====
  const handleDelete = async (product: Product) => {
    if (!confirm(`ลบสินค้า "${product.name}" ใช่ไหม?`)) return
    try {
      const supabase = getSupabaseClient()
      await supabase.from('products').delete().eq('id', product.id)
      toast.success('ลบสินค้าแล้ว')
      await loadProducts()
    } catch {
      toast.error('ลบไม่สำเร็จ')
    }
  }

  // ===== เปิด Form เพิ่ม/แก้ไข =====
  const openForm = (product?: Product) => {
    setEditingProduct(product ?? null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1">จัดการสินค้า</h1>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
          >
            <Plus size={14} /> เพิ่มสินค้า
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-gray-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10 mt-4">
            <Package size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">ไม่พบสินค้า</p>
          </div>
        ) : (
          filtered.map(product => (
            <div key={product.id} className="card flex items-center gap-3">
              {/* รูปสินค้า */}
              <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <Image
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    width={56} height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* ข้อมูล */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-bold text-red-500">{formatPrice(product.price)}</p>
                  <span className="text-gray-300">·</span>
                  <p className="text-xs text-gray-400">สต๊อก: {product.stock}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Toggle Active */}
                <button onClick={() => handleToggleActive(product)}>
                  {product.is_active
                    ? <ToggleRight size={24} className="text-green-500" />
                    : <ToggleLeft size={24} className="text-gray-300" />
                  }
                </button>

                {/* Edit / Delete */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openForm(product)}
                    className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center"
                  >
                    <Edit2 size={13} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form เพิ่ม/แก้ไขสินค้า */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); loadProducts() }}
        />
      )}
    </div>
  )
}

// ===== Form เพิ่ม/แก้ไขสินค้า =====
function ProductForm({
  product, onClose, onSaved
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0')
  const [category, setCategory] = useState(product?.category ?? 'อาหาร')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(product?.image_url ? getImageUrl(product.image_url) : '')
  const [isSaving, setIsSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const CATEGORIES = ['อาหาร', 'เครื่องดื่ม', 'ขนม', 'ของสด', 'ทั่วไป']

  // เลือกรูป
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // บันทึกสินค้า
  const handleSave = async () => {
    if (!name.trim() || !price) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
    setIsSaving(true)

    try {
      const supabase = getSupabaseClient()
      let image_url = product?.image_url

      // อัปโหลดรูปถ้ามีการเลือกใหม่
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `products/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(path, imageFile, { upsert: true })

        if (uploadError) throw uploadError
        image_url = path
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        image_url,
      }

      if (product?.id) {
        // แก้ไข
        await supabase.from('products').update(productData).eq('id', product.id)
        toast.success('แก้ไขสินค้าแล้ว')
      } else {
        // เพิ่มใหม่ (ต้องมี store_id จริงในการใช้งาน)
        await supabase.from('products').insert({ ...productData, is_active: true })
        toast.success('เพิ่มสินค้าแล้ว')
      }

      onSaved()
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800 text-lg">
            {product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        {/* รูปสินค้า */}
        <div className="mb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300
                       flex flex-col items-center justify-center gap-2 overflow-hidden"
          >
            {imagePreview ? (
              <Image src={imagePreview} alt="preview" width={200} height={128}
                className="object-cover w-full h-full" />
            ) : (
              <>
                <Package size={28} className="text-gray-300" />
                <p className="text-xs text-gray-400">กดเพื่อเลือกรูปสินค้า</p>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>

        {/* ชื่อสินค้า */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อสินค้า *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="เช่น ข้าวผัดกระเพราหมูสับ"
            className="input-field" />
        </div>

        {/* คำอธิบาย */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">คำอธิบาย</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="รายละเอียดสินค้า"
            className="input-field resize-none" rows={2} />
        </div>

        {/* ราคา + สต๊อก */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">ราคา (บาท) *</label>
            <input value={price} onChange={e => setPrice(e.target.value)}
              type="number" inputMode="decimal" placeholder="0"
              className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">สต๊อก</label>
            <input value={stock} onChange={e => setStock(e.target.value)}
              type="number" inputMode="numeric" placeholder="0"
              className="input-field" />
          </div>
        </div>

        {/* หมวดหมู่ */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">หมวดหมู่</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === cat
                    ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center justify-center gap-2">
          {isSaving ? <><Loader2 size={16} className="animate-spin" />กำลังบันทึก...</> : 'บันทึกสินค้า'}
        </button>
      </div>
    </div>
  )
}
