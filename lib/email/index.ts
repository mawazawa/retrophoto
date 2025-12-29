/**
 * Email Service
 *
 * Simple email service for payment notifications.
 * Uses Resend as the provider (requires RESEND_API_KEY).
 *
 * Features:
 * - Payment success receipts
 * - Payment failure notifications
 * - Credit addition confirmations
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Escape HTML special characters to prevent XSS
 * SECURITY: Always use this when interpolating user/external data into HTML
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Check if email service is configured
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'RetroPhoto <noreply@retrophotoai.com>'
const IS_CONFIGURED = !!RESEND_API_KEY

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  if (!IS_CONFIGURED) {
    console.log('[EMAIL] Service not configured, skipping:', options.subject)
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[EMAIL] Failed to send:', error)
      return { success: false, error }
    }

    const data = await response.json()
    console.log('[EMAIL] Sent successfully:', data.id)
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('[EMAIL] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send payment success receipt
 */
export async function sendPaymentSuccessEmail(
  email: string,
  amount: number,
  credits: number,
  transactionId: string
): Promise<SendResult> {
  const formattedAmount = (amount / 100).toFixed(2)

  return sendEmail({
    to: email,
    subject: 'Your RetroPhoto credits are ready!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 32px; }
            .content { background: #f9fafb; border-radius: 8px; padding: 24px; margin: 20px 0; }
            .details { background: white; border-radius: 6px; padding: 16px; margin-top: 16px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .cta { text-align: center; margin: 24px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📷</div>
              <h1>Thank you for your purchase!</h1>
            </div>
            <div class="content">
              <p>Your payment was successful and your credits have been added to your account.</p>
              <div class="details">
                <div class="detail-row">
                  <span>Credits Added</span>
                  <strong>${credits} credits</strong>
                </div>
                <div class="detail-row">
                  <span>Amount Paid</span>
                  <strong>$${formattedAmount}</strong>
                </div>
                <div class="detail-row">
                  <span>Transaction ID</span>
                  <span style="font-family: monospace; font-size: 12px;">${transactionId}</span>
                </div>
              </div>
            </div>
            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com'}/app" class="button">
                Start Restoring Photos
              </a>
            </div>
            <div class="footer">
              <p>Need help? Reply to this email or visit our support page.</p>
              <p>&copy; ${new Date().getFullYear()} RetroPhoto. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Thank you for your purchase!

Your payment of $${formattedAmount} was successful.
${credits} credits have been added to your account.

Transaction ID: ${transactionId}

Start restoring photos: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com'}/app

- The RetroPhoto Team`,
  })
}

/**
 * Send payment failure notification
 */
export async function sendPaymentFailureEmail(
  email: string,
  reason?: string
): Promise<SendResult> {
  return sendEmail({
    to: email,
    subject: 'Payment issue with your RetroPhoto order',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 32px; }
            .content { background: #fef2f2; border-radius: 8px; padding: 24px; margin: 20px 0; }
            .cta { text-align: center; margin: 24px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📷</div>
              <h1>Payment Issue</h1>
            </div>
            <div class="content">
              <p>We encountered an issue processing your payment.</p>
              ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
              <p>Don't worry - no charges were made to your account. Please try again or use a different payment method.</p>
            </div>
            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com'}/app" class="button">
                Try Again
              </a>
            </div>
            <div class="footer">
              <p>Need help? Reply to this email and we'll assist you.</p>
              <p>&copy; ${new Date().getFullYear()} RetroPhoto. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Payment Issue

We encountered an issue processing your payment.
${reason ? `Reason: ${reason}` : ''}

No charges were made to your account. Please try again or use a different payment method.

Try again: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com'}/app

- The RetroPhoto Team`,
  })
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return IS_CONFIGURED
}
