"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { cn, validateImageFile } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function UploadZone({
  onUpload
}: {
  onUpload: (file: File) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Cleanup object URL when file changes or component unmounts
  useEffect(() => {
    if (file) {
      // Revoke previous URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      // Create new URL
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      setPreviewUrl(url)
    } else {
      // Clear preview when file is removed
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPreviewUrl(null)
    }

    // Cleanup on unmount
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [file])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)

    if (acceptedFiles.length === 0) return

    const selectedFile = acceptedFiles[0]
    const validation = validateImageFile(selectedFile)

    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setFile(selectedFile)

    // Haptic feedback (T056a)
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024 // 20MB
  })

  const handleSubmit = () => {
    if (file) {
      onUpload(file)
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          "min-touch-44 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isDragActive && "border-primary bg-primary/10",
          error && "border-destructive"
        )}
        tabIndex={0}
        role="button"
        aria-label="Upload image"
      >
        <input {...getInputProps()} aria-label="File input" />

        {file ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl || ''}
                alt="Preview"
                className="max-h-64 rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{file.name}</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? "Drop your photo here" : "Upload your old photo"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to browse (JPG, PNG, HEIC, WEBP • Max 20MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {file && !error && (
        <Button
          onClick={handleSubmit}
          className="mt-6 w-full min-touch-44"
          size="lg"
        >
          Restore Photo
        </Button>
      )}
    </div>
  )
}
