# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm run test         # Run unit tests (Vitest)
npm run smoke:real   # Integration tests against real DB (requires .env.local)
```

## Architecture

**NS218 Interactive Class Playground** — a week-centric learning platform for the NS218 course (Spring 2026). Built with Next.js 15 App Router, React 19, TypeScript (strict), and Supabase (PostgreSQL + Auth + Storage).

### Role Model

- Default role on signup: `student`
- Teacher role is granted by email match against the `TEACHER_EMAILS` env var (comma-separated)
- Role is set once in `lib/profile.ts:ensureProfileForUser()` and stored in `profiles.role`

### Auth Flow

- Supabase SSR auth — server client in `lib/supabase/server.ts`, browser client in `lib/supabase/browser.ts`
- `middleware.ts` refreshes the session on every request
- OAuth callback at `/auth/callback`
- Server helpers: `lib/auth.ts` (`requireAuth`, `requireTeacher`, `getCurrentProfile`)
- API route guard: `lib/api-auth.ts` → `requireApiProfile({ teacherOnly?: true })`

### API Route Conventions

All API routes follow this pattern:
1. Call `requireApiProfile()` (or `requireApiProfile({ teacherOnly: true })` for teacher-only)
2. Validate request body with Zod schemas from `lib/validators/api.ts`
3. Return `422` with `schema.flatten()` for validation errors, `401/403` for auth errors

### Database

PostgreSQL via Supabase with RLS. Apply migrations in order:

```
db/migrations/001_init.sql                            # Core schema
db/migrations/002_increase_course_files_limit_25mb.sql
db/migrations/003_week_archive_profile_personalization_google.sql
db/migrations/004_student_progress_tracking.sql
db/migrations/005_notifications.sql
db/migrations/006_teacher_analytics.sql
db/seed/001_ns218_weeks.sql                           # Pre-populated weeks
```

Key tables: `profiles`, `weeks`, `content_items`, `flashcards`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `uploads`, `comments`.

### Content Types

Content items (`content_items.type`): `note`, `flashcard_deck`, `quiz`, `simulation`, `resource`. Quizzes support single/multiple choice with explanations. Simulations are built-in React components (`components/simulations/`).

### File Uploads

Files go to Supabase Storage bucket `course-files` (max 25 MB). Client-side WEBP compression for images via `lib/image-compression.ts`. Accepted types: PDF, PNG, JPEG, WEBP, DOC/DOCX, PPT/PPTX.

### Theming

5 theme tokens: `sage`, `ocean`, `amber`, `rose`, `slate`. CSS variables are set on `:root` in `app/globals.css` and per-theme in `lib/theme.ts`. User's chosen token is stored in `profiles.theme_token`.

### Key Lib Modules

| Module | Purpose |
|--------|---------|
| `lib/types.ts` | All TypeScript interfaces |
| `lib/constants.ts` | MIME types, file size limits, content labels, theme colors |
| `lib/validators/api.ts` | Zod schemas for all API payloads |
| `lib/sanitize.ts` | HTML sanitization (DOMPurify) for rich text content |
| `lib/notifications.ts` | Comment reply notification helpers |
| `lib/date-utils.ts` | Date formatting |
| `lib/env.ts` | `getEnv()`, `getTeacherEmailSet()` |

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TEACHER_EMAILS=teacher@example.com,other@example.com  # comma-separated
```
