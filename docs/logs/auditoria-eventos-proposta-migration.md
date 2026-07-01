# Auditoria eventos - proposta documental de migration

Data: 2026-07-01

## Resumo executivo

Este documento propõe, sem executar, a futura migration para criar `public.df_auditoria_eventos`.

A tabela seria a base central futura de auditoria operacional do DNA Gestão, sem substituir imediatamente `public.df_auditoria_admin`. A trilha administrativa atual permanece preservada para destinatários de alertas e lixeira/restauração de contas/notas.

Este ciclo é somente documentação e planejamento. Não foi criada migration real, nenhum SQL foi executado e nada foi alterado no Supabase ou no app.

## Decisão técnica proposta

Decisão proposta: criar uma nova tabela `public.df_auditoria_eventos` em ciclo futuro de banco, mantendo `public.df_auditoria_admin` intacta.

Motivos:

- evita acoplar novos eventos operacionais à tabela administrativa já validada;
- permite desenhar campos próprios para módulo, entidade, severidade, origem, status e correlação;
- preserva triggers e RLS já existentes em `df_auditoria_admin`;
- permite começar sem inserir eventos, validando apenas estrutura, RLS e imutabilidade;
- reduz risco de misturar auditoria financeira, usuários, RH, segurança e automações sem padrão.

## Escopo da futura tabela

Tabela planejada:

- `public.df_auditoria_eventos`

Objetivo:

- centralizar eventos operacionais futuros;
- registrar eventos por empresa, ator, módulo, entidade e ação;
- permitir histórico por registro no futuro;
- permitir uma futura tela de auditoria para Master/Admin;
- manter payload mínimo, sanitizado e compatível com LGPD.

Fora do escopo da primeira migration:

- inserir eventos reais;
- criar tela;
- alterar frontend;
- alterar services/hooks;
- alterar `df_auditoria_admin`;
- migrar registros antigos;
- criar triggers em tabelas operacionais;
- criar função `SECURITY DEFINER` exposta em `public`;
- mexer em grants/RLS de outras tabelas.

## DDL planejado

> SQL planejado para ciclo futuro. Não executar neste ciclo.

```sql
begin;

create table public.df_auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid null,
  ator_tipo text not null,
  ator_email_hash text null,
  modulo text not null,
  entidade_tipo text not null,
  entidade_id uuid null,
  acao text not null,
  severidade text not null default 'info',
  origem text not null,
  status text not null default 'sucesso',
  motivo text null,
  dados_antes jsonb null,
  dados_depois jsonb null,
  metadados jsonb null,
  correlation_id text null,
  criado_em timestamptz not null default now(),

  constraint df_auditoria_eventos_empresa_fk
    foreign key (empresa_id)
    references public.df_empresas(id)
    on delete restrict,

  constraint df_auditoria_eventos_ator_tipo_check
    check (ator_tipo in (
      'usuario',
      'edge_function',
      'script',
      'database_trigger',
      'sistema'
    )),

  constraint df_auditoria_eventos_modulo_check
    check (modulo in (
      'financeiro',
      'usuarios',
      'empresas',
      'rh',
      'seguranca',
      'automacao',
      'sistema'
    )),

  constraint df_auditoria_eventos_severidade_check
    check (severidade in ('info', 'warning', 'critical')),

  constraint df_auditoria_eventos_origem_check
    check (origem in (
      'app',
      'edge_function',
      'database_trigger',
      'script',
      'manual',
      'sistema'
    )),

  constraint df_auditoria_eventos_status_check
    check (status in ('sucesso', 'falha', 'bloqueado')),

  constraint df_auditoria_eventos_acao_not_blank
    check (length(btrim(acao)) > 0),

  constraint df_auditoria_eventos_entidade_tipo_not_blank
    check (length(btrim(entidade_tipo)) > 0),

  constraint df_auditoria_eventos_origem_not_blank
    check (length(btrim(origem)) > 0),

  constraint df_auditoria_eventos_acao_formato_check
    check (acao ~ '^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$'),

  constraint df_auditoria_eventos_dados_antes_object
    check (dados_antes is null or jsonb_typeof(dados_antes) = 'object'),

  constraint df_auditoria_eventos_dados_depois_object
    check (dados_depois is null or jsonb_typeof(dados_depois) = 'object'),

  constraint df_auditoria_eventos_metadados_object
    check (metadados is null or jsonb_typeof(metadados) = 'object')
);

comment on table public.df_auditoria_eventos is
  'Auditoria operacional futura do DNA Gestao. Registra eventos sanitizados por empresa, modulo, entidade e acao.';

comment on column public.df_auditoria_eventos.ator_email_hash is
  'Hash do e-mail do ator quando necessario. Nao armazenar e-mail em texto claro.';

comment on column public.df_auditoria_eventos.dados_antes is
  'Estado anterior sanitizado. Nao armazenar payload completo, CPF, senha, token, dados medicos, laudos, anexos ou observacoes sensiveis.';

comment on column public.df_auditoria_eventos.dados_depois is
  'Estado posterior sanitizado. Nao armazenar payload completo, CPF, senha, token, dados medicos, laudos, anexos ou observacoes sensiveis.';

comment on column public.df_auditoria_eventos.metadados is
  'Metadados auxiliares sanitizados. Nao armazenar secrets, tokens, links sensiveis ou request completo.';

commit;
```

### Foreign keys planejadas

Planejado:

- `empresa_id` com FK para `public.df_empresas(id)` e `on delete restrict`.

Não planejado inicialmente:

- FK para `auth.users`;
- FK para `entidade_id`;
- FK dinâmica para tabelas operacionais.

Justificativa:

- `empresa_id` é a barreira central de isolamento e deve existir em todos os eventos operacionais;
- `user_id` pode referenciar usuário removido, usuário externo, script ou Edge Function, então deve permanecer `uuid null` sem FK para `auth.users`;
- `entidade_id` pode apontar para diferentes tabelas, logo uma FK direta criaria acoplamento impraticável;
- logs precisam sobreviver à mudança de estrutura operacional.

## Índices planejados

### Índices Fase 1

```sql
create index idx_df_auditoria_eventos_empresa_criado
on public.df_auditoria_eventos (empresa_id, criado_em desc);

create index idx_df_auditoria_eventos_empresa_modulo_criado
on public.df_auditoria_eventos (empresa_id, modulo, criado_em desc);

create index idx_df_auditoria_eventos_empresa_entidade_criado
on public.df_auditoria_eventos (empresa_id, entidade_tipo, entidade_id, criado_em desc)
where entidade_id is not null;

create index idx_df_auditoria_eventos_empresa_user_criado
on public.df_auditoria_eventos (empresa_id, user_id, criado_em desc)
where user_id is not null;

create index idx_df_auditoria_eventos_correlation_id
on public.df_auditoria_eventos (correlation_id)
where correlation_id is not null;
```

Justificativa:

- `empresa_id, criado_em desc`: consulta principal por empresa e período;
- `empresa_id, modulo, criado_em desc`: filtros por módulo na tela futura;
- `empresa_id, entidade_tipo, entidade_id, criado_em desc`: histórico por registro;
- `empresa_id, user_id, criado_em desc`: auditoria por ator dentro da empresa;
- `correlation_id`: rastreio de fluxos multi-etapa quando existir.

### Índices a evitar inicialmente

Não criar na Fase 1:

- índice simples em `acao`;
- índice simples em `severidade`;
- índice simples em `status`.

Motivo:

- podem ter baixa seletividade;
- aumentam custo de escrita sem consulta real validada;
- devem ser avaliados depois de observar a tela/queries reais.

Alternativa futura se houver uso comprovado:

```sql
-- Avaliar somente depois de consultas reais:
-- create index idx_df_auditoria_eventos_empresa_acao_criado
-- on public.df_auditoria_eventos (empresa_id, acao, criado_em desc);

-- create index idx_df_auditoria_eventos_empresa_severidade_criado
-- on public.df_auditoria_eventos (empresa_id, severidade, criado_em desc);

-- create index idx_df_auditoria_eventos_empresa_status_criado
-- on public.df_auditoria_eventos (empresa_id, status, criado_em desc);
```

## RLS planejada

Objetivo:

- permitir leitura somente para Master e Admin;
- não permitir escrita direta por usuário comum;
- bloquear atualização e exclusão;
- preservar isolamento por `empresa_id`.

### SQL planejado de RLS

> SQL planejado para ciclo futuro. Não executar neste ciclo.

```sql
alter table public.df_auditoria_eventos enable row level security;
alter table public.df_auditoria_eventos force row level security;

revoke all on public.df_auditoria_eventos from public;
revoke all on public.df_auditoria_eventos from anon;
revoke all on public.df_auditoria_eventos from authenticated;

grant select on public.df_auditoria_eventos to authenticated;

create policy "df_auditoria_eventos_select_admin_master"
on public.df_auditoria_eventos
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);
```

### INSERT planejado

Não criar policy de `INSERT` para `authenticated` na Fase 1.

Opções futuras de escrita:

1. `service_role` por Edge Function, com payload sanitizado e validação de empresa.
2. Trigger em tabelas específicas, quando o evento for puramente de banco.
3. Função dedicada de inserção sanitizada, somente se necessária.

Recomendação:

- começar sem inserir eventos;
- quando houver escrita, preferir Edge Function/service role ou trigger específico;
- se uma função for necessária, evitar exposição ampla e preparar auditoria SECURITY DEFINER própria;
- não criar função `SECURITY DEFINER` pública sem revogar `PUBLIC`, `anon` e validar `authenticated`.

### UPDATE/DELETE planejado

Não criar policies de `UPDATE` ou `DELETE`.

Além disso, criar bloqueio defensivo por trigger para imutabilidade.

## Funções e triggers futuras planejadas

### Bloqueio de update/delete

> SQL planejado para ciclo futuro. Não executar neste ciclo.

```sql
create or replace function public.df_auditoria_eventos_bloquear_update_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit logs are immutable in df_auditoria_eventos.'
    using errcode = '42501';
end;
$$;

create trigger trg_df_auditoria_eventos_bloquear_update
before update
on public.df_auditoria_eventos
for each row
execute function public.df_auditoria_eventos_bloquear_update_delete();

create trigger trg_df_auditoria_eventos_bloquear_delete
before delete
on public.df_auditoria_eventos
for each row
execute function public.df_auditoria_eventos_bloquear_update_delete();
```

### Função de inserção sanitizada

Não implementar na Fase 1.

Se for necessária em fase futura, a função deve:

- validar `empresa_id`;
- validar `modulo`, `acao`, `entidade_tipo`, `origem`, `status` e `severidade`;
- descartar campos sensíveis;
- recusar payload completo;
- usar `search_path` fixo;
- ter grants mínimos;
- ter diagnóstico SECURITY DEFINER próprio se for `SECURITY DEFINER`;
- ter rollback e testes de chamada por perfil.

## Rollback planejado

> SQL planejado para ciclo futuro. Não executar neste ciclo.

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

- rollback só deve ser usado se a tabela ainda não tiver eventos relevantes;
- se já houver eventos reais em ciclo futuro, rollback deve exportar/validar impacto antes de `drop table`.

## Diagnóstico planejado para ciclo futuro

### Antes da migration

```sql
select to_regclass('public.df_auditoria_eventos') as tabela_auditoria_eventos;
select to_regclass('public.df_auditoria_admin') as tabela_auditoria_admin;

select
  relname,
  relrowsecurity,
  relforcerowsecurity
from pg_class
where oid = 'public.df_auditoria_admin'::regclass;

select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
order by policyname;
```

Resultado esperado antes:

- `df_auditoria_eventos` não existe;
- `df_auditoria_admin` existe;
- RLS e policies de `df_auditoria_admin` preservadas.

### Depois da migration

```sql
select to_regclass('public.df_auditoria_eventos') as tabela_auditoria_eventos;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_auditoria_eventos'
order by ordinal_position;

select
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.df_auditoria_eventos'::regclass;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_eventos'
order by policyname;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_auditoria_eventos'
order by grantee, privilege_type;

select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_auditoria_eventos'
order by trigger_name, event_manipulation;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'df_auditoria_eventos'
order by indexname;

select to_regclass('public.df_auditoria_admin') as tabela_auditoria_admin_preservada;
```

Resultado esperado depois:

- `df_auditoria_eventos` criada;
- RLS habilitada e forçada;
- somente policy `SELECT` para Admin/Master;
- sem policies `INSERT`, `UPDATE`, `DELETE` ou `ALL`;
- `authenticated` com `SELECT`;
- `anon` sem acesso;
- triggers de bloqueio `UPDATE` e `DELETE` existentes;
- índices planejados criados;
- `df_auditoria_admin` preservada.

### Diagnóstico negativo

```sql
-- Esperado: zero linhas.
select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_eventos'
  and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

-- Esperado: zero linhas para anon.
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_auditoria_eventos'
  and grantee = 'anon';

-- Esperado: zero linhas exceto authenticated SELECT.
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_auditoria_eventos'
  and grantee = 'authenticated'
  and privilege_type <> 'SELECT';
```

## Plano de implementação futura

### Fase 1 - estrutura sem eventos

Escopo:

- criar `public.df_auditoria_eventos`;
- criar checks, FK segura de `empresa_id`, índices mínimos e RLS;
- criar bloqueio de `UPDATE` e `DELETE`;
- não inserir eventos;
- não alterar app;
- não alterar services/hooks;
- não criar tela.

Validação:

- diagnóstico antes/depois;
- rollback testado em SQL planejado;
- confirmar que `df_auditoria_admin` permaneceu intacta;
- confirmar que não há policy de escrita para usuários.

### Fase 2 - primeiro evento P1 financeiro pequeno

Escopo recomendado:

- escolher um único evento de baixo risco operacional;
- preferir evento que já tenha fluxo claro e rollback;
- não começar por RH;
- não misturar com tela;
- não mexer em grants amplos ou SECURITY DEFINER fora do necessário.

Candidato:

- `financeiro.pagamento_parcial.criado` ou `financeiro.conta.baixada`, após revisão do fluxo e payload permitido.

### Fase 3 - tela somente leitura Admin/Master

Escopo:

- listar eventos por empresa;
- filtros por período, módulo, ação, entidade, usuário, severidade e status;
- sem exportação inicial;
- sem acesso para Gerente/Operador;
- sem edição ou exclusão;
- sem exibir payload sensível.

## Riscos e decisões pendentes

- Confirmar se `empresa_id` sempre será obrigatório ou se eventos globais exigirão empresa técnica.
- Confirmar se `grant select to authenticated` é suficiente com RLS ou se a tela usará Edge Function.
- Confirmar se Master pode ver eventos de todas as empresas ou se a tela exigirá filtro explícito de empresa.
- Confirmar estratégia para eventos gerados por scripts.
- Confirmar se o primeiro evento real deve vir de app, Edge Function ou trigger.
- Revisar performance depois que houver volume real; não criar índices extras antes disso.

## Confirmações deste ciclo

- Migration real: não criada.
- SQL: não executado.
- Banco: não alterado.
- Dados: não alterados.
- RLS/policies/functions/grants: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- Scripts: não alterados.
- Implementação de logs: não realizada.
