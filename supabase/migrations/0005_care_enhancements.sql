-- Care module enhancements: priority + due date on care_items, plus a reply
-- thread (care_replies). Additive and idempotent. Applied to the test branch
-- first, then prod, via the Supabase Management API.

alter table public.care_items
  add column if not exists priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent'));

alter table public.care_items
  add column if not exists due_at timestamptz;

create table if not exists public.care_replies (
  id uuid primary key default gen_random_uuid(),
  care_id uuid not null references public.care_items(id) on delete cascade,
  body text not null,
  author text,
  created_at timestamptz not null default now()
);
create index if not exists care_replies_care_idx on public.care_replies(care_id, created_at);

-- Default-deny RLS: written/read server-side via the service role, like the
-- other CRM tables.
alter table public.care_replies enable row level security;
