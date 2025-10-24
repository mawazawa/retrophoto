"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { generateFingerprint } from '@/lib/quota/client-tracker'

export function UpgradePrompt({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpgrade() {
    try {
      setIsLoading(true)

      // Generate fingerprint for guest checkout support
      const fingerprint = await generateFingerprint()

      // Create FormData to match API expectations
      const formData = new FormData()
      formData.append('fingerprint', fingerprint)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Free Restore Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've used your free restoration. Purchase 10 credits to continue restoring your precious memories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">10 Credits Pack - $9.99:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ 10 photo restorations</li>
              <li>✓ High-resolution downloads (4096px)</li>
              <li>✓ No watermarks</li>
              <li>✓ Batch processing</li>
              <li>✓ Priority processing</li>
              <li>✓ Credits valid for 1 year</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 min-touch-44"
              size="lg"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Buy 10 Credits - $9.99'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="min-touch-44"
              size="lg"
              disabled={isLoading}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
