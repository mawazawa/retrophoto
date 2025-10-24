"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { generateFingerprint } from '@/lib/quota/client-tracker'

interface PurchaseCreditsButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function PurchaseCreditsButton({
  variant = 'default',
  size = 'default',
  className
}: PurchaseCreditsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async () => {
    setIsLoading(true)

    try {
      // Generate fingerprint for guest checkout support
      const fingerprint = await generateFingerprint()

      // Create FormData to match API expectations
      const formData = new FormData()
      formData.append('fingerprint', fingerprint)

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: formData, // Send as FormData, not JSON
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Purchase error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          Buy 10 Credits - $9.99
        </>
      )}
    </Button>
  )
}
