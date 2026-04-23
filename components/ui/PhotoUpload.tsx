'use client'

import { useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Camera, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  storagePath: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  shape?: 'square' | 'circle'
}

const sizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function PhotoUpload({
  value,
  onChange,
  storagePath,
  label,
  size = 'md',
  shape = 'square',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onChange(url)
    } catch (err) {
      console.error('[PhotoUpload] Error:', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative inline-block">
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'relative cursor-pointer overflow-hidden flex items-center justify-center',
            'border-2 border-dashed border-gray-200 bg-gray-50',
            'hover:border-gray-300 hover:bg-gray-100 transition-colors',
            sizes[size],
            shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="foto" className="w-full h-full object-cover" />
          ) : uploading ? (
            <Loader2 size={20} className="text-gray-400 animate-spin" />
          ) : (
            <Camera size={20} className="text-gray-400" />
          )}
        </div>
        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={10} className="text-white" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
