# Progresso da Auditoria REDTEAM

[P0-1] [status: bloqueado] [commit: security: fecha bypass de atualizacao de pagamentos] Criação e arquivamento usam RPCs transacionais; INSERT e UPDATE diretos ficam revogados, aguardando validação autenticada em banco isolado.
[P0-2] [status: aplicado] [commit: security: protege exclusao definitiva da lixeira] Exclusões definitivas de contas e notas migradas para RPCs com retenção e auditoria transacionais.
[P0-3] [status: bloqueado] [commit: security: completa escopo financeiro por filial] Incluídas df_contas, df_contas_recorrentes, df_receitas, df_folha_lancamentos e df_folha_lancamento_itens; df_notas permanece operacional escopada; df_funcionarios foi excluída por pertencer a RH e df_usuarios_filiais por ser controle de acesso. Usuário restrito não acessa filial_id NULL; Admin, Master e acesso total explícito permanecem autorizados. Validação RLS autenticada em banco isolado continua pendente.
[P0-4] [status: aplicado] [commit: security: restringe mutacoes de recorrencias] Leitura de recorrências preservada por empresa e filial; criação, alteração e exclusão limitadas a Admin/Master no banco e na interface.
