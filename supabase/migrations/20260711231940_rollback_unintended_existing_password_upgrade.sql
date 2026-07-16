begin;

create temporary table _rollback_password_upgrade_targets on commit drop as
select u.id
from auth.users u
where u.raw_app_meta_data ->> 'password_policy_enforced_batch' = 'existing_users_2026_07_11'
   or u.raw_user_meta_data ->> 'password_policy_enforced_batch' = 'existing_users_2026_07_11';

update auth.users u
set
  raw_app_meta_data = jsonb_set(
    coalesce(u.raw_app_meta_data, '{}'::jsonb) - 'password_policy_enforced_batch',
    '{must_change_password}',
    'false'::jsonb,
    true
  ),
  raw_user_meta_data = jsonb_set(
    coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'password_policy_enforced_batch',
    '{must_change_password}',
    'false'::jsonb,
    true
  ),
  updated_at = now()
where u.id in (select id from _rollback_password_upgrade_targets);

update public.profiles p
set
  must_change_password = false,
  updated_at = now()
where p.id in (select id from _rollback_password_upgrade_targets);

commit;;
