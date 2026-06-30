-- Segmentation configuration: admin-defined dropdown value lists for the group
-- builder (skin types, concerns, lifecycle stages, tags), so the team curates a
-- clean canonical set instead of the builder deriving messy/duplicate values
-- from the data. Applied to the ecommerce customer DB (test uieuy + prod kdjcb).

create table if not exists public.segment_config (
  key        text primary key,
  values     jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.segment_config enable row level security;  -- service-role only

insert into public.segment_config(key, values) values
  ('skin_types', '["Oily","Dry","Combination","Sensitive","Normal"]'::jsonb),
  ('lifecycle_stages', '["lead","customer","subscriber","churned"]'::jsonb)
on conflict (key) do nothing;

insert into public.segment_config(key, values)
select 'concerns', coalesce(to_jsonb(array_agg(distinct c order by c)), '[]'::jsonb)
from (select unnest(concerns) c from public.quiz_results where concerns is not null) t
on conflict (key) do nothing;

insert into public.segment_config(key, values)
select 'tags', coalesce(to_jsonb(array_agg(distinct t order by t)), '[]'::jsonb)
from (select unnest(tags) t from public.customers where tags is not null) t2
on conflict (key) do nothing;
