-- Applied via the Supabase MCP on 2026-10-08.
-- The signup trigger function should only run as a trigger, never via the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Users who signed up before the profiles table existed.
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
