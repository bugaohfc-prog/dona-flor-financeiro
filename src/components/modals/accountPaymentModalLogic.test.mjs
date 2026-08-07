import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

import { criarControleBaixaConta } from './accountPaymentModalLogic.js'
import {
  baixarContaComoPaga,
  consolidarPagamentosParciaisDaConta
} from '../../services/contasService.js'

function ler(caminho) {
  return readFileSync(new URL(caminho, import.meta.url), 'utf8')
}

function criarSupabaseAtualizacao(resposta = { data: null, error: null }) {
  const chamadas = []
  const query = {
    update(payload) {
      chamadas.push({ tipo: 'update', payload })
      return this
    },
    eq(campo, valor) {
      chamadas.push({ tipo: 'eq', campo, valor })
      return this
    },
    then(resolve) {
      return Promise.resolve(resposta).then(resolve)
    }
  }

  return {
    chamadas,
    supabase: {
      from(tabela) {
        chamadas.push({ tipo: 'from', tabela })
        return query
      }
    }
  }
}

test('regressao: modais de pagamento nao referenciam o contrato styles removido de Contas', () => {
  const app = ler('../../App.jsx')
  const pagina = ler('../../pages/ContasPage.jsx')
  const modalBaixa = ler('./AccountPaymentModal.jsx')
  const modalParcial = ler('./AccountPartialPaymentModal.jsx')

  const composicaoContas = app.match(/<LazyContasPage[\s\S]*?\/>/)?.[0] || ''
  assert.doesNotMatch(composicaoContas, /styles=\{styles\}/)
  assert.doesNotMatch(pagina, /styles=\{styles\}/)
  assert.doesNotMatch(modalBaixa, /\bstyles\b/)
  assert.doesNotMatch(modalParcial, /\bstyles\b/)
  assert.match(modalBaixa, /account-payment-modal-card/)
})

test('abrir modal de baixa renderiza sem depender do contrato styles removido', async () => {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true }
  })

  try {
    const { default: AccountPaymentModal } = await vite.ssrLoadModule(
      '/src/components/modals/AccountPaymentModal.jsx'
    )
    const html = renderToStaticMarkup(createElement(AccountPaymentModal, {
      conta: {
        id: 'conta-1',
        descricao: 'Conta de teste',
        valor: '100.00',
        valor_pago: null,
        data_pagamento: null,
        observacao_pagamento: null
      },
      formatarValor: (valor) => `R$ ${Number(valor).toFixed(2)}`,
      formatarData: (valor) => valor,
      limitarDataInput: (valor) => valor,
      onClose: () => {},
      onConfirm: async () => true
    }))

    assert.match(html, /Baixar pagamento/)
    assert.match(html, /Confirmar baixa/)
    assert.doesNotMatch(html, /Não foi possível concluir a baixa/)
  } finally {
    await vite.close()
  }
})

test('controle da baixa aceita somente uma confirmacao simultanea', async () => {
  const controle = criarControleBaixaConta()
  let liberar
  let chamadas = 0
  const pendente = new Promise((resolve) => { liberar = resolve })
  const confirmar = async () => {
    chamadas += 1
    await pendente
    return true
  }

  const primeira = controle.executar(confirmar, { valor_pago: 100 })
  const segunda = await controle.executar(confirmar, { valor_pago: 100 })

  assert.equal(controle.estaEmAndamento(), true)
  assert.deepEqual(segunda, { sucesso: false, ignorado: true, erro: null })
  assert.equal(chamadas, 1)

  liberar()
  assert.deepEqual(await primeira, { sucesso: true, ignorado: false, erro: null })
  assert.equal(controle.estaEmAndamento(), false)
})

test('falha local nao escapa e permite tentar novamente com o mesmo payload', async () => {
  const controle = criarControleBaixaConta()
  const payload = { valor_pago: 80, data_pagamento: '2026-08-07', observacao_pagamento: null }
  const falha = new Error('falha de rede')

  const primeira = await controle.executar(async () => { throw falha }, payload)
  const segunda = await controle.executar(async (recebido) => {
    assert.deepEqual(recebido, payload)
    return true
  }, payload)

  assert.equal(primeira.sucesso, false)
  assert.equal(primeira.erro, falha)
  assert.deepEqual(segunda, { sucesso: true, ignorado: false, erro: null })
})

test('resposta nula ou incompleta permanece erro controlado', async () => {
  const controle = criarControleBaixaConta()

  assert.deepEqual(
    await controle.executar(async () => null, {}),
    { sucesso: false, ignorado: false, erro: null }
  )
  assert.deepEqual(
    await controle.executar(async () => ({}), {}),
    { sucesso: false, ignorado: false, erro: null }
  )
})

test('baixa integral executa um unico update com empresa e dados financeiros', async () => {
  const { supabase, chamadas } = criarSupabaseAtualizacao()
  const resposta = await baixarContaComoPaga(supabase, 'conta-1', 'empresa-1', {
    valor_pago: 125.5,
    data_pagamento: '2026-08-07',
    observacao_pagamento: null
  })

  assert.equal(resposta.error, null)
  assert.equal(chamadas.filter((item) => item.tipo === 'update').length, 1)
  assert.deepEqual(chamadas.find((item) => item.tipo === 'update').payload, {
    status: 'pago',
    valor_pago: 125.5,
    data_pagamento: '2026-08-07',
    observacao_pagamento: null
  })
  assert.deepEqual(
    chamadas.filter((item) => item.tipo === 'eq').map(({ campo, valor }) => [campo, valor]),
    [['id', 'conta-1'], ['empresa_id', 'empresa-1']]
  )
})

test('baixa integral apos parciais usa o saldo derivado sem duplicar pagamentos', () => {
  const conta = { id: 'conta-1', valor: '100.00' }
  const parcial = consolidarPagamentosParciaisDaConta(conta, [
    { id: 'p1', conta_id: 'conta-1', valor_pago: '40.00', data_pagamento: '2026-08-01', arquivado: false },
    { id: 'p2', conta_id: 'conta-1', valor_pago: 60, data_pagamento: '2026-08-07', arquivado: false },
    { id: 'p3', conta_id: 'conta-1', valor_pago: null, data_pagamento: null, arquivado: true }
  ])

  assert.equal(parcial.totalPagoParcial, 100)
  assert.equal(parcial.saldoPendente, 0)
  assert.equal(parcial.quantidadePagamentos, 2)
  assert.equal(parcial.statusOperacionalDerivado, 'paga')
})
