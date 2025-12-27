# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Apify account
- OpenAI API key
- Resend account
- Gupshup account (for WhatsApp)

## Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in all required values in `.env.local`

3. **Set Up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key to `.env.local`
   - In Supabase SQL Editor, run `supabase/migrations/00001_initial_schema.sql`
   - Enable `pg_cron` and `http` extensions in Database > Extensions

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Testing the Application

1. **Sign Up**
   - Go to http://localhost:3000/signup
   - Create a new account
   - You'll be redirected to onboarding

2. **Complete Onboarding**
   - Step 1: Enter brand name and Instagram handle
   - Step 2: Add Amazon.in product URLs (up to plan limit)
   - Step 3: Add competitors (Instagram handles, up to plan limit)
   - Click "Complete Setup"

3. **View Dashboard**
   - After onboarding, you'll see the dashboard
   - Initially, there will be no reports (until first scrape)

4. **Test Manual Scrape** (requires Edge Functions deployed)
   - Deploy Edge Functions to Supabase
   - Call the `trigger-scrape` function with your brand_id
   - Check `scrape_jobs` table for status
   - Once complete, data will appear in respective tables

5. **Generate Report** (requires Edge Functions deployed)
   - Call the `generate-report` function with your brand_id
   - Check `reports` table for the generated report
   - View report on dashboard

## Edge Functions Deployment

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set Secrets**
   ```bash
   supabase secrets set APIFY_API_TOKEN=your_token
   supabase secrets set OPENAI_API_KEY=your_key
   supabase secrets set RESEND_API_KEY=your_key
   supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com
   supabase secrets set GUPSHUP_API_KEY=your_key
   supabase secrets set GUPSHUP_APP_NAME=your_app_name
   supabase secrets set GUPSHUP_SOURCE_NUMBER=your_number
   supabase secrets set NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Deploy Functions**
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

## Important Notes

1. **Apify Actors**: Before deploying, manually test these actors in Apify console with Indian data:
   - `apify/instagram-scraper`
   - `axesso_data/amazon-reviews-scraper` (supports Amazon.in and other domains)
   - `apify/facebook-ads-library-scraper`

2. **Cron Jobs**: After deployment, update `00002_setup_cron.sql` with your actual project reference and service role key, then run it in Supabase SQL Editor.

3. **WhatsApp Templates**: Gupshup requires message templates to be approved by Meta before use. Set up templates in Gupshup dashboard.

4. **Rate Limits**: Meta Ad Library has aggressive rate limits. The code includes graceful degradation, but monitor for failures.

## Troubleshooting

- **Auth not working**: Check Supabase URL and anon key in `.env.local`
- **Database errors**: Ensure migrations are run and RLS policies are correct
- **Edge Functions failing**: Check secrets are set correctly and function logs in Supabase dashboard
- **Apify webhooks not working**: Verify webhook URL is accessible and Apify can reach it

