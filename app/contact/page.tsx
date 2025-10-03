import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageSquare, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | RetroPhoto',
  description: 'Get in touch with RetroPhoto support team. We\'re here to help with your photo restoration questions.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have questions? We're here to help. Our support team typically responds within 1-2 business days.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 border rounded-lg bg-card">
            <Mail className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">General Support</h3>
            <a href="mailto:support@retrophoto.app" className="text-primary hover:underline">
              support@retrophoto.app
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              For general questions and technical support
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <MessageSquare className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Billing Help</h3>
            <a href="mailto:billing@retrophoto.app" className="text-primary hover:underline">
              billing@retrophoto.app
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              For subscription and payment questions
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <Clock className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Privacy Questions</h3>
            <a href="mailto:privacy@retrophoto.app" className="text-primary hover:underline">
              privacy@retrophoto.app
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              For data privacy and security inquiries
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">How long does photo restoration take?</h3>
                <p className="text-muted-foreground">
                  Most photos are restored in under 30 seconds. Premium users with priority processing
                  get even faster results. Processing time may vary based on image size and complexity.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">What file formats do you support?</h3>
                <p className="text-muted-foreground">
                  We support JPG, PNG, and WEBP formats. Maximum file size is 10MB for free users
                  and 25MB for premium subscribers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Is my data secure?</h3>
                <p className="text-muted-foreground">
                  Yes. All photos are encrypted in transit and at rest. Free tier photos are automatically
                  deleted after 24 hours. Premium users have unlimited storage with the option to delete
                  photos anytime. We never sell or share your data.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Can I cancel my subscription?</h3>
                <p className="text-muted-foreground">
                  Yes, you can cancel anytime from your account settings. Your access continues until
                  the end of your billing period. We also offer a 7-day money-back guarantee for first-time
                  subscribers. See our{' '}
                  <Link href="/refund-policy" className="text-primary hover:underline">
                    Refund Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Do you offer bulk processing?</h3>
                <p className="text-muted-foreground">
                  Yes! Premium subscribers can upload and process multiple photos at once with our
                  batch processing feature. This is perfect for restoring entire family photo albums.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover)
                  through our secure payment processor, Stripe. We do not store your payment information.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Business Inquiries</h2>
            <p className="text-muted-foreground mb-4">
              For partnership opportunities, media requests, or business development:
            </p>
            <a href="mailto:business@retrophoto.app" className="text-primary hover:underline text-lg">
              business@retrophoto.app
            </a>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Office Hours</h2>
            <p className="text-muted-foreground">
              Our support team is available Monday through Friday, 9:00 AM - 5:00 PM EST.
              <br />
              We typically respond to all inquiries within 1-2 business days.
            </p>
          </section>

          <section className="bg-muted/50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Before You Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              Please check our existing resources first:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> - How we protect your data</li>
              <li>• <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> - Service terms and conditions</li>
              <li>• <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> - Cancellation and refund information</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
