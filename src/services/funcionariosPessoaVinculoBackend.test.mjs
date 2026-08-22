import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260822123620_separar_pessoa_vinculo_2c1.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const service = fs.readFileSync('src/services/funcionariosService.js', 'utf8')
const eventos = fs.readFileSync('src/modules/central-do-dia/services/eventosPessoasService.js', 'utf8')
const loteEventos = fs.readFileSync('src/modules/central-do-dia/services/eventosPessoasBatch.js', 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('migration cria identidade tenant-local sem unicidade de CPF', () => {
  assert.match(sql, /create table public\.df_pessoas/)
  assert.match(sql, /empresa_id uuid not null[\s\S]*references public\.df_empresas/)
  assert.match(sql, /constraint df_pessoas_empresa_id_id_unique unique \(empresa_id, id\)/)
  assert.doesNotMatch(sql, /unique\s*\(\s*empresa_id\s*,\s*cpf\s*\)/i)
  assert.doesNotMatch(sql, /unique\s*\(\s*cpf\s*\)/i)
})

test('backfill é estritamente 1:1, sem deduplicação e preserva IDs do vínculo', () => {
  assert.match(sql, /set pessoa_id = gen_random_uuid\(\)/)
  assert.match(sql, /insert into public\.df_pessoas[\s\S]*select[\s\S]*pessoa_id, empresa_id, nome, cpf, telefone, email, data_nascimento/)
  assert.match(sql, /alter column pessoa_id set not null/)
  assert.match(sql, /v_funcionarios <> v_pessoas/)
  assert.match(sql, /v_pessoas_compartilhadas <> 0/)
  assert.doesNotMatch(sql, /partition by\s+(?:cpf|nome)|distinct on\s*\([^)]*(?:cpf|nome)/i)
  assert.doesNotMatch(sql, /update public\.df_funcionarios\s+set id\s*=/i)
})

test('FK composta e índice impedem pessoa de outro tenant', () => {
  assert.match(sql, /foreign key \(empresa_id, pessoa_id\)[\s\S]*references public\.df_pessoas \(empresa_id, id\)/)
  assert.match(sql, /create index idx_df_funcionarios_empresa_pessoa[\s\S]*\(empresa_id, pessoa_id\)/)
  assert.match(sql, /PESSOA_DO_VINCULO_NAO_ENCONTRADA/)
})

test('df_pessoas força RLS, authenticated lê no tenant e ninguém escreve diretamente', () => {
  assert.match(sql, /alter table public\.df_pessoas enable row level security/)
  assert.match(sql, /alter table public\.df_pessoas force row level security/)
  assert.match(sql, /create policy "df_pessoas_select_rh"[\s\S]*to authenticated/)
  assert.match(sql, /df_usuario_eh_admin\(empresa_id\)/)
  assert.match(sql, /df_usuario_tem_perfil_empresa\(empresa_id, array\['gerente'\]\)/)
  assert.match(sql, /revoke all on table public\.df_pessoas from public, anon, authenticated/)
  assert.match(sql, /grant select on table public\.df_pessoas to authenticated/)
  assert.doesNotMatch(sql, /grant (?:insert|update|delete)[^;]*df_pessoas/i)
})

test('df_pessoas é autoridade e campos legados são espelho protegido', () => {
  const validar = corpoFuncao('df_funcionarios_validar_pessoa_vinculo_2c1')
  const espelhar = corpoFuncao('df_pessoas_espelhar_legado_funcionario_2c1')
  assert.match(validar, /DADOS_PESSOA_REQUER_FLUXO_CONTROLADO/)
  assert.match(espelhar, /update public\.df_funcionarios[\s\S]*set nome = new\.nome[\s\S]*cpf = new\.cpf/)
  assert.match(espelhar, /where empresa_id = new\.empresa_id[\s\S]*pessoa_id = new\.id/)
})

test('cadastro pessoa e vínculo é uma transação e reaproveita admissão controlada', () => {
  const criar = corpoFuncao('criar_funcionario_com_pessoa_controlado')
  assert.match(sql, /^begin;/)
  assert.match(sql, /commit;\s*$/)
  assert.match(criar, /insert into public\.df_pessoas/)
  assert.match(criar, /insert into public\.df_funcionarios/)
  assert.match(criar, /public\.alterar_admissao_funcionario_controlado/)
  assert.match(criar, /rh\.funcionario\.criado/)
  assert.match(criar, /correlation_id/)
  assert.match(service, /rpc\('criar_funcionario_com_pessoa_controlado'/)
  assert.doesNotMatch(service, /inserirComEmpresa/)
})

test('edição separa campos pessoais dos campos do vínculo sem mover admissão', () => {
  const atualizar = corpoFuncao('atualizar_funcionario_pessoa_vinculo_controlado')
  assert.match(atualizar, /update public\.df_pessoas/)
  assert.match(atualizar, /update public\.df_funcionarios/)
  assert.match(atualizar, /filial_id = case/)
  assert.match(atualizar, /cargo = case/)
  assert.doesNotMatch(atualizar, /data_admissao\s*=/)
  assert.match(service, /rpc\('atualizar_funcionario_pessoa_vinculo_controlado'/)
})

test('arquivamento e desligamento do vínculo não arquivam a pessoa', () => {
  const atualizar = corpoFuncao('atualizar_funcionario_pessoa_vinculo_controlado')
  assert.doesNotMatch(atualizar, /set[\s\S]*arquivado\s*=/i)
  assert.doesNotMatch(sql, /update public\.df_pessoas[\s\S]{0,180}arquivado\s*=/i)
  assert.doesNotMatch(sql, /df_funcionarios_desligamentos\s+set/i)
})

test('Férias, Folha, Exames e Desligamentos mantêm funcionario_id e não são reescritos', () => {
  for (const tabela of [
    'df_funcionarios_ferias_ciclos',
    'df_funcionarios_ferias_periodos',
    'df_folha_lancamentos',
    'df_folha_itens',
    'df_funcionarios_exames_periodicos',
    'df_funcionarios_desligamentos'
  ]) {
    assert.doesNotMatch(sql, new RegExp(`(?:insert into|update|delete from|alter table) public\\.${tabela}`, 'i'))
  }
})

test('Agenda e Dashboard conservam projeção canônica em lote', () => {
  assert.match(eventos, /listarFuncionarios/)
  assert.match(eventos, /executarConsultasEventosPessoas/)
  assert.match(loteEventos, /Promise\.all/)
  assert.doesNotMatch(eventos, /for\s*\([^)]*funcionario[^)]*\)[\s\S]{0,200}\.from\(/)
})

test('RPCs são SECURITY DEFINER restritas a authenticated e anon permanece bloqueado', () => {
  for (const nome of [
    'criar_funcionario_com_pessoa_controlado',
    'atualizar_funcionario_pessoa_vinculo_controlado'
  ]) {
    const corpo = corpoFuncao(nome)
    assert.match(corpo, /security definer[\s\S]*set search_path = ''/)
    assert.match(corpo, /auth\.uid\(\) is null or not public\.df_funcionarios_pode_escrever/)
    assert.match(sql, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${nome}[\\s\\S]*to authenticated`))
  }
})
