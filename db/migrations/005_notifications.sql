-- Add notifications support

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "notifications_select_self"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_self"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications_insert_teacher"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher'
    )
  );
