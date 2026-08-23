import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260823142847_snapshots_folha_data_efetiva_2c2.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const hardening = fs.readFileSync('supabase/migrations/20260823143855_autorizar_validador_data_folha_2c2.sql', 'utf8')
const service = fs.readFileSync('src/services/folhaService.js', 'utf8')
const pagina = fs.readFileSync('src/pages/FechamentoFolhaPage.jsx', 'utf8')
const exportacao = fs.readFileSync('src/modules/folha/utils/fechamento/folhaExport.js', 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('snapshot mínimo vive no lançamento e não duplica identidade nos itens', () => {
  for (const campo of [
    'funcionario_nome_snapshot',
    'pessoa_id_snapshot',
    'filial_id_snapshot',
    'filial_nome_snapshot',
    'cargo_snapshot',
    'data_admissao_snapshot',
    'snapshot_origem',
    'snapshot_capturado_em'
  ]) {
    assert.match(sql, new RegExp(`add column ${campo}`))
    assert.match(service, new RegExp(`'${campo}'`))
  }
  assert.doesNotMatch(sql, /alter table public\.df_folha_lancamento_itens[\s\S]{0,300}add column .*snapshot/i)
  assert.doesNotMatch(sql, /salario_snapshot|remuneracao_snapshot/i)
})

test('backfill é conservador, identificado e não altera campos financeiros', () => {
  const inicio = sql.indexOf('update public.df_folha_lancamentos l')
  const fim = sql.indexOf('do $$', inicio)
  const backfill = sql.slice(inicio, fim)
  assert.match(backfill, /p\.nome/)
  assert.match(backfill, /f\.pessoa_id/)
  assert.match(backfill, /legacy_backfill_v1/)
  assert.doesNotMatch(backfill, /\b(?:valor|quantidade|percentual|natureza|categoria)\s*=/i)
  assert.match(sql, /BACKFILL_SNAPSHOT_FOLHA_INCOMPLETO/)
})

test('novos lançamentos capturam pessoa canônica e vínculo na mesma transação', () => {
  const corpo = corpoFuncao('df_folha_lancamentos_snapshot_data_2c2')
  assert.match(corpo, /join public\.df_pessoas p/)
  assert.match(corpo, /new\.funcionario_nome_snapshot := v_nome/)
  assert.match(corpo, /new\.pessoa_id_snapshot := v_pessoa_id/)
  assert.match(corpo, /new\.filial_id_snapshot := v_filial_id/)
  assert.match(corpo, /new\.cargo_snapshot := v_cargo/)
  assert.match(corpo, /new\.data_admissao_snapshot := v_data_admissao/)
  assert.match(corpo, /capturado_criacao_v1/)
  assert.match(sql, /before insert or update[\s\S]*execute function public\.df_folha_lancamentos_snapshot_data_2c2/)
})

test('snapshot e vínculo do lançamento são imutáveis em edição financeira', () => {
  const corpo = corpoFuncao('df_folha_lancamentos_snapshot_data_2c2')
  assert.match(corpo, /SNAPSHOT_FOLHA_IMUTAVEL/)
  assert.match(corpo, /FUNCIONARIO_LANCAMENTO_FOLHA_IMUTAVEL/)
  assert.match(corpo, /EMPRESA_LANCAMENTO_FOLHA_IMUTAVEL/)
})

test('data efetiva bloqueia apenas datas comprovadamente posteriores', () => {
  const validar = corpoFuncao('df_folha_validar_data_efetiva_2c2')
  assert.match(validar, /v_status <> 'desligado'/)
  assert.match(validar, /d\.estado = 'CONCLUIDO'/)
  assert.match(validar, /FOLHA_DESLIGADO_SEM_DATA_EFETIVA/)
  assert.match(validar, /FOLHA_DESLIGADO_EXIGE_DATA_REFERENCIA/)
  assert.match(validar, /p_data_referencia > v_data_efetiva/)
  assert.match(validar, /FOLHA_APOS_DATA_EFETIVA/)
  assert.doesNotMatch(validar, /date_trunc|competencia.*>=|to_date\([^)]*competencia/i)
})

test('itens detalhados obedecem a mesma data efetiva do lançamento pai', () => {
  const corpo = corpoFuncao('df_folha_itens_data_efetiva_2c2')
  assert.match(corpo, /from public\.df_folha_lancamentos l/)
  assert.match(corpo, /coalesce\(new\.data_referencia, v_data_lancamento\)/)
  assert.match(corpo, /df_folha_validar_data_efetiva_2c2/)
})

test('anon permanece bloqueado e validador autoriza somente escrita tenant-scoped', () => {
  for (const nome of ['df_folha_lancamentos_snapshot_data_2c2', 'df_folha_itens_data_efetiva_2c2']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.doesNotMatch(sql + hardening, new RegExp(`grant execute on function public\\.${nome}`))
  }
  assert.match(hardening, /auth\.uid\(\) is null[\s\S]*df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(hardening, /ACESSO_NEGADO_FOLHA_DATA_EFETIVA/)
  assert.match(hardening, /grant execute on function public\.df_folha_validar_data_efetiva_2c2[\s\S]*to authenticated, service_role/)
  assert.doesNotMatch(hardening, /to anon/)
})

test('tela separa seleção operacional de consulta histórica e exportação prefere snapshot', () => {
  assert.match(pagina, /funcionariosSelecionaveis/)
  assert.match(pagina, /funcionariosHistoricos/)
  assert.match(pagina, /Somente histórico/)
  assert.match(pagina, /funcionarioSelecionavelParaNovaFolha/)
  assert.match(exportacao, /resolverIdentidadeHistoricaFolha/)
})

test('migrations são roll-forward coesas e não tocam módulos históricos externos', () => {
  assert.match(sql, /^begin;/)
  assert.match(sql, /commit;\s*$/)
  for (const tabela of [
    'df_funcionarios_ferias_ciclos',
    'df_funcionarios_ferias_periodos',
    'df_funcionarios_exames_periodicos'
  ]) {
    assert.doesNotMatch(sql, new RegExp(`(?:insert into|update|delete from|alter table) public\\.${tabela}`, 'i'))
  }
  assert.doesNotMatch(sql, /update public\.df_funcionarios_desligamentos/i)
  assert.doesNotMatch(sql, /update public\.df_funcionarios\s+set/i)
})
