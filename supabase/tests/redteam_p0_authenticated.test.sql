begin;

select plan(43);

-- Identidades e tenant do teste.
insert into public.df_empresas (id, nome) values
  ('10000000-0000-0000-0000-000000000001', 'Empresa P0');
insert into public.df_filiais (id, empresa_id, nome) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Filial A'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Filial B');
insert into public.df_centros_custo (id, empresa_id, nome) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Centro');

insert into public.df_usuarios_empresas
  (id, empresa_id, user_id, email, perfil, acesso_todas_filiais)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'admin@ci.local', 'admin', false),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'gerente@ci.local', 'gerente', false),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'total@ci.local', 'gerente', true),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'master@ci.local', 'master', false);
insert into public.df_usuarios_filiais (empresa_id, usuario_id, filial_id)
values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001');

insert into public.df_contas_recorrentes
  (id, empresa_id, descricao, valor, dia_vencimento, filial_id, ativo)
values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Serie A', 100, 10, '20000000-0000-0000-0000-000000000001', true),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Serie B', 100, 10, '20000000-0000-0000-0000-000000000002', true),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Serie sem filial', 100, 10, null, true);
insert into public.df_contas
  (id, empresa_id, descricao, valor, data_vencimento, vencimento, filial_id, status, excluido)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Conta A', 100, current_date, current_date, '20000000-0000-0000-0000-000000000001', 'pendente', false),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Conta B', 100, current_date, current_date, '20000000-0000-0000-0000-000000000002', 'pendente', false),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Conta sem filial', 100, current_date, current_date, null, 'pendente', false);
insert into public.df_notas (id, empresa_id, titulo, filial_id) values
  ('71000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nota A', '20000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nota B', '20000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Nota sem filial', null);
insert into public.df_receitas
  (id, empresa_id, filial_id, origem, valor, data_receita)
values
  ('72000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Receita A', 10, current_date),
  ('72000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Receita B', 10, current_date);
insert into public.df_funcionarios (id, empresa_id, filial_id, nome) values
  ('75000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Funcionario A'),
  ('75000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Funcionario B');
insert into public.df_folha_competencias (id, empresa_id, competencia)
values ('76000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','2026-07');
insert into public.df_folha_lancamentos
  (id, empresa_id, competencia_id, funcionario_id, filial_id, natureza, categoria, valor)
values
  ('77000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','76000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','desconto','compras_vales',10),
  ('77000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','76000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','desconto','compras_vales',10);
insert into public.df_folha_lancamento_itens
  (id, empresa_id, competencia_id, lancamento_id, funcionario_id, filial_id, categoria, valor)
values
  ('78000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','76000000-0000-0000-0000-000000000001','77000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','compras_vales',10),
  ('78000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','76000000-0000-0000-0000-000000000001','77000000-0000-0000-0000-000000000002','75000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','compras_vales',10);

-- P0-1: RPC, idempotencia, grants, arquivamento e auditoria atomica.
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000002', 'gerente@ci.local');
select ok(
  (public.registrar_pagamento_parcial_controlado(
    '10000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001', 40, current_date, 'CI',
    '80000000-0000-0000-0000-000000000001'
  ) ->> 'idempotente')::boolean is false,
  'P0-1 cria pagamento pela RPC'
);
select ok(
  (public.registrar_pagamento_parcial_controlado(
    '10000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001', 40, current_date, 'CI',
    '80000000-0000-0000-0000-000000000001'
  ) ->> 'idempotente')::boolean,
  'P0-1 reutiliza a chave idempotente'
);
select is((select count(*) from public.df_contas_pagamentos where idempotency_key = '80000000-0000-0000-0000-000000000001'), 1::bigint, 'P0-1 nao duplica a mesma chave');
select ok(public.redteam_throws(
  $$update public.df_contas_pagamentos set valor_pago = 1 where idempotency_key = '80000000-0000-0000-0000-000000000001'$$,
  '42501'
), 'P0-1 nega UPDATE financeiro direto');
select ok((public.definir_arquivamento_pagamento_parcial(
  '10000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  (select id from public.df_contas_pagamentos where idempotency_key = '80000000-0000-0000-0000-000000000001'), true
) ->> 'ok')::boolean, 'P0-1 arquiva pela RPC autorizada');
select ok((select arquivado from public.df_contas_pagamentos where idempotency_key = '80000000-0000-0000-0000-000000000001'), 'P0-1 RPC altera somente o arquivamento');
reset role;
select ok(exists(select 1 from public.df_auditoria_eventos where acao = 'financeiro.pagamento_parcial.estornado'), 'P0-1 arquivamento gera auditoria');

create or replace function public.redteam_rejeitar_auditoria_eventos()
returns trigger language plpgsql as $$ begin raise exception 'falha de auditoria CI'; end $$;
create trigger redteam_rejeitar_auditoria_eventos before insert on public.df_auditoria_eventos
for each row execute function public.redteam_rejeitar_auditoria_eventos();
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000002', 'gerente@ci.local');
select throws_ok(
  $$select public.registrar_pagamento_parcial_controlado('10000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',10,current_date,'atomicidade','80000000-0000-0000-0000-000000000002')$$,
  'P0001', 'falha de auditoria CI', 'P0-1 falha de auditoria aborta a RPC'
);
reset role;
drop trigger redteam_rejeitar_auditoria_eventos on public.df_auditoria_eventos;
select is((select count(*) from public.df_contas_pagamentos where idempotency_key = '80000000-0000-0000-0000-000000000002'), 0::bigint, 'P0-1 escrita e auditoria sao atomicas');

-- P0-2: grants, retencao e auditoria da exclusao na mesma transacao.
insert into public.df_contas (id, empresa_id, descricao, valor, data_vencimento, filial_id, excluido, excluido_em)
values
 ('73000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Lixeira recente',10,current_date,'20000000-0000-0000-0000-000000000001',true,now()-interval '10 days'),
 ('73000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Lixeira antiga',10,current_date,'20000000-0000-0000-0000-000000000001',true,now()-interval '61 days');
insert into public.df_notas (id, empresa_id, titulo, filial_id, excluido, excluido_em)
values ('74000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Nota antiga','20000000-0000-0000-0000-000000000001',true,now()-interval '61 days');
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000001', 'admin@ci.local');
select ok(public.redteam_throws($$delete from public.df_contas where id='73000000-0000-0000-0000-000000000002'$$,'42501'), 'P0-2 nega DELETE direto de conta');
select ok(public.redteam_throws($$delete from public.df_notas where id='74000000-0000-0000-0000-000000000001'$$,'42501'), 'P0-2 nega DELETE direto de nota');
select throws_ok(
  $$select public.excluir_conta_definitivamente('10000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000001')$$,
  '55000', null, 'P0-2 aplica retencao de 60 dias'
);
select ok((public.excluir_conta_definitivamente('10000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000002')->>'excluida')::boolean, 'P0-2 exclui conta elegivel pela RPC');
select ok((public.excluir_nota_definitivamente('10000000-0000-0000-0000-000000000001','74000000-0000-0000-0000-000000000001')->>'excluida')::boolean, 'P0-2 exclui nota elegivel pela RPC');
reset role;
select ok(exists(select 1 from public.df_auditoria_admin where acao='conta_lixeira_excluida_definitivo' and registro_id='73000000-0000-0000-0000-000000000002'), 'P0-2 audita exclusao de conta');
select ok(exists(select 1 from public.df_auditoria_admin where acao='nota_lixeira_excluida_definitivo' and registro_id='74000000-0000-0000-0000-000000000001'), 'P0-2 audita exclusao de nota');

insert into public.df_contas (id, empresa_id, descricao, valor, data_vencimento, filial_id, excluido, excluido_em)
values ('73000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Atomicidade lixeira',10,current_date,'20000000-0000-0000-0000-000000000001',true,now()-interval '61 days');
create or replace function public.redteam_rejeitar_auditoria_admin()
returns trigger language plpgsql as $$ begin raise exception 'falha de auditoria lixeira CI'; end $$;
create trigger redteam_rejeitar_auditoria_admin before insert on public.df_auditoria_admin
for each row execute function public.redteam_rejeitar_auditoria_admin();
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000001', 'admin@ci.local');
select throws_ok(
  $$select public.excluir_conta_definitivamente('10000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000003')$$,
  'P0001', 'falha de auditoria lixeira CI', 'P0-2 falha de auditoria aborta exclusao'
);
reset role;
drop trigger redteam_rejeitar_auditoria_admin on public.df_auditoria_admin;
select ok(exists(select 1 from public.df_contas where id='73000000-0000-0000-0000-000000000003'), 'P0-2 exclusao e auditoria sao atomicas');

-- P0-3: matriz real de filial, NULL e mudanca entre filiais.
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000002', 'gerente@ci.local');
select ok(public.df_usuario_pode_acessar_filial('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'), 'P0-3 filial atribuida permitida');
select ok(not public.df_usuario_pode_acessar_filial('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002'), 'P0-3 filial nao atribuida negada');
select ok(not public.df_usuario_pode_acessar_filial('10000000-0000-0000-0000-000000000001',null), 'P0-3 filial NULL negada ao restrito');
select is((select count(*) from public.df_contas where id in ('70000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000003')), 1::bigint, 'P0-3 SELECT de contas respeita filial');
select is((select count(*) from public.df_notas where id in ('71000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000003')), 1::bigint, 'P0-3 SELECT de notas respeita filial');
select is((select count(*) from public.df_contas_recorrentes where id in ('60000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000003')), 1::bigint, 'P0-3 SELECT de recorrencias respeita filial');
select is((select count(*) from public.df_receitas where id in ('72000000-0000-0000-0000-000000000001','72000000-0000-0000-0000-000000000002')), 1::bigint, 'P0-3 SELECT de receitas respeita filial');
select ok(public.redteam_throws($$update public.df_contas set filial_id='20000000-0000-0000-0000-000000000002' where id='70000000-0000-0000-0000-000000000001'$$,'42501'), 'P0-3 bloqueia mover conta para filial proibida');
select ok(public.redteam_throws($$insert into public.df_contas(empresa_id,descricao,valor,data_vencimento,filial_id) values('10000000-0000-0000-0000-000000000001','Sem filial',1,current_date,null)$$,'42501'), 'P0-3 bloqueia INSERT com filial NULL ao restrito');
select is((select count(*) from public.df_folha_lancamentos), 0::bigint, 'P0-3 Folha nao e exposta a gerente');
select is((select count(*) from public.df_folha_lancamento_itens), 0::bigint, 'P0-3 itens da Folha nao sao expostos a gerente');
select is(public.redteam_rows_affected($$update public.df_folha_lancamentos set valor=999 where id='77000000-0000-0000-0000-000000000001'$$), 0::bigint, 'P0-3 gerente nao altera Folha por caminho direto');
select ok(public.redteam_throws($$insert into public.df_folha_lancamentos(empresa_id,competencia_id,funcionario_id,filial_id,natureza,categoria,valor) values('10000000-0000-0000-0000-000000000001','76000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','desconto','compras_vales',1)$$,'42501'), 'P0-3 gerente nao insere lancamento de Folha');
reset role;

set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000003', 'total@ci.local');
select ok(public.df_usuario_pode_acessar_filial('10000000-0000-0000-0000-000000000001',null), 'P0-3 acesso total explicito inclui filial NULL');
reset role;

set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000001', 'admin@ci.local');
select is((select count(*) from public.df_folha_lancamentos where id in ('77000000-0000-0000-0000-000000000001','77000000-0000-0000-0000-000000000002')), 2::bigint, 'P0-3 Admin preserva leitura integral da Folha');
select is((select count(*) from public.df_folha_lancamento_itens where id in ('78000000-0000-0000-0000-000000000001','78000000-0000-0000-0000-000000000002')), 2::bigint, 'P0-3 Admin preserva leitura integral dos itens da Folha');
reset role;

-- P0-4: leitura de membro e mutacao apenas administrativa.
set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000002', 'gerente@ci.local');
select is((select count(*) from public.df_contas_recorrentes where id='60000000-0000-0000-0000-000000000001'), 1::bigint, 'P0-4 membro autorizado mantem SELECT');
select ok(public.redteam_throws($$insert into public.df_contas_recorrentes(empresa_id,descricao,valor,dia_vencimento,filial_id) values('10000000-0000-0000-0000-000000000001','Negada',1,1,'20000000-0000-0000-0000-000000000001')$$,'42501'), 'P0-4 gerente nao insere recorrencia');
select is(public.redteam_rows_affected($$update public.df_contas_recorrentes set valor=999 where id='60000000-0000-0000-0000-000000000001'$$), 0::bigint, 'P0-4 gerente nao atualiza recorrencia');
select is(public.redteam_rows_affected($$delete from public.df_contas_recorrentes where id='60000000-0000-0000-0000-000000000001'$$), 0::bigint, 'P0-4 gerente nao exclui recorrencia');
reset role;

set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000001', 'admin@ci.local');
select lives_ok($$insert into public.df_contas_recorrentes(id,empresa_id,descricao,valor,dia_vencimento,filial_id) values('60000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','Admin',1,1,'20000000-0000-0000-0000-000000000001')$$, 'P0-4 Admin insere recorrencia');
select lives_ok($$update public.df_contas_recorrentes set valor=2 where id='60000000-0000-0000-0000-000000000004'$$, 'P0-4 Admin atualiza recorrencia');
select lives_ok($$delete from public.df_contas_recorrentes where id='60000000-0000-0000-0000-000000000004'$$, 'P0-4 Admin exclui recorrencia');
reset role;

set local role authenticated;
select public.redteam_set_claims('50000000-0000-0000-0000-000000000004', 'master@ci.local');
select lives_ok($$insert into public.df_contas_recorrentes(id,empresa_id,descricao,valor,dia_vencimento,filial_id) values('60000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','Master',1,1,'20000000-0000-0000-0000-000000000002')$$, 'P0-4 Master insere recorrencia');
select lives_ok($$delete from public.df_contas_recorrentes where id='60000000-0000-0000-0000-000000000005'$$, 'P0-4 Master exclui recorrencia');
reset role;

select * from finish();
rollback;
