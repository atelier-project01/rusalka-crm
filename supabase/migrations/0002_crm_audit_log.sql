-- Append-only audit log for sensitive CRM actions (PII access, order/customer
-- changes, exports). Lives in the ecommerce (customer-data) project alongside
-- what it audits. Actor is a RusalkaOps staff identity (stored as plain ids).

create table if not exists public.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  detail jsonb
);
create index if not exists crm_audit_log_created_idx on public.crm_audit_log(created_at desc);
create index if not exists crm_audit_log_entity_idx on public.crm_audit_log(entity_type, entity_id);

-- Default-deny: written server-side via the service role; read by admins only
-- once staff-role RLS lands. No update/delete policy -> effectively append-only.
alter table public.crm_audit_log enable row level security;
