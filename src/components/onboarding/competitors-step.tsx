'use client'

import { useState } from 'react'

interface CompetitorsStepProps {
  data: { competitors: Array<{ name: string; instagramHandle: string; facebookPageUrl?: string }> }
  planLimits: { max_competitors: number }
  onComplete: (data: { competitors: Array<{ name: string; instagramHandle: string; facebookPageUrl?: string }> }) => void
  onBack: () => void
  loading: boolean
}

export default function CompetitorsStep({
  data,
  planLimits,
  onComplete,
  onBack,
  loading,
}: CompetitorsStepProps) {
  const [competitors, setCompetitors] = useState<
    Array<{ name: string; instagramHandle: string; facebookPageUrl?: string }>
  >(data.competitors.length > 0 ? data.competitors : [{ name: '', instagramHandle: '', facebookPageUrl: '' }])

  const addCompetitor = () => {
    if (competitors.length < planLimits.max_competitors) {
      setCompetitors([...competitors, { name: '', instagramHandle: '', facebookPageUrl: '' }])
    }
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  const updateCompetitor = (
    index: number,
    field: 'name' | 'instagramHandle' | 'facebookPageUrl',
    value: string
  ) => {
    const newCompetitors = [...competitors]
    newCompetitors[index] = { ...newCompetitors[index], [field]: value }
    setCompetitors(newCompetitors)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validCompetitors = competitors.filter(
      (c) => c.name.trim() && c.instagramHandle.trim()
    )
    onComplete({ competitors: validCompetitors })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Competitors</h2>
        <p className="text-gray-600 mb-6">
          Add competitors to track their ads and Instagram activity.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You can add up to {planLimits.max_competitors} competitors.
        </p>
      </div>

      <div className="space-y-4">
        {competitors.map((competitor, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-md space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competitor Name *
              </label>
              <input
                type="text"
                required
                value={competitor.name}
                onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Competitor Brand Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Handle *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={competitor.instagramHandle}
                  onChange={(e) =>
                    updateCompetitor(index, 'instagramHandle', e.target.value.replace('@', ''))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="competitorhandle"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Page URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={competitor.facebookPageUrl || ''}
                onChange={(e) => updateCompetitor(index, 'facebookPageUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://facebook.com/competitorpage"
              />
              <p className="mt-1 text-xs text-gray-500">
                Providing this helps track their Facebook ads more accurately
              </p>
            </div>
            {competitors.length > 1 && (
              <button
                type="button"
                onClick={() => removeCompetitor(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove competitor
              </button>
            )}
          </div>
        ))}
      </div>

      {competitors.length < planLimits.max_competitors && (
        <button
          type="button"
          onClick={addCompetitor}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          + Add another competitor
        </button>
      )}

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </div>
    </form>
  )
}

