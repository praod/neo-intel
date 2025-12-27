'use client'

import { useState } from 'react'

interface AmazonStepProps {
  data: { amazonUrls: string[] }
  planLimits: { max_amazon_urls: number }
  onNext: (data: { amazonUrls: string[] }) => void
  onBack: () => void
}

export default function AmazonStep({ data, planLimits, onNext, onBack }: AmazonStepProps) {
  const [urls, setUrls] = useState<string[]>(data.amazonUrls || [''])

  const addUrl = () => {
    if (urls.length < planLimits.max_amazon_urls) {
      setUrls([...urls, ''])
    }
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validUrls = urls.filter((url) => url.trim() && url.includes('amazon.in'))
    onNext({ amazonUrls: validUrls })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Amazon Products</h2>
        <p className="text-gray-600 mb-6">
          Add your Amazon.in product URLs to track reviews and ratings.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You can add up to {planLimits.max_amazon_urls} product URLs.
        </p>
      </div>

      <div className="space-y-4">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://www.amazon.in/your-product"
            />
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {urls.length < planLimits.max_amazon_urls && (
        <button
          type="button"
          onClick={addUrl}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          + Add another product URL
        </button>
      )}

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

