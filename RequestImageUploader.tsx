'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUploader } from '@/components/ImageUploader'
import { UploadedImage } from '@/hooks/useImageUpload'
import { Camera } from 'lucide-react'

interface RequestImageUploaderProps {
  requestId: string
  existingImages?: string[]
  onUpdated?: (urls: string[]) => void
  readOnly?: boolean
}

export function RequestImageUploader({
  requestId,
  existingImages = [],
  onUpdated,
  readOnly = false,
}: RequestImageUploaderProps) {
  const [saving, setSaving] = useState(false)
  const [currentUrls, setCurrentUrls] = useState<string[]>(existingImages)

  const handleUploadSuccess = async (images: UploadedImage[]) => {
    const newUrls = images.map((img) => img.url)
    const allUrls = [...currentUrls, ...newUrls]

    setSaving(true)
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ images: allUrls })
        .eq('id', requestId)

      if (error) throw error

      setCurrentUrls(allUrls)
      onUpdated?.(allUrls)
    } catch (err) {
      console.error('Failed to update request images:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (removedUrl: string) => {
    const updated = currentUrls.filter((url) => url !== removedUrl)
    setSaving(true)
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ images: updated })
        .eq('id', requestId)

      if (error) throw error

      setCurrentUrls(updated)
      onUpdated?.(updated)
    } catch (err) {
      console.error('Failed to remove request image:', err)
    } finally {
      setSaving(false)
    }
  }

  if (readOnly) {
    return (
      <div className="space-y-2" dir="rtl">
        {currentUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {currentUrls.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={url}
                  alt={`صورة ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Camera className="w-4 h-4" />
            <span>لا توجد صور مرفقة</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl">
      <ImageUploader
        bucket="request-images"
        maxFiles={8}
        maxSizeMB={5}
        label="صور الطلب"
        description="أضف صوراً توضح طبيعة العمل المطلوب (حتى 8 صور)"
        onSuccess={handleUploadSuccess}
      />
      {saving && (
        <p className="text-xs text-gray-400 mt-1">جارٍ الحفظ...</p>
      )}
    </div>
  )
}
