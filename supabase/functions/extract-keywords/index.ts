import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

async function extractKeywords(text: string, type: 'positive' | 'negative'): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a keyword extraction tool. Extract the most important ${type} keywords or phrases from the given text. Return a JSON array of strings with the top 10 keywords.`,
        },
        {
          role: 'user',
          content: `Extract ${type} keywords from: "${text}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)

  return result.keywords || []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { brand_id } = await req.json()
    const supabase = createSupabaseClient()

    // Get reviews grouped by sentiment
    const { data: positiveReviews } = await supabase
      .from('amazon_reviews')
      .select('review_text, title')
      .eq('brand_id', brand_id)
      .eq('sentiment_label', 'positive')
      .limit(50)

    const { data: negativeReviews } = await supabase
      .from('amazon_reviews')
      .select('review_text, title')
      .eq('brand_id', brand_id)
      .eq('sentiment_label', 'negative')
      .limit(50)

    // Combine review texts
    const positiveText = positiveReviews
      ?.map((r) => `${r.title || ''} ${r.review_text || ''}`)
      .join(' ')
      .trim()

    const negativeText = negativeReviews
      ?.map((r) => `${r.title || ''} ${r.review_text || ''}`)
      .join(' ')
      .trim()

    // Extract keywords
    const positiveKeywords: string[] = []
    const negativeKeywords: string[] = []

    if (positiveText) {
      try {
        const keywords = await extractKeywords(positiveText, 'positive')
        positiveKeywords.push(...keywords)
      } catch (error) {
        console.error('Error extracting positive keywords:', error)
      }
    }

    if (negativeText) {
      try {
        const keywords = await extractKeywords(negativeText, 'negative')
        negativeKeywords.push(...keywords)
      } catch (error) {
        console.error('Error extracting negative keywords:', error)
      }
    }

    // Update reviews with extracted keywords (store in a separate table or return)
    // For now, we'll return them to be used in report generation

    return new Response(
      JSON.stringify({
        positiveKeywords,
        negativeKeywords,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in extract-keywords:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

