import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResultClient } from './result-client'
import { isValidUUID } from '@/lib/validation/uuid'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophotoai.com'

interface ResultPageProps {
  params: { id: string }
}

/**
 * Generate dynamic metadata for result pages
 * Enables rich social sharing with OG cards
 */
export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = params

  // Validate session ID format before querying database
  if (!isValidUUID(id)) {
    return {
      title: 'Result Not Found | RetroPhoto',
      description: 'The requested result could not be found.',
    }
  }

  const supabase = await createClient()

  // Use maybeSingle to gracefully handle missing rows instead of throwing
  const { data: result, error } = await supabase
    .from('restoration_results')
    .select('og_card_url, deep_link')
    .eq('session_id', id)
    .maybeSingle()

  // If there's an error or no result, return basic metadata
  if (error || !result) {
    return {
      title: 'Result Not Found | RetroPhoto',
      description: 'The requested result could not be found.',
    }
  }

  const title = 'Your Restored Photo | RetroPhoto'
  const description = 'See the amazing before and after transformation. Restore your old photos with AI-powered restoration.'
  const ogImageUrl = result?.og_card_url || `${baseUrl}/api/og-card/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: result?.deep_link || `${baseUrl}/result/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Before and after photo restoration comparison',
        },
      ],
      siteName: 'RetroPhoto',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: result?.deep_link || `${baseUrl}/result/${id}`,
    },
  }
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = params

  // Validate session ID format before querying database
  if (!isValidUUID(id)) {
    notFound()
  }

  const supabase = await createClient()

  // Use maybeSingle to gracefully handle missing rows
  const { data: session, error: sessionError } = await supabase
    .from('upload_sessions')
    .select('original_url')
    .eq('id', id)
    .maybeSingle()

  const { data: result, error: resultError } = await supabase
    .from('restoration_results')
    .select('restored_url, deep_link, og_card_url')
    .eq('session_id', id)
    .maybeSingle()

  // Handle errors and missing data gracefully
  if (sessionError || resultError || !session || !result) {
    notFound()
  }

  return (
    <ResultClient
      originalUrl={session.original_url}
      restoredUrl={result.restored_url}
      deepLink={result.deep_link}
      ogCardUrl={result.og_card_url}
      sessionId={id}
    />
  )
}
