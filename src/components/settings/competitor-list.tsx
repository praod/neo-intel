'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CompetitorListProps {
  competitors: any[]
  brandId: string
  planLimits: any
}

export default function CompetitorList({
  competitors,
  brandId,
  planLimits,
}: CompetitorListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCompetitor, setNewCompetitor] = useState({ name: '', instagramHandle: '' })

  const handleDelete = async (competitorId: string) => {
    if (!confirm('Are you sure you want to remove this competitor?')) return

    setLoading(competitorId)
    try {
      const response = await fetch(`/api/competitors/${competitorId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete competitor')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting competitor:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (competitors.length >= planLimits?.max_competitors) {
      alert(`You can only add up to ${planLimits.max_competitors} competitors on your plan.`)
      return
    }

    setLoading('add')
    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          name: newCompetitor.name,
          instagram_handle: newCompetitor.instagramHandle,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add competitor')
      }

      setNewCompetitor({ name: '', instagramHandle: '' })
      setShowAddForm(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding competitor:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Competitors ({competitors.length}/{planLimits?.max_competitors})
        </h2>
        {competitors.length < planLimits?.max_competitors && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Competitor
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-gray-50 rounded-md space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Competitor Name
            </label>
            <input
              type="text"
              required
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                @
              </span>
              <input
                type="text"
                required
                value={newCompetitor.instagramHandle}
                onChange={(e) =>
                  setNewCompetitor({
                    ...newCompetitor,
                    instagramHandle: e.target.value.replace('@', ''),
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading === 'add'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              {loading === 'add' ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewCompetitor({ name: '', instagramHandle: '' })
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {competitors.length === 0 ? (
        <p className="text-gray-500 text-sm">No competitors added yet.</p>
      ) : (
        <ul className="space-y-3">
          {competitors.map((competitor) => (
            <li
              key={competitor.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
            >
              <div>
                <p className="font-medium text-gray-900">{competitor.name}</p>
                <p className="text-sm text-gray-500">@{competitor.instagram_handle}</p>
              </div>
              <button
                onClick={() => handleDelete(competitor.id)}
                disabled={loading === competitor.id}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {loading === competitor.id ? 'Removing...' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

