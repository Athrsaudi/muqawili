'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUploader } from '@/components/ImageUploader'
import { UploadedImage } from '@/hooks/useImageUpload'
import { Briefcase, Plus, Trash2, CheckCircle } from 'lucide-react'

interface PortfolioItem {
  id?: string
  title: string
  description: string
  images: UploadedImage[]
}

interface PortfolioUploaderProps {
  contractorId: string
  onSaved?: () => void
}

export function PortfolioUploader({ contractorId, onSaved }: PortfolioUploaderProps) {
  const [items, setItems] = useState<PortfolioItem[]>([
    { title: '', description: '', images: [] },
  ])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const addItem = () => {
    if (items.length >= 10) return
    setItems((prev) => [...prev, { title: '', description: '', images: [] }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PortfolioItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleSave = async () => {
    setError(null)
    const validItems = items.filter(
      (item) => item.title.trim() && item.images.length > 0
    )

    if (validItems.length === 0) {
      setError('أضف عنواناً وصورة واحدة على الأقل لكل عمل')
      return
    }

    setSaving(true)
    try {
      const rows = validItems.flatMap((item) =>
        item.images.map((img) => ({
          contractor_id: contractorId,
          image_url: img.url,
          title: item.title.trim(),
          description: item.description.trim() || null,
        }))
      )

      const { error: insertError } = await supabase
        .from('contractor_portfolio')
        .insert(rows)

      if (insertError) throw insertError

      setSavedCount(validItems.length)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">معرض الأعمال</h3>
        </div>
        {items.length < 10 && (
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            إضافة عمل
          </button>
        )}
      </div>

      {savedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          تم حفظ {savedCount} {savedCount === 1 ? 'عمل' : 'أعمال'} بنجاح
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              عمل {index + 1}
            </span>
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان العمل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(index, 'title', e.target.value)}
              placeholder="مثال: تركيب كلادينج مبنى تجاري"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وصف العمل
            </label>
            <textarea
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="أضف تفاصيل عن هذا العمل..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
            />
          </div>

          <ImageUploader
            bucket="portfolio-images"
            maxFiles={5}
            maxSizeMB={5}
            label="صور العمل *"
            onSuccess={(imgs) => updateItem(index, 'images', imgs)}
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'جارٍ الحفظ...' : 'حفظ الأعمال'}
      </button>
    </div>
  )
}
