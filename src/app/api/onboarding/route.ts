import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brandName, instagramHandle, amazonUrls, competitors } = body

    // Create or update brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .upsert({
        user_id: user.id,
        name: brandName,
        instagram_handle: instagramHandle || null,
        amazon_product_urls: amazonUrls || [],
      })
      .select()
      .single()

    if (brandError) {
      throw brandError
    }

    // Create competitors
    if (competitors && competitors.length > 0) {
      const competitorsData = competitors.map((c: any) => ({
        brand_id: brand.id,
        name: c.name,
        instagram_handle: c.instagramHandle,
        facebook_page_url: c.facebookPageUrl || null,
      }))

      const { error: competitorsError } = await supabase
        .from('competitors')
        .insert(competitorsData)

      if (competitorsError) {
        throw competitorsError
      }
    }

    // Mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

