-- Customer Care: care items linked to a customer, optionally to an order or
-- consultation. Triage = status + assignee; resolution recorded on the item.
-- Lives in the ecommerce (customer-data) project. Idempotent.

create table if not exists public.care_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  subject text not null,
  body text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  assignee text,
  linked_order_id uuid references public.customer_orders(id) on delete set null,
  linked_quiz_id uuid references public.quiz_results(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists care_items_customer_idx on public.care_items(customer_id, created_at desc);
create index if not exists care_items_status_idx on public.care_items(status, created_at desc);

-- RLS on, no public policies: CRM reads/writes server-side via service role,
-- behind the staff-login gate.
alter table public.care_items enable row level security;
