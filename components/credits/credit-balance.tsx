"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins } from 'lucide-react'

interface CreditBalanceProps {
  userId?: string
  className?: string
}

export function CreditBalance({ userId, className }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Query user_credits table
        const { data, error } = await supabase
          .from('user_credits')
          .select('credits_balance')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error('Error fetching credit balance:', error)
          setBalance(0)
        } else {
          setBalance(data?.credits_balance ?? 0)
        }
      } catch (error) {
        console.error('Error:', error)
        setBalance(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [userId])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Coins className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    )
  }

  if (balance === null) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`} data-testid="credit-balance">
      <Coins className="h-4 w-4" />
      <span className="font-medium">
        {balance} {balance === 1 ? 'credit' : 'credits'}
      </span>
      {balance < 0 && (
        <span className="text-xs text-destructive">(Refunded)</span>
      )}
    </div>
  )
}
