# Resultado RLS - df_destinatarios_alertas - 2026-06-01

## Projeto

- Project ref: `vyhjjtzdvofoqoericak`
- Projeto: `contas-donaflor`
- Tabela: `public.df_destinatarios_alertas`

## Metodo

Validacao feita com usuarios reais de `public.df_usuarios_empresas`, simulando a role `authenticated` e claims JWT em transacoes controladas.

Todos os registros de teste foram criados dentro de transacoes com `rollback`. Nenhum destinatario de teste permaneceu gravado.

## Empresas usadas

- `Choco Arte`: `a796034f-d28a-4251-83c1-3fdcb4dcd420`
- `Rede Dona Flor`: `4f13dbfc-6da5-4130-b952-4723409a9e01`

## Usuarios/perfis usados

E-mails foram mascarados na analise e nao devem ser publicados em logs.

- Operador: usuario real vinculado a `Choco Arte`
- Gerente: usuario real vinculado a `Choco Arte`
- Admin: usuario real vinculado a `Choco Arte`
- Master: usuario real com perfil `master` em `Rede Dona Flor` e vinculo administrativo em `Choco Arte`

## Resultado Operador

Resultado esperado: sem acesso administrativo.

- SELECT na propria empresa: bloqueado por RLS, retornou `linhas_visiveis=0`.
- INSERT na propria empresa: bloqueado por RLS.
- UPDATE na propria empresa: bloqueado, retornou `linhas=0`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

## Resultado Gerente

Resultado esperado: SELECT permitido se policy atual permitir; sem INSERT/UPDATE/DELETE.

- SELECT na propria empresa: permitido, retornou `linhas_visiveis=1`.
- SELECT em outra empresa: bloqueado por RLS, retornou `linhas_visiveis=0`.
- INSERT na propria empresa: bloqueado por RLS.
- UPDATE na propria empresa: bloqueado, retornou `linhas=0`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

## Resultado Admin

Resultado esperado: SELECT/INSERT/UPDATE na propria empresa; cross-tenant bloqueado.

- SELECT na propria empresa: permitido, retornou `linhas_visiveis=1`.
- SELECT em outra empresa: bloqueado por RLS, retornou `linhas_visiveis=0`.
- INSERT na propria empresa: permitido.
- UPDATE na propria empresa: permitido, retornou `linhas=1`.
- INSERT em outra empresa: bloqueado por RLS.
- Alteracao de `empresa_id`: bloqueada pelo trigger `trg_df_destinatarios_alertas_bloquear_alteracao_empresa`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

## E-mail duplicado

- Mesmo e-mail duplicado na mesma empresa: bloqueado pelo indice `uq_df_destinatarios_alertas_empresa_email`.
- Mesmo e-mail em empresas diferentes: permitido quando inserido na empresa propria do admin, confirmando que a unicidade e por `empresa_id + lower(email)`.

Status: aprovado.

## Resultado Master

Resultado esperado: SELECT/INSERT/UPDATE conforme padrao master do projeto.

Resultado observado:

- SELECT na empresa onde o usuario tem perfil `master` (`Rede Dona Flor`): permitido.
- SELECT em outra empresa onde o mesmo usuario tambem possui vinculo administrativo (`Choco Arte`): permitido.
- INSERT em `Choco Arte`: permitido pelo vinculo administrativo existente.
- INSERT em `Rede Dona Flor`, onde o usuario esta como `master`: falhou com RLS.

Erro exato:

```text
new row violates row-level security policy for table "df_destinatarios_alertas"
```

Status: falhou.

Interpretacao tecnica inicial:

A policy de escrita permite `public.is_master()` ou `public.df_usuario_eh_admin(empresa_id)`. No contexto simulado do usuario master, a escrita na empresa em que ele e apenas `master` nao passou. Isso sugere que o helper usado na policy nao reconheceu esse caso para INSERT em `df_destinatarios_alertas`, ou que o padrao real de master exige ajuste explicito semelhante ao que ja foi tratado em outros ciclos de RLS do projeto.

Nenhuma correcao foi aplicada neste ciclo.

## Resultado Anon

Nao executado neste ciclo apos a falha em Master, seguindo a regra de parada ao encontrar falha.

## Registros temporarios

Registros criados apenas dentro de transacoes com `rollback`:

- `fixture.rls.choco@example.com` em `Choco Arte`
- `fixture.rls.dona@example.com` em `Rede Dona Flor`
- `teste.rls.admin@example.com` em `Choco Arte`
- `teste.rls.master.outra@example.com` em `Choco Arte`

Destino:

- nao foram inativados;
- nao permaneceram como massa de teste;
- nao foi usado DELETE fisico para limpeza;
- todos foram descartados por `rollback`.

## Escopo preservado

Nao houve:

- alteracao de frontend;
- criacao de service/hook;
- alteracao em GitHub Actions;
- alteracao no script de envio;
- alteracao em secrets;
- alteracao em Vercel;
- disparo de workflow;
- envio real de e-mail;
- commit, push ou deploy;
- rollback.

## Proximo passo recomendado

Criar um microciclo de correcao RLS somente para escrita de perfil Master em `df_destinatarios_alertas`, com SQL revisado e rollback, sem alterar frontend nem envio automatico.

## Correcao aplicada - escrita Master

Microciclo executado em 2026-06-01 para corrigir somente as policies de escrita de `public.df_destinatarios_alertas`.

SQL aplicado:

- `supabase/migrations/20260601173000_fix_df_destinatarios_alertas_master_write.sql`

Rollback criado e nao executado:

- `docs/security/rollback/rollback_fix_df_destinatarios_alertas_master_write_20260601.sql`

Mudanca aplicada:

- Recriadas somente as policies `df_destinatarios_alertas_insert_admin_master` e `df_destinatarios_alertas_update_admin_master`.
- Mantido `public.is_master()`.
- Mantido `public.df_usuario_eh_admin(empresa_id)`.
- Adicionado reconhecimento explicito de vinculo master por empresa via `public.df_usuario_tem_perfil_empresa(empresa_id, array['master', 'owner', 'superadmin', 'super_admin']::text[])`.
- Policy de SELECT preservada.
- Nenhuma policy `ALL` ou `DELETE` criada.
- Nenhum grant novo aplicado.

## Validacao pos-correcao

Validacao refeita com usuarios reais e transacoes controladas com `rollback`.

### Resultado Operador pos-correcao

- SELECT na propria empresa: bloqueado por RLS, retornou `linhas=0`.
- INSERT na propria empresa: bloqueado por RLS.
- UPDATE na propria empresa: bloqueado, retornou `linhas=0`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

### Resultado Gerente pos-correcao

- SELECT na propria empresa: permitido, retornou `linhas=1`.
- SELECT em outra empresa: bloqueado por RLS, retornou `linhas=0`.
- INSERT na propria empresa: bloqueado por RLS.
- UPDATE na propria empresa: bloqueado, retornou `linhas=0`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

### Resultado Admin pos-correcao

- SELECT na propria empresa: permitido, retornou `linhas=1`.
- SELECT em outra empresa: bloqueado por RLS, retornou `linhas=0`.
- INSERT na propria empresa: permitido.
- UPDATE na propria empresa: permitido, retornou `linhas=1`.
- INSERT em outra empresa: bloqueado por RLS.
- Alteracao de `empresa_id`: bloqueada pelo trigger `trg_df_destinatarios_alertas_bloquear_alteracao_empresa`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

### Resultado Master pos-correcao

- SELECT na empresa onde o usuario tem perfil `master`: permitido, retornou `linhas=1`.
- INSERT na empresa onde o usuario tem perfil `master`: permitido.
- UPDATE na empresa onde o usuario tem perfil `master`: permitido, retornou `linhas=1`.
- Alteracao de `empresa_id`: bloqueada pelo trigger `trg_df_destinatarios_alertas_bloquear_alteracao_empresa`.
- DELETE fisico: bloqueado por falta de privilegio na tabela.

Status: aprovado.

## Conferencia estrutural pos-correcao

- Tabela `public.df_destinatarios_alertas`: existe.
- RLS: habilitada.
- FORCE RLS: habilitado.
- Policies existentes:
  - `df_destinatarios_alertas_insert_admin_master`
  - `df_destinatarios_alertas_select_empresa`
  - `df_destinatarios_alertas_update_admin_master`
- Policy `ALL`: nao existe.
- Policy `DELETE`: nao existe.
- Grants de `authenticated`: somente `SELECT`, `INSERT` e `UPDATE`.
- Grants extras de `authenticated`: nenhum `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER`.
- Grants de `anon`: nenhum.
- Triggers preservados:
  - `trg_df_destinatarios_alertas_set_timestamps`
  - `trg_df_destinatarios_alertas_bloquear_delete`
  - `trg_df_destinatarios_alertas_bloquear_alteracao_empresa`

## Registros temporarios pos-correcao

Registros criados apenas dentro de transacoes com `rollback`:

- `fixture.rls.choco.fix@example.com` em `Choco Arte`
- `fixture.rls.dona.fix@example.com` em `Rede Dona Flor`
- registros transacionais de INSERT/UPDATE para Admin e Master

Destino:

- nao foram inativados;
- nao permaneceram como massa de teste;
- nao foi usado DELETE fisico para limpeza;
- todos foram descartados por `rollback`.

## Escopo preservado na correcao

Nao houve:

- alteracao de frontend;
- criacao de service/hook;
- alteracao em GitHub Actions;
- alteracao no script de envio;
- alteracao em secrets;
- alteracao em Vercel;
- disparo de workflow;
- envio real de e-mail;
- commit, push, PR ou deploy;
- rollback.

Build:

- nao executado, pois nao houve alteracao em `src/`.

## Proximo passo recomendado pos-correcao

Criar um microciclo pequeno para conectar a tela/servico de Configuracoes aos destinatarios de alertas, somente apos validar o fluxo de produto e sem alterar GitHub Actions no mesmo ciclo.
