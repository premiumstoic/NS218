-- Add week archive support and profile personalization fields.
alter table public.weeks
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_weeks_archived_at on public.weeks(archived_at);

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists theme_token text not null default 'sage';

alter table public.profiles drop constraint if exists profiles_theme_token_check;
alter table public.profiles
  add constraint profiles_theme_token_check
  check (theme_token in ('sage', 'ocean', 'amber', 'rose', 'slate'));

-- Improve initial profile name fallback for OAuth identities.
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
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    'student'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

-- Archive-aware public visibility checks for comment targets.
create or replace function public.target_is_public(target_type public.comment_target_type, target_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when target_type = 'week' then exists (
      select 1
      from public.weeks w
      where w.id = target_id and w.published = true and w.archived_at is null
    )
    when target_type = 'content_item' then exists (
      select 1
      from public.content_items c
      join public.weeks w on w.id = c.week_id
      where c.id = target_id and c.published_at is not null and w.published = true and w.archived_at is null
    )
    when target_type = 'upload' then exists (
      select 1
      from public.uploads u
      join public.weeks w on w.id = u.week_id
      where u.id = target_id and u.status = 'published' and w.published = true and w.archived_at is null
    )
    else false
  end;
$$;

-- Update read policies to exclude archived weeks from public/student views.
drop policy if exists "weeks_read_published_or_teacher" on public.weeks;
create policy "weeks_read_published_or_teacher"
on public.weeks
for select
to anon, authenticated
using (public.is_teacher() or (published = true and archived_at is null));

drop policy if exists "content_read_published_or_teacher" on public.content_items;
create policy "content_read_published_or_teacher"
on public.content_items
for select
to anon, authenticated
using (
  public.is_teacher()
  or (
    published_at is not null
    and exists (
      select 1
      from public.weeks w
      where w.id = week_id and w.published = true and w.archived_at is null
    )
  )
);

drop policy if exists "flashcards_read" on public.flashcards;
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
    where c.id = content_item_id and c.published_at is not null and w.published = true and w.archived_at is null
  )
);

drop policy if exists "quiz_questions_read" on public.quiz_questions;
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
    where c.id = content_item_id and c.published_at is not null and w.published = true and w.archived_at is null
  )
);

drop policy if exists "quiz_options_read" on public.quiz_options;
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
    where q.id = question_id and c.published_at is not null and w.published = true and w.archived_at is null
  )
);

drop policy if exists "uploads_read_published_or_teacher" on public.uploads;
create policy "uploads_read_published_or_teacher"
on public.uploads
for select
to anon, authenticated
using (
  public.is_teacher()
  or (
    status = 'published'
    and exists (
      select 1
      from public.weeks w
      where w.id = week_id and w.published = true and w.archived_at is null
    )
  )
);

drop policy if exists "comments_insert_authenticated_author" on public.comments;
create policy "comments_insert_authenticated_author"
on public.comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and public.target_exists(target_type, target_id)
  and (public.target_is_public(target_type, target_id) or public.is_teacher())
);

-- Add dedicated avatar bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_profile_avatars_read" on storage.objects;
create policy "storage_profile_avatars_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'profile-avatars');

drop policy if exists "storage_profile_avatars_insert" on storage.objects;
create policy "storage_profile_avatars_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'profile-avatars');

drop policy if exists "storage_profile_avatars_update" on storage.objects;
create policy "storage_profile_avatars_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'profile-avatars' and (owner = auth.uid() or public.is_teacher()))
with check (bucket_id = 'profile-avatars' and (owner = auth.uid() or public.is_teacher()));

drop policy if exists "storage_profile_avatars_delete" on storage.objects;
create policy "storage_profile_avatars_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'profile-avatars' and (owner = auth.uid() or public.is_teacher()));
