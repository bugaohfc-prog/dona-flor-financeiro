begin;

do $$
begin
  if to_regclass('public.df_pessoas') is null
     or to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regclass('public.df_funcionarios_desligamentos_efetivos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null
     or to_regprocedure('public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)') is null then
    raise exception 'DEPENDENCIA_READMISSAO_2C4_AUSENTE';
  end if;
end $$;

alter table public.df_funcionarios
  add column readmissao_origem_funcionario_id uuid null,
  add column readmissao_request_key text null,
  add constraint df_funcionarios_readmissao_origem_fkey
    foreign key (empresa_id, readmissao_origem_funcionario_id)
    references public.df_funcionarios (empresa_id, id)
    on update restrict
    on delete restrict,
  add constraint df_funcionarios_readmissao_origem_distinta_check
    check (readmissao_origem_funcionario_id is null or readmissao_origem_funcionario_id <> id),
  add constraint df_funcionarios_readmissao_request_key_check
    check (
      readmissao_request_key is null
      or length(btrim(readmissao_request_key)) between 16 and 200
    );

comment on column public.df_funcionarios.readmissao_origem_funcionario_id is
  'Vinculo historico desligado usado como referencia para criar este novo vinculo. Nunca e reativado.';
comment on column public.df_funcionarios.readmissao_request_key is
  'Chave idempotente tenant-local e pessoa-local da operacao controlada de readmissao.';

create index idx_df_funcionarios_empresa_readmissao_origem
  on public.df_funcionarios (empresa_id, readmissao_origem_funcionario_id)
  where readmissao_origem_funcionario_id is not null;

create unique index uq_df_funcionarios_readmissao_request
  on public.df_funcionarios (empresa_id, pessoa_id, readmissao_request_key)
  where readmissao_request_key is not null;

create unique index uq_df_funcionarios_pessoa_vinculo_funcional
  on public.df_funcionarios (empresa_id, pessoa_id)
  where arquivado = false and status in ('ativo', 'afastado');

create or replace function public.df_funcionarios_validar_vinculo_funcional_unico_2c4()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.arquivado = false
     and new.status in ('ativo', 'afastado')
     and exists (
       select 1
       from public.df_funcionarios f
       where f.empresa_id = new.empresa_id
         and f.pessoa_id = new.pessoa_id
         and f.id <> new.id
         and f.arquivado = false
         and f.status in ('ativo', 'afastado')
     ) then
    raise exception 'PESSOA_JA_POSSUI_VINCULO_FUNCIONAL';
  end if;

  return new;
end;
$$;

create trigger trg_df_funcionarios_validar_vinculo_funcional_unico_2c4
before insert or update of empresa_id, pessoa_id, status, arquivado
on public.df_funcionarios
for each row execute function public.df_funcionarios_validar_vinculo_funcional_unico_2c4();

create or replace function public.df_funcionarios_bloquear_metadados_readmissao_2c4()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.pessoa_id is distinct from new.pessoa_id then
    raise exception 'PESSOA_DO_VINCULO_IMUTAVEL';
  end if;

  if old.readmissao_origem_funcionario_id is distinct from new.readmissao_origem_funcionario_id
     or old.readmissao_request_key is distinct from new.readmissao_request_key then
    raise exception 'METADADOS_READMISSAO_IMUTAVEIS';
  end if;

  return new;
end;
$$;

create trigger trg_df_funcionarios_bloquear_metadados_readmissao_2c4
before update of pessoa_id, readmissao_origem_funcionario_id, readmissao_request_key
on public.df_funcionarios
for each row execute function public.df_funcionarios_bloquear_metadados_readmissao_2c4();

create or replace function public.readmitir_pessoa_controlado(
  p_empresa_id uuid,
  p_vinculo_anterior_id uuid,
  p_request_key text,
  p_nova_data_admissao date,
  p_filial_id uuid default null,
  p_cargo text default null,
  p_data_exame_admissional date default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pessoa_id uuid;
  v_pessoa public.df_pessoas%rowtype;
  v_vinculo_anterior public.df_funcionarios%rowtype;
  v_desligamento_efetivo public.df_funcionarios_desligamentos_efetivos%rowtype;
  v_novo_vinculo public.df_funcionarios%rowtype;
  v_admissao jsonb;
  v_request_key text := nullif(btrim(p_request_key), '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_vinculo_anterior_id is null then
    raise exception 'VINCULO_ANTERIOR_OBRIGATORIO';
  end if;
  if v_request_key is null or length(v_request_key) not between 16 and 200 then
    raise exception 'CHAVE_IDEMPOTENCIA_INVALIDA';
  end if;
  if p_nova_data_admissao is null then
    raise exception 'NOVA_ADMISSAO_OBRIGATORIA';
  end if;

  select pessoa_id into v_pessoa_id
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and id = p_vinculo_anterior_id;
  if not found then
    raise exception 'VINCULO_ANTERIOR_NAO_ENCONTRADO';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_empresa_id::text || ':pessoa:' || v_pessoa_id::text, 0)
  );

  select * into v_novo_vinculo
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and pessoa_id = v_pessoa_id
    and readmissao_request_key = v_request_key;
  if found then
    if v_novo_vinculo.readmissao_origem_funcionario_id is distinct from p_vinculo_anterior_id then
      raise exception 'CHAVE_IDEMPOTENCIA_CONFLITANTE';
    end if;
    return to_jsonb(v_novo_vinculo) || jsonb_build_object(
      'codigo', 'READMISSAO_JA_PROCESSADA',
      'idempotente', true,
      'novo_funcionario_id', v_novo_vinculo.id,
      'vinculo_anterior_id', p_vinculo_anterior_id,
      'pessoa_id', v_pessoa_id
    );
  end if;

  perform 1
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and pessoa_id = v_pessoa_id
  order by id
  for update;

  select * into v_pessoa
  from public.df_pessoas
  where empresa_id = p_empresa_id
    and id = v_pessoa_id
  for update;
  if not found then
    raise exception 'PESSOA_NAO_ENCONTRADA';
  end if;
  if v_pessoa.arquivado then
    raise exception 'PESSOA_ARQUIVADA';
  end if;

  select * into v_vinculo_anterior
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and id = p_vinculo_anterior_id
    and pessoa_id = v_pessoa_id;
  if not found then
    raise exception 'VINCULO_ANTERIOR_NAO_ENCONTRADO';
  end if;
  if v_vinculo_anterior.status <> 'desligado' then
    raise exception 'VINCULO_ANTERIOR_NAO_DESLIGADO';
  end if;

  select * into v_desligamento_efetivo
  from public.df_funcionarios_desligamentos_efetivos
  where empresa_id = p_empresa_id
    and funcionario_id = p_vinculo_anterior_id
    and estado = 'CONCLUIDO'
    and not efeito_revertido
  order by data_efetiva_efetiva desc, concluido_em desc, id desc
  limit 1;
  if not found then
    raise exception 'DESLIGAMENTO_EFETIVO_NAO_ENCONTRADO';
  end if;

  if exists (
    select 1
    from public.df_funcionarios
    where empresa_id = p_empresa_id
      and pessoa_id = v_pessoa_id
      and arquivado = false
      and status in ('ativo', 'afastado')
  ) then
    raise exception 'PESSOA_JA_POSSUI_VINCULO_FUNCIONAL';
  end if;

  if p_nova_data_admissao <= v_desligamento_efetivo.data_efetiva_efetiva then
    raise exception 'NOVA_ADMISSAO_DEVE_SER_POSTERIOR_AO_DESLIGAMENTO';
  end if;
  if extract(month from p_nova_data_admissao) = 2
     and extract(day from p_nova_data_admissao) = 29 then
    raise exception 'ADMISSAO_29FEV_REQUER_DECISAO';
  end if;

  insert into public.df_funcionarios (
    empresa_id, pessoa_id, filial_id, nome, cpf, cargo, telefone, email,
    data_nascimento, data_admissao, data_exame_admissional, status,
    observacoes, arquivado, arquivado_em,
    readmissao_origem_funcionario_id, readmissao_request_key
  ) values (
    p_empresa_id, v_pessoa.id, p_filial_id, v_pessoa.nome, v_pessoa.cpf,
    nullif(btrim(p_cargo), ''), v_pessoa.telefone, v_pessoa.email,
    v_pessoa.data_nascimento, null, p_data_exame_admissional, 'ativo',
    null, false, null, p_vinculo_anterior_id, v_request_key
  ) returning * into v_novo_vinculo;

  v_admissao := public.alterar_admissao_funcionario_controlado(
    p_empresa_id,
    v_novo_vinculo.id,
    p_nova_data_admissao,
    false,
    false,
    'Readmissao com novo vinculo',
    v_correlation_id
  );

  select * into v_novo_vinculo
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and id = v_novo_vinculo.id;

  if v_admissao->>'ciclo_criado_id' is null then
    raise exception 'PRIMEIRO_CICLO_READMISSAO_NAO_CRIADO';
  end if;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', v_novo_vinculo.id,
    'rh.pessoa.readmitida', 'info', 'app', 'sucesso',
    jsonb_build_object(
      'pessoa_id', v_pessoa.id,
      'vinculo_anterior_id', v_vinculo_anterior.id,
      'status_vinculo_anterior', v_vinculo_anterior.status,
      'data_desligamento_efetiva', v_desligamento_efetivo.data_efetiva_efetiva
    ),
    jsonb_build_object(
      'pessoa_id', v_pessoa.id,
      'novo_funcionario_id', v_novo_vinculo.id,
      'status_novo_vinculo', v_novo_vinculo.status,
      'nova_data_admissao', v_novo_vinculo.data_admissao,
      'filial_id', v_novo_vinculo.filial_id,
      'cargo', v_novo_vinculo.cargo,
      'ciclo_criado_id', v_admissao->>'ciclo_criado_id'
    ),
    jsonb_build_object(
      'regra', 'readmissao_novo_vinculo_2c4',
      'versao', '2C-4',
      'request_key', v_request_key,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_novo_vinculo) || jsonb_build_object(
    'codigo', 'PESSOA_READMITIDA_NOVO_VINCULO',
    'idempotente', false,
    'novo_funcionario_id', v_novo_vinculo.id,
    'vinculo_anterior_id', v_vinculo_anterior.id,
    'pessoa_id', v_pessoa.id,
    'ciclo_criado_id', v_admissao->>'ciclo_criado_id',
    'correlation_id', v_correlation_id
  );
end;
$$;

revoke all on function public.readmitir_pessoa_controlado(uuid, uuid, text, date, uuid, text, date, text)
  from public, anon, authenticated;
grant execute on function public.readmitir_pessoa_controlado(uuid, uuid, text, date, uuid, text, date, text)
  to authenticated;

revoke all on function public.df_funcionarios_bloquear_metadados_readmissao_2c4()
  from public, anon, authenticated;
revoke all on function public.df_funcionarios_validar_vinculo_funcional_unico_2c4()
  from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from public.df_funcionarios
    where arquivado = false and status in ('ativo', 'afastado')
    group by empresa_id, pessoa_id
    having count(*) > 1
  ) then
    raise exception 'VINCULOS_FUNCIONAIS_DUPLICADOS_PREEXISTENTES';
  end if;

  if has_function_privilege('anon', 'public.readmitir_pessoa_controlado(uuid,uuid,text,date,uuid,text,date,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.readmitir_pessoa_controlado(uuid,uuid,text,date,uuid,text,date,text)', 'EXECUTE') then
    raise exception 'PRIVILEGIOS_READMISSAO_2C4_INVALIDOS';
  end if;
end $$;

commit;
