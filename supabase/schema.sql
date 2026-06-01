-- Run this in Supabase SQL Editor once.

create table if not exists public.question_stats (
  date date primary key,
  counts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key,
  created_at timestamptz not null default now(),
  skill_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null,
  result jsonb not null
);

alter table public.reports add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_skill_id_idx on public.reports (skill_id);
create index if not exists reports_user_id_idx on public.reports (user_id, created_at desc);

-- The service role key bypasses RLS, so this is enough for the server to read/write.
-- If you ever expose these tables to the browser, add Row Level Security policies first.
alter table public.question_stats enable row level security;
alter table public.reports enable row level security;
