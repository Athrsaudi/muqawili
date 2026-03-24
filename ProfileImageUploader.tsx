'use client'

import React, { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, User, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ProfileImageUploaderProps {
  userId: string
  currentImageUrl?: string | null
  onUpdated?: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function ProfileImageUploader({
  userId,
  currentImageUrl,
  onUpdated,
  size = 'md',
}: ProfileImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 2 ميغابايت')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/profile.${ext}`

      // Upload (upsert to replace existing)
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true, cacheControl: '0' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path)

      // Add cache-bust
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      // Update contractor_profiles
      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', userId)

      if (updateError) throw updateError

      setImageUrl(urlWithBust)
      onUpdated?.(publicUrl)
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2" dir="rtl">
      <div className={`relative ${sizeMap[size]} group`}>
        {/* Avatar */}
        <div
          className={`${sizeMap[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="الصورة الشخصية"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-1/2 h-1/2 text-gray-300" />
            </div>
          )}
        </div>

        {/* Upload button overlay */}
        <button
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          {uploading ? (
            <Loader2 className="w-1/3 h-1/3 text-white animate-spin" />
          ) : (
            <Camera className="w-1/3 h-1/3 text-white" />
          )}
        </button>

        {/* Small camera badge */}
        <div className="absolute bottom-0 left-0 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center pointer-events-none">
          <Camera className="w-3 h-3 text-white" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {uploading && (
        <p className="text-xs text-gray-400">جارٍ الرفع...</p>
      )}
    </div>
  )
}
