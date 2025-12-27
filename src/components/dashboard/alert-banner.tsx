interface AlertBannerProps {
  report: any
}

export default function AlertBanner({ report }: AlertBannerProps) {
  if (!report) return null

  const vulnerabilities = report.report_data?.vulnerabilities || []
  const opportunities = report.report_data?.opportunities || []

  const highSeverityVulns = vulnerabilities.filter((v: any) => v.severity === 'high')

  if (highSeverityVulns.length === 0 && opportunities.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {highSeverityVulns.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {highSeverityVulns.length} High Priority Alert
                {highSeverityVulns.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {highSeverityVulns.slice(0, 2).map((v: any, i: number) => (
                  <p key={i} className="mb-1">
                    • {v.issue}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {opportunities.length} Opportunity
                {opportunities.length > 1 ? 'ies' : ''} Found
              </h3>
              <div className="mt-2 text-sm text-green-700">
                {opportunities.slice(0, 2).map((o: any, i: number) => (
                  <p key={i} className="mb-1">
                    • {o.insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

