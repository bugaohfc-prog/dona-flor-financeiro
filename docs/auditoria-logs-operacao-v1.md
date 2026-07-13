# Auditoria e logs — operação V1

## Escopo encerrado

Esta documentação fecha os ciclos 0 a 8 da frente de Auditoria e Logs da V1. A auditoria de negócio permanece separada dos logs técnicos; nenhum evento permite edição ou exclusão pela interface.

## Acesso e isolamento

- A tela de auditoria é somente leitura e restrita a Admin/Master.
- A consulta filtra `empresa_id` e usa paginação server-side de 50 registros.
- O isolamento entre empresas deve ser validado continuamente com RLS e acesso direto negado.
- Exportações usam somente os eventos já visíveis ao usuário.

## Dados sensíveis

Não registrar senhas, tokens, sessões, CPF/CNPJ, dados bancários, anexos ou payloads completos. Detalhes exibidos na tela devem permanecer sanitizados. Mensagens técnicas são truncadas e não incluem payload de requisição.

## Retenção e volume

Política recomendada: retenção operacional de 24 meses, seguida de arquivamento conforme a política de dados da empresa. Antes de qualquer expurgo, gerar exportação administrativa e registrar a aprovação. Índices e volume devem ser acompanhados por período, empresa e data de criação; alterações de schema exigem ciclo próprio.

## Falhas técnicas e desempenho

Falhas e latência de gravação são sinalizadas com módulo `sistema`, ações `sistema.auditoria_falhou` e `sistema.auditoria_lenta`, sem interromper a operação principal. O limiar atual de lentidão é 1,5 s. Eventos técnicos não devem ser usados como substitutos de métricas de infraestrutura.

## Limitação operacional conhecida

A Edge Function atualmente publicada aceita apenas o evento histórico de pagamento parcial (`financeiro.pagamento_parcial.criado`). Os demais eventos adicionados ao frontend ficam sujeitos à rejeição da função até que um ciclo específico amplie a taxonomia e a validação da Edge Function. Não considerar esses eventos como cobertura efetiva antes dessa confirmação.

## Contingência e rollback

1. Se a auditoria falhar, manter a operação financeira e registrar o erro técnico localmente.
2. Investigar o evento técnico por `correlation_id`, empresa e horário.
3. Reverter o commit do lote que introduziu a mudança, sem reset destrutivo:

   `git revert <commit_sha>`

4. Revalidar build, RLS e acesso por perfil após o rollback.

## Checklist de encerramento

- [x] tela somente leitura, filtros, paginação e estados de erro/vazio;
- [x] timeline detalhada por evento;
- [x] exportação CSV e XLSX;
- [x] mascaramento e bloqueio de payload sensível;
- [x] sinalização de falha e latência da auditoria;
- [x] nenhum acesso de escrita pela UI;
- [x] build de produção aprovado;
- [x] banco, RLS, migrations e V2 não alterados nesta frente;
- [ ] ampliar a Edge Function para os novos eventos em ciclo futuro, com testes de autorização e sanitização.

## Testes operacionais futuros

Validar em ambiente autenticado: Admin/Master versus usuário comum; duas empresas; paginação com grande volume; exportação; evento duplicado; falha de Edge Function; latência; tentativa de editar/excluir; e ausência de dados sensíveis nos resultados.
