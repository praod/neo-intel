import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HealthScoreCard from '@/components/dashboard/health-score-card'
import AlertBanner from '@/components/dashboard/alert-banner'
import ReportSection from '@/components/dashboard/report-section'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: latestReport } = await supabase
    .from('reports')
    .select('*')
    .eq('brand_id', brand?.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {profile?.full_name || user.email}
        </p>
      </div>

      {brand && (
        <>
          <HealthScoreCard report={latestReport} />
          <AlertBanner report={latestReport} />
          <ReportSection report={latestReport} brand={brand} />
        </>
      )}

      {!brand && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please complete your onboarding to start tracking your brand.
          </p>
        </div>
      )}
    </div>
  )
}

