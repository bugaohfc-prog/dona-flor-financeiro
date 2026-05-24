-- =========================================================
-- DNA Gestao - Mini RH
-- Migration de revisao: cria public.df_funcionarios com RLS.
--
-- ATENCAO:
-- - Arquivo gerado para revisao tecnica.
-- - Nao aplicar automaticamente em producao.
-- - Validar primeiro em homologacao com testes negativos de RLS.
-- - Dados de funcionarios sao dados pessoais sob LGPD.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_filiais') is null then
    raise exception 'Missing table public.df_filiais';
  end if;

  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
  end if;

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;
end $$;

create table if not exists public.df_funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  filial_id uuid null
    references public.df_filiais(id)
    on delete set null,
  nome text not null,
  cpf text null,
  cargo text null,
  telefone text null,
  email text null,
  data_nascimento date null,
  data_admissao date null,
  status text not null default 'ativo',
  observacoes text null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint df_funcionarios_nome_not_blank
    check (length(btrim(nome)) > 0),

  constraint df_funcionarios_status_check
    check (status in ('ativo', 'afastado', 'desligado')),

  constraint df_funcionarios_cpf_digits_check
    check (cpf is null or cpf ~ '^[0-9]{11}$'),

  constraint df_funcionarios_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

comment on table public.df_funcionarios is
  'Mini RH: cadastro basico de funcionarios. Contem dados pessoais e exige RLS validada antes de UI.';

comment on column public.df_funcionarios.cpf is
  'Dado pessoal sensivel operacional. Armazenar apenas digitos. Nao registrar em logs.';

comment on column public.df_funcionarios.telefone is
  'Dado pessoal. Nao registrar em logs.';

comment on column public.df_funcionarios.email is
  'Dado pessoal. Nao registrar em logs.';

comment on column public.df_funcionarios.data_nascimento is
  'Dado pessoal. Nao registrar em logs.';

comment on column public.df_funcionarios.data_admissao is
  'Dado trabalhista. Nao registrar em logs.';

comment on column public.df_funcionarios.observacoes is
  'Campo potencialmente sensivel. Evitar dados medicos, documentos e informacoes trabalhistas detalhadas.';

create index if not exists idx_df_funcionarios_empresa_id
on public.df_funcionarios (empresa_id);

create index if not exists idx_df_funcionarios_empresa_status
on public.df_funcionarios (empresa_id, status);

create index if not exists idx_df_funcionarios_empresa_filial
on public.df_funcionarios (empresa_id, filial_id);

create index if not exists idx_df_funcionarios_empresa_nome_lower
on public.df_funcionarios (empresa_id, lower(nome));

create index if not exists idx_df_funcionarios_empresa_ativos
on public.df_funcionarios (empresa_id)
where arquivado = false;

-- CPF e dado pessoal e pode exigir regra de negocio antes de unique rigido.
-- Se aprovado em ciclo futuro, avaliar:
-- create unique index uq_df_funcionarios_empresa_cpf_ativo
-- on public.df_funcionarios (empresa_id, cpf)
-- where cpf is not null and arquivado = false;

create or replace function public.df_usuario_tem_perfil_empresa(
  p_empresa_id uuid,
  p_perfis text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and p_empresa_id is not null
    and exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = p_empresa_id
        and lower(coalesce(ue.perfil, '')) = any (p_perfis)
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

revoke all on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from public;
grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to authenticated;

create or replace function public.df_funcionarios_validar_filial_empresa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.filial_id is not null and not exists (
    select 1
    from public.df_filiais f
    where f.id = new.filial_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'filial_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
  else
    new.updated_at = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_funcionarios after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_funcionarios. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_df_funcionarios_validar_filial_empresa on public.df_funcionarios;
create trigger trg_df_funcionarios_validar_filial_empresa
before insert or update of empresa_id, filial_id
on public.df_funcionarios
for each row
execute function public.df_funcionarios_validar_filial_empresa();

drop trigger if exists trg_df_funcionarios_bloquear_alteracao_empresa on public.df_funcionarios;
create trigger trg_df_funcionarios_bloquear_alteracao_empresa
before update
on public.df_funcionarios
for each row
execute function public.df_funcionarios_bloquear_alteracao_empresa();

drop trigger if exists trg_df_funcionarios_set_timestamps on public.df_funcionarios;
create trigger trg_df_funcionarios_set_timestamps
before insert or update
on public.df_funcionarios
for each row
execute function public.df_funcionarios_set_timestamps();

drop trigger if exists trg_df_funcionarios_bloquear_delete on public.df_funcionarios;
create trigger trg_df_funcionarios_bloquear_delete
before delete
on public.df_funcionarios
for each row
execute function public.df_funcionarios_bloquear_delete();

alter table public.df_funcionarios enable row level security;
alter table public.df_funcionarios force row level security;

revoke all on public.df_funcionarios from public;
revoke all on public.df_funcionarios from anon;
grant select, insert, update on public.df_funcionarios to authenticated;
revoke delete on public.df_funcionarios from authenticated;

drop policy if exists "df_funcionarios_select_rh_inicial" on public.df_funcionarios;
drop policy if exists "df_funcionarios_insert_admin_master" on public.df_funcionarios;
drop policy if exists "df_funcionarios_update_admin_master" on public.df_funcionarios;

create policy "df_funcionarios_select_rh_inicial"
on public.df_funcionarios
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
);

create policy "df_funcionarios_insert_admin_master"
on public.df_funcionarios
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

create policy "df_funcionarios_update_admin_master"
on public.df_funcionarios
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

-- Intencionalmente nao ha policy de DELETE.
-- O DELETE fisico tambem e bloqueado pelo trigger trg_df_funcionarios_bloquear_delete.
-- Arquivamento deve ser feito por UPDATE com arquivado=true.

do $$
declare
  unexpected_delete_policies text;
begin
  select string_agg(policyname, ', ' order by policyname)
  into unexpected_delete_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_funcionarios'
    and cmd = 'DELETE';

  if unexpected_delete_policies is not null then
    raise exception 'Unexpected df_funcionarios DELETE policies found: %', unexpected_delete_policies;
  end if;
end $$;

-- Checklist manual obrigatorio antes de liberar UI:
-- 1. Operador nao deve conseguir SELECT, INSERT, UPDATE ou DELETE.
-- 2. Gerente deve conseguir apenas SELECT dentro da empresa.
-- 3. Admin deve conseguir SELECT, INSERT e UPDATE dentro da empresa.
-- 4. Master deve operar conforme regra atual do projeto, mantendo filtro de empresa ativa no service/UI.
-- 5. Usuario de outra empresa nao deve ver nem alterar funcionarios.
-- 6. filial_id de outra empresa deve ser rejeitado.
-- 7. DELETE fisico deve falhar; usar arquivado=true.
-- 8. Alterar empresa_id de funcionario existente deve falhar.
-- 9. Logs nao podem expor CPF, telefone, email, datas, observacoes ou dados trabalhistas.
-- 10. Nao criar exportacao sem permissao explicita futura.
-- 11. Nao criar frontend antes da RLS ser validada.

commit;
