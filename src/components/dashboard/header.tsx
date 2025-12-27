'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  profile: any
}

export default function Header({ user, profile }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="text-sm text-gray-700">
            {profile?.full_name || user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-700 hover:text-indigo-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

