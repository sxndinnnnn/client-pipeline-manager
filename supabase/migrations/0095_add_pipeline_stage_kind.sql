-- Pipeline stages get an explicit status category (Pending / In Progress /
-- Won / Lost) instead of move_deal_stage() inferring WON/LOST from the
-- stage's *name* - which silently broke deal status if a stage was ever
-- renamed away from "Won"/"Lost". Backfill assigns the categories the
-- existing seeded stages already represent; every other stage defaults to
-- In Progress.

alter table pipeline_stages
  add column kind text not null default 'IN_PROGRESS'
    check (kind in ('PENDING', 'IN_PROGRESS', 'WON', 'LOST'));

update pipeline_stages set kind = 'PENDING' where name = 'Lead';
update pipeline_stages set kind = 'WON' where name = 'Won';
update pipeline_stages set kind = 'LOST' where name = 'Lost';

create or replace function move_deal_stage(p_deal_id uuid, p_stage_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage_name text;
  v_stage_kind text;
  v_status text := 'OPEN';
  v_closed_at timestamptz := null;
begin
  select name, kind into v_stage_name, v_stage_kind
  from pipeline_stages where id = p_stage_id;

  if v_stage_name is null then
    raise exception 'Unknown pipeline stage: %', p_stage_id;
  end if;

  if v_stage_kind = 'WON' then
    v_status := 'WON';
    v_closed_at := now();
  elsif v_stage_kind = 'LOST' then
    v_status := 'LOST';
    v_closed_at := now();
  end if;

  update deals
  set stage_id = p_stage_id,
      status = v_status,
      closed_at = v_closed_at,
      updated_at = now()
  where id = p_deal_id;

  if not found then
    raise exception 'Unknown deal: %', p_deal_id;
  end if;

  insert into activities (deal_id, author_id, type, content)
  values (p_deal_id, auth.uid(), 'note', 'Deal moved to stage: ' || v_stage_name);
end;
$$;
