'use client'

import { useState } from 'react'

interface BrandStepProps {
  data: { brandName: string; instagramHandle: string }
  onNext: (data: { brandName: string; instagramHandle: string }) => void
  onBack: () => void
}

export default function BrandStep({ data, onNext, onBack }: BrandStepProps) {
  const [brandName, setBrandName] = useState(data.brandName || '')
  const [instagramHandle, setInstagramHandle] = useState(data.instagramHandle || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (brandName.trim()) {
      onNext({ brandName: brandName.trim(), instagramHandle: instagramHandle.trim() })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Brand</h2>
        <p className="text-gray-600 mb-6">
          Tell us about your brand so we can start tracking it.
        </p>
      </div>

      <div>
        <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
          Brand Name *
        </label>
        <input
          id="brandName"
          type="text"
          required
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., My Awesome Brand"
        />
      </div>

      <div>
        <label htmlFor="instagramHandle" className="block text-sm font-medium text-gray-700 mb-2">
          Instagram Handle
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            @
          </span>
          <input
            id="instagramHandle"
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="yourbrand"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          We'll track posts and engagement from this account
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Next
        </button>
      </div>
    </form>
  )
}

