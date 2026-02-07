"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CreditBalanceProps {
  className?: string
  showErrorToast?: boolean
}

export function CreditBalance({ className, showErrorToast = false }: CreditBalanceProps) {
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

        // Query user_credits table
        const { data, error } = await supabase
          .from('user_credits')
          .select('available_credits')
          .eq('user_id', user.id)
          .single()

        if (error) {
          // User might not have credits row yet (first purchase creates it)
          // Don't show error for PGRST116 (row not found)
          if (error.code !== 'PGRST116' && showErrorToast) {
            toast.error('Could not load balance', 'Failed to fetch credit balance. Please refresh.')
          }
          setBalance(0)
        } else {
          setBalance(data?.available_credits ?? 0)
        }
      } catch (error) {
        if (showErrorToast) {
          toast.error('Could not load balance', 'An unexpected error occurred.')
        }
        setBalance(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [showErrorToast])

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
