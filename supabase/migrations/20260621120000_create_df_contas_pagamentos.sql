-- =========================================================
-- DNA Gestao - Financeiro: estrutura para pagamentos parciais
--
-- Objetivo:
-- - Criar historico separado de pagamentos por conta.
-- - Permitir multiplos pagamentos para a mesma conta em ciclo futuro.
-- - Nao alterar df_contas, status, triggers de baixa, UI ou dados existentes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
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

  if to_regprocedure('public.df_usuario_tem_perfil_empresa(uuid,text[])') is null then
    raise exception 'Missing helper public.df_usuario_tem_perfil_empresa(uuid,text[])';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'df_contas'
      and column_name in ('id', 'empresa_id')
    group by table_schema, table_name
    having count(*) = 2
  ) then
    raise exception 'Missing required columns on public.df_contas';
  end if;
end $$;

create table if not exists public.df_contas_pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  conta_id uuid not null
    references public.df_contas(id)
    on delete restrict,
  valor_pago numeric(12,2) not null,
  data_pagamento date not null,
  observacao text null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null,
  atualizado_por uuid null,

  constraint df_contas_pagamentos_valor_pago_positivo
    check (valor_pago > 0),

  constraint df_contas_pagamentos_observacao_not_blank
    check (observacao is null or length(btrim(observacao)) > 0),

  constraint df_contas_pagamentos_arquivado_em_consistente
    check (
      (arquivado = true and arquivado_em is not null)
      or (arquivado = false and arquivado_em is null)
    )
);

comment on table public.df_contas_pagamentos is
  'Financeiro: historico de pagamentos registrados para contas. Base estrutural para pagamento parcial futuro.';

comment on column public.df_contas_pagamentos.empresa_id is
  'Empresa/tenant do pagamento. Deve ser igual a empresa_id da conta vinculada.';

comment on column public.df_contas_pagamentos.conta_id is
  'Conta financeira vinculada ao pagamento.';

comment on column public.df_contas_pagamentos.valor_pago is
  'Valor efetivamente pago neste registro de pagamento.';

comment on column public.df_contas_pagamentos.data_pagamento is
  'Data efetiva deste pagamento.';

comment on column public.df_contas_pagamentos.observacao is
  'Observacao administrativa curta do pagamento. Nao registrar dados sensiveis, senhas, documentos ou informacoes pessoais desnecessarias.';

comment on column public.df_contas_pagamentos.arquivado is
  'Inativacao logica do registro de pagamento. DELETE fisico e bloqueado.';

comment on column public.df_contas_pagamentos.criado_por is
  'Identificador do usuario autenticado que criou o pagamento, quando disponivel.';

comment on column public.df_contas_pagamentos.atualizado_por is
  'Identificador do usuario autenticado que atualizou o pagamento, quando disponivel.';

create index if not exists idx_df_contas_pagamentos_empresa_id
on public.df_contas_pagamentos (empresa_id);

create index if not exists idx_df_contas_pagamentos_empresa_conta
on public.df_contas_pagamentos (empresa_id, conta_id);

create index if not exists idx_df_contas_pagamentos_empresa_data
on public.df_contas_pagamentos (empresa_id, data_pagamento);

create index if not exists idx_df_contas_pagamentos_empresa_arquivado
on public.df_contas_pagamentos (empresa_id, arquivado);

create or replace function public.df_contas_pagamentos_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
    new.criado_por = coalesce(new.criado_por, auth.uid());
    new.atualizado_por = coalesce(new.atualizado_por, auth.uid());
  else
    new.atualizado_em = now();
    new.atualizado_por = coalesce(auth.uid(), new.atualizado_por);
  end if;

  new.observacao = nullif(btrim(new.observacao), '');

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_contas_pagamentos_validar_conta_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.df_contas c
    where c.id = new.conta_id
      and c.empresa_id = new.empresa_id
  ) then
    raise exception 'conta_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_contas_pagamentos_bloquear_alteracao_vinculo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_contas_pagamentos after insert'
      using errcode = '23514';
  end if;

  if new.conta_id is distinct from old.conta_id then
    raise exception 'conta_id cannot be changed for df_contas_pagamentos after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_contas_pagamentos_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_contas_pagamentos. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_df_contas_pagamentos_set_timestamps on public.df_contas_pagamentos;
create trigger trg_df_contas_pagamentos_set_timestamps
before insert or update
on public.df_contas_pagamentos
for each row
execute function public.df_contas_pagamentos_set_timestamps();

drop trigger if exists trg_df_contas_pagamentos_validar_conta_empresa on public.df_contas_pagamentos;
create trigger trg_df_contas_pagamentos_validar_conta_empresa
before insert or update of empresa_id, conta_id
on public.df_contas_pagamentos
for each row
execute function public.df_contas_pagamentos_validar_conta_empresa();

drop trigger if exists trg_df_contas_pagamentos_bloquear_alteracao_vinculo on public.df_contas_pagamentos;
create trigger trg_df_contas_pagamentos_bloquear_alteracao_vinculo
before update
on public.df_contas_pagamentos
for each row
execute function public.df_contas_pagamentos_bloquear_alteracao_vinculo();

drop trigger if exists trg_df_contas_pagamentos_bloquear_delete on public.df_contas_pagamentos;
create trigger trg_df_contas_pagamentos_bloquear_delete
before delete
on public.df_contas_pagamentos
for each row
execute function public.df_contas_pagamentos_bloquear_delete();

alter table public.df_contas_pagamentos enable row level security;
alter table public.df_contas_pagamentos force row level security;

revoke all on public.df_contas_pagamentos from public;
revoke all on public.df_contas_pagamentos from anon;
revoke all on public.df_contas_pagamentos from authenticated;
grant select, insert, update on public.df_contas_pagamentos to authenticated;

drop policy if exists "df_contas_pagamentos_select_empresa" on public.df_contas_pagamentos;
drop policy if exists "df_contas_pagamentos_insert_empresa_operacional" on public.df_contas_pagamentos;
drop policy if exists "df_contas_pagamentos_update_empresa_operacional" on public.df_contas_pagamentos;

create policy "df_contas_pagamentos_select_empresa"
on public.df_contas_pagamentos
for select
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_contas_pagamentos.empresa_id
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_contas_pagamentos_insert_empresa_operacional"
on public.df_contas_pagamentos
for insert
to authenticated
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_contas_pagamentos_update_empresa_operacional"
on public.df_contas_pagamentos
for update
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
)
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

do $$
declare
  unsafe_policies text;
  unsafe_grants text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_contas_pagamentos'
    and cmd in ('ALL', 'DELETE');

  if unsafe_policies is not null then
    raise exception 'Unexpected df_contas_pagamentos ALL/DELETE policies found: %', unsafe_policies;
  end if;

  select string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type)
  into unsafe_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_contas_pagamentos'
    and grantee in ('anon', 'authenticated')
    and (
      grantee = 'anon'
      or privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
    );

  if unsafe_grants is not null then
    raise exception 'Unexpected df_contas_pagamentos grants found: %', unsafe_grants;
  end if;
end $$;

commit;
