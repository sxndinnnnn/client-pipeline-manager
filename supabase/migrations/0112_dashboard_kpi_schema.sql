-- Schema support for the revamped dashboard KPIs:
--   * deal_stage_events: history of every stage a deal entered (conversion
--     funnel, stale deals, "stage where deals are lost")
--   * deals.lost_reason: why a deal was lost
--   * pipeline_stages.win_probability: per-stage % for the weighted pipeline
--   * sales_targets: yearly revenue target (coverage, revenue-vs-target)
-- Run AFTER 0111. The app keeps working if this hasn't been run yet; the new
-- dashboard widgets just show empty states.

-- 1. Stage history ---------------------------------------------------------
create table deal_stage_events (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references deals(id) on delete cascade,
  stage_id uuid not null references pipeline_stages(id) on delete cascade,
  entered_at timestamptz not null default now()
);

create index on deal_stage_events (deal_id);
create index on deal_stage_events (entered_at);

alter table deal_stage_events enable row level security;
create policy "authenticated full access" on deal_stage_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Record the initial stage whenever a deal is created.
create or replace function record_initial_deal_stage()
returns trigger
language plpgsql
security invoker
as $$
begin
  if new.stage_id is not null then
    insert into deal_stage_events (deal_id, stage_id, entered_at)
    values (new.id, new.stage_id, coalesce(new.created_at, now()));
  end if;
  return new;
end;
$$;

create trigger deals_record_initial_stage
  after insert on deals
  for each row execute function record_initial_deal_stage();

-- Backfill: every existing deal started in the first stage...
insert into deal_stage_events (deal_id, stage_id, entered_at)
select d.id,
       (select id from pipeline_stages order by sort_order asc limit 1),
       d.created_at
from deals d
where exists (select 1 from pipeline_stages);

-- ...then replay the "Deal moved to stage: X" notes move_deal_stage() wrote.
insert into deal_stage_events (deal_id, stage_id, entered_at)
select a.deal_id, s.id, a.created_at
from activities a
join pipeline_stages s
  on a.content = 'Deal moved to stage: ' || s.name
where a.deal_id is not null;

-- 2. Lost reason -----------------------------------------------------------
alter table deals add column lost_reason text;

-- 3. Win probability per stage ----------------------------------------------
alter table pipeline_stages
  add column win_probability int not null default 25
    check (win_probability between 0 and 100);

update pipeline_stages set win_probability = 100 where kind = 'WON';
update pipeline_stages set win_probability = 0 where kind = 'LOST';
update pipeline_stages set win_probability = 10 where kind = 'PENDING';

-- Spread the remaining in-progress stages evenly between 25% and 75% by order.
with ranked as (
  select id,
         row_number() over (order by sort_order) as rn,
         count(*) over () as total
  from pipeline_stages
  where kind = 'IN_PROGRESS'
)
update pipeline_stages p
set win_probability = case
  when r.total = 1 then 50
  else round(25 + (r.rn - 1) * 50.0 / (r.total - 1))
end
from ranked r
where p.id = r.id;

-- 4. Yearly sales target -----------------------------------------------------
create table sales_targets (
  year int primary key check (year between 2000 and 2100),
  amount_lkr numeric(14,2) not null check (amount_lkr >= 0),
  updated_at timestamptz default now()
);

alter table sales_targets enable row level security;
create policy "authenticated full access" on sales_targets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 5. move_deal_stage: record stage history + optional lost reason -----------
drop function if exists move_deal_stage(uuid, uuid);

create or replace function move_deal_stage(
  p_deal_id uuid,
  p_stage_id uuid,
  p_lost_reason text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage_name text;
  v_stage_kind text;
  v_status text := 'OPEN';
  v_closed_at timestamptz := null;
  v_lost_reason text := null;
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
    v_lost_reason := nullif(trim(p_lost_reason), '');
  end if;

  update deals
  set stage_id = p_stage_id,
      status = v_status,
      closed_at = v_closed_at,
      lost_reason = v_lost_reason,
      updated_at = now()
  where id = p_deal_id;

  if not found then
    raise exception 'Unknown deal: %', p_deal_id;
  end if;

  insert into deal_stage_events (deal_id, stage_id) values (p_deal_id, p_stage_id);

  insert into activities (deal_id, author_id, type, content)
  values (p_deal_id, auth.uid(), 'note', 'Deal moved to stage: ' || v_stage_name);
end;
$$;
