"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SignInButton } from '@/components/auth/sign-in-button'
import { UserMenu } from '@/components/auth/user-menu'
import { Footer } from '@/components/footer'
import { BeforeAfterHero } from '@/components/before-after-hero'
import { Sparkles, Zap, Shield, Clock, Check, ArrowRight } from 'lucide-react'

function PremiumPricingCard() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpgrade() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border-2 border-primary rounded-2xl p-8 bg-background relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
        Most Popular
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Credit Pack</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">$9.99</span>
          <span className="text-muted-foreground">for 10 credits</span>
        </div>
        <p className="text-sm text-muted-foreground">
          1 credit = 1 photo restoration
        </p>
      </div>

      <ul className="space-y-3 mt-8 mb-8">
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">10 photo restorations</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">High resolution (4096px)</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">No watermarks</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">30-day storage</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">Priority processing</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">Batch processing</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">Credits never expire</span>
        </li>
      </ul>

      <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Buy 10 Credits'}
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Secure payment • Instant access
      </p>
    </div>
  )
}

export default function LandingPage() {
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    import('@/lib/auth/client').then(({ getUser }) => {
      getUser().then((user) => {
        setShowUserMenu(!!user)
      })
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="RetroPhoto Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-xl">RetroPhoto</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {showUserMenu ? (
              <>
                <Link href="/app">
                  <Button variant="outline" size="sm">
                    Go to App
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <SignInButton />
                <Link href="/app">
                  <Button size="sm">
                    Try Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Before/After Slider */}
        <section className="relative py-12 md:py-20 px-4 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
                  ✨ Powered by Advanced AI Technology
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  Restore Old Photos
                  <br />
                  <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    in Seconds
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  Transform damaged, faded, and old photos into stunning HD quality.
                  Preserve your family memories with cutting-edge AI restoration technology.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
                  <Link href="/app">
                    <Button size="lg" className="min-w-[200px] h-14 text-lg">
                      Start Free Restoration
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="min-w-[200px] h-14 text-lg" asChild>
                    <Link href="#pricing">View Pricing</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    1 free photo
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    No credit card
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Instant results
                  </div>
                </div>
              </div>

              {/* Right side - Before/After Slider */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50"></div>
                <BeforeAfterHero />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Professional Results in Seconds
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered restoration technology brings your old photos back to life
                with incredible detail and accuracy.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Get restored photos in under 30 seconds. No waiting, no hassle.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">HD Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Up to 4096px resolution output for crystal clear results.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your photos are encrypted and automatically deleted after 24 hours.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Easy to Use</h3>
                <p className="text-sm text-muted-foreground">
                  Just upload your photo. No technical skills required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to restore your precious memories
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-xl">Upload Your Photo</h3>
                <p className="text-muted-foreground">
                  Drag and drop or click to upload your old, damaged, or faded photo.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-xl">AI Processing</h3>
                <p className="text-muted-foreground">
                  Our advanced AI analyzes and restores your photo in seconds.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-xl">Download & Share</h3>
                <p className="text-muted-foreground">
                  Compare, download, and share your beautifully restored photo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start with 1 free photo, then buy credits as you need them
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <div className="border rounded-2xl p-8 bg-background">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Free</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Perfect for trying out the service
                  </p>
                </div>

                <ul className="space-y-3 mt-8 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1 free photo restoration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Medium resolution (2048px)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Results in under 30 seconds</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Small watermark</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">24-hour storage</span>
                  </li>
                </ul>

                <Link href="/app" className="block">
                  <Button variant="outline" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Premium Tier */}
              <PremiumPricingCard />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              All plans include secure, encrypted storage and automatic deletion.
              See our <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> for details.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Restore Your Memories?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of satisfied customers who have preserved their precious photos
            </p>
            <Link href="/app">
              <Button size="lg" className="min-w-[250px]">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              No credit card required • 1 free restoration
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
