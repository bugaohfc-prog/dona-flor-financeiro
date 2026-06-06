select
  'storage_buckets' as diagnostico,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by name;

select
  'storage_bucket_policies' as diagnostico,
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  cmd as command,
  roles,
  permissive,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'storage'
  and tablename in ('buckets', 'objects')
order by tablename, policyname;

select
  'storage_grants_anon_authenticated' as diagnostico,
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'storage'
  and table_name in ('buckets', 'objects')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select
  'storage_recent_objects_sample' as diagnostico,
  bucket_id,
  name,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
from storage.objects
order by created_at desc
limit 50;
