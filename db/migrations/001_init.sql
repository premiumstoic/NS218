create extension if not exists pgcrypto;

create type public.user_role as enum ('teacher', 'student');
create type public.content_type as enum ('note', 'flashcards', 'quiz', 'simulation', 'resource');
create type public.upload_status as enum ('published', 'hidden');
create type public.comment_target_type as enum ('week', 'content_item', 'upload');
create type public.question_type as enum ('single_choice', 'multiple_choice');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  week_index int not null,
  title text not null,
  act text,
  start_date date not null,
  is_exam_week boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(course_code, week_index)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  type public.content_type not null,
  title text not null,
  body text,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  front text not null,
  back text not null,
  order_index int not null default 0
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  prompt text not null,
  question_type public.question_type not null,
  explanation text,
  order_index int not null default 0
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  order_index int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(5,2) not null,
  answers jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  file_url text not null,
  mime_type text not null,
  status public.upload_status not null default 'published',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.comment_target_type not null,
  target_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comment_body_length check (char_length(body) between 1 and 3000)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_content_items_updated_at
before update on public.content_items
for each row
execute function public.touch_updated_at();

create trigger touch_comments_updated_at
before update on public.comments
for each row
execute function public.touch_updated_at();

create or replace function public.is_teacher()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'teacher'
  );
$$;

create or replace function public.target_is_public(target_type public.comment_target_type, target_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when target_type = 'week' then exists (
      select 1 from public.weeks w where w.id = target_id and w.published = true
    )
    when target_type = 'content_item' then exists (
      select 1
      from public.content_items c
      join public.weeks w on w.id = c.week_id
      where c.id = target_id and c.published_at is not null and w.published = true
    )
    when target_type = 'upload' then exists (
      select 1 from public.uploads u where u.id = target_id and u.status = 'published'
    )
    else false
  end;
$$;

create or replace function public.target_exists(target_type public.comment_target_type, target_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when target_type = 'week' then exists (
      select 1 from public.weeks w where w.id = target_id
    )
    when target_type = 'content_item' then exists (
      select 1 from public.content_items c where c.id = target_id
    )
    when target_type = 'upload' then exists (
      select 1 from public.uploads u where u.id = target_id
    )
    else false
  end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'student'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create index if not exists idx_weeks_start_date on public.weeks(start_date);
create index if not exists idx_content_items_week_id on public.content_items(week_id);
create index if not exists idx_content_items_type on public.content_items(type);
create index if not exists idx_flashcards_content_item_id on public.flashcards(content_item_id);
create index if not exists idx_quiz_questions_content_item_id on public.quiz_questions(content_item_id);
create index if not exists idx_quiz_options_question_id on public.quiz_options(question_id);
create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index if not exists idx_uploads_week_id on public.uploads(week_id);
create index if not exists idx_comments_target on public.comments(target_type, target_id);

alter table public.profiles enable row level security;
alter table public.weeks enable row level security;
alter table public.content_items enable row level security;
alter table public.flashcards enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.uploads enable row level security;
alter table public.comments enable row level security;

create policy "profiles_select_for_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_self_or_teacher"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_teacher());

create policy "profiles_update_self_or_teacher"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_teacher())
with check (auth.uid() = id or public.is_teacher());

create policy "weeks_read_published_or_teacher"
on public.weeks
for select
to anon, authenticated
using (published = true or public.is_teacher());

create policy "weeks_teacher_write"
on public.weeks
for insert
to authenticated
with check (public.is_teacher());

create policy "weeks_teacher_update"
on public.weeks
for update
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy "weeks_teacher_delete"
on public.weeks
for delete
to authenticated
using (public.is_teacher());

create policy "content_read_published_or_teacher"
on public.content_items
for select
to anon, authenticated
using (
  public.is_teacher()
  or (
    published_at is not null
    and exists (select 1 from public.weeks w where w.id = week_id and w.published = true)
  )
);

create policy "content_teacher_write"
on public.content_items
for insert
to authenticated
with check (public.is_teacher() and created_by = auth.uid());

create policy "content_teacher_update"
on public.content_items
for update
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy "content_teacher_delete"
on public.content_items
for delete
to authenticated
using (public.is_teacher());

create policy "flashcards_read"
on public.flashcards
for select
to anon, authenticated
using (
  public.is_teacher()
  or exists (
    select 1
    from public.content_items c
    join public.weeks w on w.id = c.week_id
    where c.id = content_item_id and c.published_at is not null and w.published = true
  )
);

create policy "flashcards_teacher_write"
on public.flashcards
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy "quiz_questions_read"
on public.quiz_questions
for select
to anon, authenticated
using (
  public.is_teacher()
  or exists (
    select 1
    from public.content_items c
    join public.weeks w on w.id = c.week_id
    where c.id = content_item_id and c.published_at is not null and w.published = true
  )
);

create policy "quiz_questions_teacher_write"
on public.quiz_questions
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy "quiz_options_read"
on public.quiz_options
for select
to anon, authenticated
using (
  public.is_teacher()
  or exists (
    select 1
    from public.quiz_questions q
    join public.content_items c on c.id = q.content_item_id
    join public.weeks w on w.id = c.week_id
    where q.id = question_id and c.published_at is not null and w.published = true
  )
);

create policy "quiz_options_teacher_write"
on public.quiz_options
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy "quiz_attempts_insert_self"
on public.quiz_attempts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "quiz_attempts_select_self_or_teacher"
on public.quiz_attempts
for select
to authenticated
using (auth.uid() = user_id or public.is_teacher());

create policy "uploads_read_published_or_teacher"
on public.uploads
for select
to anon, authenticated
using (status = 'published' or public.is_teacher());

create policy "uploads_insert_self"
on public.uploads
for insert
to authenticated
with check (auth.uid() = uploader_id);

create policy "uploads_update_owner_or_teacher"
on public.uploads
for update
to authenticated
using (auth.uid() = uploader_id or public.is_teacher())
with check (auth.uid() = uploader_id or public.is_teacher());

create policy "uploads_delete_owner_or_teacher"
on public.uploads
for delete
to authenticated
using (auth.uid() = uploader_id or public.is_teacher());

create policy "comments_read_public_targets_or_teacher"
on public.comments
for select
to anon, authenticated
using (public.is_teacher() or public.target_is_public(target_type, target_id));

create policy "comments_insert_authenticated_author"
on public.comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and public.target_exists(target_type, target_id)
);

create policy "comments_update_owner_or_teacher"
on public.comments
for update
to authenticated
using (auth.uid() = author_id or public.is_teacher())
with check (auth.uid() = author_id or public.is_teacher());

create policy "comments_delete_owner_or_teacher"
on public.comments
for delete
to authenticated
using (auth.uid() = author_id or public.is_teacher());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-files',
  'course-files',
  true,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'course-files');

create policy "storage_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'course-files');

create policy "storage_owner_or_teacher_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'course-files' and (owner = auth.uid() or public.is_teacher()))
with check (bucket_id = 'course-files' and (owner = auth.uid() or public.is_teacher()));

create policy "storage_owner_or_teacher_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'course-files' and (owner = auth.uid() or public.is_teacher()));
