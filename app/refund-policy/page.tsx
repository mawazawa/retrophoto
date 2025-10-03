import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | RetroPhoto',
  description: 'RetroPhoto Refund Policy - Subscription cancellation and refund terms',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              At RetroPhoto, we want you to be completely satisfied with our service. This Refund Policy explains our approach to refunds and cancellations for our premium subscription service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Subscription Cancellation</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 How to Cancel</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You can cancel your premium subscription at any time through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your account settings page</li>
              <li>Emailing support@retrophoto.app</li>
              <li>Through the Stripe customer portal link sent in your confirmation email</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 When Cancellation Takes Effect</h3>
            <p className="text-muted-foreground leading-relaxed">
              Cancellations take effect at the end of your current billing period. You will continue to have access to premium features until that date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Refund Eligibility</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 7-Day Money-Back Guarantee</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We offer a <strong>7-day money-back guarantee</strong> for first-time premium subscribers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Request a refund within 7 days of your initial subscription</li>
              <li>Receive a full refund, no questions asked</li>
              <li>One-time offer for new subscribers only</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Service Issues</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may be eligible for a refund if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>The service was unavailable for more than 24 consecutive hours due to our technical issues</li>
              <li>You were charged incorrectly or multiple times for the same period</li>
              <li>You experienced a significant service defect that we couldn't resolve within 48 hours</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Non-Refundable Situations</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Refunds are <strong>NOT</strong> available in these cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>After the 7-day guarantee period has passed (unless service issues apply)</li>
              <li>If you've violated our Terms of Service</li>
              <li>If your account has been terminated for abuse or fraud</li>
              <li>For partial months after cancellation</li>
              <li>If you simply changed your mind after the guarantee period</li>
              <li>If you didn't use the service during your billing period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How to Request a Refund</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Refund Process</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Email support@retrophoto.app with your request</li>
              <li>Include your account email and subscription details</li>
              <li>Explain the reason for your refund request</li>
              <li>We'll respond within 1-2 business days</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Processing Time</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Approved refunds are processed within 5-7 business days</li>
              <li>Refunds go back to your original payment method</li>
              <li>Bank processing may take an additional 5-10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Billing Disputes</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Incorrect Charges</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you believe you've been charged incorrectly, contact us immediately at billing@retrophoto.app. We'll investigate and resolve the issue within 48 hours.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Chargeback Policy</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Before initiating a chargeback with your bank:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Please contact us first - we're happy to help resolve billing issues</li>
              <li>Chargebacks may result in immediate account suspension</li>
              <li>Disputed chargebacks may incur a $25 processing fee</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Pro-Rated Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not offer pro-rated refunds for partial months. When you cancel:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Your subscription continues until the end of the current billing period</li>
              <li>No refund is provided for unused days in that period</li>
              <li>You maintain full access until the subscription ends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Free Tier</h2>
            <p className="text-muted-foreground leading-relaxed">
              The free tier is provided at no cost and is not eligible for refunds. No payment information is required for the free tier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Account Reactivation</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you cancel and later decide to return:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>You can reactivate your subscription at any time</li>
              <li>Previous billing rates may not apply if pricing has changed</li>
              <li>The 7-day money-back guarantee is only available once per customer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Data After Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you cancel your premium subscription:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your photos remain accessible until the end of your billing period</li>
              <li>After cancellation, photos are retained for 30 days then permanently deleted</li>
              <li>Download any photos you want to keep before canceling</li>
              <li>Account reactivation within 30 days restores your photos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Refund Policy from time to time. Material changes will be communicated via email. The updated policy applies to subscriptions renewed after the change date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Exceptions and Discretion</h2>
            <p className="text-muted-foreground leading-relaxed">
              While this policy outlines our standard approach, we reserve the right to make exceptions on a case-by-case basis. Each situation is unique, and we're committed to fair treatment of our customers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Questions about refunds or billing? We're here to help:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground"><strong>General Support:</strong> support@retrophoto.app</p>
              <p className="text-muted-foreground mt-2"><strong>Billing Questions:</strong> billing@retrophoto.app</p>
              <p className="text-muted-foreground mt-2"><strong>Refund Requests:</strong> support@retrophoto.app</p>
              <p className="text-muted-foreground mt-4">
                <strong>Response Time:</strong> Within 1-2 business days
              </p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8 bg-muted/50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ <strong>7-day money-back guarantee</strong> for new subscribers</li>
              <li>✅ Full refund for significant service issues</li>
              <li>✅ Cancel anytime, access continues until period ends</li>
              <li>❌ No pro-rated refunds for partial months</li>
              <li>❌ No refunds after 7-day guarantee period (except service issues)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
