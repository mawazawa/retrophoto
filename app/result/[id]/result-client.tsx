"use client"

import { useState, useEffect } from 'react'
import { ComparisonSlider } from '@/components/comparison-slider'
import { ZoomViewer } from '@/components/zoom-viewer'
import { ShareSheet } from '@/components/share-sheet'
import { WatermarkBadge } from '@/components/watermark-badge'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { Button } from '@/components/ui/button'
import { setupNSMTracking } from '@/lib/metrics/client-analytics'
import confetti from 'canvas-confetti'

export function ResultClient({
  originalUrl,
  restoredUrl,
  deepLink,
  ogCardUrl,
  sessionId
}: {
  originalUrl: string
  restoredUrl: string
  deepLink: string
  ogCardUrl: string
  sessionId: string
}) {
  const [showZoom, setShowZoom] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    // Confetti animation (T066a)
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#ec4899', '#f59e0b']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#f59e0b']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()

    // Mark NSM complete
    const nsmTracker = setupNSMTracking()
    if (nsmTracker) {
      nsmTracker.markPreviewVisible()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative">
        <ComparisonSlider
          originalUrl={originalUrl}
          restoredUrl={restoredUrl}
          onZoom={() => setShowZoom(true)}
        />
        <WatermarkBadge />
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-4 justify-center">
          <ShareSheet
            deepLink={deepLink}
            ogCardUrl={ogCardUrl}
            sessionId={sessionId}
          />
          <Button
            variant="secondary"
            size="lg"
            className="min-touch-44"
            onClick={() => setShowUpgrade(true)}
          >
            Get High-Res
          </Button>
        </div>
      </div>

      {showZoom && (
        <ZoomViewer
          imageUrl={restoredUrl}
          onClose={() => setShowZoom(false)}
        />
      )}

      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  )
}
