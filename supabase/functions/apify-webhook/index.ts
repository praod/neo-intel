import { createSupabaseClient } from '../_shared/supabase.ts'
import { getApifyDatasetItems } from '../_shared/apify-client.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookData = await req.json()
    const { eventType, actorRunId, actorId } = webhookData

    if (eventType !== 'ACTOR.RUN.SUCCEEDED' && eventType !== 'ACTOR.RUN.FAILED') {
      return new Response(
        JSON.stringify({ message: 'Event type not handled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient()

    // Find the scrape job (include metadata for competitor_id)
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .select('*, metadata, brands!inner(*)')
      .eq('apify_run_id', actorRunId)
      .single()

    if (jobError || !job) {
      console.error('Job not found for run:', actorRunId)
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (eventType === 'ACTOR.RUN.FAILED') {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Apify run failed',
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ message: 'Job marked as failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch dataset items
    const items = await getApifyDatasetItems(actorRunId)

    // Process based on job type
    if (job.job_type === 'instagram_brand' || job.job_type === 'instagram_competitor') {
      await processInstagramData(supabase, items, job)
    } else if (job.job_type === 'amazon') {
      await processAmazonData(supabase, items, job)
    } else if (job.job_type === 'meta_ads') {
      await processMetaAdsData(supabase, items, job)
    }

    // Update job status
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return new Response(
      JSON.stringify({ message: 'Data processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in apify-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processInstagramData(supabase: any, items: any[], job: any) {
  const brandId = job.brand_id
  const isBrand = job.job_type === 'instagram_brand'

  for (const item of items) {
    // Determine if this is for brand or competitor
    let competitorId = null
    if (!isBrand) {
      // Find competitor by instagram handle
      const { data: competitors } = await supabase
        .from('competitors')
        .select('id, instagram_handle')
        .eq('brand_id', brandId)

      const competitor = competitors?.find((c: any) =>
        item.username?.toLowerCase().includes(c.instagram_handle.toLowerCase())
      )
      competitorId = competitor?.id
    }

    // Upsert post
    const { error: postError } = await supabase.from('instagram_posts').upsert(
      {
        brand_id: isBrand ? brandId : null,
        competitor_id: competitorId,
        post_id: item.id || item.shortcode,
        post_url: item.url,
        caption: item.caption,
        likes_count: item.likesCount || item.likes,
        comments_count: item.commentsCount || item.comments,
        post_type: item.type,
        posted_at: item.timestamp ? new Date(item.timestamp * 1000).toISOString() : null,
      },
      { onConflict: 'post_id' }
    )

    if (postError) {
      console.error('Error inserting Instagram post:', postError)
      continue
    }

    // Get the post ID for comments
    const { data: post } = await supabase
      .from('instagram_posts')
      .select('id')
      .eq('post_id', item.id || item.shortcode)
      .single()

    // Process comments if available
    if (item.comments && post) {
      for (const comment of item.comments) {
        await supabase.from('instagram_comments').upsert(
          {
            post_id: post.id,
            comment_text: comment.text,
            username: comment.ownerUsername,
            created_at: comment.timestamp
              ? new Date(comment.timestamp * 1000).toISOString()
              : null,
          },
          { onConflict: 'id' }
        )
      }
    }
  }
}

async function processAmazonData(supabase: any, items: any[], job: any) {
  const brandId = job.brand_id

  for (const item of items) {
    // Handle both old (junglee) and new (axesso_data) output formats
    // axesso_data format: reviewId, text, rating (as "5.0 out of 5 stars"), userName, numberOfHelpful, date, verified, asin, domainCode
    // junglee format: reviewId/id, text/reviewText, rating/stars, reviewerName/author, helpfulVotes, date, verifiedPurchase, productUrl/url
    
    // Extract rating number from string format like "5.0 out of 5 stars" or just a number
    let rating: number | null = null
    if (item.rating) {
      if (typeof item.rating === 'string') {
        const ratingMatch = item.rating.match(/(\d+\.?\d*)/)
        rating = ratingMatch ? Math.round(parseFloat(ratingMatch[1])) : null
      } else {
        rating = Math.round(Number(item.rating))
      }
    } else if (item.stars) {
      rating = Math.round(Number(item.stars))
    }
    
    // Parse date from various formats
    let reviewDate: string | null = null
    if (item.date) {
      if (typeof item.date === 'string') {
        // Try to parse formats like "Reviewed in the United Kingdom on 24 November 2024"
        const dateMatch = item.date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
        if (dateMatch) {
          try {
            const dateStr = `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`
            reviewDate = new Date(dateStr).toISOString().split('T')[0]
          } catch (e) {
            // Fallback: try direct Date parsing
            try {
              reviewDate = new Date(item.date).toISOString().split('T')[0]
            } catch (e2) {
              console.error('Could not parse date:', item.date)
            }
          }
        } else {
          // Try direct Date parsing
          try {
            reviewDate = new Date(item.date).toISOString().split('T')[0]
          } catch (e) {
            console.error('Could not parse date:', item.date)
          }
        }
      } else {
        reviewDate = new Date(item.date).toISOString().split('T')[0]
      }
    }
    
    // Construct product URL from ASIN and domainCode if available
    let productUrl = item.productUrl || item.url
    if (!productUrl && item.asin && item.domainCode) {
      productUrl = `https://www.amazon.${item.domainCode}/dp/${item.asin}`
    }
    
    await supabase.from('amazon_reviews').upsert(
      {
        brand_id: brandId,
        product_url: productUrl || '',
        review_id: item.reviewId || item.id,
        rating: rating && rating >= 1 && rating <= 5 ? rating : null,
        title: item.title || null,
        review_text: item.text || item.reviewText || null,
        reviewer_name: item.userName || item.reviewerName || item.author || null,
        verified_purchase: item.verified !== undefined ? item.verified : (item.verifiedPurchase || false),
        helpful_votes: item.numberOfHelpful || item.helpfulVotes || 0,
        review_date: reviewDate,
      },
      { onConflict: 'review_id' }
    )
  }
}

async function processMetaAdsData(supabase: any, items: any[], job: any) {
  // Get competitor_id from job metadata (set by trigger-scrape)
  const competitorId = job.metadata?.competitor_id
  
  if (!competitorId) {
    console.error('No competitor_id found in job metadata for meta_ads job:', job.id)
    return
  }

  for (const item of items) {
    // Handle different output formats from apify/facebook-ads-scraper
    // Common fields: id, pageName, adCreativeBody, adCreativeLinkTitle, etc.
    const adId = item.adArchiveId || item.adId || item.id || `${competitorId}-${Date.now()}-${Math.random()}`
    
    await supabase.from('meta_ads').upsert(
      {
        competitor_id: competitorId,
        ad_id: adId,
        page_name: item.pageName || item.pageInfo?.name || item.advertiserName,
        ad_creative_body: item.adCreativeBody || item.body || item.snapshot?.body?.text,
        ad_creative_link_title: item.adCreativeLinkTitle || item.title || item.snapshot?.title,
        ad_creative_link_caption: item.adCreativeLinkCaption || item.caption || item.snapshot?.caption,
        media_type: item.mediaType || item.snapshot?.cards?.[0]?.mediaType || 'unknown',
        media_url: item.mediaUrl || item.imageUrl || item.snapshot?.images?.[0] || item.snapshot?.videos?.[0]?.videoUrl,
        started_running: item.startDate || item.startedRunning
          ? new Date(item.startDate || item.startedRunning).toISOString().split('T')[0]
          : null,
        is_active: item.isActive !== false && item.endDate === null,
        platforms: item.platforms || item.publisherPlatforms || ['facebook', 'instagram'],
      },
      { onConflict: 'ad_id' }
    )
  }
}

