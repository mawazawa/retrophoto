"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut, getUser } from '@/lib/auth/client'
import { User as UserIcon, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  if (loading) return null

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{user.email}</span>
      </div>
      <Button onClick={handleSignOut} variant="ghost" size="sm">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  )
}
