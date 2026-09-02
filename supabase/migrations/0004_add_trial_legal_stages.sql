-- Add "Trial" and "Legal" pipeline stages, between Negotiation and Won.
-- Shift Won/Lost up first to free the sort_order slots (sort_order is unique).
update pipeline_stages set sort_order = sort_order + 2 where name in ('Won', 'Lost');

insert into pipeline_stages (name, sort_order) values
  ('Trial', 5),
  ('Legal', 6);
