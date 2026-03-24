'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { UploadedImage, UseImageUploadOptions, useImageUpload } from '@/hooks/useImageUpload'

interface ImageUploaderProps extends UseImageUploadOptions {
  label?: string
  description?: string
  className?: string
  initialImages?: UploadedImage[]
}

export function ImageUploader({
  label = 'رفع الصور',
  description,
  className = '',
  initialImages = [],
  ...uploadOptions
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    uploading,
    progress,
    uploadedImages,
    error,
    uploadFiles,
    removeImage,
    canUploadMore,
    remainingSlots,
  } = useImageUpload({
    ...uploadOptions,
  })

  // Merge initial + uploaded
  const allImages = [...initialImages, ...uploadedImages]

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length > 0) uploadFiles(fileArray)
    },
    [uploadFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    // Reset input to allow re-upload of same file
    e.target.value = ''
  }

  return (
    <div className={`w-full ${className}`} dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-200 select-none
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
            }
            ${uploading ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-600">جارٍ الرفع... {progress}%</p>
              <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  اسحب الصور هنا أو{' '}
                  <span className="text-blue-600 underline underline-offset-2">اختر من جهازك</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {description || `JPEG, PNG, WebP — حتى ${uploadOptions.maxSizeMB || 5} ميغابايت للصورة`}
                </p>
                {remainingSlots < (uploadOptions.maxFiles || 5) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    متبقي {remainingSlots} من {uploadOptions.maxFiles || 5} صور
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {allImages.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(img)
                  }}
                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Success badge */}
              <div className="absolute top-1 right-1">
                <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow" />
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {canUploadMore && allImages.length > 0 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-300" />
              <span className="text-xs text-gray-400">إضافة</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
