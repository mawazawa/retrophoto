import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { RegisterServiceWorker } from './register-sw'
import { WebVitalsReporter } from '@/components/web-vitals'
import { SkipLink } from '@/components/skip-link'
import { Toaster } from '@/components/ui/toaster'

// System font stack - no network dependency, works everywhere
// Note: For production, Inter can be served via CDN in globals.css

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: 'RetroPhoto - Restore Old Photos in Seconds',
  description: 'Preserve memories by turning old photos into realistic HD in seconds.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RetroPhoto',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <SkipLink />
        <RegisterServiceWorker />
        <WebVitalsReporter />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
