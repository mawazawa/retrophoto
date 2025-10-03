import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | RetroPhoto',
  description: 'RetroPhoto Terms of Service - Legal agreement for using our service',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using RetroPhoto ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              RetroPhoto provides an AI-powered photo restoration service that transforms old, damaged photos into high-quality restored images. We offer both free and premium tiers with different features and limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Registration</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current information</li>
              <li>Maintain the security of your password</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Eligibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 13 years old to use this Service. Users under 18 must have parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Service Tiers</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Free Tier</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>1 free photo restoration per user</li>
              <li>Medium resolution output (2048px)</li>
              <li>Watermarked results</li>
              <li>24-hour data retention</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Premium Tier</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Unlimited restorations</li>
              <li>High resolution output (4096px)</li>
              <li>No watermarks</li>
              <li>Unlimited storage</li>
              <li>Priority processing queue</li>
              <li>Batch processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Pricing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Premium subscription is billed monthly. Prices are displayed during checkout and may change with 30 days notice.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Billing</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Payments are processed securely through Stripe</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>You authorize us to charge your payment method</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
            <p className="text-muted-foreground mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Upload illegal, offensive, or copyrighted content without permission</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer or copy our AI models</li>
              <li>Automate or scrape our Service without permission</li>
              <li>Upload malicious files or viruses</li>
              <li>Violate others' privacy or intellectual property rights</li>
              <li>Resell or redistribute our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Content Ownership</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain all rights to photos you upload. By uploading, you grant us a limited license to process, store, and display your photos solely to provide the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Restored Photos</h3>
            <p className="text-muted-foreground leading-relaxed">
              Restored photos are generated by our AI and are provided to you for personal use. You own the restored output but acknowledge that similar results may be generated for other users with similar input.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Our Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              All Service features, design, software, and branding are owned by RetroPhoto and protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Quality and Limitations</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.1 No Guarantees</h3>
            <p className="text-muted-foreground leading-relaxed">
              While we strive for high-quality results, AI restoration quality varies based on the input photo. We do not guarantee specific results or perfection.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.2 Service Availability</h3>
            <p className="text-muted-foreground leading-relaxed">
              We aim for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance when possible.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Processing Times</h3>
            <p className="text-muted-foreground leading-relaxed">
              Target processing time is under 30 seconds, but may vary based on system load and photo complexity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RETROPHOTO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold RetroPhoto harmless from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may terminate or suspend your account immediately for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Extended period of inactivity</li>
              <li>At our discretion with reasonable notice</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Upon termination, your right to use the Service ceases immediately. Stored photos may be deleted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be notified via email or Service notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.1 Informal Resolution</h3>
            <p className="text-muted-foreground leading-relaxed">
              Before filing a claim, you agree to try to resolve the dispute informally by contacting us at support@retrophoto.app
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.2 Arbitration</h3>
            <p className="text-muted-foreground leading-relaxed">
              If informal resolution fails, disputes will be resolved through binding arbitration rather than court, except for small claims court matters.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">Email: support@retrophoto.app</p>
              <p className="text-muted-foreground mt-2">Legal: legal@retrophoto.app</p>
              <p className="text-muted-foreground mt-2">
                Address: [Your Business Address]
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
