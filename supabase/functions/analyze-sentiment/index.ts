import { createSupabaseClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

interface SentimentResult {
  score: number // -1 to 1
  label: 'positive' | 'negative' | 'neutral'
}

async function analyzeSentiment(text: string): Promise<SentimentResult> {
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
          content:
            'You are a sentiment analysis tool. Analyze the sentiment of the given text and return a JSON object with "score" (float between -1 and 1, where -1 is very negative, 0 is neutral, 1 is very positive) and "label" (one of: "positive", "negative", "neutral").',
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this text: "${text}"`,
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

  return {
    score: parseFloat(result.score) || 0,
    label: result.label || 'neutral',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { brand_id } = await req.json()
    const supabase = createSupabaseClient()

    // Analyze Instagram comments
    const { data: comments } = await supabase
      .from('instagram_comments')
      .select('*, instagram_posts!inner(brand_id, competitor_id)')
      .is('sentiment_score', null)
      .limit(100) // Process in batches

    if (comments && comments.length > 0) {
      for (const comment of comments) {
        if (!comment.comment_text) continue

        try {
          const sentiment = await analyzeSentiment(comment.comment_text)

          await supabase
            .from('instagram_comments')
            .update({
              sentiment_score: sentiment.score,
              sentiment_label: sentiment.label,
            })
            .eq('id', comment.id)
        } catch (error) {
          console.error(`Error analyzing comment ${comment.id}:`, error)
        }
      }
    }

    // Analyze Amazon reviews
    const { data: reviews } = await supabase
      .from('amazon_reviews')
      .select('*')
      .eq('brand_id', brand_id)
      .is('sentiment_score', null)
      .limit(100)

    if (reviews && reviews.length > 0) {
      for (const review of reviews) {
        const reviewText = `${review.title || ''} ${review.review_text || ''}`.trim()
        if (!reviewText) continue

        try {
          const sentiment = await analyzeSentiment(reviewText)

          await supabase
            .from('amazon_reviews')
            .update({
              sentiment_score: sentiment.score,
              sentiment_label: sentiment.label,
            })
            .eq('id', review.id)
        } catch (error) {
          console.error(`Error analyzing review ${review.id}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Sentiment analysis completed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-sentiment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

