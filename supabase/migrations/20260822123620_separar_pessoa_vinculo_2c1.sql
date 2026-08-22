begin;

do $$
begin
  if to_regclass('public.df_empresas') is null
     or to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null
     or to_regprocedure('public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)') is null then
    raise exception 'DEPENDENCIA_PESSOA_VINCULO_2C1_AUSENTE';
  end if;
end $$;

create table public.df_pessoas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  nome text not null,
  cpf text null,
  telefone text null,
  email text null,
  data_nascimento date null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint df_pessoas_empresa_id_id_unique unique (empresa_id, id),
  constraint df_pessoas_nome_not_blank check (length(btrim(nome)) > 0),
  constraint df_pessoas_cpf_digits_check check (cpf is null or cpf ~ '^[0-9]{11}$'),
  constraint df_pessoas_arquivado_em_check check (arquivado = true or arquivado_em is null)
);

comment on table public.df_pessoas is
  'Identidade tenant-local da pessoa. Vínculos empregatícios permanecem em public.df_funcionarios.';
comment on column public.df_pessoas.cpf is
  'Dado pessoal tenant-local, sem unicidade global ou por empresa no 2C-1. Armazenar somente dígitos.';
comment on column public.df_pessoas.arquivado is
  'Arquivamento da identidade, independente do arquivamento de qualquer vínculo.';

create index idx_df_pessoas_empresa_nome
  on public.df_pessoas (empresa_id, lower(nome));
create index idx_df_pessoas_empresa_ativas
  on public.df_pessoas (empresa_id, arquivado)
  where arquivado = false;
create index idx_df_pessoas_empresa_cpf
  on public.df_pessoas (empresa_id, cpf)
  where cpf is not null;

create or replace function public.df_pessoas_set_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
  else
    new.updated_at = now();
  end if;

  if new.arquivado and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif not new.arquivado then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create trigger trg_df_pessoas_set_timestamps
before insert or update on public.df_pessoas
for each row execute function public.df_pessoas_set_timestamps();

alter table public.df_pessoas enable row level security;
alter table public.df_pessoas force row level security;

revoke all on table public.df_pessoas from public, anon, authenticated;
grant select on table public.df_pessoas to authenticated;

create policy "df_pessoas_select_rh"
on public.df_pessoas
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

alter table public.df_funcionarios
  add column pessoa_id uuid null;

alter table public.df_funcionarios
  disable trigger trg_df_funcionarios_set_timestamps;

update public.df_funcionarios
set pessoa_id = gen_random_uuid();

alter table public.df_funcionarios
  enable trigger trg_df_funcionarios_set_timestamps;

insert into public.df_pessoas (
  id, empresa_id, nome, cpf, telefone, email, data_nascimento,
  arquivado, arquivado_em, created_at, updated_at
)
select
  pessoa_id, empresa_id, nome, cpf, telefone, email, data_nascimento,
  false, null, created_at, updated_at
from public.df_funcionarios;

alter table public.df_funcionarios
  alter column pessoa_id set not null,
  add constraint df_funcionarios_empresa_pessoa_fkey
    foreign key (empresa_id, pessoa_id)
    references public.df_pessoas (empresa_id, id)
    on update restrict
    on delete restrict;

create index idx_df_funcionarios_empresa_pessoa
  on public.df_funcionarios (empresa_id, pessoa_id);

comment on column public.df_funcionarios.pessoa_id is
  'Identidade tenant-local canônica. O registro de funcionário permanece sendo o vínculo empregatício.';

create or replace function public.df_funcionarios_validar_pessoa_vinculo_2c1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_pessoa public.df_pessoas%rowtype;
begin
  select * into v_pessoa
  from public.df_pessoas
  where empresa_id = new.empresa_id
    and id = new.pessoa_id;

  if not found then
    raise exception 'PESSOA_DO_VINCULO_NAO_ENCONTRADA';
  end if;

  if tg_op = 'INSERT' then
    new.nome := v_pessoa.nome;
    new.cpf := v_pessoa.cpf;
    new.telefone := v_pessoa.telefone;
    new.email := v_pessoa.email;
    new.data_nascimento := v_pessoa.data_nascimento;
  elsif new.nome is distinct from v_pessoa.nome
     or new.cpf is distinct from v_pessoa.cpf
     or new.telefone is distinct from v_pessoa.telefone
     or new.email is distinct from v_pessoa.email
     or new.data_nascimento is distinct from v_pessoa.data_nascimento then
    raise exception 'DADOS_PESSOA_REQUER_FLUXO_CONTROLADO';
  end if;

  return new;
end;
$$;

create trigger trg_df_funcionarios_validar_pessoa_vinculo_2c1
before insert or update on public.df_funcionarios
for each row execute function public.df_funcionarios_validar_pessoa_vinculo_2c1();

create or replace function public.df_pessoas_espelhar_legado_funcionario_2c1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.empresa_id is distinct from new.empresa_id
     or old.id is distinct from new.id then
    raise exception 'IDENTIDADE_PESSOA_IMUTAVEL';
  end if;

  if old.nome is distinct from new.nome
     or old.cpf is distinct from new.cpf
     or old.telefone is distinct from new.telefone
     or old.email is distinct from new.email
     or old.data_nascimento is distinct from new.data_nascimento then
    update public.df_funcionarios
    set nome = new.nome,
        cpf = new.cpf,
        telefone = new.telefone,
        email = new.email,
        data_nascimento = new.data_nascimento
    where empresa_id = new.empresa_id
      and pessoa_id = new.id;
  end if;

  return new;
end;
$$;

create trigger trg_df_pessoas_espelhar_legado_funcionario_2c1
after update on public.df_pessoas
for each row execute function public.df_pessoas_espelhar_legado_funcionario_2c1();

create or replace function public.criar_funcionario_com_pessoa_controlado(
  p_empresa_id uuid,
  p_dados jsonb,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pessoa public.df_pessoas%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_admissao jsonb;
  v_nome text := nullif(btrim(p_dados->>'nome'), '');
  v_data_admissao date := nullif(p_dados->>'data_admissao', '')::date;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then
    raise exception 'DADOS_FUNCIONARIO_INVALIDOS';
  end if;
  if v_nome is null then
    raise exception 'NOME_FUNCIONARIO_OBRIGATORIO';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_dados) as campos(chave)
    where chave not in (
      'nome', 'cpf', 'telefone', 'email', 'data_nascimento',
      'filial_id', 'cargo', 'status', 'observacoes',
      'data_admissao', 'data_exame_admissional'
    )
  ) then
    raise exception 'CAMPO_FUNCIONARIO_NAO_PERMITIDO';
  end if;

  insert into public.df_pessoas (
    empresa_id, nome, cpf, telefone, email, data_nascimento
  ) values (
    p_empresa_id,
    v_nome,
    nullif(btrim(p_dados->>'cpf'), ''),
    nullif(btrim(p_dados->>'telefone'), ''),
    nullif(lower(btrim(p_dados->>'email')), ''),
    nullif(p_dados->>'data_nascimento', '')::date
  ) returning * into v_pessoa;

  insert into public.df_funcionarios (
    empresa_id, pessoa_id, filial_id, nome, cpf, cargo, telefone, email,
    data_nascimento, data_admissao, data_exame_admissional, status,
    observacoes, arquivado, arquivado_em
  ) values (
    p_empresa_id,
    v_pessoa.id,
    nullif(p_dados->>'filial_id', '')::uuid,
    v_pessoa.nome,
    v_pessoa.cpf,
    nullif(btrim(p_dados->>'cargo'), ''),
    v_pessoa.telefone,
    v_pessoa.email,
    v_pessoa.data_nascimento,
    null,
    nullif(p_dados->>'data_exame_admissional', '')::date,
    coalesce(nullif(lower(btrim(p_dados->>'status')), ''), 'ativo'),
    nullif(btrim(p_dados->>'observacoes'), ''),
    false,
    null
  ) returning * into v_funcionario;

  if v_data_admissao is not null then
    v_admissao := public.alterar_admissao_funcionario_controlado(
      p_empresa_id,
      v_funcionario.id,
      v_data_admissao,
      false,
      false,
      'Cadastro inicial do vínculo',
      v_correlation_id
    );
    select * into v_funcionario
    from public.df_funcionarios
    where empresa_id = p_empresa_id and id = v_funcionario.id;
  end if;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', v_funcionario.id,
    'rh.funcionario.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object(
      'funcionario_id', v_funcionario.id,
      'pessoa_id', v_pessoa.id,
      'status', v_funcionario.status,
      'arquivado', v_funcionario.arquivado
    ),
    jsonb_build_object(
      'funcionario_id', v_funcionario.id,
      'pessoa_id', v_pessoa.id,
      'regra', 'pessoa_vinculo_2c1',
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_funcionario) || jsonb_build_object(
    'ciclo_criado_id', v_admissao->>'ciclo_criado_id'
  );
end;
$$;

create or replace function public.atualizar_funcionario_pessoa_vinculo_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_dados jsonb,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_funcionario_antes public.df_funcionarios%rowtype;
  v_funcionario_depois public.df_funcionarios%rowtype;
  v_pessoa_antes public.df_pessoas%rowtype;
  v_pessoa_depois public.df_pessoas%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or p_dados = '{}'::jsonb then
    raise exception 'DADOS_FUNCIONARIO_INVALIDOS';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_dados) as campos(chave)
    where chave not in (
      'nome', 'cpf', 'telefone', 'email', 'data_nascimento',
      'filial_id', 'cargo', 'status', 'observacoes', 'data_exame_admissional'
    )
  ) then
    raise exception 'CAMPO_FUNCIONARIO_NAO_PERMITIDO';
  end if;

  select * into v_funcionario_antes
  from public.df_funcionarios
  where empresa_id = p_empresa_id and id = p_funcionario_id
  for update;
  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

  select * into v_pessoa_antes
  from public.df_pessoas
  where empresa_id = p_empresa_id and id = v_funcionario_antes.pessoa_id
  for update;
  if not found then
    raise exception 'PESSOA_DO_VINCULO_NAO_ENCONTRADA';
  end if;

  if p_dados ? 'nome' and nullif(btrim(p_dados->>'nome'), '') is null then
    raise exception 'NOME_FUNCIONARIO_OBRIGATORIO';
  end if;

  if p_dados ?| array['nome', 'cpf', 'telefone', 'email', 'data_nascimento'] then
    update public.df_pessoas
    set nome = case when p_dados ? 'nome' then nullif(btrim(p_dados->>'nome'), '') else nome end,
        cpf = case when p_dados ? 'cpf' then nullif(btrim(p_dados->>'cpf'), '') else cpf end,
        telefone = case when p_dados ? 'telefone' then nullif(btrim(p_dados->>'telefone'), '') else telefone end,
        email = case when p_dados ? 'email' then nullif(lower(btrim(p_dados->>'email')), '') else email end,
        data_nascimento = case when p_dados ? 'data_nascimento' then nullif(p_dados->>'data_nascimento', '')::date else data_nascimento end
    where empresa_id = p_empresa_id and id = v_pessoa_antes.id
    returning * into v_pessoa_depois;
  else
    v_pessoa_depois := v_pessoa_antes;
  end if;

  update public.df_funcionarios
  set filial_id = case when p_dados ? 'filial_id' then nullif(p_dados->>'filial_id', '')::uuid else filial_id end,
      cargo = case when p_dados ? 'cargo' then nullif(btrim(p_dados->>'cargo'), '') else cargo end,
      status = case when p_dados ? 'status' then nullif(lower(btrim(p_dados->>'status')), '') else status end,
      observacoes = case when p_dados ? 'observacoes' then nullif(btrim(p_dados->>'observacoes'), '') else observacoes end,
      data_exame_admissional = case when p_dados ? 'data_exame_admissional' then nullif(p_dados->>'data_exame_admissional', '')::date else data_exame_admissional end
  where empresa_id = p_empresa_id and id = p_funcionario_id
  returning * into v_funcionario_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', p_funcionario_id,
    'rh.funcionario.atualizado', 'info', 'app', 'sucesso',
    jsonb_build_object(
      'funcionario_id', v_funcionario_antes.id,
      'pessoa_id', v_pessoa_antes.id,
      'status', v_funcionario_antes.status,
      'arquivado', v_funcionario_antes.arquivado
    ),
    jsonb_build_object(
      'funcionario_id', v_funcionario_depois.id,
      'pessoa_id', v_pessoa_depois.id,
      'status', v_funcionario_depois.status,
      'arquivado', v_funcionario_depois.arquivado
    ),
    jsonb_build_object(
      'campos', (select jsonb_agg(chave order by chave) from jsonb_object_keys(p_dados) as campos(chave)),
      'regra', 'pessoa_vinculo_2c1',
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_funcionario_depois);
end;
$$;

revoke all on function public.criar_funcionario_com_pessoa_controlado(uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.criar_funcionario_com_pessoa_controlado(uuid, jsonb, text)
  to authenticated;

revoke all on function public.atualizar_funcionario_pessoa_vinculo_controlado(uuid, uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.atualizar_funcionario_pessoa_vinculo_controlado(uuid, uuid, jsonb, text)
  to authenticated;

revoke all on function public.df_pessoas_set_timestamps()
  from public, anon, authenticated;
revoke all on function public.df_funcionarios_validar_pessoa_vinculo_2c1()
  from public, anon, authenticated;
revoke all on function public.df_pessoas_espelhar_legado_funcionario_2c1()
  from public, anon, authenticated;

do $$
declare
  v_funcionarios bigint;
  v_pessoas bigint;
  v_sem_pessoa bigint;
  v_pessoas_compartilhadas bigint;
  v_divergencias bigint;
begin
  select count(*) into v_funcionarios from public.df_funcionarios;
  select count(*) into v_pessoas from public.df_pessoas;
  select count(*) into v_sem_pessoa
  from public.df_funcionarios f
  left join public.df_pessoas p
    on p.empresa_id = f.empresa_id and p.id = f.pessoa_id
  where p.id is null;
  select count(*) into v_pessoas_compartilhadas
  from (
    select empresa_id, pessoa_id
    from public.df_funcionarios
    group by empresa_id, pessoa_id
    having count(*) > 1
  ) compartilhadas;
  select count(*) into v_divergencias
  from public.df_funcionarios f
  join public.df_pessoas p
    on p.empresa_id = f.empresa_id and p.id = f.pessoa_id
  where f.nome is distinct from p.nome
     or f.cpf is distinct from p.cpf
     or f.telefone is distinct from p.telefone
     or f.email is distinct from p.email
     or f.data_nascimento is distinct from p.data_nascimento;

  if v_funcionarios <> v_pessoas
     or v_sem_pessoa <> 0
     or v_pessoas_compartilhadas <> 0
     or v_divergencias <> 0 then
    raise exception 'BACKFILL_PESSOA_VINCULO_2C1_INCONSISTENTE: funcionarios=%, pessoas=%, sem_pessoa=%, compartilhadas=%, divergencias=%',
      v_funcionarios, v_pessoas, v_sem_pessoa, v_pessoas_compartilhadas, v_divergencias;
  end if;

  if has_table_privilege('anon', 'public.df_pessoas', 'SELECT')
     or has_table_privilege('anon', 'public.df_pessoas', 'INSERT')
     or has_table_privilege('anon', 'public.df_pessoas', 'UPDATE')
     or has_table_privilege('authenticated', 'public.df_pessoas', 'INSERT')
     or has_table_privilege('authenticated', 'public.df_pessoas', 'UPDATE') then
    raise exception 'PRIVILEGIOS_DF_PESSOAS_INVALIDOS';
  end if;
end $$;

commit;
