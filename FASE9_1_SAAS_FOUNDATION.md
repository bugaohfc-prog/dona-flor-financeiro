# FASE 9.1 — SaaS Foundation Guardrails

## Objetivo
Preparar o projeto para multiempresa sem mudar visual, sem mexer no Topbar e sem alterar o fluxo validado do dashboard.

## O que esta fase entrega

- Criação de `tenantService.js` como ponto central de vínculo usuário → empresa.
- `App.jsx` deixa de consultar diretamente o vínculo de empresa em bloco solto.
- Normalização de perfil passa pelo mesmo contrato usado em usuários.
- SQL opcional com índices e proteção contra duplicidade por empresa/e-mail.

## O que esta fase NÃO faz

- Não ativa RLS ainda.
- Não muda tabelas produtivas obrigatoriamente.
- Não altera layout do dashboard.
- Não muda Topbar.
- Não cria painel master ainda.

## Validação pós-deploy

1. Login normal.
2. Dashboard abre.
3. Nome do usuário aparece.
4. Contas carregam.
5. Notas carregam.
6. Usuários carregam.
7. Nenhum ícone novo aparece no topo.

## Próxima fase
FASE 9.2 — RLS Readiness: mapear policies de leitura/escrita por `empresa_id`, ainda sem aplicar tudo de uma vez.
