import { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Heart, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | RetroPhoto',
  description: 'Learn about RetroPhoto\'s mission to preserve precious memories through AI-powered photo restoration.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">About RetroPhoto</h1>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <p className="text-lg text-muted-foreground leading-relaxed">
              RetroPhoto was born from a simple belief: every family photo tells a story worth preserving.
              We combine cutting-edge AI technology with a deep respect for the memories captured in old,
              damaged, and faded photographs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We're on a mission to make professional-grade photo restoration accessible to everyone.
              Whether it's a faded wedding photo from your grandparents, a damaged childhood memory,
              or a cherished family portrait, we believe every photo deserves a second chance at clarity
              and vibrance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Using advanced artificial intelligence and machine learning algorithms, RetroPhoto automatically
              repairs and enhances old photographs in seconds. Our technology can:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Remove scratches, tears, and physical damage</li>
              <li>• Restore faded colors to their original vibrancy</li>
              <li>• Enhance image clarity and sharpness</li>
              <li>• Upscale resolution to modern HD standards (up to 4096px)</li>
              <li>• Preserve the authentic character of the original photo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border rounded-lg bg-card">
                <Heart className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Respect for Memories</h3>
                <p className="text-sm text-muted-foreground">
                  We treat every photo with the care and respect it deserves. Your memories are precious,
                  and we handle them with the utmost sensitivity.
                </p>
              </div>

              <div className="p-6 border rounded-lg bg-card">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Your photos are yours alone. We use encryption, automatic deletion, and strict privacy
                  policies to ensure your memories stay private.
                </p>
              </div>

              <div className="p-6 border rounded-lg bg-card">
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  Professional photo restoration shouldn't cost hundreds of dollars or take weeks.
                  We make it instant, affordable, and easy for everyone.
                </p>
              </div>

              <div className="p-6 border rounded-lg bg-card">
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Quality Results</h3>
                <p className="text-sm text-muted-foreground">
                  We're committed to delivering the highest quality restorations possible, combining
                  AI precision with attention to photographic detail.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How It Started</h2>
            <p className="text-muted-foreground leading-relaxed">
              RetroPhoto was created after seeing family members struggle to preserve aging photographs.
              Traditional photo restoration services were expensive and time-consuming, often costing
              hundreds of dollars per photo and taking weeks to complete. We knew there had to be a better way.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By leveraging the latest advances in artificial intelligence and image processing, we built
              a platform that delivers professional-quality results in seconds, not weeks. What once required
              hours of manual work by skilled artists can now be accomplished instantly, making photo
              restoration accessible to everyone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Technology</h2>
            <p className="text-muted-foreground leading-relaxed">
              RetroPhoto uses state-of-the-art machine learning models trained on millions of photographs.
              Our AI understands the patterns of photo degradation, damage, and aging, allowing it to
              intelligently restore images while preserving their authentic character.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Unlike simple filters or basic enhancement tools, our technology analyzes the entire image,
              understanding context, faces, textures, and colors to deliver restoration that looks natural
              and authentic—not artificial or over-processed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Privacy & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take your privacy seriously. All photos are encrypted during upload and processing.
              Free tier photos are automatically deleted after 24 hours. Premium users have full control
              over their storage and can delete photos at any time.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We never use your photos for training our AI models without explicit permission. We never
              sell, share, or distribute your images. Your memories belong to you, and only you.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              For more details, see our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to You</h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <ul className="space-y-3 text-muted-foreground">
                <li>✓ <strong>Fast Processing</strong> - Results in under 30 seconds</li>
                <li>✓ <strong>High Quality</strong> - Professional-grade restoration technology</li>
                <li>✓ <strong>Secure & Private</strong> - Your photos are encrypted and protected</li>
                <li>✓ <strong>Fair Pricing</strong> - Affordable plans with a free tier to get started</li>
                <li>✓ <strong>No Hassle Cancellation</strong> - Cancel your subscription anytime</li>
                <li>✓ <strong>Money-Back Guarantee</strong> - 7-day guarantee for new premium subscribers</li>
                <li>✓ <strong>Responsive Support</strong> - Our team is here to help when you need us</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Join Thousands of Happy Customers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Since launching, we've helped thousands of people restore precious family photos, bringing
              old memories back to life in stunning clarity. Whether you're preserving a single cherished
              photo or digitizing an entire family album, RetroPhoto is here to help.
            </p>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-4">
              Have questions or feedback? We'd love to hear from you.
            </p>
            <div className="space-y-2">
              <p>
                <strong>General Support:</strong>{' '}
                <a href="mailto:support@retrophoto.app" className="text-primary hover:underline">
                  support@retrophoto.app
                </a>
              </p>
              <p>
                <strong>Privacy Questions:</strong>{' '}
                <a href="mailto:privacy@retrophoto.app" className="text-primary hover:underline">
                  privacy@retrophoto.app
                </a>
              </p>
              <p>
                <strong>Business Inquiries:</strong>{' '}
                <a href="mailto:business@retrophoto.app" className="text-primary hover:underline">
                  business@retrophoto.app
                </a>
              </p>
            </div>
            <p className="text-muted-foreground mt-6">
              Visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact page
              </Link>{' '}
              for more ways to reach us.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
