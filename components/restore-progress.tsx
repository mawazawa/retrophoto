"use client"

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

export function RestoreProgress({
  isComplete = false,
  onComplete
}: {
  isComplete?: boolean
  onComplete?: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Analyzing your photo...")

  useEffect(() => {
    if (isComplete) {
      setProgress(100)
      setMessage("Restoration complete!")

      // Haptic feedback (T057a)
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50])
      }

      onComplete?.()
      return
    }

    const messages = [
      "Analyzing your photo...",
      "Detecting faces and details...",
      "Restoring clarity...",
      "Enhancing colors...",
      "Finalizing your restoration..."
    ]

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev

        const increment = Math.random() * 15 + 5
        const newProgress = Math.min(prev + increment, 95)

        // Update message based on progress
        const messageIndex = Math.floor((newProgress / 100) * messages.length)
        setMessage(messages[Math.min(messageIndex, messages.length - 1)])

        return newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isComplete, onComplete])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4" role="status" aria-live="polite">
      <Progress value={progress} shimmer={!isComplete} className="h-3" />
      <p className="text-center text-lg font-medium">
        {message}
      </p>
      {progress > 60 && !isComplete && (
        <p className="text-center text-sm text-muted-foreground">
          Processing complex details...
        </p>
      )}
    </div>
  )
}
