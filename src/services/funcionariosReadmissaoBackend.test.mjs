import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260823195150_readmitir_pessoa_novo_vinculo_2c4.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const service = fs.readFileSync('src/services/funcionariosService.js', 'utf8')
const eventos = fs.readFileSync('src/modules/central-do-dia/domain/centralDoDiaPeopleRules.js', 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('migration cria metadados imutáveis e vínculo tenant-safe com o histórico', () => {
  assert.match(sql, /add column readmissao_origem_funcionario_id uuid null/)
  assert.match(sql, /add column readmissao_request_key text null/)
  assert.match(sql, /foreign key \(empresa_id, readmissao_origem_funcionario_id\)[\s\S]*references public\.df_funcionarios \(empresa_id, id\)/)
  assert.match(sql, /PESSOA_DO_VINCULO_IMUTAVEL/)
  assert.match(sql, /METADADOS_READMISSAO_IMUTAVEIS/)
})

test('RPC cria novo vínculo para a mesma pessoa e não reativa o anterior', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.match(rpc, /from public\.df_pessoas[\s\S]*where empresa_id = p_empresa_id/)
  assert.match(rpc, /insert into public\.df_funcionarios/)
  assert.match(rpc, /p_empresa_id, v_pessoa\.id/)
  assert.match(rpc, /p_vinculo_anterior_id, v_request_key/)
  assert.doesNotMatch(rpc, /update public\.df_funcionarios[\s\S]*set status = 'ativo'/i)
  assert.doesNotMatch(rpc, /set\s+arquivado\s*=/i)
})

test('RPC usa desligamento efetivo 2C-3 e exige admissão civil posterior', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.match(rpc, /from public\.df_funcionarios_desligamentos_efetivos/)
  assert.match(rpc, /estado = 'CONCLUIDO'/)
  assert.match(rpc, /not efeito_revertido/)
  assert.match(rpc, /p_nova_data_admissao <= v_desligamento_efetivo\.data_efetiva_efetiva/)
  assert.match(rpc, /NOVA_ADMISSAO_DEVE_SER_POSTERIOR_AO_DESLIGAMENTO/)
  assert.match(rpc, /ADMISSAO_29FEV_REQUER_DECISAO/)
})

test('concorrência e retry são serializados e idempotentes', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.match(rpc, /pg_advisory_xact_lock/)
  assert.match(rpc, /order by id\s+for update/)
  assert.match(sql, /create unique index uq_df_funcionarios_readmissao_request/)
  assert.match(sql, /create unique index uq_df_funcionarios_pessoa_vinculo_funcional/)
  assert.match(rpc, /READMISSAO_JA_PROCESSADA/)
  assert.match(rpc, /CHAVE_IDEMPOTENCIA_CONFLITANTE/)
  assert.match(sql, /PESSOA_JA_POSSUI_VINCULO_FUNCIONAL/)
})

test('primeiro ciclo e auditoria usam a mesma transação e correlation_id', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.match(sql, /^begin;/)
  assert.match(sql, /commit;\s*$/)
  assert.match(rpc, /alterar_admissao_funcionario_controlado/)
  assert.match(rpc, /PRIMEIRO_CICLO_READMISSAO_NAO_CRIADO/)
  assert.match(rpc, /rh\.pessoa\.readmitida/)
  assert.match(rpc, /v_correlation_id/)
})

test('segurança restringe a autoridade a authenticated e ao tenant', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.match(rpc, /security definer\s+set search_path = ''/)
  assert.match(rpc, /auth\.uid\(\) is null or not public\.df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(sql, /revoke all on function public\.readmitir_pessoa_controlado[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /grant execute on function public\.readmitir_pessoa_controlado[\s\S]*to authenticated/)
})

test('readmissão preserva históricos e somente cria o primeiro ciclo do novo vínculo', () => {
  const rpc = corpoFuncao('readmitir_pessoa_controlado')
  assert.doesNotMatch(rpc, /(?:update|delete from) public\.df_funcionarios_ferias_/i)
  assert.doesNotMatch(rpc, /(?:insert into|update|delete from) public\.df_folha_/i)
  assert.doesNotMatch(rpc, /(?:insert into|update|delete from) public\.df_funcionarios_exames_/i)
  assert.doesNotMatch(rpc, /(?:insert into|update|delete from) public\.df_funcionarios_desligamentos\b/i)
  assert.doesNotMatch(rpc, /delete\s+from/i)
})

test('service e UI expõem somente o fluxo controlado com aviso de novo vínculo', () => {
  assert.match(service, /supabase\.rpc\('readmitir_pessoa_controlado'/)
  assert.match(page, /Confirmar readmissão/)
  assert.match(page, /Será criado um novo vínculo/)
  assert.match(page, /O vínculo anterior continuará desligado/)
  assert.match(page, /confirmouHistorico/)
  assert.match(page, /vinculosPorPessoa/)
})

test('Agenda e Dashboard deduplicam aniversário por pessoa na projeção canônica', () => {
  assert.match(eventos, /function vinculosAtivosUnicosPorPessoa/)
  assert.match(eventos, /pessoas:aniversario:\$\{pessoaId\}/)
  assert.match(eventos, /aniversario_pessoa/)
  assert.match(eventos, /export function projetarEventosPessoas/)
})
