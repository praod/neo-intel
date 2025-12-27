'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BrandFormProps {
  brand: any
  planLimits: any
}

export default function BrandForm({ brand, planLimits }: BrandFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [brandName, setBrandName] = useState(brand?.name || '')
  const [instagramHandle, setInstagramHandle] = useState(brand?.instagram_handle || '')
  const [amazonUrls, setAmazonUrls] = useState<string[]>(
    brand?.amazon_product_urls || []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/brand', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandName,
          instagram_handle: instagramHandle,
          amazon_product_urls: amazonUrls.filter((url) => url.trim()),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update brand')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating brand:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAmazonUrl = () => {
    if (amazonUrls.length < planLimits?.max_amazon_urls) {
      setAmazonUrls([...amazonUrls, ''])
    }
  }

  const removeAmazonUrl = (index: number) => {
    setAmazonUrls(amazonUrls.filter((_, i) => i !== index))
  }

  const updateAmazonUrl = (index: number, value: string) => {
    const newUrls = [...amazonUrls]
    newUrls[index] = value
    setAmazonUrls(newUrls)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
            Brand Name
          </label>
          <input
            id="brandName"
            type="text"
            required
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amazon Product URLs ({amazonUrls.length}/{planLimits?.max_amazon_urls})
          </label>
          <div className="space-y-2">
            {amazonUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateAmazonUrl(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://www.amazon.in/your-product"
                />
                {amazonUrls.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAmazonUrl(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {amazonUrls.length < planLimits?.max_amazon_urls && (
            <button
              type="button"
              onClick={addAmazonUrl}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Add product URL
            </button>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

