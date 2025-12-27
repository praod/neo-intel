import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BrandForm from '@/components/settings/brand-form'
import CompetitorList from '@/components/settings/competitor-list'
import NotificationPrefs from '@/components/settings/notification-prefs'

export default async function SettingsPage() {
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

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('brand_id', brand?.id)
    .order('created_at', { ascending: true })

  const { data: planLimits } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', profile?.plan || 'free')
    .single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account, brand, and notification preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Name:</span> {profile?.full_name || 'Not set'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Plan:</span>{' '}
            <span className="capitalize">{profile?.plan || 'free'}</span>
          </p>
        </div>
      </div>

      {brand && (
        <>
          <BrandForm brand={brand} planLimits={planLimits} />
          <CompetitorList
            competitors={competitors || []}
            brandId={brand.id}
            planLimits={planLimits}
          />
        </>
      )}

      <NotificationPrefs profile={profile} />
    </div>
  )
}

