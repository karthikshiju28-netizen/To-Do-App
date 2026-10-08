-- Syllabus To-Do: initial schema, Row Level Security, and private upload bucket.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  color text,
  is_course boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
-- at most one active semester per user
create unique index one_active_semester_per_user on public.semesters (user_id) where is_active;

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id uuid references public.lists (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  status text not null default 'pending'
    check (status in ('pending', 'extracting', 'review', 'saved', 'failed')),
  raw_extraction jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  due_date date not null,
  original_due_date date not null,
  type text not null default 'assignment'
    check (type in ('assignment', 'project', 'exam', 'quiz', 'task')),
  done boolean not null default false,
  done_at timestamptz,
  notes text,
  source_upload_id uuid references public.uploads (id) on delete set null,
  source_quote text,
  created_at timestamptz not null default now()
);
create index items_user_due on public.items (user_id, due_date);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Mon ... 6 = Sun
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id uuid not null references public.templates (id) on delete cascade,
  occurrence_date date not null,
  done boolean not null default true,
  unique (template_id, occurrence_date)
);

-- ---------- row level security ----------
-- Every table: a signed-in user can only see and change their own rows.

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.semesters enable row level security;
alter table public.uploads enable row level security;
alter table public.items enable row level security;
alter table public.templates enable row level security;
alter table public.completions enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own lists" on public.lists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own semesters" on public.semesters for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The extra checks stop a user from pointing their row at someone else's list/template.
create policy "own uploads" on public.uploads for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (list_id is null or exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid()))
  );

create policy "own items" on public.items for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "own templates" on public.templates for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid())
  );

create policy "own completions" on public.completions for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.templates t where t.id = template_id and t.user_id = auth.uid())
  );

-- ---------- create a profile automatically on signup ----------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- private storage bucket for uploaded syllabi ----------
-- Files live at uploads/<user id>/<file>; users can only touch their own folder.

insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', false, 10485760)
on conflict (id) do nothing;

create policy "own upload files" on storage.objects for all to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
