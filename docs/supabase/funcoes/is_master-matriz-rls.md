# Matriz RLS da função `is_master`

Data da matriz: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento mapeia exclusivamente as policies de RLS que citam `public.is_master()`.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service ou hook.

## Resumo executivo

`public.is_master()` é um helper crítico de permissão Master, `SECURITY DEFINER`, `search_path=public`, sem argumentos e com retorno `boolean`.

Foram confirmadas 27 policies dependentes de `is_master()` em 8 tabelas. Todas as 27 policies catalogadas são `PERMISSIVE`, para role `authenticated`.

Leitura de risco:

- revogar `authenticated` é risco crítico e não deve ser feito agora, pois quebraria policies e a chamada direta da Edge Function `convidar-usuario`;
- revogar `anon` e `PUBLIC` pode ser avaliado futuramente, mas apenas depois de revisar esta matriz e executar diagnóstico operacional com perfis Master/Admin/Gerente/Operador;
- nenhuma alteração de grant deve ser feita até existir ciclo autorizado, curto e com rollback imediato.

## Estado catalogado da função

| Campo | Valor |
| --- | --- |
| Função | `public.is_master()` |
| Linguagem | `sql` |
| `SECURITY DEFINER` | `true` |
| Owner | `postgres` |
| `search_path` | `public` |
| Hash da definição | `0ae7a94df00e970385f5cf68ada3925a` |
| ACL | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` EXECUTE efetivo | sim |
| `anon` EXECUTE efetivo | sim |
| `authenticated` EXECUTE efetivo | sim |

Definição funcional resumida: retorna `true` quando existe registro em `public.df_usuarios_master` com `user_id = auth.uid()`.

## Tabelas afetadas

| Tabela | Policies | Finalidade provável | Módulo relacionado | Uso no app/código runtime | Área crítica | Risco de bloquear Admin/Master |
| --- | ---: | --- | --- | --- | --- | --- |
| `public.df_assinaturas` | 4 | Assinaturas/licenciamento/estado comercial da empresa | Administração/Billing | `src/services/billingService.js` | Sim, acesso e assinatura | Alto: pode bloquear leitura/escrita de assinatura por Master/Admin |
| `public.df_auditoria_admin` | 1 | Auditoria administrativa | Auditoria/Configurações | Sem uso runtime direto encontrado em `src`, `supabase/functions` ou `scripts` | Sim, rastreabilidade | Médio/alto: pode bloquear visibilidade de auditoria para Master/Admin |
| `public.df_contas` | 4 | Contas financeiras | Financeiro/Contas/Relatórios | `src/services/contasService.js`, `src/pages/ContasPage.jsx`, `src/pages/Relatorios.jsx`, scripts financeiros | Sim, financeiro | Crítico: pode bloquear leitura, criação, edição e exclusão lógica/operacional de contas |
| `public.df_contas_pagamentos` | 3 | Pagamentos/baixas de contas | Financeiro/Contas | `src/services/contasService.js` | Sim, financeiro | Crítico: pode bloquear baixas e edição de pagamentos |
| `public.df_destinatarios_alertas` | 3 | Destinatários de alertas por empresa | Configurações/Notificações | `src/services/destinatariosAlertasService.js`, `scripts/envio-automatico-dona-flor.mjs` | Sim, notificações e automação | Alto: pode bloquear Admin/Master na configuração de alertas |
| `public.df_notas` | 4 | Notas/pendências | Notas/Pendências/Painel | `src/services/notasService.js`, `scripts/envio-automatico-dona-flor.mjs` | Sim, operação | Alto: pode bloquear notas e pendências por tenant |
| `public.df_usuarios_empresas` | 4 | Vínculos usuário-empresa/perfil | Usuários/Tenant/Permissões | `tenantService.js`, `usuariosService.js`, `permissoesService.js`, Edge Functions de usuário/empresa | Sim, identidade e tenant | Crítico: pode bloquear resolução de empresa, permissões e administração de usuários |
| `public.df_usuarios_filiais` | 4 | Vínculos usuário-filial | Usuários/Filiais | `src/services/usuariosService.js` | Sim, escopo por filial | Alto: pode bloquear administração de filiais por usuário |

## Matriz de policies

| # | Schema | Tabela | Policy | Tipo | Roles | Comando | Onde `is_master()` aparece | USING | WITH CHECK | Impacto provável se `anon`/`PUBLIC` forem revogados | Impacto provável se `authenticated` fosse revogado | Risco operacional | Fluxo afetado provável |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `public` | `df_assinaturas` | `df_assinaturas_delete_master_saneado` | `PERMISSIVE` | `{authenticated}` | `DELETE` | `USING` | `auth.uid() is not null and is_master()` | vazio | Provavelmente baixo para sessões autenticadas, pois a policy é para `authenticated`; exige validação porque `PUBLIC` ainda afeta execução direta da função. | Crítico: Master perderia a condição de DELETE. | Alto | Exclusão/remoção operacional de assinatura por Master |
| 2 | `public` | `df_assinaturas` | `df_assinaturas_insert_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and (is_master() or df_usuario_eh_admin(empresa_id))` | Provavelmente baixo para sessões autenticadas; validar criação por Admin/Master. | Alto/crítico: INSERT dependeria só de admin por empresa, removendo caminho Master global. | Alto | Criação de assinatura |
| 3 | `public` | `df_assinaturas` | `df_assinaturas_select_tenant_saneado` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and (is_master() or empresa_id in vínculos do usuário)` | vazio | Provavelmente baixo para authenticated; anon não deveria consultar assinaturas. | Crítico: Master global pode perder leitura ampla de assinaturas. | Alto | Billing/assinatura/estado da empresa |
| 4 | `public` | `df_assinaturas` | `df_assinaturas_update_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and (is_master() or df_usuario_eh_admin(empresa_id))` | mesma regra do `USING` | Provavelmente baixo para authenticated; validar edição por Admin/Master. | Crítico: atualização por Master pode falhar. | Alto | Edição de assinatura |
| 5 | `public` | `df_auditoria_admin` | `df_auditoria_admin_select_admin_master` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and (is_master() or df_usuario_eh_admin(empresa_id))` | vazio | Provavelmente baixo para authenticated; anon não deveria consultar auditoria. | Alto: Master pode perder acesso a auditoria administrativa. | Alto | Consulta de auditoria admin |
| 6 | `public` | `df_contas` | `df_contas_delete_admin_master` | `PERMISSIVE` | `{authenticated}` | `DELETE` | `USING` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/perfil elevado)` | vazio | Provavelmente baixo para authenticated; precisa teste financeiro antes. | Crítico: pode quebrar ação sensível de Admin/Master no financeiro. | Crítico | Contas financeiras, exclusão física/lógica conforme desenho atual |
| 7 | `public` | `df_contas` | `df_contas_insert_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | Provavelmente baixo para authenticated; validar Gerente/Admin/Master. | Alto/crítico: criação de contas pode falhar para Master global. | Crítico | Lançamento de contas |
| 8 | `public` | `df_contas` | `df_contas_select_empresa` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/perfil elevado ou vínculo na empresa)` | vazio | Provavelmente baixo para authenticated; anon não deveria ler financeiro. | Crítico: leitura financeira por Master pode falhar. | Crítico | Contas, relatórios e painel financeiro |
| 9 | `public` | `df_contas` | `df_contas_update_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | mesma regra do `USING` | Provavelmente baixo para authenticated; validar atualização por perfil. | Crítico: atualização financeira por Master pode falhar. | Crítico | Edição/baixa operacional de contas |
| 10 | `public` | `df_contas_pagamentos` | `df_contas_pagamentos_insert_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | Provavelmente baixo para authenticated; precisa teste de baixa. | Crítico: baixa/pagamento por Master pode falhar. | Crítico | Baixas de contas |
| 11 | `public` | `df_contas_pagamentos` | `df_contas_pagamentos_select_empresa` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/perfil elevado ou vínculo na empresa)` | vazio | Provavelmente baixo para authenticated. | Crítico: leitura de pagamentos por Master pode falhar. | Crítico | Histórico de pagamentos |
| 12 | `public` | `df_contas_pagamentos` | `df_contas_pagamentos_update_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | mesma regra do `USING` | Provavelmente baixo para authenticated; validar edição de pagamento. | Crítico: edição de pagamento por Master pode falhar. | Crítico | Atualização de baixas/pagamentos |
| 13 | `public` | `df_destinatarios_alertas` | `df_destinatarios_alertas_insert_admin_master` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and (is_master() or admin/perfil elevado)` | Provavelmente baixo para authenticated; anon/PUBLIC não deveriam cadastrar alertas. | Alto: cadastro por Master pode falhar. | Alto | Configuração de destinatários de alertas |
| 14 | `public` | `df_destinatarios_alertas` | `df_destinatarios_alertas_select_empresa` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and (is_master() or vínculo admin/master/operacional na empresa)` | vazio | Provavelmente baixo para authenticated. | Alto: Master pode perder leitura de destinatários. | Alto | Configurações/alertas e automação de e-mail |
| 15 | `public` | `df_destinatarios_alertas` | `df_destinatarios_alertas_update_admin_master` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and (is_master() or admin/perfil elevado)` | mesma regra do `USING` | Provavelmente baixo para authenticated. | Alto: edição por Master pode falhar. | Alto | Edição/inativação de destinatários |
| 16 | `public` | `df_notas` | `df_notas_delete_admin_master` | `PERMISSIVE` | `{authenticated}` | `DELETE` | `USING` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/perfil elevado)` | vazio | Provavelmente baixo para authenticated; validar fluxo de notas. | Alto: remoção por Master pode falhar. | Alto | Notas/pendências |
| 17 | `public` | `df_notas` | `df_notas_insert_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | Provavelmente baixo para authenticated. | Alto: criação de nota por Master pode falhar. | Alto | Criação de notas |
| 18 | `public` | `df_notas` | `df_notas_select_empresa` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/perfil elevado ou vínculo na empresa)` | vazio | Provavelmente baixo para authenticated. | Alto: leitura de notas por Master pode falhar. | Alto | Notas/Painel/automação |
| 19 | `public` | `df_notas` | `df_notas_update_empresa_operacional` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and empresa_id is not null and (is_master() or admin/gerente/perfil elevado)` | mesma regra do `USING` | Provavelmente baixo para authenticated. | Alto: atualização de nota por Master pode falhar. | Alto | Edição de notas |
| 20 | `public` | `df_usuarios_empresas` | `df_usuarios_empresas_delete_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `DELETE` | `USING` | `auth.uid() is not null and (is_master() or admin sem atingir usuário Master)` | vazio | Provavelmente baixo para authenticated; exige teste de permissões. | Crítico: administração de vínculos por Master pode falhar. | Crítico | Administração de usuários/tenant |
| 21 | `public` | `df_usuarios_empresas` | `df_usuarios_empresas_insert_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and (is_master() or admin sem criar alvo Master indevido)` | Provavelmente baixo para authenticated; anon/PUBLIC não deveriam criar vínculos. | Crítico: criação de vínculo por Master pode falhar. | Crítico | Convite/criação/vínculo de usuários |
| 22 | `public` | `df_usuarios_empresas` | `df_usuarios_empresas_select_scoped_saneado` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and (is_master() or admin ou próprio usuário/e-mail)` | vazio | Provavelmente baixo para authenticated; validar tenantService. | Crítico: Master pode perder leitura ampla de vínculos; app pode perder resolução de permissões. | Crítico | Tenant, permissões e usuários |
| 23 | `public` | `df_usuarios_empresas` | `df_usuarios_empresas_update_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and (is_master() or admin sem alterar alvo Master indevido)` | mesma regra do `USING` | Provavelmente baixo para authenticated; exige teste Admin/Master. | Crítico: edição de vínculo/perfil por Master pode falhar. | Crítico | Administração de perfis e vínculos |
| 24 | `public` | `df_usuarios_filiais` | `df_usuarios_filiais_delete_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `DELETE` | `USING` | `auth.uid() is not null and (is_master() or admin sem atingir usuário Master)` | vazio | Provavelmente baixo para authenticated. | Alto/crítico: remoção de vínculo filial por Master pode falhar. | Alto | Administração de filiais por usuário |
| 25 | `public` | `df_usuarios_filiais` | `df_usuarios_filiais_insert_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `INSERT` | `WITH CHECK` | vazio | `auth.uid() is not null and (is_master() or admin sem atingir usuário Master)` | Provavelmente baixo para authenticated. | Alto/crítico: criação de vínculo filial por Master pode falhar. | Alto | Atribuição de filiais |
| 26 | `public` | `df_usuarios_filiais` | `df_usuarios_filiais_select_scoped_saneado` | `PERMISSIVE` | `{authenticated}` | `SELECT` | `USING` | `auth.uid() is not null and (is_master() or admin ou usuário vinculado)` | vazio | Provavelmente baixo para authenticated. | Alto: Master pode perder leitura de vínculos de filial. | Alto | Consulta de filiais por usuário |
| 27 | `public` | `df_usuarios_filiais` | `df_usuarios_filiais_update_admin_saneado` | `PERMISSIVE` | `{authenticated}` | `UPDATE` | `USING e WITH CHECK` | `auth.uid() is not null and (is_master() or admin sem atingir usuário Master)` | mesma regra do `USING` | Provavelmente baixo para authenticated. | Alto/crítico: atualização de vínculo filial por Master pode falhar. | Alto | Edição de filiais por usuário |

## Evidência de uso no código

### Referências runtime por tabela

| Tabela | Arquivos encontrados fora de docs/migrations |
| --- | --- |
| `df_assinaturas` | `src/services/billingService.js` |
| `df_auditoria_admin` | nenhuma referência runtime direta encontrada |
| `df_contas` | `src/services/contasService.js`, `src/pages/ContasPage.jsx`, `src/pages/Relatorios.jsx`, `src/App.jsx`, `src/pages/OnboardingPage.jsx`, `src/utils/recorrencia.js`, scripts financeiros |
| `df_contas_pagamentos` | `src/services/contasService.js` |
| `df_destinatarios_alertas` | `src/services/destinatariosAlertasService.js`, `scripts/envio-automatico-dona-flor.mjs` |
| `df_notas` | `src/services/notasService.js`, `scripts/envio-automatico-dona-flor.mjs` |
| `df_usuarios_empresas` | `tenantService.js`, `usuariosService.js`, `permissoesService.js`, `empresasService.js`, Edge Functions de usuário/empresa |
| `df_usuarios_filiais` | `src/services/usuariosService.js` |

### Referências diretas a `is_master`

- `supabase/functions/convidar-usuario/index.ts`: chamada direta `supabaseUser.rpc('is_master')`.
- `scripts/validar-rls-df-funcionarios.mjs`: chamada direta `client.rpc('is_master')`.
- `supabase/migrations/*` e `docs/security/*`: histórico de criação/validação de RLS que usa `public.is_master()` como helper de autorização.

## Edge Function `convidar-usuario`

Arquivo analisado: `supabase/functions/convidar-usuario/index.ts`.

Achados:

- a função `verificarMaster(supabaseUser)` chama diretamente `supabaseUser.rpc('is_master')`;
- `supabaseUser` é criado com `service_role` e `Authorization` do usuário chamador, então a verificação usa contexto de usuário autenticado;
- o fluxo combina `is_master` com `df_usuario_eh_admin` para autorizar convite/reset de usuário na empresa;
- `authenticated` é necessário para esse desenho atual;
- `anon` e `PUBLIC` não são necessários para a Edge Function, mas a remoção deles ainda deve ser validada porque a função também aparece em policies.

Impacto se `authenticated` fosse revogado: alto/crítico. A Edge Function pode passar a tratar Master como não autorizado ou retornar erro na verificação, bloqueando convites autorizados.

## Script `validar-rls-df-funcionarios.mjs`

Arquivo analisado: `scripts/validar-rls-df-funcionarios.mjs`.

Achados:

- o script chama `client.rpc('is_master')` em `diagnoseMasterContext`;
- a finalidade aparente é diagnóstico/validação operacional de RLS de Gestão de Pessoas, não fluxo runtime do app;
- a execução depende do perfil usado no cliente Supabase do teste;
- revogar `authenticated` quebraria a validação do contexto Master autenticado;
- revogar `anon`/`PUBLIC` pode afetar apenas cenários de teste anônimo, mas deve ser registrado e validado se o script for usado como checklist.

## Recomendação

Recomendação conservadora deste ciclo:

- não revogar `authenticated`;
- não executar `REVOKE` de `anon` ou `PUBLIC` ainda;
- revisar esta matriz antes de qualquer alteração;
- se a equipe quiser avançar, criar um ciclo de diagnóstico adicional para simular Master/Admin/Gerente/Operador nas 8 tabelas antes de aplicar grant change;
- só depois avaliar se `anon` e `PUBLIC` podem ser removidos sem afetar RLS/policies;
- não misturar esse ciclo futuro com alteração de função, RLS, policy, Auth, frontend, service ou Edge Function.

## SQL futuro possível, somente como referência comentada

Não executar sem ciclo autorizado:

```sql
-- revoke execute on function public.is_master() from anon;
-- revoke execute on function public.is_master() from public;
```

Não planejar neste momento:

```sql
-- revoke execute on function public.is_master() from authenticated;
```

Rollback futuro se `anon`/`PUBLIC` forem removidos em ciclo posterior e houver quebra:

```sql
-- grant execute on function public.is_master() to public;
-- grant execute on function public.is_master() to anon;
```

Se algum ciclo futuro algum dia tratar `authenticated`, rollback separado:

```sql
-- grant execute on function public.is_master() to authenticated;
```

## Próximo ciclo recomendado

Criar diagnóstico operacional antes de qualquer `REVOKE`, cobrindo:

- confirmação de ACL atual;
- leitura/escrita controlada, sem persistência indevida, para Master/Admin/Gerente/Operador nas 8 tabelas afetadas;
- validação da Edge Function `convidar-usuario`;
- validação do script `validar-rls-df-funcionarios.mjs`, se ainda for usado como checklist;
- consulta ao Advisor apenas depois de uma alteração autorizada.

Sem essa validação, a recomendação é manter `is_master()` como está.
