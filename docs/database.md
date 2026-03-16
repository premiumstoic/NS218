# Database Schema

The NS218 database runs on PostgreSQL (via Supabase) and heavily utilizes Row Level Security (RLS) policies for granular authorization and constraints.

## Core Entities

### Profiles (`profiles`)
Linked 1-to-1 with the Supabase `auth.users` authentication table via a trigger during sign up. Contains fields for user data and assigns the `'student'` or `'teacher'` enumeration role.

### Weeks (`weeks`)
The highest chronological organizational structure of the course. Groups material according to timeframes. Teachers define whether a week is published and visible. 

### Content Items (`content_items`)
A polymorphic table that stores all teacher-generated module material within a specific week.
Content types are constrained to the enum: `'note'`, `'flashcards'`, `'quiz'`, `'simulation'`, `'resource'`.

- **Flashcards (`flashcards`)**: Bound to a specific `content_item`, rendering dual-faced prompt cards.
- **Quizzes (`quiz_questions`, `quiz_options`, `quiz_attempts`)**: Relational tables enabling complex quiz structuring (`single_choice`, `multiple_choice`). Tracks student attempts (`score`, `answers`, `feedback`).

### Student Uploads (`uploads`)
Reflects materials provided by students (such as assignments or submissions). Tracks external locations of the uploaded Supabase bucket objects. Managed by a `upload_status` enum (`published`, `hidden`).

### Comments (`comments`)
Centralized threaded discussion model. Comments are constrained polymorphically to a specific contextual target via physical entity keys (`target_target_type` enum over `'week'`, `'content_item'`, `'upload'`). 

## Row Level Security (RLS) policies

RLS guarantees isolated access rights natively processed by the PostgreSQL engine.
The general heuristics implemented include:
- **Students (Anon / Student Role)**: Can `SELECT` (read) entities that are marked as `published: true` (or are explicitly public). Can `INSERT` against their own contextual boundaries (their own comments, their own quiz attempts, their own uploads).
- **Teachers**: Possess nearly ubiquitous `SELECT`, `UPDATE`, and `DELETE` capacities across the dataset checked securely via the injected Postgres helper function `public.is_teacher()`.

## Storage
The `course-files` bucket integrates its own decoupled RLS implementation where explicit uploads write directly against `storage.objects` provided permissions validate.
