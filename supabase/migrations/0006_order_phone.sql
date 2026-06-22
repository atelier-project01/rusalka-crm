-- Delivery phone on orders. customer_orders is storefront-owned; this column is
-- additive and safe. The CRM displays it immediately; capturing it at checkout
-- in the storefront is a separate, tracked task.

alter table public.customer_orders add column if not exists shipping_phone text;
