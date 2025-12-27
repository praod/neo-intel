import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient()
    const projectUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get all brands that have completed onboarding
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, profiles!inner(onboarding_completed)')
      .eq('profiles.onboarding_completed', true)

    if (brandsError) {
      throw brandsError
    }

    if (!brands || brands.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No brands to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    // Generate report for each brand
    for (const brand of brands) {
      try {
        const response = await fetch(`${projectUrl}/functions/v1/generate-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ brand_id: brand.id }),
        })

        if (response.ok) {
          const data = await response.json()
          results.push({ brand_id: brand.id, success: true, report_id: data.report_id })
        } else {
          const error = await response.text()
          results.push({ brand_id: brand.id, success: false, error })
        }
      } catch (error) {
        console.error(`Error generating report for brand ${brand.id}:`, error)
        results.push({ brand_id: brand.id, success: false, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Report generation completed',
        total: brands.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-all-reports:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

