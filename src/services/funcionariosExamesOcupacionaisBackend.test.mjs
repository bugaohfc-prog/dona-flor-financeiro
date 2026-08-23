import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260823211740_criar_exames_ocupacionais_2c5b.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const repairSql = fs.readFileSync(
  'supabase/migrations/20260823213434_remover_indice_duplicado_exames_2c5b.sql',
  'utf8'
)

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('migration cria modelo operacional por vínculo sem conteúdo clínico', () => {
  assert.match(sql, /create table public\.df_funcionarios_exames_ocupacionais/)
  assert.match(sql, /tipo in \('ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL'\)/)
  assert.match(sql, /estado in \('PENDENTE', 'REALIZADO', 'CANCELADO'\)/)
  assert.match(sql, /estado = 'REALIZADO' and data_realizada is not null/)
  assert.match(sql, /estado = 'PENDENTE' and data_prevista is not null and data_realizada is null/)
  assert.doesNotMatch(sql, /^\s*(cid|diagnostico|laudo|resultado_clinico|observacao_medica)\s+\w+/im)
})

test('FK composta mantém exame no tenant do vínculo', () => {
  assert.match(sql, /unique \(empresa_id, id\)/)
  assert.match(sql, /foreign key \(empresa_id, funcionario_id\)[\s\S]*references public\.df_funcionarios\(empresa_id, id\)/)
  assert.match(sql, /idx_df_funcionarios_exames_ocupacionais_funcionario[\s\S]*\(empresa_id, funcionario_id\)/)
  assert.match(repairSql, /drop constraint df_funcionarios_empresa_id_id_unique/)
  assert.match(repairSql, /to_regclass\('public\.uq_df_funcionarios_empresa_id_id'\)/)
  assert.match(repairSql, /v_indices_iguais <> 1/)
})

test('backfill admissional é 1:1, realizado e idempotente', () => {
  assert.match(sql, /f\.data_exame_admissional, 'LEGADO', 'DF_FUNCIONARIO_ADMISSIONAL', f\.id/)
  assert.match(sql, /where f\.data_exame_admissional is not null/)
  assert.match(sql, /on conflict \(empresa_id, legado_tipo, legado_id\)[\s\S]*do nothing/)
  assert.match(sql, /BACKFILL_ADMISSIONAL_INCOMPLETO/)
})

test('backfill periódico preserva vínculo, data e arquivamento', () => {
  assert.match(sql, /e\.empresa_id, e\.funcionario_id, 'PERIODICO', 'REALIZADO'/)
  assert.match(sql, /null, e\.data_exame, 'LEGADO', 'DF_FUNCIONARIO_EXAME_PERIODICO', e\.id/)
  assert.match(sql, /e\.arquivado, e\.arquivado_em, e\.criado_em, e\.atualizado_em/)
  assert.match(sql, /BACKFILL_PERIODICO_INCOMPLETO/)
})

test('backfill não cria demissional nem pendente', () => {
  assert.match(sql, /where tipo = 'DEMISSIONAL' or estado = 'PENDENTE'/)
  assert.match(sql, /BACKFILL_EXAMES_OCUPACIONAIS_CRIACAO_INDEVIDA/)
  assert.doesNotMatch(sql, /insert into public\.df_funcionarios_exames_ocupacionais[\s\S]{0,500}'DEMISSIONAL'/)
})

test('tabela é read-only no Data API com RLS tenant-local', () => {
  assert.match(sql, /enable row level security/)
  assert.match(sql, /force row level security/)
  assert.match(sql, /revoke all on table public\.df_funcionarios_exames_ocupacionais from public, anon, authenticated/)
  assert.match(sql, /grant select on table public\.df_funcionarios_exames_ocupacionais to authenticated/)
  assert.match(sql, /to authenticated[\s\S]*df_funcionarios_pode_escrever\(empresa_id\)/)
  assert.doesNotMatch(sql, /grant (?:insert|update|delete)[^;]*df_funcionarios_exames_ocupacionais/i)
})

test('mutações controladas são restritas e auditadas na mesma transação', () => {
  for (const [nome, acao] of [
    ['registrar_exame_ocupacional_controlado', 'rh.exame_ocupacional.criado'],
    ['atualizar_exame_ocupacional_controlado', 'rh.exame_ocupacional.atualizado'],
    ['arquivar_exame_ocupacional_controlado', 'rh.exame_ocupacional.arquivado']
  ]) {
    const corpo = corpoFuncao(nome)
    assert.match(corpo, /security definer[\s\S]*set search_path = ''/)
    assert.match(corpo, /auth\.uid\(\) is null or not public\.df_funcionarios_pode_escrever/)
    assert.match(corpo, /insert into public\.df_auditoria_eventos/)
    assert.match(corpo, new RegExp(acao.replaceAll('.', '\\.')))
    assert.match(sql, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${nome}[\\s\\S]*to authenticated`))
  }
})

test('registros legados têm proveniência imutável e não aceitam mutação nativa', () => {
  const atualizar = corpoFuncao('atualizar_exame_ocupacional_controlado')
  const arquivar = corpoFuncao('arquivar_exame_ocupacional_controlado')
  assert.match(sql, /idx_df_funcionarios_exames_ocupacionais_legado_unico/)
  assert.match(sql, /PROVENIENCIA_EXAME_OCUPACIONAL_IMUTAVEL/)
  assert.match(atualizar, /EXAME_OCUPACIONAL_LEGADO_SOMENTE_LEITURA/)
  assert.match(arquivar, /EXAME_OCUPACIONAL_LEGADO_SOMENTE_LEITURA/)
})

test('legado permanece intacto e periodicidade não vira automação', () => {
  assert.doesNotMatch(sql, /drop (?:table|column).*df_funcionarios_exames_periodicos/i)
  assert.doesNotMatch(sql, /drop column.*data_exame_admissional/i)
  assert.doesNotMatch(sql, /create (?:trigger|event trigger).*demissional/i)
  assert.doesNotMatch(sql, /interval\s+'1 year'|pg_cron|cron\.schedule/i)
})
