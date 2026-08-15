import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MIGRATION = 'supabase/migrations/20260814214555_adicionar_admissao_transacional_ferias_2b1.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const funcionariosPage = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const feriasPage = fs.readFileSync('src/pages/FeriasPage.jsx', 'utf8')
const funcionariosService = fs.readFileSync('src/services/funcionariosService.js', 'utf8')

test('RPC 2B-1 é transacional, autorizada e bloqueia 29/02', () => {
  assert.match(sql, /create or replace function public\.alterar_admissao_funcionario_controlado/)
  assert.match(sql, /security definer\s+set search_path = public, pg_temp/)
  assert.match(sql, /not public\.df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(sql, /from public\.df_funcionarios[\s\S]*for update/)
  assert.match(sql, /ADMISSAO_29FEV_REQUER_DECISAO/)
  assert.match(sql, /revoke all on function public\.alterar_admissao_funcionario_controlado[\s\S]*from anon/)
  assert.match(sql, /grant execute on function public\.alterar_admissao_funcionario_controlado[\s\S]*to authenticated/)
})

test('primeiro ciclo é único, civil e não reescreve ciclos legados', () => {
  assert.match(sql, /select count\(\*\)::integer, min\(periodo_aquisitivo_inicio\)/)
  assert.match(sql, /v_ciclos_existentes = 0/)
  assert.match(sql, /p_nova_data_admissao \+ interval '1 year' - interval '1 day'/)
  assert.match(sql, /ADMISSAO_POSTERIOR_A_CICLO_EXISTENTE/)
  assert.doesNotMatch(sql, /update public\.df_funcionarios_ferias_ciclos\s+set/)
  assert.match(sql, /perform 1[\s\S]*from public\.df_funcionarios[\s\S]*for update/)
})

test('auditoria atômica identifica admissão e ciclo derivado', () => {
  assert.match(sql, /rh\.funcionario\.admissao_alterada/)
  assert.match(sql, /rh\.ferias_ciclo\.derivado/)
  assert.match(sql, /'regra', 'ferias_2b1'/)
  assert.match(sql, /'data_admissao_base', p_nova_data_admissao/)
  assert.match(sql, /correlation_id/)
})

test('UI faz preflight, exige motivo e preserva criação manual sem duplicação', () => {
  assert.match(funcionariosPage, /somentePreflight: true/)
  assert.match(funcionariosPage, /motivo_obrigatorio/)
  assert.match(funcionariosPage, /requer_confirmacao && !resultadoAdmissao\?\.aplicado/)
  assert.match(funcionariosPage, /ciclo\(s\) existente\(s\) serão preservados/)
  assert.match(funcionariosPage, /primeiro período aquisitivo será criado automaticamente/)
  assert.match(feriasPage, /cicloDuplicadoSugerido/)
  assert.match(feriasPage, /disabled=\{[\s\S]*salvando[\s\S]*cicloDuplicadoSugerido[\s\S]*\}/)
})

test('cadastro inicial não grava admissão diretamente e explicita falha parcial', () => {
  assert.match(funcionariosService, /data_admissao: _dataAdmissaoRemovida/)
  assert.match(funcionariosService, /alterarAdmissaoFuncionarioControlada\(\{[\s\S]*funcionarioId: funcionarioCriado\?\.id/)
  assert.match(funcionariosService, /parcial: true[\s\S]*admissaoPendente: true/)
  assert.match(funcionariosPage, /Funcionário criado, mas a admissão e o ciclo não foram aplicados/)
})
