"use client"

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { logger } from '@/lib/observability/logger'

export function ShareSheet({
  deepLink,
  ogCardUrl: _ogCardUrl,
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
        logger.shareEvent(sessionId, 'native')
      } catch (err) {
        // User cancelled share or share failed
        if ((err as Error).name !== 'AbortError') {
          // Only log if not user-cancelled
          logger.error('Native share failed', {
            sessionId,
            error: (err as Error).message,
            operation: 'share',
          })
        }
        fallbackCopy()
      }
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      toast.success('Link copied!', 'The share link has been copied to your clipboard.')
      logger.shareEvent(sessionId, 'copy')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Clipboard access denied or not available
      logger.error('Clipboard copy failed', {
        sessionId,
        error: (err as Error).message,
        operation: 'share',
      })
      toast.error(
        'Could not copy link',
        'Please copy the link manually from the address bar.'
      )
    }
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
