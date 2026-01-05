"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Receipt, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Transaction {
  id: string
  amount: number
  currency: string
  credits_purchased: number
  status: string
  created_at: string | null
  stripe_session_id: string
}

interface PurchaseHistoryProps {
  userId?: string
  className?: string
}

export function PurchaseHistory({ userId, className }: PurchaseHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('id, amount, currency, credits_purchased, status, created_at, stripe_session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      setTransactions(data || [])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history'
      setError(errorMessage)
      toast.error('Could not load history', 'Failed to fetch purchase history. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (!userId) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 border border-destructive/50 rounded-lg ${className}`}>
        <p className="text-sm text-destructive">Error: {error}</p>
        <Button onClick={fetchHistory} size="sm" variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={`text-center p-8 border border-dashed rounded-lg ${className}`}>
        <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No purchase history yet</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Purchase History</h3>
        <Button onClick={fetchHistory} size="sm" variant="ghost">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {tx.credits_purchased} credits
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : tx.status === 'refunded'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : 'Unknown date'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                ${(tx.amount / 100).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground uppercase">
                {tx.currency}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
