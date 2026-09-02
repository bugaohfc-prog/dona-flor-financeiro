import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260902000117_criar_transferencias_filiais_lote3.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const sqlLotacaoCompetencia = fs.readFileSync(
  'supabase/migrations/20260902130444_definir_lotacao_folha_competencia_lote3a.sql',
  'utf8'
)
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const service = fs.readFileSync('src/services/funcionariosService.js', 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('histórico é tenant-safe, append-only e sem DELETE físico', () => {
  assert.match(sql, /create table public\.df_funcionarios_transferencias_filiais/)
  assert.match(sql, /foreign key \(empresa_id, funcionario_id\)[\s\S]*references public\.df_funcionarios\(empresa_id, id\)/)
  assert.match(sql, /foreign key \(empresa_id, filial_origem_id\)[\s\S]*references public\.df_filiais\(empresa_id, id\)/)
  assert.match(sql, /foreign key \(empresa_id, filial_destino_id\)[\s\S]*references public\.df_filiais\(empresa_id, id\)/)
  assert.match(sql, /force row level security/)
  assert.match(sql, /TRANSFERENCIA_FILIAL_HISTORICO_IMUTAVEL[\s\S]*before update or delete/)
  assert.match(sql, /revoke all on table public\.df_funcionarios_transferencias_filiais[\s\S]*from public, anon, authenticated/)
  assert.doesNotMatch(sql, /grant (?:insert|update|delete)[^;]*df_funcionarios_transferencias_filiais/i)
})

test('RPC usa locks, origem autoritativa, valida invariantes e audita atomicamente', () => {
  const rpc = corpoFuncao('transferir_funcionario_filial_controlado')
  assert.match(rpc, /security definer[\s\S]*set search_path = ''/)
  assert.match(rpc, /df_funcionarios_pode_escrever/)
  assert.match(rpc, /pg_advisory_xact_lock/)
  assert.match(rpc, /for update/)
  assert.match(rpc, /FILIAL_DESTINO_IGUAL_ORIGEM/)
  assert.match(rpc, /FILIAL_DESTINO_INVALIDA/)
  assert.match(rpc, /TRANSFERENCIA_DATA_ANTERIOR_ADMISSAO/)
  assert.match(rpc, /TRANSFERENCIA_DATA_FUTURA/)
  assert.match(rpc, /TRANSFERENCIA_CRONOLOGIA_INVALIDA/)
  assert.match(rpc, /TRANSFERENCIA_CONFLITO_DESLIGAMENTO/)
  assert.match(rpc, /v_funcionario_antes\.filial_id, p_filial_destino_id/)
  assert.match(rpc, /rh\.funcionario\.filial_transferida/)
  assert.match(rpc, /correlation_id/)
})

test('alteração direta de filial é bloqueada fora da RPC', () => {
  assert.match(sql, /before update of filial_id on public\.df_funcionarios/)
  assert.match(sql, /TRANSFERENCIA_FILIAL_EXIGE_OPERACAO_CONTROLADA/)
  assert.match(page, /delete demaisCampos\.filial_id/)
  assert.match(page, /Use “Transferir filial”/)
})

test('regra temporal resolve origem antes e destino a partir da data efetiva', () => {
  const resolver = corpoFuncao('df_funcionario_filial_na_data_lote3')
  assert.match(resolver, /data_transferencia <= p_data_referencia[\s\S]*order by data_transferencia desc/)
  assert.match(resolver, /data_transferencia > p_data_referencia[\s\S]*order by data_transferencia asc/)
})

test('Folha preserva snapshots e usa data real ou fim da competência', () => {
  assert.match(sqlLotacaoCompetencia, /SNAPSHOT_FOLHA_IMUTAVEL/)
  assert.match(sqlLotacaoCompetencia, /v_data_lotacao := coalesce\([\s\S]*new\.data_referencia[\s\S]*interval '1 month - 1 day'/)
  assert.match(sqlLotacaoCompetencia, /df_funcionario_filial_na_data_lote3\([\s\S]*v_data_lotacao/)
  assert.match(sqlLotacaoCompetencia, /new\.snapshot_origem := 'capturado_criacao_v1'/)
})

test('UI mostra ação, confirmação e histórico sem expor IDs', () => {
  assert.match(page, />\s*Transferir filial\s*</)
  assert.match(page, /'Confirmar transferência'/)
  assert.match(page, />\s*Histórico de transferências\s*</)
  assert.match(page, /filiaisPorId\[item\.filial_origem_id\]/)
  assert.match(page, /filiaisPorId\[item\.filial_destino_id\]/)
  assert.doesNotMatch(page, /Transferência ID|Código da transferência/)
  assert.match(service, /rpc\('transferir_funcionario_filial_controlado'/)
})
