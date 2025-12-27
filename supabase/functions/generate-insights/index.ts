import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

interface InsightData {
  brandHealth: any
  vulnerabilities: any[]
  opportunities: any[]
  stealThis: any[]
  watchThis: any[]
}

async function generateInsights(context: string): Promise<InsightData> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a brand intelligence analyst. Analyze the provided data and generate actionable insights in JSON format with the following structure:
{
  "brandHealth": {
    "overallScore": number (0-100),
    "sentimentBreakdown": { "positive": number, "neutral": number, "negative": number },
    "ratingTrend": { "current": number, "change": number },
    "topPositiveKeywords": string[],
    "topNegativeKeywords": string[]
  },
  "vulnerabilities": [
    {
      "issue": string,
      "evidence": string,
      "competitorExploiting": string | null,
      "severity": "high" | "medium" | "low"
    }
  ],
  "opportunities": [
    {
      "insight": string,
      "suggestedAction": string
    }
  ],
  "stealThis": [
    {
      "competitorName": string,
      "postUrl": string,
      "whyItWorks": string
    }
  ],
  "watchThis": [
    {
      "competitorName": string,
      "adPreview": string,
      "observation": string
    }
  ]
}`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { brand_id } = await req.json()
    const supabase = createSupabaseClient()

    // Gather data for analysis
    const { data: brand } = await supabase.from('brands').select('*').eq('id', brand_id).single()

    // Get reviews data
    const { data: reviews } = await supabase
      .from('amazon_reviews')
      .select('*')
      .eq('brand_id', brand_id)
      .order('review_date', { ascending: false })
      .limit(100)

    // Get Instagram posts
    const { data: brandPosts } = await supabase
      .from('instagram_posts')
      .select('*, instagram_comments(*)')
      .eq('brand_id', brand_id)
      .order('posted_at', { ascending: false })
      .limit(50)

    // Get competitor posts
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*, instagram_posts(*), meta_ads(*)')
      .eq('brand_id', brand_id)

    // Get competitor ads
    const { data: competitorAds } = await supabase
      .from('meta_ads')
      .select('*, competitors!inner(*)')
      .eq('competitors.brand_id', brand_id)
      .eq('is_active', true)
      .order('started_running', { ascending: false })
      .limit(50)

    // Calculate metrics
    const avgRating =
      reviews?.reduce((sum, r) => sum + (r.rating || 0), 0) / (reviews?.length || 1) || 0

    const sentimentCounts = {
      positive: reviews?.filter((r) => r.sentiment_label === 'positive').length || 0,
      neutral: reviews?.filter((r) => r.sentiment_label === 'neutral').length || 0,
      negative: reviews?.filter((r) => r.sentiment_label === 'negative').length || 0,
    }

    const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative
    const sentimentBreakdown = {
      positive: totalSentiment > 0 ? (sentimentCounts.positive / totalSentiment) * 100 : 0,
      neutral: totalSentiment > 0 ? (sentimentCounts.neutral / totalSentiment) * 100 : 0,
      negative: totalSentiment > 0 ? (sentimentCounts.negative / totalSentiment) * 100 : 0,
    }

    // Build context for LLM
    const context = `
Brand: ${brand?.name}
Instagram Handle: ${brand?.instagram_handle || 'N/A'}

Recent Reviews (${reviews?.length || 0}):
${reviews?.slice(0, 20).map((r) => `- Rating: ${r.rating}/5, Sentiment: ${r.sentiment_label}, Text: ${r.review_text?.substring(0, 200)}`).join('\n') || 'No reviews'}

Sentiment Breakdown: ${JSON.stringify(sentimentBreakdown)}
Average Rating: ${avgRating.toFixed(2)}/5

Brand Instagram Posts: ${brandPosts?.length || 0}
Competitor Posts: ${competitors?.flatMap((c) => c.instagram_posts || []).length || 0}

Active Competitor Ads: ${competitorAds?.length || 0}
${competitorAds?.slice(0, 10).map((ad) => `- ${ad.competitors?.name}: ${ad.ad_creative_body?.substring(0, 150)}`).join('\n') || 'No ads'}
`

    // Generate insights
    const insights = await generateInsights(context)

    // Enhance with actual data
    // Find high-performing competitor posts
    if (competitors) {
      for (const competitor of competitors) {
        const posts = competitor.instagram_posts || []
        if (posts.length > 0) {
          const topPost = posts.sort(
            (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
          )[0]
          if (topPost && !insights.stealThis.find((s) => s.competitorName === competitor.name)) {
            insights.stealThis.push({
              competitorName: competitor.name,
              postUrl: topPost.post_url || '',
              whyItWorks: `High engagement: ${topPost.likes_count} likes, ${topPost.comments_count} comments`,
            })
          }
        }
      }
    }

    // Find new ads to watch
    const newAds = competitorAds?.filter(
      (ad) =>
        ad.started_running &&
        new Date(ad.started_running) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    if (newAds && newAds.length > 0) {
      for (const ad of newAds.slice(0, 5)) {
        insights.watchThis.push({
          competitorName: ad.competitors?.name || 'Unknown',
          adPreview: ad.ad_creative_body?.substring(0, 100) || '',
          observation: `New ad started ${ad.started_running}`,
        })
      }
    }

    return new Response(
      JSON.stringify(insights),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-insights:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

