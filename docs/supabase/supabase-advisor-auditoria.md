# Auditoria Supabase Advisor

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Objetivo

Registrar uma auditoria documental dos avisos atuais do Supabase Advisor, classificando riscos e definindo uma ordem segura de correção futura.

Este ciclo é somente documentação e inventário. Não corrige banco, não cria migration, não altera RLS, policies, funções, views, índices, dados, frontend, services, hooks, automações ou secrets.

## Fonte da auditoria

Consulta executada em 2026-06-28 pelo conector Supabase:

- Security Advisor
- Performance Advisor

## Diretriz de segurança deste inventário

- Não remover policy sem confirmar uso real pelo app.
- Não executar `REVOKE` de função sem mapear chamadas RPC, triggers, policies e rotinas internas.
- Não apagar índice marcado como unused sem auditoria de consultas reais e janela de observação.
- Não mexer em autenticação sem plano próprio.
- Não misturar correções de segurança e performance no mesmo ciclo.
- Em produção, preferir ciclos pequenos com rollback explícito, diagnóstico antes/depois e validação anon/auth quando envolver RLS.

## Resumo executivo

Os achados mais relevantes são:

- Funções `SECURITY DEFINER` no schema `public` executáveis por `anon` e `authenticated`.
- View `public.df_lembretes_hoje` definida como `SECURITY DEFINER`.
- Tabelas públicas com RLS habilitado e nenhuma policy: `public.contas` e `public.df_push_tokens`.
- Funções sem `search_path` fixo.
- Proteção contra senhas vazadas desativada no Supabase Auth.
- Foreign keys sem índice em tabelas ativas, principalmente no financeiro.
- Avisos de performance em RLS (`auth_rls_initplan`) e múltiplas policies permissivas.
- Índices duplicados, que devem ser tratados somente após auditoria.

## Classificação por grupo

### A. Segurança crítica ou alta prioridade

#### A1. `Public Can Execute SECURITY DEFINER Function`

Alerta: `anon_security_definer_function_executable`

Afetados:

- `public.criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)`
- `public.df_auditoria_admin_sanitize_destinatario_alerta()`
- `public.df_empresas_do_usuario()`
- `public.df_folha_lancamentos_validar_vinculos()`
- `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()`
- `public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa()`
- `public.df_funcionarios_ferias_periodos_validar_vinculos()`
- `public.df_funcionarios_pode_escrever(p_empresa_id uuid)`
- `public.df_funcionarios_validar_filial_empresa()`
- `public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)`
- `public.df_usuario_eh_admin(p_empresa_id uuid)`
- `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])`
- `public.get_empresa_usuario()`
- `public.handle_new_user()`
- `public.is_admin()`
- `public.is_master()`
- `public.login_usuario(p_usuario text, p_senha text)`
- `public.vincular_usuario_logado()`

Risco prático: funções `SECURITY DEFINER` rodam com privilégios do dono e podem contornar RLS. Quando expostas no schema `public`, podem virar endpoints RPC acessíveis por usuários anônimos, dependendo de grants e configuração da API.

Legado ou ativo: misto. Há funções claramente legadas (`login_usuario`, `is_admin`, `get_empresa_usuario`) e funções ativas/recém-criadas em permissões, auditoria, Gestão de Pessoas e fechamento de folha. O uso real precisa ser confirmado no app, em triggers e em policies antes de qualquer revogação.

Decisão: corrigir depois, em ciclo próprio de auditoria, sem alterar permissões inicialmente.

Proposta de correção em alto nível:

- inventariar chamadas no código, migrations, triggers, policies e RPC;
- classificar cada função como RPC pública intencional, helper interno, trigger-only ou legado;
- para helpers internos, avaliar `REVOKE EXECUTE` de `PUBLIC`, `anon` e/ou `authenticated`;
- para funções necessárias via app, exigir checagens explícitas de identidade/empresa/perfil dentro da função;
- avaliar mover funções internas para schema não exposto ou trocar para `SECURITY INVOKER` quando seguro;
- manter `SECURITY DEFINER` apenas onde houver justificativa e `search_path` fixo.

Risco de quebra: alto. Revogar ou alterar modo de execução pode quebrar login legado, onboarding, vínculos de usuário, permissões, triggers de auditoria e validações de Gestão de Pessoas.

Rollback previsto: migration reversível restaurando grants/modo da função exatamente como estavam; diagnóstico antes/depois com lista de `prosecdef`, grants de execução e smoke test dos fluxos afetados.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

#### A2. `Signed-In Users Can Execute SECURITY DEFINER Function`

Alerta: `authenticated_security_definer_function_executable`

Afetados: mesmo conjunto principal de funções listadas em A1.

Risco prático: usuários autenticados podem chamar helpers privilegiados diretamente via RPC, mesmo quando a função foi desenhada para ser usada por policy, trigger ou rotina interna.

Legado ou ativo: misto. Como o app opera com usuário autenticado, este alerta deve ser auditado com mais cuidado que uma remoção ampla de grants.

Decisão: corrigir depois, junto com A1, começando por auditoria sem mudança.

Proposta de correção em alto nível:

- identificar quais funções são chamadas diretamente pelo frontend/service;
- validar quais são chamadas indiretamente por RLS, triggers ou Edge Functions;
- separar funções de leitura de perfil/empresa das funções de escrita ou administração;
- remover execução direta somente após comprovar que não quebra fluxo ativo;
- para funções que continuarem expostas, reforçar validação interna de `auth.uid()`, `empresa_id` e perfil.

Risco de quebra: alto.

Rollback previsto: restaurar grants anteriores e, se necessário, restaurar definição anterior da função.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

#### A3. `Security Definer View`

Alerta: `security_definer_view`

Afetado: view `public.df_lembretes_hoje`

Risco prático: uma view `SECURITY DEFINER` usa permissões/RLS do criador, não do usuário que consulta. Isso pode expor dados além do escopo esperado, especialmente em base multiempresa.

Legado ou ativo: precisa auditoria. Pelo nome, parece relacionada a lembretes/agenda, possivelmente ativa em fluxo operacional.

Decisão: corrigir depois, em ciclo de segurança próprio.

Proposta de correção em alto nível:

- localizar uso da view no frontend, services, scripts e automações;
- validar se a view filtra por `empresa_id` e usuário/perfil;
- avaliar recriar como `security_invoker = true` se compatível;
- se não for usada, planejar descontinuação com prova de não uso;
- se for necessária, validar comportamento por Admin, Master, Gerente e Operador.

Risco de quebra: médio/alto. Pode afetar agenda/lembretes e consultas usadas pelo painel.

Rollback previsto: recriar a view anterior em migration de rollback e validar consultas impactadas.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

#### A4. `RLS Enabled No Policy`

Alerta: `rls_enabled_no_policy`

Afetados:

- tabela `public.contas`
- tabela `public.df_push_tokens`

Risco prático: RLS habilitado sem policy bloqueia acesso comum, mas o risco real depende de grants, FORCE RLS e uso por roles privilegiadas. Em tabela pública, pode indicar objeto legado ou parcialmente endurecido.

Legado ou ativo:

- `public.contas`: documentação anterior indica provável tabela legada, sem uso direto confirmado pelo frontend atual.
- `public.df_push_tokens`: parece relacionada a push, canal atualmente não configurado no fluxo principal; precisa confirmar se há automação futura ou resíduo técnico.

Decisão: não mexer agora. Precisa auditoria antes.

Proposta de correção em alto nível:

- confirmar uso no app, scripts e automações;
- confirmar grants para `anon` e `authenticated`;
- confirmar volume de dados e sensibilidade;
- se legado sem uso, manter bloqueado e documentar;
- se ativo, criar plano de policy mínimo por `empresa_id` e perfil em ciclo próprio.

Risco de quebra: médio. Criar policy errada pode abrir acesso indevido; bloquear/remover pode afetar fluxo oculto.

Rollback previsto: reverter policies/grants criados no ciclo específico, preservando RLS.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### B. Segurança média/baixa

#### B1. `Function Search Path Mutable`

Alerta: `function_search_path_mutable`

Afetados:

- `public.atualizar_data_modificacao`
- `public.login_usuario`
- `public.criar_usuario`
- `public.handle_new_user`
- `public.bloquear_exclusao_usuario_master`
- `public.df_contas_calcular_baixa_pagamento`

Risco prático: função sem `search_path` fixo pode resolver objetos de forma inesperada conforme o contexto de execução. Em funções privilegiadas, isso aumenta risco de comportamento indevido.

Legado ou ativo: misto. `login_usuario`, `criar_usuario` e `handle_new_user` parecem sensíveis. `df_contas_calcular_baixa_pagamento` parece ativa no financeiro.

Decisão: corrigir depois, como primeira correção candidata após este inventário, desde que cada função seja inspecionada.

Proposta de correção em alto nível:

- extrair definição atual de cada função;
- confirmar dependências de schema;
- fixar `search_path` mínimo, preferencialmente `public` e/ou schemas necessários;
- não alterar lógica da função no mesmo ciclo;
- validar fluxo que aciona cada função.

Risco de quebra: baixo/médio se a função já usa objetos no `public`; maior se depender implicitamente de outro schema.

Rollback previsto: restaurar definição anterior da função, incluindo atributos originais.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

#### B2. `Leaked Password Protection Disabled`

Alerta: `auth_leaked_password_protection`

Afetado: Supabase Auth

Risco prático: novos usuários podem cadastrar senhas já comprometidas em vazamentos conhecidos.

Legado ou ativo: ativo no Auth.

Decisão: depois, em plano próprio de autenticação.

Proposta de correção em alto nível:

- avaliar impacto em UX de login/cadastro;
- documentar comunicação para usuários;
- ativar proteção em ciclo de Auth próprio;
- validar criação/troca de senha.

Risco de quebra: baixo/médio. Pode bloquear senhas fracas/comprometidas de usuários existentes em fluxos de troca ou cadastro.

Rollback previsto: desativar a configuração se houver impacto operacional inesperado.

Remediação Supabase: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### C. Performance com impacto provável

#### C1. `Unindexed foreign keys` em tabelas financeiras centrais

Alerta: `unindexed_foreign_keys`

Afetados prioritários:

- `public.df_contas`, FK `df_contas_centro_custo_id_fkey`
- `public.df_contas`, FK `df_contas_user_id_fkey`
- `public.df_contas`, FK `fk_conta_recorrencia`
- `public.df_contas_pagamentos`, FK `df_contas_pagamentos_conta_id_fkey`

Risco prático: operações de join, filtros, exclusões/atualizações referenciadas e validação de integridade podem ficar mais lentas conforme a base cresce.

Legado ou ativo: ativo. `df_contas` e `df_contas_pagamentos` são núcleo financeiro.

Decisão: corrigir depois, em ciclo específico de performance, separado de segurança.

Proposta de correção em alto nível:

- confirmar nomes reais das colunas das FKs;
- verificar índices compostos existentes que já cubram as colunas;
- criar índices simples ou compostos apenas onde houver benefício claro;
- preferir criação concorrente se compatível com o fluxo de migration adotado;
- validar plano de consulta e ausência de duplicidade com índices existentes.

Risco de quebra: baixo para leitura/escrita funcional, médio para lock/custo operacional em produção se aplicado sem cuidado.

Rollback previsto: `DROP INDEX` dos índices novos, com nomes explícitos e diagnóstico antes/depois.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

#### C2. `Unindexed foreign keys` em tabelas operacionais/RH

Alerta: `unindexed_foreign_keys`

Afetados adicionais observados:

- `public.df_folha_lancamento_itens`, FK `df_folha_lancamento_itens_filial_id_fkey`
- `public.df_folha_lancamentos`, FK `df_folha_lancamentos_filial_id_fkey`
- `public.df_funcionarios`, FK `df_funcionarios_filial_id_fkey`
- `public.df_notas`, FK `df_notas_user_id_fkey`
- `public.df_usuarios_empresas`, FK `df_usuarios_empresas_user_id_fkey`

Risco prático: impacto provável em consultas e manutenção conforme Gestão de Pessoas, notas e vínculos de usuários crescem.

Legado ou ativo: ativo, mas com domínios diferentes. Não deve ser misturado com o pacote financeiro.

Decisão: depois. Priorizar financeiro primeiro; RH/usuários/notas em etapa separada se métricas indicarem necessidade.

Proposta de correção em alto nível: mesma abordagem de C1, separando por domínio.

Risco de quebra: baixo/médio por lock e custo operacional.

Rollback previsto: `DROP INDEX` dos índices criados no ciclo específico.

### D. Performance para ciclo separado

#### D1. `Auth RLS Initialization Plan`

Alerta: `auth_rls_initplan`

Afetados observados:

- `public.profiles`
- `public.df_centros_custo`
- `public.df_usuarios_empresas`
- `public.df_configuracoes_alertas`
- `public.df_folha_competencias`
- `public.df_folha_lancamentos`
- `public.df_contas`

Risco prático: chamadas a `auth.uid()`/funções similares podem ser reavaliadas por linha em policies, degradando performance em tabelas maiores.

Legado ou ativo: misto. Há policies antigas e novas, incluindo áreas ativas.

Decisão: ciclo separado. Não alterar junto com security definer nem índices.

Proposta de correção em alto nível:

- exportar policies atuais;
- trocar chamadas por forma initplan quando semanticamente equivalente, por exemplo `(select auth.uid())`;
- manter mesma regra de autorização;
- validar por perfil e isolamento multiempresa.

Risco de quebra: médio. Pequena alteração de policy pode mudar escopo de acesso se feita sem equivalência exata.

Rollback previsto: restaurar definitions anteriores das policies.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

#### D2. `Multiple Permissive Policies`

Alerta: `multiple_permissive_policies`

Afetados observados:

- `public.df_centros_custo`
- `public.df_usuarios_empresas`
- `public.profiles`

Risco prático: múltiplas policies permissivas para mesmo papel/ação aumentam custo de execução e podem esconder sobreposição ou regra legada perigosa.

Legado ou ativo: provável mistura de legado e saneamentos posteriores.

Decisão: ciclo separado, depois dos itens de segurança alta e dos índices críticos.

Proposta de correção em alto nível:

- listar policies por tabela, role e action;
- provar equivalência antes de consolidar;
- não remover policy sem teste anon/auth por perfil;
- preservar Admin/Master e nunca ampliar Operador.

Risco de quebra: alto se policy removida/consolidada sem matriz de acesso.

Rollback previsto: recriar policies removidas com nomes e expressões originais.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

#### D3. `Duplicate Index`

Alerta: `duplicate_index`

Afetados:

- `public.df_centros_custo`: `idx_df_centros_custo_empresa_id`, `idx_df_centros_empresa`
- `public.df_contas`: `idx_df_contas_empresa`, `idx_df_contas_empresa_id`
- `public.df_notas`: `idx_df_notas_empresa`, `idx_df_notas_empresa_id`
- `public.df_usuarios_empresas`: `df_usuarios_empresas_id_unique`, `df_usuarios_empresas_pkey`

Risco prático: índices duplicados aumentam custo de escrita, storage e manutenção.

Legado ou ativo: provavelmente legado/migrações acumuladas. `df_usuarios_empresas_id_unique` vs PK exige cuidado extra por constraint.

Decisão: não mexer agora. Tratar somente após auditoria de constraints, queries e uso real.

Proposta de correção em alto nível:

- identificar se índice sustenta constraint;
- confirmar definição exata e dependências;
- avaliar impacto em queries e migrations antigas;
- remover somente duplicata comprovada e reversível.

Risco de quebra: médio. Remover índice errado pode quebrar constraint, performance ou expectativa de migration.

Rollback previsto: recriar índice removido com definição original.

Remediação Supabase: https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

### E. Não mexer agora / precisa auditoria antes

Itens nesta categoria:

- Índices marcados como duplicados ou unused.
- Tabelas legadas como `public.contas`, até confirmar ausência de uso real.
- `public.df_push_tokens`, por estar ligada a canal Push ainda não configurado no fluxo atual.
- Policies legadas em `profiles`, `df_usuarios_empresas` e `df_centros_custo` sem impacto confirmado.
- Configurações de Auth, incluindo leaked password protection, até plano próprio.

Risco prático: mudanças aparentemente simples podem quebrar produção porque `main` é produção e não há homologação.

Decisão: não mexer neste ciclo.

Proposta de correção em alto nível: criar diagnósticos somente leitura, mapear uso no código e no banco, e só depois propor migration/rollback.

Rollback previsto: dependerá do ciclo específico, mas deve sempre restaurar definição anterior de policy, grant, função, view, índice ou configuração.

## Ordem segura de correção futura

### Etapa 1 - documentação e inventário

Status: esta etapa.

Escopo:

- registrar os achados do Advisor;
- classificar risco e prioridade;
- evitar qualquer mudança em produção;
- definir próximos ciclos pequenos.

### Etapa 2 - `search_path` das funções, se seguro

Escopo futuro:

- auditar definição das funções afetadas;
- fixar `search_path` sem alterar lógica;
- criar rollback e diagnóstico.

Motivo: tende a ser a menor correção de segurança, mas ainda exige cuidado em funções de autenticação e financeiro.

### Etapa 3 - revisar `SECURITY DEFINER` expostas

Escopo futuro:

- começar por auditoria, sem alterar permissões;
- mapear chamadas RPC, triggers, policies, Edge Functions e frontend;
- propor correção por função ou por grupos pequenos.

Preferência atual: iniciar pelo inventário das funções `SECURITY DEFINER` executáveis por `anon`/`authenticated`, sem `REVOKE` no primeiro ciclo.

### Etapa 4 - índices faltantes em foreign keys críticas

Escopo futuro:

- priorizar `df_contas` e `df_contas_pagamentos`;
- separar performance financeira de RH/usuários/notas;
- validar duplicidade antes de criar índice.

### Etapa 5 - RLS/policies duplicadas

Escopo futuro:

- tratar `auth_rls_initplan` e `multiple_permissive_policies`;
- não consolidar policy sem prova por perfil;
- preservar isolamento por `empresa_id`.

### Etapa 6 - índices duplicados/unused somente após auditoria

Escopo futuro:

- não apagar índice unused agora;
- confirmar dependências e janela de observação;
- remover somente duplicata comprovada.

## Próximo ciclo recomendado

Começar por auditoria das funções `SECURITY DEFINER` expostas para `anon` e `authenticated`, sem alterar permissões ainda.

Status em 2026-06-28: inventário documental criado em `docs/supabase/security-definer-funcoes-auditoria.md`, ainda sem alteração de banco, grants, funções, RLS ou policies.

Resultado da execução do SQL diagnóstico registrado em `docs/supabase/security-definer-diagnostico-resultado.md`, também sem alteração no Supabase.

Entregáveis sugeridos para o próximo ciclo:

- relatório de uso por função;
- classificação por função: RPC ativa, helper interno, trigger-only, policy helper ou legado;
- busca no código e migrations;
- consulta somente leitura de grants/definições;
- proposta de correção por pacote pequeno;
- rollback planejado para cada função candidata;
- nenhuma execução de `REVOKE`, `DROP`, `ALTER FUNCTION` ou migration sem autorização explícita.

## Estado final deste ciclo

- Banco: não alterado.
- RLS/policies: não alteradas.
- Funções: não alteradas.
- Views: não alteradas.
- Índices: não alterados.
- Dados: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- GitHub Actions/scripts/secrets: não alterados.
- Envio real: não executado.
- Build: não necessário, pois houve somente documentação.
