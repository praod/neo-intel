-- Add facebook_page_url column to competitors table
-- This allows more accurate Facebook Ads Library scraping

ALTER TABLE public.competitors 
ADD COLUMN facebook_page_url TEXT;

-- Add a comment explaining the field
COMMENT ON COLUMN public.competitors.facebook_page_url IS 'Optional Facebook page URL for accurate ad tracking. Falls back to name search if not provided.';

-- Add metadata column to scrape_jobs for storing job-specific context
ALTER TABLE public.scrape_jobs
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.scrape_jobs.metadata IS 'JSON metadata for job context like competitor_id for meta_ads jobs';

