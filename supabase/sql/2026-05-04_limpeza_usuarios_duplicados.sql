-- Limpeza segura de usuários duplicados por empresa.
-- Mantém o registro mais antigo/preenchido e remove duplicados que surgiram durante os testes.

with ranqueados as (
  select
    id,
    row_number() over (
      partition by empresa_id, coalesce(nullif(lower(email), ''), user_id::text)
      order by
        case when email is not null and email <> '' then 0 else 1 end,
        case when nome is not null and nome <> '' then 0 else 1 end,
        created_at asc
    ) as rn
  from public.df_usuarios_empresas
  where coalesce(nullif(lower(email), ''), user_id::text) is not null
)
delete from public.df_usuarios_empresas u
using ranqueados r
where u.id = r.id
  and r.rn > 1;

create unique index if not exists idx_df_usuarios_empresas_empresa_email_unique
on public.df_usuarios_empresas (empresa_id, lower(email))
where email is not null and email <> '';
