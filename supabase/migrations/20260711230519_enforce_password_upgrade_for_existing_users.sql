begin;

create temporary table _password_upgrade_targets on commit drop as
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where not (
  coalesce((u.raw_app_meta_data ->> 'must_change_password')::boolean, false)
  or coalesce((u.raw_user_meta_data ->> 'must_change_password')::boolean, false)
  or coalesce(p.must_change_password, false)
);

update auth.users u
set
  raw_app_meta_data = jsonb_set(
    jsonb_set(coalesce(u.raw_app_meta_data, '{}'::jsonb), '{must_change_password}', 'true'::jsonb, true),
    '{password_policy_enforced_batch}',
    to_jsonb('existing_users_2026_07_11'::text),
    true
  ),
  raw_user_meta_data = jsonb_set(
    jsonb_set(coalesce(u.raw_user_meta_data, '{}'::jsonb), '{must_change_password}', 'true'::jsonb, true),
    '{password_policy_enforced_batch}',
    to_jsonb('existing_users_2026_07_11'::text),
    true
  ),
  updated_at = now()
where u.id in (select id from _password_upgrade_targets);

update public.profiles p
set
  must_change_password = true,
  updated_at = now()
where p.id in (select id from _password_upgrade_targets);

commit;;
