-- Add student progress tracking

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(user_id, content_item_id)
);

create index if not exists idx_student_progress_user_id on public.student_progress(user_id);
create index if not exists idx_student_progress_content_item_id on public.student_progress(content_item_id);
create index if not exists idx_student_progress_user_content on public.student_progress(user_id, content_item_id);

-- RLS
alter table public.student_progress enable row level security;

create policy "student_progress_select_self_or_teacher"
  on public.student_progress for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "student_progress_insert_self"
  on public.student_progress for insert
  with check (user_id = auth.uid());

create policy "student_progress_delete_self"
  on public.student_progress for delete
  using (user_id = auth.uid());
