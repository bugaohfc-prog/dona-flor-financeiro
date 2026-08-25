begin;

-- df_auditoria_eventos exige exatamente modulo.entidade.acao.
-- Mantem a semantica do checklist e ajusta somente os nomes dos eventos.
do $$
declare
  v_alteracao record;
  v_funcao regprocedure;
  v_definicao text;
begin
  for v_alteracao in
    select * from (values
      (
        'public.criar_item_checklist_desligamento_controlado(uuid,uuid,uuid,date,text,text)',
        'rh.desligamento.checklist_item.criado',
        'rh.checklist_item.criado'
      ),
      (
        'public.atualizar_item_checklist_desligamento_controlado(uuid,uuid,date,text,text)',
        'rh.desligamento.checklist_item.atualizado',
        'rh.checklist_item.atualizado'
      ),
      (
        'public.alterar_estado_item_checklist_desligamento_controlado(uuid,uuid,text,text)',
        'rh.desligamento.checklist_item.estado_alterado',
        'rh.checklist_item.estado_alterado'
      )
    ) as x(assinatura, acao_antiga, acao_nova)
  loop
    v_funcao := to_regprocedure(v_alteracao.assinatura);
    if v_funcao is null then
      raise exception 'FUNCAO_CHECKLIST_2C6B_AUSENTE: %', v_alteracao.assinatura;
    end if;

    select pg_get_functiondef(v_funcao) into v_definicao;
    if position(v_alteracao.acao_antiga in v_definicao) = 0 then
      raise exception 'ACAO_AUDITORIA_CHECKLIST_2C6B_INESPERADA: %', v_alteracao.assinatura;
    end if;

    execute replace(v_definicao, v_alteracao.acao_antiga, v_alteracao.acao_nova);
  end loop;
end $$;

commit;
