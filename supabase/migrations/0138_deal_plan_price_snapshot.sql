-- Gain/Loss accuracy: remember the plan price a deal was sold at.
-- The report used to read the plan's CURRENT price, so editing a plan in Settings
-- silently rewrote every past deal's gain/loss. These columns freeze the price at the
-- moment a plan is set on the deal. Run after 0112. The app keeps working if this has
-- not been run yet (it falls back to the live plan price).

alter table deals
  add column plan_amount_lkr numeric(12,2),
  add column plan_amount_usd numeric(12,2);

-- Backfill from the current plan prices (the best information available for old deals).
update deals d
set plan_amount_lkr = p.amount_lkr,
    plan_amount_usd = p.amount_usd
from plans p
where p.id = d.plan_id;
