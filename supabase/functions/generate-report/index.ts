import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { brand_id } = await req.json()
    const supabase = createSupabaseClient()

    // Step 1: Analyze sentiment
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ brand_id }),
    })

    // Step 2: Extract keywords
    const keywordsResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/extract-keywords`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ brand_id }),
      }
    )
    const keywordsData = await keywordsResponse.json()

    // Step 3: Generate insights
    const insightsResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-insights`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ brand_id }),
      }
    )
    const insights = await insightsResponse.json()

    // Enhance insights with keywords
    if (keywordsData.positiveKeywords) {
      insights.brandHealth.topPositiveKeywords = keywordsData.positiveKeywords.slice(0, 10)
    }
    if (keywordsData.negativeKeywords) {
      insights.brandHealth.topNegativeKeywords = keywordsData.negativeKeywords.slice(0, 10)
    }

    // Generate summary
    const summary = `Brand Health Score: ${insights.brandHealth.overallScore}/100. ${
      insights.vulnerabilities?.length || 0
    } vulnerabilities identified, ${insights.opportunities?.length || 0} opportunities found.`

    // Save report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        brand_id,
        report_type: 'weekly',
        report_data: insights,
        summary,
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    // Trigger notifications
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ report_id: report.id }),
    })

    return new Response(
      JSON.stringify({ message: 'Report generated successfully', report_id: report.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-report:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

