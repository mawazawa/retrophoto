"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function UpgradePrompt({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Free Restore Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've used your free restoration. Upgrade for unlimited restorations, high-res downloads, and watermark removal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">With Premium:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Unlimited restorations</li>
              <li>✓ High-resolution downloads</li>
              <li>✓ No watermarks</li>
              <li>✓ Batch processing</li>
              <li>✓ Priority queue (faster processing)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 min-touch-44" size="lg">
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="min-touch-44"
              size="lg"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
