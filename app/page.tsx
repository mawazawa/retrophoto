"use client"

import { useState, useEffect } from 'react'
import { UploadZone } from '@/components/upload-zone'
import { RestoreProgress } from '@/components/restore-progress'
import { useRouter } from 'next/navigation'
import { generateFingerprint } from '@/lib/quota/tracker'
import { setupNSMTracking } from '@/lib/metrics/analytics'

export default function Home() {
  const [isUploading, setIsUploading] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Generate fingerprint
    generateFingerprint().then(setFingerprint)

    // Setup NSM tracking
    const nsmTracker = setupNSMTracking()

    return () => {
      // Cleanup if needed
    }
  }, [])

  const handleUpload = async (file: File) => {
    if (!fingerprint) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fingerprint', fingerprint)

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      // Navigate to result page
      router.push(`/result/${result.session_id}`)

    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Restore Old Photos in Seconds
          </h1>
          <p className="text-xl text-muted-foreground">
            Preserve memories by turning old photos into realistic HD.
            No sign-up required.
          </p>
        </div>

        {isUploading ? (
          <RestoreProgress />
        ) : (
          <UploadZone onUpload={handleUpload} />
        )}
      </div>
    </main>
  )
}
