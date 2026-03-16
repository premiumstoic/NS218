# Setup and Deployment Guide

## Prerequisites
- Node.js (version 20+ recommended)
- `npm`
- A [Supabase](https://supabase.com/) account/project

## 1. Dependency Installation
Initialize your local tree by fetching dependencies:

```bash
npm install
```

## 2. Environment Configuration
Duplicate the provided example payload into your active Git-ignored local variables map:

```bash
cp .env.example .env.local
```

Next, fill out the newly created `.env.local` by retrieving your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` credentials through the API Settings section of your active Supabase project.

## 3. Database Bootstrapping
You must apply the foundational schema constructs to your Supabase Postgres deployment.

Navigate to your Supabase SQL Editor and execute the following sequential scripts obtained from `/db/`:

1.  `db/migrations/001_init.sql` (Foundational Tables and RLS schemas)
2.  `db/migrations/002_increase_course_files_limit_25mb.sql`
3.  `db/migrations/003_week_archive_profile_personalization_google.sql`
4.  `db/seed/001_ns218_weeks.sql` (Inserts fallback curriculum data)

## 4. Run Development Server
Bring the interactive Next.js environment online:

```bash
npm run dev
```

The system will report operational readiness generally pointing at `http://localhost:3000/`.

## 5. Google OAuth Setup (Optional but Recommended)
For Google authentication:
1. Generate OAuth 2.0 Client credentials via the Google Cloud Console.
2. In your Supabase Dashboard: Navigate to **Authentication > Providers** and activate **Google**.
3. Supply the Google Client ID and Secret to Supabase.
4. Input your valid redirect URLs inside the Supabase Provider configuration:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://<your-vercel-domain>/auth/callback`
