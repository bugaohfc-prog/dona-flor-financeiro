import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const raiz = process.cwd()
const migrationPagamento = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730183313_registrar_pagamento_parcial_controlado.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const migrationLixeira = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730184527_proteger_exclusao_definitiva_lixeira.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const contasServiceFonte = fs.readFileSync(path.join(raiz, 'src/services/contasService.js'), 'utf8')
const notasServiceFonte = fs.readFileSync(path.join(raiz, 'src/services/notasService.js'), 'utf8')
const useContasFonte = fs.readFileSync(path.join(raiz, 'src/hooks/useContas.js'), 'utf8')
const appFonte = fs.readFileSync(path.join(raiz, 'src/App.jsx'), 'utf8')
const modalPagamentoFonte = fs.readFileSync(
  path.join(raiz, 'src/components/modals/AccountPartialPaymentModal.jsx'),
  'utf8'
)

test('P0-1 usa RPC transacional com bloqueio da conta e idempotencia por empresa', () => {
  assert.match(migrationPagamento, /registrar_pagamento_parcial_controlado/)
  assert.match(migrationPagamento, /for update/i)
  assert.match(migrationPagamento, /uq_df_contas_pagamentos_empresa_idempotency/)
  assert.match(migrationPagamento, /empresa_id, idempotency_key/)
  assert.match(migrationPagamento, /v_valor > v_saldo/)
})

test('P0-1 registra auditoria na mesma funcao transacional', () => {
  const inicioFuncao = migrationPagamento.indexOf('create or replace function public.registrar_pagamento_parcial_controlado')
  const fimFuncao = migrationPagamento.indexOf('revoke all on function public.registrar_pagamento_parcial_controlado')
  const corpo = migrationPagamento.slice(inicioFuncao, fimFuncao)
  assert.match(corpo, /insert into public\.df_auditoria_eventos/)
  assert.match(corpo, /financeiro\.pagamento_parcial\.criado/)
})

test('P0-1 remove INSERT direto e policy paralela de pagamentos', () => {
  assert.match(migrationPagamento, /revoke insert on table public\.df_contas_pagamentos from authenticated/i)
  assert.match(migrationPagamento, /drop policy if exists "df_contas_pagamentos_insert_empresa_operacional"/i)
})

test('P0-1 frontend usa somente a RPC protegida para criar pagamento parcial', async () => {
  const { registrarPagamentoParcial } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?p0=${Date.now()}`
  )
  const chamadas = []
  const supabase = {
    rpc: async (nome, payload) => {
      chamadas.push({ nome, payload })
      return {
        data: {
          pagamento: { id: 'pagamento-1', valor_pago: 80 },
          idempotente: false,
          auditoria_registrada: true
        },
        error: null
      }
    },
    from: () => {
      throw new Error('INSERT direto nao pode ser usado')
    }
  }

  const resposta = await registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', {
    valor_pago: 80,
    data_pagamento: '2026-07-30',
    observacao: null,
    idempotency_key: '11111111-1111-4111-8111-111111111111'
  })

  assert.equal(resposta.error, null)
  assert.equal(chamadas.length, 1)
  assert.equal(chamadas[0].nome, 'registrar_pagamento_parcial_controlado')
  assert.equal(chamadas[0].payload.p_idempotency_key, '11111111-1111-4111-8111-111111111111')
})

test('P0-1 reutiliza a mesma chave durante a tentativa logica no modal', () => {
  assert.match(modalPagamentoFonte, /useRef\(globalThis\.crypto\.randomUUID\(\)\)/)
  assert.match(modalPagamentoFonte, /idempotency_key: idempotencyKeyRef\.current/)
  assert.match(modalPagamentoFonte, /idempotencyKeyRef\.current = globalThis\.crypto\.randomUUID\(\)/)
})

test('P0-1 chamadas repetidas e simultaneas preservam a mesma identidade logica', async () => {
  const { registrarPagamentoParcial } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?concorrencia=${Date.now()}`
  )
  const pagamentosPorChave = new Map()
  const supabase = {
    rpc: async (_nome, payload) => {
      await Promise.resolve()
      const existente = pagamentosPorChave.get(payload.p_idempotency_key)
      if (existente) {
        return { data: { pagamento: existente, idempotente: true, auditoria_registrada: true }, error: null }
      }
      const criado = { id: 'pagamento-unico', valor_pago: payload.p_valor }
      pagamentosPorChave.set(payload.p_idempotency_key, criado)
      return { data: { pagamento: criado, idempotente: false, auditoria_registrada: true }, error: null }
    }
  }
  const tentativa = {
    valor_pago: 80,
    data_pagamento: '2026-07-30',
    idempotency_key: '22222222-2222-4222-8222-222222222222'
  }

  const [primeira, repetida] = await Promise.all([
    registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', tentativa),
    registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', tentativa)
  ])

  assert.equal(primeira.data[0].id, repetida.data[0].id)
  assert.equal(pagamentosPorChave.size, 1)
})

test('P0-1 hook nao dispara auditoria separada depois da escrita', () => {
  assert.doesNotMatch(useContasFonte, /registrarAuditoriaPagamentoParcialCriado/)
  assert.doesNotMatch(contasServiceFonte, /functions\.invoke\('registrar-auditoria-evento'/)
})

test('P0-2 RPCs bloqueiam registros e revalidam a retencao de 60 dias', () => {
  assert.match(migrationLixeira, /create or replace function public\.excluir_conta_definitivamente/)
  assert.match(migrationLixeira, /create or replace function public\.excluir_nota_definitivamente/)
  assert.equal((migrationLixeira.match(/for update/gi) || []).length, 2)
  assert.equal((migrationLixeira.match(/now\(\) - interval '60 days'/gi) || []).length, 2)
})

test('P0-2 auditoria obrigatoria permanece na mesma transacao das exclusoes', () => {
  assert.match(migrationLixeira, /trg_df_contas_auditoria_lixeira/)
  assert.match(migrationLixeira, /trg_df_notas_auditoria_lixeira/)
  assert.match(migrationLixeira, /begin;[\s\S]+delete from public\.df_contas[\s\S]+delete from public\.df_notas[\s\S]+commit;/i)
})

test('P0-2 remove grants e policies de DELETE direto sem caminho paralelo', () => {
  assert.match(migrationLixeira, /revoke delete on table public\.df_contas from authenticated/i)
  assert.match(migrationLixeira, /revoke delete on table public\.df_notas from authenticated/i)
  assert.match(migrationLixeira, /drop policy if exists "df_contas_delete_admin_master"/i)
  assert.match(migrationLixeira, /drop policy if exists "df_notas_delete_admin_master"/i)
  assert.doesNotMatch(appFonte, /\.from\(['"]df_contas['"]\)[\s\S]{0,300}\.delete\(\)/)
  assert.doesNotMatch(notasServiceFonte, /\.from\(['"]df_notas['"]\)[\s\S]{0,300}\.delete\(\)/)
})

test('P0-2 frontend chama somente as RPCs controladas para exclusao definitiva', async () => {
  const { excluirContaPermanentemente } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?lixeira=${Date.now()}`
  )
  const chamadas = []
  const supabase = {
    rpc: async (nome, payload) => {
      chamadas.push({ nome, payload })
      return { data: { id: payload.p_conta_id, excluida: true }, error: null }
    },
    from: () => {
      throw new Error('DELETE direto nao pode ser usado')
    }
  }

  const resposta = await excluirContaPermanentemente(supabase, 'conta-1', 'empresa-1')

  assert.equal(resposta.error, null)
  assert.deepEqual(chamadas, [{
    nome: 'excluir_conta_definitivamente',
    payload: { p_empresa_id: 'empresa-1', p_conta_id: 'conta-1' }
  }])
  assert.match(notasServiceFonte, /supabase\.rpc\('excluir_nota_definitivamente'/)
})
