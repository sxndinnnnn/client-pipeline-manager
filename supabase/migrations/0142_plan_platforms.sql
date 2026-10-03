-- Per-platform pricing for plans. Each platform on a plan is billed either per unit or
-- per shipment, with a quantity and a price per unit/shipment in both LKR and USD.
-- plans.amount_lkr / amount_usd / vehicle_count / shipment_count stay as the plan's
-- totals; the app recomputes them from these rows whenever a plan is saved, so deals and
-- reports keep reading the same columns. Existing plans have no rows here and keep their
-- current totals until they are edited and priced per platform.

create table plan_platforms (
  plan_id uuid not null references plans(id) on delete cascade,
  platform text not null check (platform in ('GPS', 'TMS', 'DVR', 'HSC', 'FMS')),
  billing_basis text not null check (billing_basis in ('UNITS', 'SHIPMENTS')),
  quantity numeric(12,2) not null check (quantity >= 0),
  price_lkr numeric(12,2) not null check (price_lkr >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  primary key (plan_id, platform)
);

alter table plan_platforms enable row level security;
create policy "authenticated full access" on plan_platforms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
