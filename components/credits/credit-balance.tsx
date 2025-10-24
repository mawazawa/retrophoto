"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins } from 'lucide-react'

interface CreditBalanceProps {
  className?: string
}

export function CreditBalance({ className }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Query user_credits table (use 'available_credits' per schema)
        const { data, error } = await supabase
          .from('user_credits')
          .select('available_credits')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching credit balance:', error)
          // User might not have credits row yet (first purchase creates it)
          setBalance(0)
        } else {
          setBalance(data?.available_credits ?? 0)
        }
      } catch (error) {
        console.error('Error:', error)
        setBalance(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [])

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
