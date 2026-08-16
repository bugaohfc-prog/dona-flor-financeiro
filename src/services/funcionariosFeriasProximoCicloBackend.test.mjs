import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260816121317_gerar_proximo_ciclo_ferias_2b2b.sql'
const sql = readFileSync(MIGRATION, 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('autoridade individual cria somente o sucessor exato no último dia civil', () => {
  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  assert.match(autoridade, /v_inicio := v_ancora\.periodo_aquisitivo_fim \+ 1/)
  assert.match(autoridade, /v_fim := \(v_inicio \+ interval '1 year' - interval '1 day'\)::date/)
  assert.match(autoridade, /v_limite := \(v_fim \+ interval '1 year'\)::date/)
  assert.match(autoridade, /v_ancora\.periodo_aquisitivo_fim <> p_data_referencia/)
  assert.match(autoridade, /FORA_DO_ULTIMO_DIA_DO_CICLO/)
  assert.equal((autoridade.match(/insert into public\.df_funcionarios_ferias_ciclos/g) ?? []).length, 1)
  assert.doesNotMatch(autoridade, /update public\.df_funcionarios_ferias_ciclos/)
  assert.doesNotMatch(autoridade, /delete from public\.df_funcionarios_ferias_ciclos/)
})

test('diagnósticos esperados são determinísticos e não viram erro técnico genérico', () => {
  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  for (const codigo of [
    'CRIADO',
    'JA_EXISTE',
    'NAO_ELEGIVEL',
    'BLOQUEADO_GAP',
    'BLOQUEADO_SOBREPOSICAO',
    'BLOQUEADO_FUTURO_INCOMPATIVEL',
    'BLOQUEADO_29FEV',
    'FUNCIONARIO_INATIVO'
  ]) {
    assert.match(autoridade, new RegExp(`'${codigo}'`))
  }

  assert.match(autoridade, /PROXIMO_CICLO_29FEV_REQUER_DECISAO/)
})

test('sucessor nasce com auditoria, anchor, fingerprint e regra 2B-2B', () => {
  const autoridade = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  assert.match(autoridade, /'rh\.ferias_ciclo\.derivado'/)
  assert.match(autoridade, /'proveniencia', 'sistema_derivado'/)
  assert.match(autoridade, /'regra', 'ferias_proximo_ciclo_v1'/)
  assert.match(autoridade, /'ciclo_ancora_id', v_ancora\.id/)
  assert.match(autoridade, /'data_base', p_data_referencia/)
  assert.match(autoridade, /'fingerprint_versao', 'ferias_ciclo_v1'/)
  assert.match(autoridade, /'fingerprint_inicial', v_fingerprint/)
  assert.match(autoridade, /'snapshot_inicial', to_jsonb\(v_ciclo\)/)
  assert.match(autoridade, /'correlation_id', v_correlation_id/)
})

test('proveniência forte reconhece 2B-1 e próximo ciclo sem reclassificar legado', () => {
  const proveniencia = corpoFuncao('df_ferias_proveniencia_ciclo_interno')

  assert.match(proveniencia, /in \('ferias_2b1', 'ferias_proximo_ciclo_v1'\)/)
  assert.match(proveniencia, /v_derivacoes_fortes = 1 and v_total_derivacoes = 1/)
  assert.match(proveniencia, /PROVENIENCIA_FORTE/)
  assert.match(proveniencia, /PROVENIENCIA_INSUFICIENTE/)
  assert.match(proveniencia, /LEGADO_OU_DESCONHECIDO/)
  assert.match(proveniencia, /fingerprint_atual = v_fingerprint_inicial/)
})

test('autoridade usa lock 2B-2A e mantém tenant e grants mínimos', () => {
  const interna = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')
  const publica = corpoFuncao('garantir_proximo_ciclo_ferias_controlado')

  assert.match(interna, /df_ferias_bloquear_funcionario_interno/)
  assert.match(publica, /security definer/)
  assert.match(publica, /set search_path = public, pg_temp/)
  assert.match(publica, /auth\.uid\(\) is null/)
  assert.match(publica, /df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(sql, /revoke all on function public\.df_ferias_garantir_proximo_ciclo_interno[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /grant execute on function public\.garantir_proximo_ciclo_ferias_controlado[\s\S]*to authenticated/)
})

test('criação manual concorrente usa o mesmo lock e devolve colisão determinística', () => {
  const manual = corpoFuncao('criar_ciclo_ferias_controlado')

  assert.match(manual, /df_ferias_bloquear_funcionario_interno/)
  assert.match(manual, /periodo_aquisitivo_inicio = p_periodo_aquisitivo_inicio/)
  assert.match(manual, /periodo_aquisitivo_fim = p_periodo_aquisitivo_fim/)
  assert.match(manual, /'codigo', 'JA_EXISTE'/)
  assert.match(manual, /'codigo', 'CRIADO'/)
})

test('lote chama a mesma autoridade, isola falhas e expõe observabilidade', () => {
  const lote = corpoFuncao('df_ferias_gerar_proximos_ciclos_lote_interno')
  const interna = corpoFuncao('df_ferias_garantir_proximo_ciclo_interno')

  assert.match(lote, /df_ferias_garantir_proximo_ciclo_interno/)
  assert.match(lote, /periodo_aquisitivo_fim = p_data_referencia/)
  assert.equal((interna.match(/insert into public\.df_funcionarios_ferias_ciclos/g) ?? []).length, 1)
  assert.doesNotMatch(lote, /insert into public\.df_funcionarios_ferias_ciclos/)
  assert.match(lote, /exception when others/)
  assert.match(lote, /'candidatos'/)
  assert.match(lote, /'criados'/)
  assert.match(lote, /'ja_existentes'/)
  assert.match(lote, /'bloqueados'/)
  assert.match(lote, /'erros'/)
})

test('executor diário usa data civil de São Paulo e não depende de acesso à UI', () => {
  assert.match(sql, /create extension if not exists pg_cron/)
  assert.match(sql, /cron\.schedule/)
  assert.match(sql, /df-ferias-proximo-ciclo-diario/)
  assert.match(sql, /America\/Sao_Paulo/)
  assert.match(sql, /'5 3 \* \* \*'/)
})

test('migration não reconcilia, move ou apaga ciclos existentes', () => {
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_inicio\s*=/i)
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_fim\s*=/i)
  assert.doesNotMatch(sql, /set\s+data_limite_gozo\s*=/i)
  assert.doesNotMatch(sql, /delete\s+from\s+public\.df_funcionarios_ferias_(ciclos|periodos)/i)
  assert.doesNotMatch(sql, /update\s+public\.df_auditoria_eventos/i)
})
