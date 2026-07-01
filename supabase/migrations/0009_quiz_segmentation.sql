-- Expose the curated quiz answers on the segmentation profile so Customer Groups
-- can filter on consultation data (not just the derived skin_type + concerns).
-- Values are pulled from the customer's LATEST quiz_results.answers JSONB, keyed
-- by question id. Single-select answers -> text; multi-select answers -> text[].
-- New columns are APPENDED after the existing ones (CREATE OR REPLACE VIEW cannot
-- reorder/insert columns). Applied to the ecommerce customer DB (test uieuy + prod kdjcb).

create or replace view public.customer_seg_profile as
select
  c.id as user_id, c.email, c.full_name, c.lifecycle_stage, c.tags, c.created_at,
  q.skin_type, q.concerns,
  coalesce(o.order_count, 0)        as order_count,
  coalesce(o.total_spent, 0)        as total_spent,
  o.last_order_at,
  coalesce(o.is_subscriber, false)  as is_subscriber,
  o.last_country,
  -- curated quiz fields (latest consultation)
  q.answers->>'1'  as age,
  q.answers->>'3'  as region,
  q.answers->>'4'  as environment,
  q.answers->>'18' as skin_tone,
  q.answers->>'21' as routine_steps,
  q.answers->>'27' as retinol_experience,
  q.answers->>'31' as fragrance_pref,
  q.answers->>'10' as pregnancy,
  case when jsonb_typeof(q.answers->'16') = 'array' then array(select jsonb_array_elements_text(q.answers->'16')) end as skin_conditions,
  case when jsonb_typeof(q.answers->'25') = 'array' then array(select jsonb_array_elements_text(q.answers->'25')) end as ingredient_values,
  case when jsonb_typeof(q.answers->'29') = 'array' then array(select jsonb_array_elements_text(q.answers->'29')) end as avoid_ingredients
from public.customers c
left join lateral (
  select skin_type, concerns, answers from public.quiz_results
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
