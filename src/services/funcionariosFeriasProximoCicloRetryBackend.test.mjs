import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const MIGRATION =
  'supabase/migrations/20260816132530_corrigir_retry_observabilidade_proximo_ciclo_ferias_2b2b.sql'
const sql = readFileSync(MIGRATION, 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('fronteira de ativação é explícita e não depende de created_at dos ciclos', () => {
  assert.match(sql, /create table if not exists public\.df_ferias_automacoes_config/)
  assert.match(sql, /'ferias_proximo_ciclo_v1'/)
  assert.match(sql, /now\(\) at time zone 'America\/Sao_Paulo'/)
  assert.match(sql, /on conflict \(regra\) do nothing/)

  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')
  assert.match(autoridade, /v_ancora\.periodo_aquisitivo_fim < v_data_ativacao/)
  assert.match(autoridade, /CICLO_ENCERRADO_ANTES_ATIVACAO/)
  assert.doesNotMatch(autoridade, /created_at|criado_em/)
})

test('catch-up mantém datas ancoradas no ciclo original e não impõe janela curta', () => {
  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  assert.match(autoridade, /periodo_aquisitivo_fim <= p_data_referencia/)
  assert.match(autoridade, /v_inicio := v_ancora\.periodo_aquisitivo_fim \+ 1/)
  assert.match(autoridade, /when v_ancora\.periodo_aquisitivo_fim = p_data_referencia then 'NORMAL'/)
  assert.match(autoridade, /else 'CATCH_UP'/)
  assert.doesNotMatch(autoridade, /interval '[0-9]+ days'/)
  assert.doesNotMatch(autoridade, /FORA_DO_ULTIMO_DIA_DO_CICLO/)
})

test('catch-up preserva idempotência e bloqueio de 29 de fevereiro', () => {
  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  assert.match(autoridade, /'codigo', 'JA_EXISTE'/)
  assert.match(autoridade, /'codigo', 'BLOQUEADO_29FEV'/)
  assert.match(autoridade, /PROXIMO_CICLO_29FEV_REQUER_DECISAO/)
  assert.equal((autoridade.match(/insert into public\.df_funcionarios_ferias_ciclos/g) ?? []).length, 1)
  assert.doesNotMatch(autoridade, /update public\.df_funcionarios_ferias_ciclos/)
  assert.doesNotMatch(autoridade, /delete from public\.df_funcionarios_ferias_ciclos/)
})

test('observabilidade funcional persiste contadores, resumo e correlação', () => {
  assert.match(sql, /create table if not exists public\.df_ferias_execucoes_automaticas/)
  assert.match(sql, /data_referencia date not null/)
  assert.match(sql, /iniciado_em timestamptz not null/)
  assert.match(sql, /finalizado_em timestamptz/)
  assert.match(sql, /candidatos integer not null/)
  assert.match(sql, /criados integer not null/)
  assert.match(sql, /ja_existentes integer not null/)
  assert.match(sql, /bloqueados integer not null/)
  assert.match(sql, /erros integer not null/)
  assert.match(sql, /resumo jsonb not null/)
  assert.match(sql, /correlation_id text not null unique/)

  const lote = corpoFuncao('df_ferias_gerar_proximos_ciclos_lote_execucao_interno')
  assert.match(lote, /insert into public\.df_ferias_execucoes_automaticas/)
  assert.match(lote, /update public\.df_ferias_execucoes_automaticas/)
  assert.match(lote, /'resultados', v_resultados/)
  assert.match(lote, /'erro_fatal'/)
})

test('falhas por candidato são isoladas e finalização da execução é única', () => {
  const lote = corpoFuncao('df_ferias_gerar_proximos_ciclos_lote_execucao_interno')
  const protecao = corpoFuncao('df_ferias_proteger_execucao_automatica_interno')

  assert.match(lote, /exception when others/)
  assert.match(lote, /get stacked diagnostics/)
  assert.match(lote, /'codigo', 'ERRO_TECNICO'/)
  assert.match(lote, /v_status := case when v_erros > 0 then 'parcial' else 'sucesso' end/)
  assert.match(protecao, /old\.status <> 'em_execucao'/)
  assert.match(protecao, /EXECUCAO_AUTOMATICA_APPEND_ONLY/)
  assert.match(protecao, /EXECUCAO_AUTOMATICA_FINALIZACAO_INVALIDA/)
})

test('cron mantém horário e data civil e chama apenas o wrapper observável', () => {
  const cron = corpoFuncao('df_ferias_gerar_proximos_ciclos_lote_interno')
  const teste = corpoFuncao('df_ferias_gerar_proximos_ciclos_lote_teste_interno')

  assert.match(cron, /df_ferias_gerar_proximos_ciclos_lote_execucao_interno/)
  assert.match(cron, /'cron'/)
  assert.match(teste, /'manual_test'/)
  assert.match(sql, /'5 3 \* \* \*'/)
  assert.match(sql, /America\/Sao_Paulo/)
  assert.match(sql, /CRON_FERIAS_2B2B_INCOMPATIVEL/)
})

test('migration não altera ciclos legados nem implementa reconciliação', () => {
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_inicio\s*=/i)
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_fim\s*=/i)
  assert.doesNotMatch(sql, /set\s+data_limite_gozo\s*=/i)
  assert.doesNotMatch(sql, /delete\s+from\s+public\.df_funcionarios_ferias_(ciclos|periodos)/i)
  assert.doesNotMatch(sql, /update\s+public\.df_auditoria_eventos/i)
})

test('tabelas internas não são abertas para anon ou authenticated', () => {
  assert.match(sql, /alter table public\.df_ferias_automacoes_config enable row level security/)
  assert.match(sql, /alter table public\.df_ferias_execucoes_automaticas enable row level security/)
  assert.match(sql, /revoke all on table public\.df_ferias_automacoes_config from public, anon, authenticated/)
  assert.match(sql, /revoke all on table public\.df_ferias_execucoes_automaticas from public, anon, authenticated/)
  assert.match(sql, /revoke all on function public\.df_ferias_gerar_proximos_ciclos_lote_execucao_interno/)
})
