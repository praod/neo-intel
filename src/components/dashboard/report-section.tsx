'use client'

import { useState } from 'react'

interface ReportSectionProps {
  report: any
  brand: any
}

export default function ReportSection({ report, brand }: ReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Report</h2>
        <p className="text-gray-500">
          No reports available yet. Reports will appear here after data is scraped and analyzed.
        </p>
      </div>
    )
  }

  const reportData = report.report_data || {}

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Latest Report</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="space-y-4">
        {report.summary && (
          <div className="bg-gray-50 rounded p-4">
            <p className="text-sm text-gray-700">{report.summary}</p>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            {reportData.brandHealth && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Brand Health</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Sentiment: {reportData.brandHealth.sentimentBreakdown?.positive || 0}% positive,{' '}
                    {reportData.brandHealth.sentimentBreakdown?.negative || 0}% negative
                  </p>
                  {reportData.brandHealth.topPositiveKeywords?.length > 0 && (
                    <p>
                      Top positive keywords:{' '}
                      {reportData.brandHealth.topPositiveKeywords.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {reportData.vulnerabilities?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Vulnerabilities</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {reportData.vulnerabilities.map((v: any, i: number) => (
                    <li key={i}>
                      {v.issue} ({v.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.opportunities?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Opportunities</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {reportData.opportunities.map((o: any, i: number) => (
                    <li key={i}>{o.insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.stealThis?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Steal This</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {reportData.stealThis.map((s: any, i: number) => (
                    <li key={i}>
                      {s.competitorName}: {s.whyItWorks}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.watchThis?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Watch This</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {reportData.watchThis.map((w: any, i: number) => (
                    <li key={i}>
                      {w.competitorName}: {w.observation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

