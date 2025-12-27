-- Profiles with notification preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  -- Notification preferences
  whatsapp_number TEXT,
  whatsapp_opted_in BOOLEAN DEFAULT FALSE,
  email_opted_in BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands (user's own brand)
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instagram_handle TEXT,
  amazon_product_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Competitors
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan limits
CREATE TABLE public.plan_limits (
  plan TEXT PRIMARY KEY,
  max_competitors INT NOT NULL,
  max_amazon_urls INT NOT NULL,
  report_frequency TEXT NOT NULL
);

INSERT INTO public.plan_limits VALUES
  ('free', 3, 2, 'weekly'),
  ('pro', 10, 10, 'weekly'),
  ('enterprise', 25, 50, 'daily');

-- Scrape jobs tracking
CREATE TABLE public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  apify_run_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instagram posts (explicit FKs instead of polymorphic)
CREATE TABLE public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  -- One of brand_id or competitor_id must be set
  CONSTRAINT chk_single_source CHECK (
    (brand_id IS NOT NULL AND competitor_id IS NULL) OR
    (brand_id IS NULL AND competitor_id IS NOT NULL)
  ),
  post_id TEXT NOT NULL UNIQUE,
  post_url TEXT,
  caption TEXT,
  likes_count INT,
  comments_count INT,
  post_type TEXT,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.instagram_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
  comment_text TEXT,
  username TEXT,
  sentiment_score FLOAT,
  sentiment_label TEXT,
  created_at TIMESTAMPTZ
);

-- Amazon reviews
CREATE TABLE public.amazon_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  review_id TEXT NOT NULL UNIQUE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  reviewer_name TEXT,
  verified_purchase BOOLEAN,
  helpful_votes INT,
  review_date DATE,
  sentiment_score FLOAT,
  sentiment_label TEXT,
  extracted_keywords TEXT[],
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta Ad Library data
CREATE TABLE public.meta_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  ad_id TEXT NOT NULL UNIQUE,
  page_name TEXT,
  ad_creative_body TEXT,
  ad_creative_link_title TEXT,
  ad_creative_link_caption TEXT,
  media_type TEXT,
  media_url TEXT,
  started_running DATE,
  is_active BOOLEAN DEFAULT TRUE,
  platforms TEXT[],
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  report_type TEXT DEFAULT 'weekly',
  report_data JSONB NOT NULL,
  summary TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_whatsapp BOOLEAN DEFAULT FALSE
);

-- INDEXES for query performance
CREATE INDEX idx_instagram_posts_brand ON public.instagram_posts(brand_id);
CREATE INDEX idx_instagram_posts_competitor ON public.instagram_posts(competitor_id);
CREATE INDEX idx_amazon_reviews_brand ON public.amazon_reviews(brand_id);
CREATE INDEX idx_meta_ads_competitor ON public.meta_ads(competitor_id);
CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_brand ON public.scrape_jobs(brand_id);
CREATE INDEX idx_reports_brand ON public.reports(brand_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own brand"
  ON public.brands FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own brand"
  ON public.brands FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brand"
  ON public.brands FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own brand"
  ON public.brands FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own competitors"
  ON public.competitors FOR SELECT 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own competitors"
  ON public.competitors FOR INSERT 
  WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own competitors"
  ON public.competitors FOR UPDATE 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own competitors"
  ON public.competitors FOR DELETE 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own scrape jobs"
  ON public.scrape_jobs FOR SELECT 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own instagram posts"
  ON public.instagram_posts FOR SELECT 
  USING (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()) OR
    competitor_id IN (
      SELECT id FROM public.competitors 
      WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own instagram comments"
  ON public.instagram_comments FOR SELECT 
  USING (
    post_id IN (
      SELECT id FROM public.instagram_posts 
      WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()) OR
      competitor_id IN (
        SELECT id FROM public.competitors 
        WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can view own amazon reviews"
  ON public.amazon_reviews FOR SELECT 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own meta ads"
  ON public.meta_ads FOR SELECT 
  USING (
    competitor_id IN (
      SELECT id FROM public.competitors 
      WHERE brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT 
  USING (brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid()));

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

