# Progresso da Auditoria REDTEAM

[P0-1] [status: APROVADO] [commit: security: fecha bypass de atualizacao de pagamentos] Criacao e arquivamento usam RPCs transacionais; INSERT e UPDATE diretos permanecem revogados.
[P0-2] [status: APROVADO] [commit: security: protege exclusao definitiva da lixeira] Exclusoes definitivas de contas e notas usam RPCs com retencao de 60 dias e auditoria transacional.
[P0-3] [status: APROVADO] [commit: security: completa escopo financeiro por filial] Escopo canonico por filial validado nas tabelas financeiras, inclusive Folha; usuario restrito nao acessa filial_id NULL.
[P0-4] [status: APROVADO] [commit: security: restringe mutacoes de recorrencias] Leitura de recorrencias permanece autorizada; mutacoes ficam limitadas a Admin/Master.

## Validacao autenticada em banco isolado

- CI: `30625132588`
- Resultado: `43/43` testes autenticados aprovados
- SHA de infraestrutura: `0308ec6cd1e505942130b1b4c48c3f0b813d2af5`

## Limitacoes residuais

- Os testes autenticados foram executados diretamente no PostgreSQL, sem passagem pelo PostgREST.
- As migrations ainda nao foram aplicadas no banco usado pelo Preview.
