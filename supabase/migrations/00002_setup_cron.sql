-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making requests
CREATE EXTENSION IF NOT EXISTS http;

-- Weekly scrape job (Sundays at midnight UTC)
-- Note: Replace [project-ref] and [service_role_key] with actual values
SELECT cron.schedule(
  'weekly-brand-scrape',
  '0 0 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/trigger-scrape',
    headers := '{"Authorization": "Bearer [service_role_key]", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);

-- Weekly report generation (Monday 6am UTC, after scrapes complete)
SELECT cron.schedule(
  'weekly-report-generation',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/generate-all-reports',
    headers := '{"Authorization": "Bearer [service_role_key]", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);

-- Note: After creating these cron jobs, you need to:
-- 1. Replace [project-ref] with your actual Supabase project reference
-- 2. Replace [service_role_key] with your actual service role key
-- 3. These can be set via Supabase dashboard or environment variables

