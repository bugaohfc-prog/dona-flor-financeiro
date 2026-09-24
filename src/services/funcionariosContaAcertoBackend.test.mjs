import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260924204748_vincular_conta_pagamento_desligamento.sql',
  'utf8'
)
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const service = fs.readFileSync('src/services/funcionariosDesligamentosService.js', 'utf8')

test('estrutura usa conta tenant-local e FK composta no desligamento', () => {
  assert.match(migration, /create table public\.df_contas_pagamento/)
  assert.match(migration, /unique \(empresa_id, id\)/)
  assert.match(migration, /add column conta_pagamento_id uuid null/)
  assert.match(migration, /foreign key \(empresa_id, conta_pagamento_id\)[\s\S]*references public\.df_contas_pagamento \(empresa_id, id\)[\s\S]*on delete restrict/)
  assert.doesNotMatch(migration, /references public\.df_contas\b/)
})

test('RLS, FORCE RLS e grants mantêm escrita apenas nas RPCs', () => {
  assert.match(migration, /alter table public\.df_contas_pagamento enable row level security/)
  assert.match(migration, /alter table public\.df_contas_pagamento force row level security/)
  assert.match(migration, /revoke all on table public\.df_contas_pagamento from public, anon, authenticated/)
  assert.match(migration, /grant select on table public\.df_contas_pagamento to authenticated/)
  assert.doesNotMatch(migration, /grant (?:insert|update|delete)[\s\S]*df_contas_pagamento[\s\S]*authenticated/i)
  assert.match(migration, /df_funcionarios_pode_escrever\(empresa_id\)/)
})

test('RPCs validam autorização, tenant, conta ativa e estado editável', () => {
  for (const nome of [
    'criar_conta_pagamento_desligamento_controlado',
    'alterar_atividade_conta_pagamento_desligamento_controlado',
    'vincular_conta_pagamento_desligamento_controlado'
  ]) {
    assert.match(migration, new RegExp(`create function public\\.${nome}`))
    assert.match(migration, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.match(migration, new RegExp(`grant execute on function public\\.${nome}[\\s\\S]*to authenticated`))
  }
  assert.match(migration, /not public\.df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(migration, /where empresa_id = p_empresa_id and id = p_conta_pagamento_id/)
  assert.match(migration, /if not v_conta\.ativo then raise exception 'CONTA_PAGAMENTO_ARQUIVADA'/)
  assert.match(migration, /if v_antes\.estado <> 'ABERTO' then raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO'/)
})

test('arquivamento preserva vínculo e todas as mutações são auditadas', () => {
  assert.match(migration, /'rh\.conta_pagamento\.criada'/)
  assert.match(migration, /'rh\.conta_pagamento\.arquivada'/)
  assert.match(migration, /'rh\.desligamento\.conta_pagamento_vinculada'/)
  assert.doesNotMatch(migration, /delete from public\.df_contas_pagamento/i)
  assert.doesNotMatch(migration, /set conta_pagamento_id = null[\s\S]*arquiv/i)
})

test('UI cobre vazio, seleção, reload por serviço, arquivada histórica e bloqueio imutável', () => {
  assert.match(page, /Nenhuma conta definida/)
  assert.match(page, /contasPagamentoAtivas\.map/)
  assert.match(page, /salvarContaPagamentoAcerto/)
  assert.match(page, /Conta arquivada — vínculo histórico preservado/)
  assert.match(page, /Este desligamento não permite mais alteração da conta/)
  assert.match(service, /'conta_pagamento_id'/)
  assert.match(service, /listarContasPagamentoDesligamento/)
})
