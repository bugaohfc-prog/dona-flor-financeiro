begin;

-- A origem adicional descreve a captura, nunca altera a identidade preservada.
alter table public.df_folha_lancamentos
  drop constraint df_folha_lancamentos_snapshot_origem_check,
  add constraint df_folha_lancamentos_snapshot_origem_check check
    (snapshot_origem in ('capturado_criacao_v1', 'legacy_backfill_v1', 'retificacao_historica_v1'));

create or replace function public.df_folha_lancamentos_snapshot_data_2c2()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_original public.df_folha_lancamentos%rowtype;
  v_competencia text;
  v_data date;
  v_filial uuid;
  v_contexto text := nullif(current_setting('dna.folha_retificacao_origem_id', true), '');
begin
  select competencia into v_competencia from public.df_folha_competencias
    where empresa_id=new.empresa_id and id=new.competencia_id;
  if not found then raise exception 'COMPETENCIA_FOLHA_NAO_ENCONTRADA'; end if;
  v_data := coalesce(new.data_referencia,
    (to_date(v_competencia || '-01','YYYY-MM-DD') + interval '1 month - 1 day')::date);
  if tg_op='UPDATE' then
    if row(new.funcionario_nome_snapshot,new.pessoa_id_snapshot,new.filial_id_snapshot,
      new.filial_nome_snapshot,new.cargo_snapshot,new.data_admissao_snapshot,
      new.snapshot_origem,new.snapshot_capturado_em) is distinct from
      row(old.funcionario_nome_snapshot,old.pessoa_id_snapshot,old.filial_id_snapshot,
      old.filial_nome_snapshot,old.cargo_snapshot,old.data_admissao_snapshot,
      old.snapshot_origem,old.snapshot_capturado_em) then
      raise exception 'SNAPSHOT_FOLHA_IMUTAVEL';
    end if;
    if new.funcionario_id is distinct from old.funcionario_id then raise exception 'FUNCIONARIO_LANCAMENTO_FOLHA_IMUTAVEL'; end if;
    if new.empresa_id is distinct from old.empresa_id then raise exception 'EMPRESA_LANCAMENTO_FOLHA_IMUTAVEL'; end if;
  elsif v_contexto is not null then
    -- Uma GUC falsificada por authenticated nao concede a identidade do owner.
    if current_user <> 'postgres' or auth.uid() is null or
      current_setting('dna.folha_retificacao_novo_id',true) is distinct from new.id::text then
      raise exception 'CONTEXTO_RETIFICACAO_INVALIDO';
    end if;
    select * into v_original from public.df_folha_lancamentos where id=v_contexto::uuid;
    if not found or v_original.empresa_id is distinct from new.empresa_id
      or v_original.funcionario_id is distinct from new.funcionario_id
      or new.categoria <> 'falta_injustificada' or v_original.categoria <> new.categoria
      or new.origem_id is distinct from v_original.id
      or new.origem_lancamento is distinct from 'retificacao_historica'
      or not public.df_funcionarios_pode_escrever(new.empresa_id)
      or not public.df_usuario_pode_acessar_filial(new.empresa_id,v_original.filial_id_snapshot) then
      raise exception 'ORIGEM_RETIFICACAO_INVALIDA';
    end if;
    new.filial_id := v_original.filial_id_snapshot;
    new.funcionario_nome_snapshot := v_original.funcionario_nome_snapshot;
    new.pessoa_id_snapshot := v_original.pessoa_id_snapshot;
    new.filial_id_snapshot := v_original.filial_id_snapshot;
    new.filial_nome_snapshot := v_original.filial_nome_snapshot;
    new.cargo_snapshot := v_original.cargo_snapshot;
    new.data_admissao_snapshot := v_original.data_admissao_snapshot;
    new.snapshot_origem := 'retificacao_historica_v1';
    new.snapshot_capturado_em := now();
  else
    v_filial := public.df_funcionario_filial_na_data_lote3(new.empresa_id,new.funcionario_id,v_data);
    select p.nome,f.pessoa_id,v_filial,coalesce(fi.razao_social,fi.nome),nullif(btrim(f.cargo),''),f.data_admissao
      into new.funcionario_nome_snapshot,new.pessoa_id_snapshot,new.filial_id_snapshot,
        new.filial_nome_snapshot,new.cargo_snapshot,new.data_admissao_snapshot
      from public.df_funcionarios f join public.df_pessoas p on p.empresa_id=f.empresa_id and p.id=f.pessoa_id
      left join public.df_filiais fi on fi.empresa_id=f.empresa_id and fi.id=v_filial
      where f.empresa_id=new.empresa_id and f.id=new.funcionario_id;
    if not found or new.pessoa_id_snapshot is null or nullif(btrim(new.funcionario_nome_snapshot),'') is null then
      raise exception 'IDENTIDADE_FOLHA_NAO_ENCONTRADA';
    end if;
    new.filial_id := v_filial;
    new.snapshot_origem := 'capturado_criacao_v1';
    new.snapshot_capturado_em := now();
  end if;
  if tg_op='INSERT' or new.data_referencia is distinct from old.data_referencia
    or new.funcionario_id is distinct from old.funcionario_id then
    perform public.df_folha_validar_data_efetiva_2c2(new.empresa_id,new.funcionario_id,v_data);
  end if;
  return new;
end;
$$;

create or replace function public.df_retificar_ocorrencia_folha(
  p_item_original_id uuid, p_competencia_destino_id uuid,
  p_data_referencia_corrigida date, p_motivo text, p_correlation_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_item public.df_folha_lancamento_itens%rowtype;
  v_pai public.df_folha_lancamentos%rowtype;
  v_origem public.df_folha_competencias%rowtype;
  v_destino public.df_folha_competencias%rowtype;
  v_novo uuid := gen_random_uuid();
  v_novo_item uuid := gen_random_uuid();
  v_anterior jsonb;
  v_resultado jsonb;
  v_pedido jsonb;
  v_pai_arquivado boolean;
begin
  if auth.uid() is null then raise exception 'ACESSO_NEGADO_RETIFICACAO'; end if;
  if p_correlation_id is null or p_item_original_id is null or p_competencia_destino_id is null
    or p_data_referencia_corrigida is null then raise exception 'PARAMETROS_RETIFICACAO_INVALIDOS'; end if;
  if nullif(btrim(p_motivo),'') is null or length(btrim(p_motivo))>1000 then raise exception 'MOTIVO_RETIFICACAO_INVALIDO'; end if;
  select * into v_item from public.df_folha_lancamento_itens where id=p_item_original_id;
  if not found then raise exception 'OCORRENCIA_RETIFICACAO_INDISPONIVEL'; end if;
  if not public.df_funcionarios_pode_escrever(v_item.empresa_id)
    or not public.df_usuario_pode_acessar_filial(v_item.empresa_id,v_item.filial_id) then
    raise exception 'ACESSO_NEGADO_RETIFICACAO';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('folha-retificacao-correlation:'||v_item.empresa_id||':'||p_correlation_id,0));
  v_pedido := jsonb_build_object('item',p_item_original_id,'destino',p_competencia_destino_id,
    'data',p_data_referencia_corrigida,'motivo',btrim(p_motivo));
  select metadados into v_anterior from public.df_auditoria_eventos
    where empresa_id=v_item.empresa_id and correlation_id=p_correlation_id::text
      and acao='folha.ocorrencia.retificada';
  if found then
    if v_anterior->'pedido' is distinct from v_pedido then raise exception 'CORRELATION_RETIFICACAO_REUTILIZADO'; end if;
    return (v_anterior->'resultado') || jsonb_build_object('idempotente',true);
  end if;
  -- Locks de competencias ordenados tambem serializam retificacoes cruzadas.
  perform 1 from public.df_folha_competencias where id in (v_item.competencia_id,p_competencia_destino_id) order by id for update;
  select * into v_pai from public.df_folha_lancamentos where id=v_item.lancamento_id for update;
  select * into v_item from public.df_folha_lancamento_itens where id=p_item_original_id for update;
  if v_item.lancamento_id is distinct from v_pai.id
    or not public.df_funcionarios_pode_escrever(v_item.empresa_id)
    or not public.df_usuario_pode_acessar_filial(v_item.empresa_id,v_item.filial_id) then
    raise exception 'ORIGEM_RETIFICACAO_ALTERADA';
  end if;
  if v_item.arquivado or v_pai.arquivado then raise exception 'OCORRENCIA_RETIFICACAO_ARQUIVADA'; end if;
  if v_item.categoria <> 'falta_injustificada' or v_pai.categoria <> v_item.categoria then raise exception 'CATEGORIA_RETIFICACAO_NAO_SUPORTADA'; end if;
  if v_item.empresa_id is distinct from v_pai.empresa_id or v_item.funcionario_id is distinct from v_pai.funcionario_id
    or v_item.competencia_id is distinct from v_pai.competencia_id then raise exception 'ORIGEM_RETIFICACAO_INVALIDA'; end if;
  if not public.df_usuario_pode_acessar_filial(v_pai.empresa_id,v_pai.filial_id_snapshot) then raise exception 'ACESSO_NEGADO_RETIFICACAO'; end if;
  select * into v_origem from public.df_folha_competencias where id=v_pai.competencia_id and empresa_id=v_pai.empresa_id;
  if not found then raise exception 'ORIGEM_RETIFICACAO_INVALIDA'; end if;
  select * into v_destino from public.df_folha_competencias where id=p_competencia_destino_id and empresa_id=v_pai.empresa_id;
  if not found then raise exception 'DESTINO_RETIFICACAO_INVALIDO'; end if;
  if v_origem.id=v_destino.id then raise exception 'DESTINO_RETIFICACAO_IGUAL_ORIGEM'; end if;
  if v_origem.status not in ('aberta','em_conferencia') or v_origem.fechado_em is not null
    or v_destino.status not in ('aberta','em_conferencia') or v_destino.fechado_em is not null then
    raise exception 'COMPETENCIA_RETIFICACAO_IMUTAVEL';
  end if;
  if to_char(p_data_referencia_corrigida,'YYYY-MM')<>v_destino.competencia then raise exception 'DATA_FALTA_FORA_COMPETENCIA'; end if;
  perform public.df_folha_validar_data_efetiva_2c2(v_pai.empresa_id,v_pai.funcionario_id,p_data_referencia_corrigida);
  perform pg_advisory_xact_lock(hashtextextended('folha-retificacao-destino:'||v_pai.empresa_id||':'||v_pai.funcionario_id||':'||v_destino.id||':'||p_data_referencia_corrigida,0));
  if exists(select 1 from public.df_folha_lancamento_itens i join public.df_folha_lancamentos l on l.id=i.lancamento_id
    where i.empresa_id=v_pai.empresa_id and i.funcionario_id=v_pai.funcionario_id and i.competencia_id=v_destino.id
      and i.categoria='falta_injustificada' and i.data_referencia=p_data_referencia_corrigida and not i.arquivado and not l.arquivado) then
    raise exception 'FALTA_DESTINO_JA_EXISTENTE';
  end if;
  perform set_config('dna.folha_retificacao_origem_id',v_pai.id::text,true);
  perform set_config('dna.folha_retificacao_novo_id',v_novo::text,true);
  insert into public.df_folha_lancamentos(id,empresa_id,competencia_id,funcionario_id,filial_id,natureza,categoria,
    data_referencia,quantidade,valor,origem_lancamento,origem_id,observacao_administrativa)
    values(v_novo,v_pai.empresa_id,v_destino.id,v_pai.funcionario_id,v_pai.filial_id_snapshot,'desconto','falta_injustificada',
      p_data_referencia_corrigida,0,0,'retificacao_historica',v_pai.id,btrim(p_motivo));
  -- Limpar antes de qualquer outra gravacao, inclusive dentro da mesma transacao.
  perform set_config('dna.folha_retificacao_origem_id','',true);
  perform set_config('dna.folha_retificacao_novo_id','',true);
  insert into public.df_folha_lancamento_itens(id,empresa_id,competencia_id,lancamento_id,funcionario_id,filial_id,
    categoria,data_referencia,quantidade,valor,descricao,origem_item,observacao_administrativa)
    values(v_novo_item,v_pai.empresa_id,v_destino.id,v_novo,v_pai.funcionario_id,v_pai.filial_id_snapshot,
      'falta_injustificada',p_data_referencia_corrigida,v_item.quantidade,0,v_item.descricao,
      'retificacao_historica:'||v_item.id,btrim(p_motivo));
  update public.df_folha_lancamento_itens set arquivado=true,arquivado_em=now() where id=v_item.id;
  v_pai_arquivado := not exists(select 1 from public.df_folha_lancamento_itens where lancamento_id=v_pai.id and not arquivado);
  if v_pai_arquivado then update public.df_folha_lancamentos set arquivado=true,arquivado_em=now() where id=v_pai.id; end if;
  v_resultado := jsonb_build_object('ok',true,'idempotente',false,'correlation_id',p_correlation_id,
    'lancamento_original_id',v_pai.id,'item_original_id',v_item.id,'lancamento_novo_id',v_novo,'item_novo_id',v_novo_item,
    'competencia_origem_id',v_origem.id,'competencia_destino_id',v_destino.id,'data_referencia',p_data_referencia_corrigida,
    'original_item_arquivado',true,'original_lancamento_arquivado',v_pai_arquivado);
  insert into public.df_auditoria_eventos(empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,
    severidade,origem,status,motivo,correlation_id,dados_antes,dados_depois,metadados)
    values(v_pai.empresa_id,auth.uid(),'usuario','financeiro','df_folha_lancamento_itens',v_item.id,
      'folha.ocorrencia.retificada','info','app','sucesso',btrim(p_motivo),p_correlation_id::text,
      jsonb_build_object('lancamento_id',v_pai.id,'item_id',v_item.id,'competencia_id',v_origem.id,
        'data_referencia',v_item.data_referencia,'funcionario_id',v_pai.funcionario_id,'categoria',v_item.categoria,'arquivado',false),
      v_resultado,jsonb_build_object('pedido',v_pedido,'resultado',v_resultado));
  return v_resultado;
end;
$$;

alter function public.df_retificar_ocorrencia_folha(uuid,uuid,date,text,uuid) owner to postgres;
revoke all on function public.df_retificar_ocorrencia_folha(uuid,uuid,date,text,uuid) from public,anon;
grant execute on function public.df_retificar_ocorrencia_folha(uuid,uuid,date,text,uuid) to authenticated;
comment on function public.df_retificar_ocorrencia_folha(uuid,uuid,date,text,uuid) is
  'Retifica falta existente atomicamente. DEFINER necessario: authenticated nao possui INSERT na auditoria. Nao altera status do vinculo ou arquivamento das competencias.';
commit;
