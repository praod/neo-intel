import { createSupabaseClient } from '../_shared/supabase.ts'
import { startApifyRun } from '../_shared/apify-client.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Extract ASIN and domain code from Amazon URL
function extractAmazonInfo(url: string): { asin: string | null; domainCode: string | null } {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    // Extract domain code (e.g., "in" from amazon.in, "com" from amazon.com)
    const domainMatch = hostname.match(/amazon\.([a-z.]+)/i)
    const domainCode = domainMatch ? domainMatch[1].split('.')[0] : null
    
    // Extract ASIN from URL - can be in /dp/ASIN, /product/ASIN, or ?asin=ASIN
    let asin: string | null = null
    
    // Try /dp/ASIN or /product/ASIN pattern
    const dpMatch = url.match(/\/(?:dp|product)\/([A-Z0-9]{10})/)
    if (dpMatch) {
      asin = dpMatch[1]
    } else {
      // Try query parameter
      const asinParam = urlObj.searchParams.get('asin')
      if (asinParam && asinParam.length === 10) {
        asin = asinParam
      } else {
        // Try to extract from path segments
        const pathParts = urlObj.pathname.split('/').filter(p => p.length === 10 && /^[A-Z0-9]+$/.test(p))
        if (pathParts.length > 0) {
          asin = pathParts[0]
        }
      }
    }
    
    return { asin, domainCode }
  } catch (error) {
    console.error('Error parsing Amazon URL:', url, error)
    return { asin: null, domainCode: null }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient()
    const { brand_id } = await req.json().catch(() => ({}))
    const projectUrl = Deno.env.get('SUPABASE_URL')!
    const webhookUrl = `${projectUrl}/functions/v1/apify-webhook`

    // Get all brands or specific brand
    let query = supabase.from('brands').select('*, competitors(*)')
    if (brand_id) {
      query = query.eq('id', brand_id)
    }
    const { data: brands, error: brandsError } = await query

    if (brandsError) {
      throw brandsError
    }

    if (!brands || brands.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No brands found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jobs = []

    for (const brand of brands) {
      // Scrape Instagram for brand
      if (brand.instagram_handle) {
        try {
          const runId = await startApifyRun({
            actorId: 'apify/instagram-scraper',
            input: {
              usernames: [brand.instagram_handle],
              resultsLimit: 50,
            },
            webhookUrl,
          })

          const { error: jobError } = await supabase.from('scrape_jobs').insert({
            brand_id: brand.id,
            job_type: 'instagram_brand',
            status: 'running',
            apify_run_id: runId,
            started_at: new Date().toISOString(),
          })

          if (jobError) {
            console.error('Error creating job:', jobError)
          } else {
            jobs.push({ type: 'instagram_brand', runId })
          }
        } catch (error) {
          console.error(`Error starting Instagram scrape for brand ${brand.id}:`, error)
        }
      }

      // Scrape Instagram for competitors
      if (brand.competitors && brand.competitors.length > 0) {
        for (const competitor of brand.competitors) {
          try {
            const runId = await startApifyRun({
              actorId: 'apify/instagram-scraper',
              input: {
                usernames: [competitor.instagram_handle],
                resultsLimit: 50,
              },
              webhookUrl,
            })

            const { error: jobError } = await supabase.from('scrape_jobs').insert({
              brand_id: brand.id,
              job_type: 'instagram_competitor',
              status: 'running',
              apify_run_id: runId,
              started_at: new Date().toISOString(),
            })

            if (jobError) {
              console.error('Error creating job:', jobError)
            } else {
              jobs.push({ type: 'instagram_competitor', runId, competitorId: competitor.id })
            }
          } catch (error) {
            console.error(`Error starting Instagram scrape for competitor ${competitor.id}:`, error)
          }
        }
      }

      // Scrape Amazon reviews using axesso_data/amazon-reviews-scraper
      if (brand.amazon_product_urls && brand.amazon_product_urls.length > 0) {
        // Group URLs by domain and prepare input array
        const amazonInputs: Array<{ asin: string; domainCode: string; maxPages: number }> = []
        
        for (const productUrl of brand.amazon_product_urls) {
          const { asin, domainCode } = extractAmazonInfo(productUrl)
          
          if (!asin || !domainCode) {
            console.error(`Could not extract ASIN or domain from URL: ${productUrl}`)
            continue
          }
          
          // Check if we already have this ASIN+domain combination
          const existing = amazonInputs.find(
            (input) => input.asin === asin && input.domainCode === domainCode
          )
          
          if (!existing) {
            amazonInputs.push({
              asin,
              domainCode,
              maxPages: 1, // Scrape first page (up to ~10 reviews per page)
            })
          }
        }
        
        // Start scrape job with all ASINs in one run (more efficient)
        if (amazonInputs.length > 0) {
          try {
            const runId = await startApifyRun({
              actorId: 'axesso_data/amazon-reviews-scraper',
              input: {
                input: amazonInputs.map(({ asin, domainCode, maxPages }) => ({
                  asin,
                  domainCode,
                  maxPages,
                  sortBy: 'recent', // Get most recent reviews
                  reviewerType: 'all_reviews', // Include both verified and unverified
                })),
              },
              webhookUrl,
            })

            const { error: jobError } = await supabase.from('scrape_jobs').insert({
              brand_id: brand.id,
              job_type: 'amazon',
              status: 'running',
              apify_run_id: runId,
              started_at: new Date().toISOString(),
            })

            if (jobError) {
              console.error('Error creating job:', jobError)
            } else {
              jobs.push({ type: 'amazon', runId, asinCount: amazonInputs.length })
            }
          } catch (error) {
            console.error(`Error starting Amazon scrape:`, error)
          }
        }
      }

      // Scrape Meta Ads for competitors
      if (brand.competitors && brand.competitors.length > 0) {
        for (const competitor of brand.competitors) {
          try {
            // Note: Meta Ad Library scraping may require different actor or manual API
            // This is a placeholder - verify the correct actor ID
            const runId = await startApifyRun({
              actorId: 'apify/facebook-ads-library-scraper',
              input: {
                searchTerms: competitor.instagram_handle,
                country: 'IN',
                limit: 50,
              },
              webhookUrl,
            })

            const { error: jobError } = await supabase.from('scrape_jobs').insert({
              brand_id: brand.id,
              job_type: 'meta_ads',
              status: 'running',
              apify_run_id: runId,
              started_at: new Date().toISOString(),
            })

            if (jobError) {
              console.error('Error creating job:', jobError)
            } else {
              jobs.push({ type: 'meta_ads', runId, competitorId: competitor.id })
            }
          } catch (error) {
            console.error(`Error starting Meta Ads scrape for competitor ${competitor.id}:`, error)
            // Graceful degradation - continue with other jobs
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Scraping jobs started',
        jobsStarted: jobs.length,
        jobs,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in trigger-scrape:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

