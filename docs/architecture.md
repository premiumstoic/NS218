# Architecture Overview

The NS218 Interactive Class Playground is a monolithic full-stack web application.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router paradigm) using React 19.
- **Language**: TypeScript throughout the repository.
- **Database / Backend-as-a-Service**: [Supabase](https://supabase.com/). Acts as the authentication provider, PostgreSQL database, and cloud storage solution.
- **Styling**: Vanilla CSS (`globals.css`) with modular design patterns.
- **Validation**: [Zod](https://zod.dev/) for payload validation on API endpoints and form submissions.
- **Deployment Strategy**: Recommended to be deployed on Vercel.

## Directory Structure
The repository follows a standard Next.js directory organizational layout:

- `app/`: Next.js App Router paths containing pages, layouts, and API routes (`app/api/`).
- `components/`: Reusable React components decoupled into logical folders (e.g., `forms`, `home`, `simulations`).
- `lib/`: Business logic, utility helpers, shared constants, and the initialized Supabase client logic.
- `db/`: Database migrations (`migrations/`) and seed data (`seed/`) for the Postgres database.
- `public/`: Publicly accessible static assets.
- `scripts/`: Custom Node.js scripting for utility commands (e.g., smoke testing).
- `tests/`: End-to-end and unit test configurations (via Vitest).

## Supabase Integration

### Authentication
Authentication operates via `@supabase/ssr` to tightly integrate with Next.js Server Components and Server Actions. Open sign-up is allowed (defaults to Student), and Google OAuth is natively supported.

### Storage
Uses Supabase Storage Buckets. Specifically, the application configures a `course-files` bucket for file payloads like PDFs, images, DOCX, and PPTX with a cap limit of 25MB per file. The `lib/image-compression.ts` contains built-in frontend compression for uploaded images, shrinking and converting them to WEBP formats prior to hitting the backend API.

### APIs
Data mutations predominantly interact via RESTful routes located in `app/api/` (such as `PATCH /api/profile` or `POST /api/uploads`), abstracting the direct Supabase DB requests from the React frontend lifecycle and enforcing security and validation logic before transacting.
