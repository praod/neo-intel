'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Login timeout - resetting loading state')
      setLoading(false)
      setError('Request timed out. Please try again.')
    }, 10000) // 10 second timeout

    try {
      const supabase = createClient()
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      clearTimeout(timeoutId)

      // Check for error in response
      if (response.error) {
        console.error('Login error:', response.error)
        setError(response.error.message || 'Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      // Check if we got a session
      if (!response.data?.session) {
        console.error('No session returned from login', response)
        setError('Login failed. No session created. Please try again.')
        setLoading(false)
        return
      }

      // Wait for the auth state to be fully established in cookies
      // The onAuthStateChange listener confirms when cookies are set
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          // Now cookies should be set, safe to navigate
          window.location.href = '/dashboard'
        }
      })

      // Fallback: if auth state change doesn't fire within 2 seconds, navigate anyway
      setTimeout(() => {
        subscription.unsubscribe()
        window.location.href = '/dashboard'
      }, 2000)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center">
        <a href="/signup" className="text-sm text-indigo-600 hover:text-indigo-500">
          Don't have an account? Sign up
        </a>
      </div>
    </form>
  )
}

