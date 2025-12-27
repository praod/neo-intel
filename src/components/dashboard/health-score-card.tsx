interface HealthScoreCardProps {
  report: any
}

export default function HealthScoreCard({ report }: HealthScoreCardProps) {
  const healthScore = report?.report_data?.brandHealth?.overallScore || 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-2 ${getScoreBg(healthScore)}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Health Score</h2>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(healthScore)} mb-2`}>
            {healthScore || '--'}
          </div>
          <div className="text-sm text-gray-600">out of 100</div>
        </div>
      </div>
      {report && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last updated: {new Date(report.generated_at).toLocaleDateString()}
          </p>
        </div>
      )}
      {!report && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            No reports yet. Your first report will be generated after the first data scrape.
          </p>
        </div>
      )}
    </div>
  )
}

