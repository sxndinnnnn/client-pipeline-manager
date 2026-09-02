-- Security fix: move_deal_stage previously trusted a caller-supplied
-- p_actor_id and wrote it verbatim into activities.author_id. Because the
-- function is callable directly via PostgREST RPC by any authenticated
-- user, and RLS only checks auth.role() = 'authenticated' (not actor
-- identity), any teammate could attribute an activity note to a different
-- user than themselves. Fix: derive the actor from auth.uid() instead of
-- a parameter, so it can't be spoofed.
drop function if exists move_deal_stage(uuid, uuid, uuid);

create function move_deal_stage(p_deal_id uuid, p_stage_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_stage_name text;
  v_status text := 'OPEN';
  v_closed_at timestamptz := null;
begin
  select name into v_stage_name from pipeline_stages where id = p_stage_id;

  if v_stage_name is null then
    raise exception 'Unknown pipeline stage: %', p_stage_id;
  end if;

  if v_stage_name = 'Won' then
    v_status := 'WON';
    v_closed_at := now();
  elsif v_stage_name = 'Lost' then
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
