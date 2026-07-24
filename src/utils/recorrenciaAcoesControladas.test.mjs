import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { vincularContaManualRecorrencia } from '../services/recorrenciaCoberturaService.js'
import {
  AUDITORIA_ACOES_RECORRENCIAS,
  detectarConflitoOcorrencia,
  montarPayloadAuditoriaVinculoManual,
  montarPreviaPayloadGeracao,
  montarPreviaPayloadVinculo,
  validarOcorrenciaParaGeracao,
  validarSugestaoParaVinculo,
  validarVinculoManualConfirmado
} from './recorrenciaAcoesControladas.js'

const serie = (extra = {}) => ({ id: 'r1', empresa_id: 'e1', descricao: 'Aluguel', valor: 100, ativo: true, filial_id: 'f1', centro_custo_id: 'c1', ...extra })
const conta = (extra = {}) => ({ id: 'c1', empresa_id: 'e1', data_vencimento: '2026-08-15', recorrencia_id: null, filial_id: 'f1', centro_custo_id: 'c1', excluido: false, deletado: false, ...extra })
const ocorrencia = (extra = {}) => ({ recorrenciaId: 'r1', serie: serie(), dataVencimento: '2026-08-15', competencia: '2026-08-01', contasVinculadas: [], ...extra })

function criarSupabaseMock({ series = [serie()], contas = [conta()], updateError = null } = {}) {
  const chamadas = []
  const dados = { df_contas_recorrentes: [...series], df_contas: [...contas] }

  class Query {
    constructor(tabela) {
      this.tabela = tabela
      this.filtros = []
      this.payloadUpdate = null
    }

    select() { return this }
    order() { return this }
    or() { return this }
    eq(campo, valor) { this.filtros.push({ tipo: 'eq', campo, valor }); return this }
    is(campo, valor) { this.filtros.push({ tipo: 'is', campo, valor }); return this }

    update(payload) {
      this.payloadUpdate = payload
      chamadas.push({ tipo: 'update', tabela: this.tabela, payload })
      return this
    }

    aplicarFiltros() {
      return (dados[this.tabela] || []).filter((item) => this.filtros.every((filtro) => {
        if (filtro.tipo === 'eq') return item[filtro.campo] === filtro.valor
        if (filtro.tipo === 'is') return filtro.valor === null ? (item[filtro.campo] === null || item[filtro.campo] === undefined) : item[filtro.campo] === filtro.valor
        return true
      }))
    }

    async maybeSingle() {
      if (this.payloadUpdate) {
        if (updateError) return { data: null, error: updateError }
        const item = this.aplicarFiltros()[0] || null
        if (!item) return { data: null, error: null }
        Object.assign(item, this.payloadUpdate)
        return { data: item, error: null }
      }
      return { data: this.aplicarFiltros()[0] || null, error: null }
    }

    async range() {
      return { data: this.aplicarFiltros(), error: null }
    }
  }

  return {
    chamadas,
    from(tabela) {
      return new Query(tabela)
    }
  }
}

test('vínculo bloqueia empresa filial e centro incompatíveis', () => {
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e2', serie: serie(), conta: conta(), autorizado: true }).codigo, 'EMPRESA_INVALIDA')
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e1', serie: serie(), conta: conta({ filial_id: 'f2' }), autorizado: true }).codigo, 'ORGANIZACAO_INCOMPATIVEL')
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e1', serie: serie(), conta: conta({ centro_custo_id: 'c2' }), autorizado: true }).codigo, 'ORGANIZACAO_INCOMPATIVEL')
})

test('conta manual já vinculada não pode ser vinculada novamente em pré-validação', () => {
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e1', serie: serie(), conta: conta({ recorrencia_id: 'r2' }), autorizado: true }).codigo, 'CONTA_JA_VINCULADA')
})

test('prévia de vínculo contém somente identificadores e alteração existente', () => {
  assert.deepEqual(montarPreviaPayloadVinculo({ empresaId: 'e1', serie: serie(), conta: conta(), autorizado: true }).payload, { contaId: 'c1', empresaId: 'e1', alteracoes: { recorrencia_id: 'r1' } })
})

test('geração é bloqueada por ocorrência existente ou duplicada', () => {
  assert.equal(validarOcorrenciaParaGeracao({ empresaId: 'e1', ocorrencia: ocorrencia({ contasVinculadas: [conta({ recorrencia_id: 'r1' })] }), autorizado: true }).codigo, 'OCORRENCIA_COBERTA')
  assert.equal(validarOcorrenciaParaGeracao({ empresaId: 'e1', ocorrencia: ocorrencia({ contasVinculadas: [conta({ recorrencia_id: 'r1' }), conta({ id: 'c2', recorrencia_id: 'r1' })] }), autorizado: true }).codigo, 'OCORRENCIA_DUPLICADA')
})

test('detecção de concorrência usa recorrência e vencimento ativos', () => {
  const conflito = detectarConflitoOcorrencia({ ocorrencia: ocorrencia(), contas: [conta({ recorrencia_id: 'r1' }), conta({ id: 'x', recorrencia_id: 'r1', excluido: true })] })
  assert.deepEqual({ existe: conflito.existe, duplicada: conflito.duplicada, quantidade: conflito.quantidade }, { existe: true, duplicada: false, quantidade: 1 })
  assert.equal(conflito.indice, 'uq_df_contas_recorrencia_vencimento_ativas')
})

test('prévia de geração usa apenas campos já presentes no fluxo atual', () => {
  const payload = montarPreviaPayloadGeracao({ empresaId: 'e1', ocorrencia: ocorrencia(), autorizado: true }).payload
  assert.deepEqual(Object.keys(payload).sort(), ['centro_custo_id', 'competencia', 'data_vencimento', 'descricao', 'dias_aviso', 'empresa_id', 'enviar_email', 'enviar_push', 'enviar_whatsapp', 'excluido', 'filial_id', 'imposto_tipo', 'observacao', 'recorrencia_id', 'status', 'valor', 'vencimento'].sort())
})

test('contrato libera somente vínculo manual com confirmação idempotência e auditoria posterior', () => {
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.escritaDisponivel, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.exigeConfirmacaoExplicita, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.exigeIdempotencia, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.acoesAuditoriaAtivadas, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.auditoriaAtomicaComEscrita, false)
})

test('central mantem geração desabilitada e não chama Supabase direto', async () => {
  const pagina = await readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8')
  assert.match(pagina, /Vincular após revisão/)
  assert.match(pagina, /Gerar após revisão/)
  assert.match(pagina, /podeVincularRecorrencia/)
  assert.match(pagina, /Gerar após revisão[\s\S]*disabled|disabled[\s\S]*Gerar após revisão/)
  assert.equal(/supabase\s*\.\s*from|supabase\.|functions\.invoke/.test(pagina), false)
})

test('validacao confirmada bloqueia recorrencia inativa e ocorrencia coberta', () => {
  assert.equal(validarVinculoManualConfirmado({ empresaId: 'e1', serie: serie({ ativo: false }), conta: conta(), ocorrencia: ocorrencia(), autorizado: true }).codigo, 'RECORRENCIA_INATIVA')
  assert.equal(validarVinculoManualConfirmado({ empresaId: 'e1', serie: serie(), conta: conta(), ocorrencia: ocorrencia({ contasVinculadas: [conta({ id: 'c2', recorrencia_id: 'r1' })] }), autorizado: true }).codigo, 'OCORRENCIA_COBERTA')
})

test('vinculo manual valido executa somente update de recorrencia_id', async () => {
  const supabase = criarSupabaseMock()
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', autorizado: true })
  assert.equal(resultado.error, null)
  assert.equal(resultado.bloqueado, false)
  assert.equal(resultado.data.recorrencia_id, 'r1')
  assert.deepEqual(supabase.chamadas, [{ tipo: 'update', tabela: 'df_contas', payload: { recorrencia_id: 'r1' } }])
})

test('vinculo manual e idempotente quando a conta ja cobre a mesma ocorrencia', async () => {
  const supabase = criarSupabaseMock({ contas: [conta({ recorrencia_id: 'r1' })] })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', autorizado: true })
  assert.equal(resultado.idempotente, true)
  assert.equal(supabase.chamadas.length, 0)
})

test('vinculo manual bloqueia conta vinculada a outra recorrencia', async () => {
  const supabase = criarSupabaseMock({ contas: [conta({ recorrencia_id: 'r2' })] })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', autorizado: true })
  assert.equal(resultado.bloqueado, true)
  assert.equal(resultado.codigo, 'CONTA_JA_VINCULADA')
})

test('vinculo manual bloqueia conflito do indice protegido', async () => {
  const supabase = criarSupabaseMock({ updateError: { code: '23505', message: 'duplicate key value violates unique constraint "uq_df_contas_recorrencia_vencimento_ativas"' } })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', autorizado: true })
  assert.equal(resultado.bloqueado, true)
  assert.equal(resultado.codigo, 'CONFLITO_INDICE')
})

test('auditoria do vinculo usa acao segura e sem dados financeiros completos', () => {
  const payload = montarPayloadAuditoriaVinculoManual({ empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', competencia: '2026-08-01', correlationId: 'corr' })
  assert.equal(payload.acao, 'financeiro.recorrencia.vinculo_manual')
  assert.deepEqual(payload.dados_depois, { recorrencia_id: 'r1' })
  assert.deepEqual(Object.keys(payload.metadados).sort(), ['competencia', 'conta_id', 'data_vencimento', 'recorrencia_id'].sort())
})

test('App invalida indicadores bloqueia duplo clique e nao gera recorrencias', async () => {
  const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8')
  assert.match(app, /vinculoManualRecorrenciaEmAndamentoRef/)
  assert.match(app, /buscarContasAposMutacao\(\)/)
  assert.match(app, /registrarEventoAuditoriaSeguro/)
  assert.doesNotMatch(app, /montarPreviaPayloadGeracao\(|inserirContasRecorrentes/)
})
