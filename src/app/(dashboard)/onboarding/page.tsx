import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/onboarding-flow'

export default async function OnboardingPage() {
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

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  const { data: planLimits } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', profile?.plan || 'free')
    .single()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Neo Intel</h1>
      <p className="text-gray-600 mb-8">
        Let's set up your brand tracking. This will only take a few minutes.
      </p>
      <OnboardingFlow planLimits={planLimits} />
    </div>
  )
}

