# Progresso da Auditoria REDTEAM

[P0-1] [status: aplicado] [commit: security: protege pagamentos parciais concorrentes] Pagamento parcial migrado para RPC transacional com bloqueio, idempotência e auditoria atômica.
[P0-2] [status: aplicado] [commit: security: protege exclusao definitiva da lixeira] Exclusões definitivas de contas e notas migradas para RPCs com retenção e auditoria transacionais.
[P0-3] [status: aplicado] [commit: security: aplica escopo financeiro por filial] Escopo explícito por filial aplicado às leituras e escritas financeiras, sem inferência por ausência de atribuições.
[P0-4] [status: aplicado] [commit: security: restringe mutacoes de recorrencias] Leitura de recorrências preservada por empresa e filial; criação, alteração e exclusão limitadas a Admin/Master no banco e na interface.
