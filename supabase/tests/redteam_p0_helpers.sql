create or replace function public.redteam_set_claims(p_user_id uuid, p_email text)
returns void language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id, 'email', p_email, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create or replace function public.redteam_throws(p_sql text, p_state text)
returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return sqlstate = p_state;
end;
$$;

create or replace function public.redteam_rows_affected(p_sql text)
returns bigint language plpgsql as $$
declare
  v_rows bigint;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;
