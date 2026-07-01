# Auditoria eventos - Fase 1 execucao

Data: 2026-07-01

## Resumo executivo

A Fase 1 da auditoria operacional foi executada no Supabase `contas-donaflor`.

Foi criada a estrutura inicial de `public.df_auditoria_eventos`, com tabela, constraints, índices mínimos, RLS, policy de leitura Admin/Master, grants mínimos e bloqueio defensivo de `UPDATE`/`DELETE`.

Nenhum evento real foi inserido. Não houve alteração de frontend, services/hooks, scripts, Contas, RH, usuários/permissões fora da tabela nova, funções existentes, policies existentes de outras tabelas ou `public.df_auditoria_admin`.

## Migration criada

Arquivo:

- `supabase/migrations/20260701120000_create_df_auditoria_eventos.sql`

Nome aplicado no Supabase:

- `create_df_auditoria_eventos`

## Estrutura criada

Tabela:

- `public.df_auditoria_eventos`

Campos:

- `id uuid primary key default gen_random_uuid()`
- `empresa_id uuid not null`
- `user_id uuid null`
- `ator_tipo text not null`
- `ator_email_hash text null`
- `modulo text not null`
- `entidade_tipo text not null`
- `entidade_id uuid null`
- `acao text not null`
- `severidade text not null default 'info'`
- `origem text not null`
- `status text not null default 'sucesso'`
- `motivo text null`
- `dados_antes jsonb null`
- `dados_depois jsonb null`
- `metadados jsonb null`
- `correlation_id text null`
- `criado_em timestamptz not null default now()`

Foreign key criada:

- `empresa_id -> public.df_empresas(id) on delete restrict`

Não foram criadas:

- FK para `auth.users`;
- FK para `entidade_id`;
- FK dinâmica para tabelas operacionais.

## Constraints criadas

Constraints confirmadas por catálogo:

- `df_auditoria_eventos_pkey`
- `df_auditoria_eventos_empresa_fk`
- `df_auditoria_eventos_ator_tipo_check`
- `df_auditoria_eventos_modulo_check`
- `df_auditoria_eventos_severidade_check`
- `df_auditoria_eventos_origem_check`
- `df_auditoria_eventos_status_check`
- `df_auditoria_eventos_acao_not_blank`
- `df_auditoria_eventos_entidade_tipo_not_blank`
- `df_auditoria_eventos_origem_not_blank`
- `df_auditoria_eventos_acao_formato_check`
- `df_auditoria_eventos_dados_antes_object`
- `df_auditoria_eventos_dados_depois_object`
- `df_auditoria_eventos_metadados_object`

## Índices criados

Índices confirmados:

- `df_auditoria_eventos_pkey`
- `idx_df_auditoria_eventos_empresa_criado`
- `idx_df_auditoria_eventos_empresa_modulo_criado`
- `idx_df_auditoria_eventos_empresa_entidade_criado`
- `idx_df_auditoria_eventos_empresa_user_criado`
- `idx_df_auditoria_eventos_correlation_id`

Não foram criados índices simples em:

- `acao`
- `severidade`
- `status`

## RLS, policy e grants

RLS:

- `relrowsecurity = true`
- `relforcerowsecurity = true`

Policy criada:

- `df_auditoria_eventos_select_admin_master`
- comando: `SELECT`
- role: `{authenticated}`
- condição confirmada por catálogo:
  - `(select auth.uid()) is not null`
  - `(select public.is_master())`
  - ou `public.df_usuario_eh_admin(empresa_id)`

Grants confirmados:

- `authenticated`: somente `SELECT`
- `anon`: nenhum grant
- `postgres` e `service_role`: grants administrativos esperados

Não há policy:

- `ALL`
- `INSERT`
- `UPDATE`
- `DELETE`

## Bloqueio UPDATE/DELETE

Função criada:

- `public.df_auditoria_eventos_bloquear_update_delete()`

Características:

- `language plpgsql`
- `set search_path = public`
- sem `SECURITY DEFINER`
- `raise exception` com `errcode = '42501'`

Triggers criados:

- `trg_df_auditoria_eventos_bloquear_update`
  - `BEFORE UPDATE`
- `trg_df_auditoria_eventos_bloquear_delete`
  - `BEFORE DELETE`

Teste rollbackado:

- foi inserido um evento técnico temporário dentro de transação;
- tentativa de `UPDATE` foi bloqueada;
- tentativa de `DELETE` foi bloqueada;
- a transação foi revertida com `ROLLBACK`;
- contagem final da tabela permaneceu `0`.

## Diagnóstico antes

Executado somente com `SELECT`.

Resultado:

- `public.df_auditoria_eventos`: não existia;
- `public.df_auditoria_admin`: existia;
- `df_auditoria_admin` estava com RLS habilitada e forçada;
- policy existente em `df_auditoria_admin`: `df_auditoria_admin_select_admin_master`, `SELECT`, `{authenticated}`;
- contagem de `df_auditoria_admin`: `223`.

## Diagnóstico depois

Executado após aplicar a migration.

Resultado:

- `public.df_auditoria_eventos`: existe;
- `public.df_auditoria_admin`: preservada;
- colunas esperadas: confirmadas;
- constraints esperadas: confirmadas;
- RLS habilitada e forçada: confirmado;
- policy SELECT Admin/Master: confirmada;
- grants: `authenticated` somente com `SELECT`, `anon` sem acesso;
- triggers de bloqueio: confirmados;
- índices mínimos: confirmados;
- contagem de registros em `df_auditoria_eventos`: `0`.

## Diagnóstico negativo

Resultados esperados e confirmados:

- zero policies `ALL`, `INSERT`, `UPDATE` ou `DELETE`;
- zero grants para `anon`;
- zero grants para `authenticated` além de `SELECT`;
- tabela vazia após teste rollbackado.

## SQL executado

Migration aplicada:

```sql
-- Conteúdo versionado em:
-- supabase/migrations/20260701120000_create_df_auditoria_eventos.sql
```

Teste rollbackado de bloqueio:

```sql
begin;

do $$
declare
  v_empresa_id uuid;
  v_evento_id uuid;
  v_update_blocked boolean := false;
  v_delete_blocked boolean := false;
begin
  select id into v_empresa_id
  from public.df_empresas
  order by id
  limit 1;

  insert into public.df_auditoria_eventos (
    empresa_id,
    ator_tipo,
    modulo,
    entidade_tipo,
    acao,
    origem,
    metadados
  ) values (
    v_empresa_id,
    'sistema',
    'sistema',
    'automacoes/scripts',
    'sistema.teste.bloqueio',
    'manual',
    jsonb_build_object('teste', 'rollback')
  ) returning id into v_evento_id;

  begin
    update public.df_auditoria_eventos
    set motivo = 'nao_deve_atualizar'
    where id = v_evento_id;
  exception
    when insufficient_privilege then
      v_update_blocked := true;
  end;

  begin
    delete from public.df_auditoria_eventos
    where id = v_evento_id;
  exception
    when insufficient_privilege then
      v_delete_blocked := true;
  end;

  if not v_update_blocked then
    raise exception 'UPDATE nao foi bloqueado em df_auditoria_eventos';
  end if;

  if not v_delete_blocked then
    raise exception 'DELETE nao foi bloqueado em df_auditoria_eventos';
  end if;
end $$;

rollback;
```

## Rollback SQL

Usar somente se for necessário remover a Fase 1.

```sql
begin;

drop policy if exists "df_auditoria_eventos_select_admin_master"
on public.df_auditoria_eventos;

drop trigger if exists trg_df_auditoria_eventos_bloquear_update
on public.df_auditoria_eventos;

drop trigger if exists trg_df_auditoria_eventos_bloquear_delete
on public.df_auditoria_eventos;

drop function if exists public.df_auditoria_eventos_bloquear_update_delete();

drop index if exists public.idx_df_auditoria_eventos_correlation_id;
drop index if exists public.idx_df_auditoria_eventos_empresa_user_criado;
drop index if exists public.idx_df_auditoria_eventos_empresa_entidade_criado;
drop index if exists public.idx_df_auditoria_eventos_empresa_modulo_criado;
drop index if exists public.idx_df_auditoria_eventos_empresa_criado;

drop table if exists public.df_auditoria_eventos;

commit;
```

Observação:

- este rollback é seguro enquanto `df_auditoria_eventos` estiver vazia e sem eventos reais;
- se eventos forem inseridos em ciclo futuro, revisar impacto antes de dropar a tabela.

## Riscos remanescentes

- A tabela ainda não recebe eventos reais.
- A futura escrita precisa ser desenhada com cuidado para não expor função `SECURITY DEFINER` desnecessária.
- `authenticated` recebeu `SELECT`, mas a leitura real depende da RLS Admin/Master.
- A futura tela precisa evitar vazamento cross-tenant e payload sensível.
- Antes de inserir eventos de RH, será necessário ciclo LGPD próprio.

## Próximo ciclo recomendado

Não inserir eventos ainda sem escolher um fluxo P1 específico.

Próximo ciclo mais seguro:

1. Auditar um único evento P1 financeiro de baixo risco.
2. Definir origem da escrita: app, Edge Function ou trigger.
3. Definir payload sanitizado.
4. Preparar rollback.
5. Só então inserir o primeiro evento real.

Alternativa de baixo risco:

- criar tela somente leitura para `df_auditoria_eventos` e `df_auditoria_admin`, restrita a Admin/Master, antes de iniciar captura ampla.

## Confirmações

- `public.df_auditoria_admin`: preservada.
- Eventos reais: nenhum inserido.
- `df_auditoria_eventos`: criada e vazia.
- Frontend: não alterado.
- Services/hooks: não alterados.
- Scripts: não alterados.
- Contas: não alterado.
- RH: não alterado.
- Tabelas operacionais: sem triggers novos.
