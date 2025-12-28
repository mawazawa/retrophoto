import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResultClient } from './result-client'

export default async function ResultPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('id', id)
    .single()

  const { data: result } = await supabase
    .from('restoration_results')
    .select('*')
    .eq('session_id', id)
    .single()

  if (!session || !result) {
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
