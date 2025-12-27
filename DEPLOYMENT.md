# Deployment Guide

## Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Run Migrations**
   - In Supabase dashboard, go to SQL Editor
   - Run `supabase/migrations/00001_initial_schema.sql`
   - Run `supabase/migrations/00002_setup_cron.sql` (update placeholders first)

3. **Enable Extensions**
   - In Supabase dashboard, go to Database > Extensions
   - Enable `pg_cron`
   - Enable `http` (if not already enabled)

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy trigger-scrape
   supabase functions deploy apify-webhook
   supabase functions deploy analyze-sentiment
   supabase functions deploy extract-keywords
   supabase functions deploy generate-insights
   supabase functions deploy generate-report
   supabase functions deploy generate-all-reports
   supabase functions deploy send-notifications
   ```

5. **Set Environment Variables**
   - In Supabase dashboard, go to Project Settings > Edge Functions
   - Add the following secrets:
     - `APIFY_API_TOKEN`
     - `OPENAI_API_KEY`
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `GUPSHUP_API_KEY`
     - `GUPSHUP_APP_NAME`
     - `GUPSHUP_SOURCE_NUMBER`
     - `NEXT_PUBLIC_APP_URL` (your frontend URL)

6. **Update Cron Jobs**
   - Edit the cron jobs in `00002_setup_cron.sql` with your actual project reference and service role key
   - Or create them manually in Supabase SQL Editor

## Next.js Deployment (Vercel)

1. **Set Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`

2. **Deploy**
   ```bash
   vercel deploy
   ```

## Apify Setup

1. **Create Apify Account**
   - Go to https://apify.com
   - Create account and get API token

2. **Verify Actors**
   - Test these actors manually in Apify console:
     - `apify/instagram-scraper`
     - `axesso_data/amazon-reviews-scraper` (supports Amazon.in and other domains)
     - `apify/facebook-ads-library-scraper`
   - Ensure they work with Indian data (Amazon.in, Indian Instagram accounts)
   - Note: The Amazon scraper uses ASIN + domainCode format (URLs are automatically converted)

3. **Set Webhook URL**
   - The webhook URL is automatically set in `trigger-scrape` function
   - Format: `https://[project-ref].supabase.co/functions/v1/apify-webhook`

## Gupshup Setup

1. **Create Gupshup Account**
   - Go to https://gupshup.io
   - Sign up for WhatsApp Business API

2. **Register Message Templates**
   - Templates must be approved by Meta before use
   - Template format is in `send-notifications` function

3. **Get Credentials**
   - API Key
   - App Name
   - Source Number

## Resend Setup

1. **Create Resend Account**
   - Go to https://resend.com
   - Create account and verify domain

2. **Get API Key**
   - Add to Supabase Edge Functions secrets

## Testing

1. **Test Onboarding Flow**
   - Sign up new user
   - Complete onboarding
   - Verify brand and competitors are created

2. **Test Manual Scrape**
   - Call `trigger-scrape` function with `brand_id`
   - Check `scrape_jobs` table for status
   - Verify data in `instagram_posts`, `amazon_reviews`, `meta_ads`

3. **Test Report Generation**
   - Call `generate-report` function with `brand_id`
   - Check `reports` table
   - Verify notifications are sent

4. **Test Cron Jobs**
   - Manually trigger cron jobs or wait for scheduled time
   - Check logs in Supabase dashboard

