-- Yearly sales targets are now entered in both LKR and USD.
-- Existing targets keep a null USD amount until they are saved again.

alter table sales_targets
  add column amount_usd numeric(14,2) check (amount_usd >= 0);
