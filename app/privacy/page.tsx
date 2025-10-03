import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | RetroPhoto',
  description: 'RetroPhoto Privacy Policy - How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              RetroPhoto, operated by Empathy Labs LLC ("we," "our," or "us"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our photo restoration service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Email address, password (encrypted)</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store card details)</li>
              <li><strong>Photos:</strong> Images you upload for restoration</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Usage Data:</strong> How you interact with our service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> For authentication and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and maintain our photo restoration service</li>
              <li>Process your payments and manage your subscription</li>
              <li>Send you service-related notifications</li>
              <li>Improve our service through analytics</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Free Tier:</strong> Original photos are automatically deleted after 24 hours. Restored photos are kept for 7 days.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Premium Tier:</strong> Photos are stored indefinitely until you delete them or cancel your subscription.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Account data is retained until you request account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">We share your data only in these situations:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> Stripe (payments), Supabase (database), Replicate (AI processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>We never sell your personal data to third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>SSL/TLS encryption for data in transit</li>
              <li>Encryption at rest for stored data</li>
              <li>Secure authentication with Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Download your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at privacy@retrophoto.app
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for children under 13. We do not knowingly collect data from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through our service. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>Empathy Labs LLC</strong></p>
              <p className="text-muted-foreground mt-2">Email: mathieuwauters@gmail.com</p>
              <p className="text-muted-foreground mt-2">Phone: +1 (347) 574-3963</p>
              <p className="text-muted-foreground mt-2">
                Address: 3525 8th Ave, Los Angeles, CA 90018
              </p>
              <p className="text-muted-foreground mt-2">EIN: 92-2643132</p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">GDPR Compliance (EU Users)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under GDPR:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Right to object to processing</li>
              <li>Right to restrict processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Our legal basis for processing: Your consent and contractual necessity.
            </p>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">CCPA Rights (California Users)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              California residents have specific rights under CCPA:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information (we don't sell your data)</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
