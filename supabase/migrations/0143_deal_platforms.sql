-- A deal's own copy of its plan's per-platform lines. Picking a plan on a deal pre-fills
-- these from plan_platforms; they can then be edited for this deal only (different
-- quantities or prices) without touching the plan. deals.value / value_usd stay as the
-- totals, recomputed by the app whenever a deal with lines is saved. Deals created before
-- this have no rows and keep their stored values. Run after 0142.

create table deal_platforms (
  deal_id uuid not null references deals(id) on delete cascade,
  platform text not null check (platform in ('GPS', 'TMS', 'DVR', 'HSC', 'FMS')),
  billing_basis text not null check (billing_basis in ('UNITS', 'SHIPMENTS')),
  quantity numeric(12,2) not null check (quantity >= 0),
  price_lkr numeric(12,2) not null check (price_lkr >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  primary key (deal_id, platform)
);

alter table deal_platforms enable row level security;
create policy "authenticated full access" on deal_platforms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
