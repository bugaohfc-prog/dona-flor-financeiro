# Diagnóstico SQL de SECURITY DEFINER

Data: 2026-06-28

Arquivo SQL: `docs/supabase/sql/diagnostico-security-definer.sql`

## Objetivo

Este diagnóstico apoia a auditoria das funções `SECURITY DEFINER` expostas no schema `public`, principalmente as funções apontadas pelo Supabase Advisor como executáveis por `anon` e/ou `authenticated`.

O SQL ajuda a levantar:

- funções `SECURITY DEFINER` em `public`;
- linguagem, volatilidade, argumentos e `search_path`;
- privilégios efetivos de `EXECUTE` para `anon` e `authenticated`;
- funções potencialmente expostas como RPC/PostgREST;
- triggers que usam essas funções;
- policies que citam essas funções;
- views que citam essas funções;
- funções que chamam outras funções sensíveis.

## Segurança

O arquivo é somente leitura.

Ele contém apenas consultas `SELECT` contra catálogos e views de metadados do Postgres/Supabase. Não contém `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP`, `CREATE POLICY`, `ALTER VIEW`, criação de índice, remoção de índice, migration ou alteração de dados.

Nenhuma correção deve ser aplicada automaticamente a partir do resultado.

## Como executar

1. Abrir o SQL Editor do Supabase no projeto `contas-donaflor`.
2. Copiar o conteúdo de `docs/supabase/sql/diagnostico-security-definer.sql`.
3. Executar as seções em ordem ou uma seção por vez.
4. Exportar ou salvar os resultados por seção.
5. Anexar os resultados ao próximo ciclo de planejamento antes de qualquer alteração.

## Como interpretar

- Se `anon_has_execute = true`, a função pode ser chamada sem sessão autenticada quando exposta pela API.
- Se `authenticated_has_execute = true`, usuários logados podem chamar a função diretamente via RPC, além de eventuais usos por RLS, trigger ou rotina interna.
- `has_search_path_config = false` indica função candidata a ciclo separado de `search_path`, sem misturar com revogação de permissões.
- Resultado em "triggers" indica função provavelmente interna; isso não prova que `EXECUTE` público seja necessário.
- Resultado em "policies" indica dependência de RLS; não revogar `authenticated` sem teste por perfil e isolamento multiempresa.
- Resultado em "views" ou "funções que chamam funções sensíveis" indica dependência indireta que precisa ser revisada antes de qualquer restrição.

## Próximos passos

Após gerar os resultados:

1. Comparar com `docs/supabase/security-definer-funcoes-auditoria.md`.
2. Separar funções em pacotes pequenos:
   - trigger/validação interna;
   - helpers de RLS/policies;
   - Auth/legado;
   - administração/sensíveis.
3. Para qualquer ciclo de correção futura, criar rollback explícito antes da alteração.
4. Não executar `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de policy ou mudança de Auth sem autorização específica.

## Estado deste ciclo

- SQL criado e versionado.
- SQL não executado contra produção neste ciclo.
- Banco não alterado.
- Funções, grants, RLS, policies, views e dados não alterados.
