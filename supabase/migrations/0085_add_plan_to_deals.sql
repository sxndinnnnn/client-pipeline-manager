-- Deals can now carry a Plan (nullable - existing deals had no plan).
alter table deals add column plan_id uuid references plans(id);
create index on deals (plan_id);
