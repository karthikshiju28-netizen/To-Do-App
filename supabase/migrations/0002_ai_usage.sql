-- Counts AI calls per user so quick-add can be rate limited.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index ai_usage_user_kind_time on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;

-- Users can see and add their own usage rows (needed for the daily count), nothing else.
create policy "read own usage" on public.ai_usage for select to authenticated
  using (user_id = auth.uid());
create policy "add own usage" on public.ai_usage for insert to authenticated
  with check (user_id = auth.uid());
