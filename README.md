# NS218 Interactive Class Playground

Week-centric class platform for NS218 (Spring 2026), built with Next.js App Router + Supabase.

## Features

- Public read access for published weekly modules
- Authenticated student actions: uploads, comments/discussion, quiz attempts
- Teacher dashboard for managing weeks, content, and upload moderation
- Content types: notes, flashcards, quizzes, simulations, resources
- Discussion at both week and content/upload item levels
- Practice quizzes with unlimited retries + explanation feedback

## Tech stack

- Next.js 15 (App Router, TypeScript)
- Supabase Auth + Postgres + Storage + RLS
- Deployable on Vercel

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values.

4. Apply database schema and seed in Supabase SQL editor:

- `db/migrations/001_init.sql`
- `db/migrations/002_increase_course_files_limit_25mb.sql`
- `db/seed/001_ns218_weeks.sql`

5. Run local app:

```bash
npm run dev
```

## Auth + role model

- Open signup is enabled.
- New users default to `student`.
- `teacher` role is assigned by email list in `TEACHER_EMAILS`.

## Storage

- Bucket: `course-files`
- Max file size: `25 MB`
- Allowed file types:
  - PDF
  - PNG/JPG/WEBP
  - DOC/DOCX
  - PPT/PPTX
- Upload flow: files go directly from browser to Supabase Storage, then metadata is saved through `POST /api/uploads`.

## API routes

- `GET /api/weeks`
- `GET /api/weeks/:id`
- `GET /api/weeks/:id/content`
- `POST /api/teacher/weeks`
- `PATCH /api/teacher/weeks/:id`
- `POST /api/teacher/content`
- `PATCH /api/teacher/content/:id`
- `POST /api/uploads`
- `POST /api/comments`
- `DELETE /api/comments/:id`
- `POST /api/quizzes/:id/attempts`
- `GET /api/quizzes/:id/attempts/me`
- `PATCH /api/teacher/uploads/:id`

## Important paths

- UI routes are under `app/`
- Supabase schema/RLS is in `db/migrations/001_init.sql`
- Seed weeks are in `db/seed/001_ns218_weeks.sql`
