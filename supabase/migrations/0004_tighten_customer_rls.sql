-- Tighten RLS on the relocated customer tables: drop the legacy, over-permissive
-- anon policies (they let anyone read/insert all rows). Not needed:
--   - the CRM reads server-side via the service role (bypasses RLS),
--   - the storefront reads a customer's OWN rows via the per-user policies.
-- RLS stays enabled; the "Users can view/insert own" policies remain.

drop policy if exists "Allow anon read customer_orders"   on public.customer_orders;
drop policy if exists "Allow anon insert customer_orders" on public.customer_orders;
drop policy if exists "Allow anon read quiz_results"      on public.quiz_results;
drop policy if exists "Allow anon insert quiz_results"    on public.quiz_results;
