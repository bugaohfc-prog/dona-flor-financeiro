import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL(
  '../../supabase/migrations/20260726001346_proteger_recorrencia_id_admin_master.sql',
  import.meta.url
)
const migrationGeracaoUrl = new URL(
  '../../supabase/migrations/20260726021424_proteger_geracao_controlada_recorrencias.sql',
  import.meta.url
)

async function lerMigration() {
  return readFile(migrationUrl, 'utf8')
}

async function lerMigrationGeracao() {
  return readFile(migrationGeracaoUrl, 'utf8')
}

test('Admin e Master sao as unicas autorizacoes do vinculo no backend', async () => {
  const sql = await lerMigration()
  assert.match(sql, /public\.is_master\(\)/)
  assert.match(sql, /public\.df_usuario_eh_admin\(old\.empresa_id\)/)
  assert.match(sql, /public\.df_usuario_eh_admin\(new\.empresa_id\)/)
  assert.doesNotMatch(sql, /gerente/i)
})

test('Gerente e REST direto recebem erro de privilegio ao alterar recorrencia_id', async () => {
  const sql = await lerMigration()
  assert.match(sql, /before update of recorrencia_id/i)
  assert.match(sql, /errcode\s*=\s*'42501'/i)
  assert.match(sql, /Somente Admin ou Master pode alterar recorrencia_id/)
})

test('trigger atua somente quando recorrencia_id realmente muda', async () => {
  const sql = await lerMigration()
  assert.match(sql, /old\.recorrencia_id is distinct from new\.recorrencia_id/i)
  assert.match(sql, /new\.recorrencia_id is not distinct from old\.recorrencia_id/i)
  assert.doesNotMatch(sql, /before update(?! of recorrencia_id)/i)
})

test('demais updates financeiros permanecem sob as policies existentes', async () => {
  const sql = await lerMigration()
  assert.doesNotMatch(sql, /alter policy|create policy|drop policy/i)
  assert.doesNotMatch(sql, /revoke\s+update\s+on\s+(table\s+)?public\.df_contas/i)
  assert.doesNotMatch(sql, /after update|instead of update/i)
})

test('tenant e seguranca do trigger nao usam metadado editavel ou privilegio elevado', async () => {
  const sql = await lerMigration()
  assert.match(sql, /security invoker/i)
  assert.match(sql, /auth\.uid\(\)/)
  assert.match(sql, /old\.empresa_id/)
  assert.match(sql, /new\.empresa_id/)
  assert.doesNotMatch(sql, /user_metadata|raw_user_meta_data|security definer/i)
})

test('indice protegido e tratamento de concorrencia 23505 permanecem intactos', async () => {
  const [sql, service] = await Promise.all([
    lerMigration(),
    readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(sql, /drop\s+index|alter\s+index|create\s+(unique\s+)?index/i)
  assert.match(service, /uq_df_contas_recorrencia_vencimento_ativas/)
  assert.match(service, /error\?\.code === '23505'/)
  assert.match(service, /\.is\('recorrencia_id', null\)/)
})

test('migration de vinculo permanece restrita e a geracao exige confirmacao explicita', async () => {
  const [sql, pagina, service] = await Promise.all([
    lerMigration(),
    readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(sql, /\binsert\b|\bdelete\b/i)
  assert.match(pagina, /Gerar ocorrência/)
  assert.match(pagina, /Confirmar geração/)
  assert.match(pagina, /ocorrencia\?\.cobertura !== 'faltante'/)
  assert.match(pagina, /!podeGerarRecorrencia/)
  assert.match(service, /supabase\.rpc\('gerar_ocorrencia_recorrente_controlada'/)
  assert.doesNotMatch(service, /inserirComEmpresa/)
  assert.doesNotMatch(service, /executarPlanejamento|inserirEmLotes/)
})

test('consulta de recorrencias usa somente colunas reais', async () => {
  const service = await readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  const colunas = service.match(/const COLUNAS_SERIES = '([^']+)'/)?.[1] || ''
  assert.ok(colunas)
  assert.doesNotMatch(colunas, /\bobservacao\b|\bdata_fim\b/)
  assert.match(colunas, /\bdata_inicio\b/)
  assert.match(colunas, /\bvalor_variavel\b/)
})

test('trigger bloqueia Gerente no INSERT REST recorrente e preserva conta manual comum', async () => {
  const sql = await lerMigrationGeracao()
  assert.match(sql, /create trigger proteger_df_contas_recorrencia_id_insert[\s\S]*before insert/i)
  assert.match(sql, /if new\.recorrencia_id is null then[\s\S]*return new;/i)
  assert.match(sql, /errcode = '42501'/)
  assert.match(sql, /Somente Admin ou Master pode inserir conta com recorrencia_id diretamente/)
  assert.match(sql, /public\.is_master\(\)/)
  assert.match(sql, /public\.df_usuario_eh_admin\(new\.empresa_id\)/)
})

test('RPC controlada exige Admin ou Master e revalida serie antes do INSERT', async () => {
  const sql = await lerMigrationGeracao()
  assert.match(sql, /function public\.gerar_ocorrencia_recorrente_controlada/)
  assert.match(sql, /public\.is_master\(\)[\s\S]*public\.df_usuario_eh_admin\(p_empresa_id\)/)
  assert.match(sql, /from public\.df_contas_recorrentes[\s\S]*r\.empresa_id = p_empresa_id[\s\S]*for update/i)
  assert.match(sql, /coalesce\(v_serie\.ativo, false\) is not true/)
  assert.match(sql, /from public\.df_centros_custo cc[\s\S]*cc\.empresa_id = p_empresa_id/)
  assert.match(sql, /from public\.df_filiais f[\s\S]*f\.empresa_id = p_empresa_id[\s\S]*coalesce\(f\.ativo, false\) = true/)
  assert.match(sql, /on conflict \(recorrencia_id, data_vencimento\)/)
  assert.match(sql, /uq_df_contas_recorrencia_vencimento_ativas/)
})

test('planejamento automatico existente usa RPC estrita somente para Admin ou Master', async () => {
  const [sql, contasService, hook] = await Promise.all([
    lerMigrationGeracao(),
    readFile(new URL('../services/contasService.js', import.meta.url), 'utf8'),
    readFile(new URL('../hooks/useContas.js', import.meta.url), 'utf8')
  ])
  assert.match(sql, /function public\.gerar_ocorrencias_recorrentes_automaticas/)
  const funcaoAutomatica = sql.match(
    /create or replace function public\.gerar_ocorrencias_recorrentes_automaticas[\s\S]*?\nend;\n\$function\$;/
  )?.[0] || ''
  assert.match(funcaoAutomatica, /public\.is_master\(\)[\s\S]*public\.df_usuario_eh_admin\(p_empresa_id\)/)
  assert.doesNotMatch(funcaoAutomatica, /df_usuario_tem_perfil_empresa|gerente/)
  assert.match(funcaoAutomatica, /Somente Admin ou Master pode executar planejamento recorrente automatico/)
  assert.match(sql, /v_inicio_horizonte[\s\S]*v_fim_horizonte/)
  assert.match(sql, /order by value ->> 'recorrencia_id', value ->> 'data_vencimento'/)
  assert.match(contasService, /supabase\.rpc\('gerar_ocorrencias_recorrentes_automaticas'/)
  assert.match(hook, /criarContasEmLote\(supabase/)
})

test('migration de geracao nao altera RLS, indice protegido ou trigger de vinculo', async () => {
  const sql = await lerMigrationGeracao()
  assert.doesNotMatch(sql, /alter policy|create policy|drop policy/i)
  assert.doesNotMatch(sql, /drop\s+index|alter\s+index|create\s+(unique\s+)?index/i)
  assert.doesNotMatch(sql, /proteger_df_contas_recorrencia_id_admin_master/)
  assert.doesNotMatch(sql, /security definer|user_metadata|raw_user_meta_data/i)
  assert.doesNotMatch(sql, /current_setting|set_config|recorrencia_insert_autorizado/i)
})
