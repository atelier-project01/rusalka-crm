-- Customer segmentation ("Smart Customer Groups").
-- Saved segments + a flattened per-customer profile view that the segment
-- filters query against (one row per customer: latest quiz + order aggregates).
-- Applied to the ecommerce customer DB (test uieuy + prod kdjcb).

create table if not exists public.segments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  type        text not null default 'living' check (type in ('living','frozen')),
  rules       jsonb not null default '[]'::jsonb,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.segment_members (
  segment_id  uuid not null references public.segments(id) on delete cascade,
  user_id     uuid not null,
  captured_at timestamptz not null default now(),
  primary key (segment_id, user_id)
);

-- Service-role only (the CRM reads/writes these server-side); no anon/auth policies.
alter table public.segments        enable row level security;
alter table public.segment_members enable row level security;

create or replace view public.customer_seg_profile as
select
  c.id as user_id, c.email, c.full_name, c.lifecycle_stage, c.tags, c.created_at,
  q.skin_type, q.concerns,
  coalesce(o.order_count, 0)        as order_count,
  coalesce(o.total_spent, 0)        as total_spent,
  o.last_order_at,
  coalesce(o.is_subscriber, false)  as is_subscriber,
  o.last_country
from public.customers c
left join lateral (
  select skin_type, concerns from public.quiz_results
  where user_id = c.id order by created_at desc limit 1
) q on true
left join lateral (
  select count(*) as order_count, coalesce(sum(total),0) as total_spent,
         max(created_at) as last_order_at,
         bool_or(subscription_plan is not null and subscription_plan <> 'one-time') as is_subscriber,
         (array_agg(shipping_country order by created_at desc) filter (where shipping_country is not null))[1] as last_country
  from public.customer_orders where user_id = c.id
) o on true;

revoke all on public.customer_seg_profile from anon, authenticated;
