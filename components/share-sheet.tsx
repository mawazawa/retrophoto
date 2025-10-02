"use client"

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ShareSheet({
  deepLink,
  ogCardUrl,
  sessionId
}: {
  deepLink: string
  ogCardUrl: string
  sessionId: string
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Native share sheet (T019)
        await navigator.share({
          title: 'Restored with RetroPhoto',
          text: 'Check out my restored photo!',
          url: deepLink
        })
      } catch (err) {
        console.error('Share failed:', err)
        fallbackCopy()
      }
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = async () => {
    await navigator.clipboard.writeText(deepLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleShare}
      className="min-touch-44"
      size="lg"
      aria-label="Share restored photo"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Link Copied!
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-5 w-5" />
          Share
        </>
      )}
    </Button>
  )
}
