-- CRM customer model, on the ecommerce Supabase project.
-- customers extends auth.users 1:1; customer_interactions = notes/timeline; consents = GDPR.
-- Idempotent. Applied to the test branch first, then prod via the pipeline.

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead','customer','subscriber','churned')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note','event')),
  body text not null,
  author text,
  created_at timestamptz not null default now()
);
create index if not exists customer_interactions_customer_idx
  on public.customer_interactions(customer_id, created_at desc);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  channel text not null default 'marketing_email',
  opted_in boolean not null,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists consents_customer_idx
  on public.consents(customer_id, created_at desc);

-- RLS on, no public policies: the CRM reads via the service role behind the
-- staff-login gate. Staff-role policies are added with the roles model.
alter table public.customers enable row level security;
alter table public.customer_interactions enable row level security;
alter table public.consents enable row level security;

-- Keep customers in sync with auth: every new signup gets a customers row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill for users that existed before the trigger.
insert into public.customers (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- NOTE: customer_orders and quiz_results are storefront-owned tables that live
-- in this same (ecommerce) project; the CRM reads them but does not define them here.
