'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationPrefsProps {
  profile: any
}

export default function NotificationPrefs({ profile }: NotificationPrefsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailOptedIn, setEmailOptedIn] = useState(profile?.email_opted_in ?? true)
  const [whatsappOptedIn, setWhatsappOptedIn] = useState(profile?.whatsapp_opted_in ?? false)
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_opted_in: emailOptedIn,
          whatsapp_opted_in: whatsappOptedIn,
          whatsapp_number: whatsappOptedIn ? whatsappNumber : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notification preferences')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="emailOptedIn" className="block text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <p className="text-sm text-gray-500">Receive weekly reports via email</p>
          </div>
          <input
            id="emailOptedIn"
            type="checkbox"
            checked={emailOptedIn}
            onChange={(e) => setEmailOptedIn(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="whatsappOptedIn" className="block text-sm font-medium text-gray-700">
              WhatsApp Notifications
            </label>
            <p className="text-sm text-gray-500">Receive weekly reports via WhatsApp</p>
          </div>
          <input
            id="whatsappOptedIn"
            type="checkbox"
            checked={whatsappOptedIn}
            onChange={(e) => setWhatsappOptedIn(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>

        {whatsappOptedIn && (
          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number
            </label>
            <input
              id="whatsappNumber"
              type="tel"
              required={whatsappOptedIn}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+91XXXXXXXXXX"
            />
            <p className="mt-1 text-sm text-gray-500">
              Include country code (e.g., +91 for India)
            </p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  )
}

