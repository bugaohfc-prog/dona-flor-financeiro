begin;

create or replace function public.df_registrar_auditoria_mutacao_interno(
  p_empresa_id uuid,
  p_entidade_tipo text,
  p_entidade_id uuid,
  p_acao text,
  p_modulo text,
  p_correlation_id uuid,
  p_dados_antes jsonb,
  p_dados_depois jsonb,
  p_pedido jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.df_auditoria_eventos (
    empresa_id,
    user_id,
    ator_tipo,
    modulo,
    entidade_tipo,
    entidade_id,
    acao,
    severidade,
    origem,
    status,
    correlation_id,
    dados_antes,
    dados_depois,
    metadados
  ) values (
    p_empresa_id,
    auth.uid(),
    'usuario',
    case when p_modulo = 'folha' then 'rh' else p_modulo end,
    p_entidade_tipo,
    p_entidade_id,
    p_acao,
    'critical',
    'app',
    'sucesso',
    p_correlation_id::text,
    p_dados_antes,
    p_dados_depois,
    jsonb_build_object(
      'pedido', p_pedido,
      'resultado', jsonb_build_object('id', p_entidade_id)
    )
  );
end;
$$;

alter function public.df_registrar_auditoria_mutacao_interno(uuid,text,uuid,text,text,uuid,jsonb,jsonb,jsonb)
  owner to postgres;
revoke all on function public.df_registrar_auditoria_mutacao_interno(uuid,text,uuid,text,text,uuid,jsonb,jsonb,jsonb)
  from public, anon, authenticated, service_role;

commit;
