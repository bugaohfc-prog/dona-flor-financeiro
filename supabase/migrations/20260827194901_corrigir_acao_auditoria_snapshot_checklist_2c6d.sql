begin;

do $$
declare
  v_funcao regprocedure := to_regprocedure(
    'public.criar_item_checklist_desligamento_controlado(uuid,uuid,uuid,date,text,text)'
  );
  v_definicao text;
begin
  if v_funcao is null then
    raise exception 'RPC_CRIAR_ITEM_CHECKLIST_2C6D_AUSENTE';
  end if;

  v_definicao := pg_get_functiondef(v_funcao);
  if position('descricao_snapshot' in v_definicao) = 0
     or position('rh.desligamento.checklist_item.criado' in v_definicao) = 0 then
    raise exception 'RPC_CRIAR_ITEM_CHECKLIST_2C6D_FORA_DO_CONTRATO_ESPERADO';
  end if;

  execute replace(
    v_definicao,
    'rh.desligamento.checklist_item.criado',
    'rh.checklist_item.criado'
  );
end $$;

commit;
