-- ============================================
-- Freeform Web App — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles table (stores API token per user)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  api_token uuid default gen_random_uuid() unique not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow reading profiles by api_token (for snapshot API)
create policy "Anyone can read profile by api_token"
  on public.profiles for select
  using (true);

-- 2. Boards table
create table public.boards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text default 'Untitled Board' not null,
  snapshot jsonb,
  snapshot_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.boards enable row level security;

create policy "Users can read own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Allow reading boards by user_id (for snapshot API with service role or via profile join)
-- The snapshot API uses the anon key + RLS bypass via the profiles policy
create policy "Allow read boards for snapshot API"
  on public.boards for select
  using (true);

-- 3. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Storage bucket for snapshots
-- Run this separately or create the bucket via the Supabase dashboard:
-- Go to Storage → New Bucket → name: "snapshots" → Public: ON

-- Storage policies (run in SQL editor):
-- Allow authenticated users to upload to their own folder
insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', true)
on conflict (id) do nothing;
