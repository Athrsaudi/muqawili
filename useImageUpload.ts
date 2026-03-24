import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export type UploadBucket = 'portfolio-images' | 'request-images' | 'profile-images'

export interface UploadedImage {
  id: string
  url: string
  path: string
  name: string
  size: number
}

export interface UseImageUploadOptions {
  bucket: UploadBucket
  maxFiles?: number
  maxSizeMB?: number
  onSuccess?: (images: UploadedImage[]) => void
  onError?: (error: string) => void
}

export function useImageUpload({
  bucket,
  maxFiles = 5,
  maxSizeMB = 5,
  onSuccess,
  onError,
}: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      return `حجم الملف ${file.name} يتجاوز ${maxSizeMB} ميغابايت`
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return `نوع الملف ${file.name} غير مدعوم. يُرجى رفع صور فقط (JPEG, PNG, WebP)`
    }
    return null
  }

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedImage[]> => {
      setError(null)

      // Validate total count
      if (uploadedImages.length + files.length > maxFiles) {
        const msg = `لا يمكن رفع أكثر من ${maxFiles} صور`
        setError(msg)
        onError?.(msg)
        return []
      }

      // Validate each file
      for (const file of files) {
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          onError?.(validationError)
          return []
        }
      }

      setUploading(true)
      setProgress(0)

      const results: UploadedImage[] = []

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('يجب تسجيل الدخول أولاً')

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const ext = file.name.split('.').pop()
          const fileName = `${uuidv4()}.${ext}`
          // Store under user's folder for RLS policies
          const filePath = `${user.id}/${fileName}`

          const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path)

          results.push({
            id: uuidv4(),
            url: publicUrl,
            path: data.path,
            name: file.name,
            size: file.size,
          })

          setProgress(Math.round(((i + 1) / files.length) * 100))
        }

        const updated = [...uploadedImages, ...results]
        setUploadedImages(updated)
        onSuccess?.(updated)
        return results
      } catch (err: any) {
        const msg = err.message || 'حدث خطأ أثناء رفع الصور'
        setError(msg)
        onError?.(msg)
        return []
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [bucket, uploadedImages, maxFiles, maxSizeMB, onSuccess, onError]
  )

  const removeImage = useCallback(
    async (image: UploadedImage): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([image.path])

        if (deleteError) throw deleteError

        const updated = uploadedImages.filter((img) => img.id !== image.id)
        setUploadedImages(updated)
        onSuccess?.(updated)
        return true
      } catch (err: any) {
        const msg = err.message || 'حدث خطأ أثناء حذف الصورة'
        setError(msg)
        onError?.(msg)
        return false
      }
    },
    [bucket, uploadedImages, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setUploadedImages([])
    setError(null)
    setProgress(0)
  }, [])

  return {
    uploading,
    progress,
    uploadedImages,
    error,
    uploadFiles,
    removeImage,
    reset,
    canUploadMore: uploadedImages.length < maxFiles,
    remainingSlots: maxFiles - uploadedImages.length,
  }
}
