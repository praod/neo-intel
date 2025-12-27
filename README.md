# Neo Intel - Brand Intelligence Platform

A SaaS tool for D2C brands that provides brand health and competitive intelligence reports.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions, Cron)
- **Scraping**: Apify (Meta Ad Library, Instagram, Amazon.in)
- **LLM**: OpenAI API (sentiment analysis + insight generation)
- **Email**: Resend
- **WhatsApp**: Gupshup

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase, Apify, OpenAI, Resend, and Gupshup credentials.

3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration: `supabase/migrations/00001_initial_schema.sql`
   - Enable pg_cron extension in your Supabase dashboard

4. Run the development server:
```bash
npm run dev
```

## Project Structure

```
neo-intel/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/              # Utilities and Supabase clients
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions
└── package.json
```

## Features

- User authentication (email/password)
- Brand onboarding flow
- Dashboard with brand health metrics
- Settings for brand and notification preferences
- Weekly automated scraping and reporting (Phase 2+)

## Development Status

- ✅ Phase 1: Project setup, DB schema, Auth, Onboarding
- 🚧 Phase 2: Apify integration + scraping pipeline
- ⏳ Phase 3: LLM analysis pipeline
- ⏳ Phase 4: Email + WhatsApp delivery
- ⏳ Phase 5: Dashboard UI (MVP)
- ⏳ Phase 6: Cron scheduling + automation

