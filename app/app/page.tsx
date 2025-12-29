"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/upload-zone'
import { RestoreProgress } from '@/components/restore-progress'
import { CreditBalance } from '@/components/credits/credit-balance'
import { PurchaseCreditsButton } from '@/components/credits/purchase-credits-button'
import { UserMenu } from '@/components/auth/user-menu'
import { SignInButton } from '@/components/auth/sign-in-button'
import { generateFingerprint } from '@/lib/quota/client-tracker'
import { CheckCircle, X, AlertCircle, Sparkles } from 'lucide-react'

export default function AppPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Payment success/cancel handling
  const paymentSuccess = searchParams?.get('success') === 'true'
  const paymentCanceled = searchParams?.get('canceled') === 'true'
  const [showPaymentMessage, setShowPaymentMessage] = useState(paymentSuccess || paymentCanceled)

  // Check if user is logged in (separate effect with proper cleanup)
  useEffect(() => {
    let isMounted = true

    import('@/lib/auth/client').then(({ getUser }) => {
      getUser().then((user) => {
        // Only update state if component is still mounted
        if (isMounted) {
          setShowUserMenu(!!user)
        }
      })
    }).catch(() => {
      // Silently fail - auth check is non-critical
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Auto-hide payment messages after 5 seconds
  useEffect(() => {
    if (showPaymentMessage) {
      const timer = setTimeout(() => {
        setShowPaymentMessage(false)
        // Clean up URL
        router.replace('/app')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showPaymentMessage, router])

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Generate fingerprint for guest users
      const fingerprint = await generateFingerprint()

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fingerprint', fingerprint)

      // Simulate progress (actual upload is fast)
      setUploadProgress(30)

      // Upload and process
      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(60)

      if (!response.ok) {
        const error = await response.json()

        // Handle quota exceeded - show upgrade prompt
        if (error.error_code === 'QUOTA_EXCEEDED') {
          // Redirect to pricing
          router.push('/#pricing')
          return
        }

        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)

      // Redirect to result page
      router.push(`/result/${data.session_id}`)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-bold text-xl">RetroPhoto</span>
          </Link>

          <div className="flex items-center gap-4">
            {showUserMenu ? (
              <>
                <CreditBalance />
                <PurchaseCreditsButton size="sm" />
                <UserMenu />
              </>
            ) : (
              <>
                <SignInButton />
                <Link href="/#pricing">
                  <Button variant="outline" size="sm">
                    Pricing
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Payment Success/Cancel Messages */}
      {showPaymentMessage && (
        <div className="max-w-4xl mx-auto px-4 pt-4 w-full">
          {paymentSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Payment Successful!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  10 credits have been added to your account. Start restoring your photos now!
                </p>
              </div>
              <button
                onClick={() => setShowPaymentMessage(false)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {paymentCanceled && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Payment Canceled
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your payment was canceled. No charges were made to your account.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentMessage(false)}
                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered Photo Restoration
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Restore Your Old Photos
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload your photo and watch it transform in seconds
            </p>
          </div>

          {/* Upload or Progress */}
          {isUploading ? (
            <RestoreProgress />
          ) : (
            <>
              <UploadZone onUpload={handleUpload} />

              {/* Error Display */}
              {error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-destructive">Upload Failed</h3>
                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Info Cards */}
              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">~30s</div>
                  <div className="text-sm text-muted-foreground">Processing Time</div>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">4096px</div>
                  <div className="text-sm text-muted-foreground">Max Resolution</div>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">20MB</div>
                  <div className="text-sm text-muted-foreground">Max File Size</div>
                </div>
              </div>

              {/* Supported Formats */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPG, PNG, HEIC, WebP
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">
            Refund Policy
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  )
}
