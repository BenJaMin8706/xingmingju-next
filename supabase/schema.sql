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

create table if not exists public.credit_events (
  event_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.reports add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_skill_id_idx on public.reports (skill_id);
create index if not exists reports_user_id_idx on public.reports (user_id, created_at desc);
create index if not exists credit_events_user_id_idx on public.credit_events (user_id, created_at desc);

create or replace function public.adjust_user_credits(
  p_user_id uuid,
  p_delta integer,
  p_reason text,
  p_event_id text
)
returns table (success boolean, new_balance integer, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_balance integer;
  updated_balance integer;
begin
  select coalesce((raw_user_meta_data ->> 'credits')::integer, 0)
    into current_balance
    from auth.users
    where id = p_user_id
    for update;

  if not found then
    return query select false, 0, false;
    return;
  end if;

  if exists (select 1 from public.credit_events where event_id = p_event_id) then
    return query select true, current_balance, true;
    return;
  end if;

  updated_balance := current_balance + p_delta;
  if updated_balance < 0 then
    return query select false, current_balance, false;
    return;
  end if;

  update auth.users
    set raw_user_meta_data = case
      when p_reason = 'welcome_bonus' then
        jsonb_set(
          jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{credits}', to_jsonb(updated_balance), true),
          '{welcomeBonusGranted}',
          'true'::jsonb,
          true
        )
      else
        jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{credits}', to_jsonb(updated_balance), true)
      end
    where id = p_user_id;

  insert into public.credit_events (event_id, user_id, delta, reason)
    values (p_event_id, p_user_id, p_delta, p_reason);

  return query select true, updated_balance, false;
end;
$$;

revoke all on function public.adjust_user_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.adjust_user_credits(uuid, integer, text, text) to service_role;

-- The service role key bypasses RLS, so this is enough for the server to read/write.
-- If you ever expose these tables to the browser, add Row Level Security policies first.
alter table public.question_stats enable row level security;
alter table public.reports enable row level security;
alter table public.credit_events enable row level security;
