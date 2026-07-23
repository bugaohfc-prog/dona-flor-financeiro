import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { AUDITORIA_ACOES_RECORRENCIAS, detectarConflitoOcorrencia, montarPreviaPayloadGeracao, montarPreviaPayloadVinculo, validarOcorrenciaParaGeracao, validarSugestaoParaVinculo } from './recorrenciaAcoesControladas.js'

const serie = (extra = {}) => ({ id: 'r1', empresa_id: 'e1', descricao: 'Aluguel', valor: 100, ativo: true, filial_id: 'f1', centro_custo_id: 'c1', ...extra })
const conta = (extra = {}) => ({ id: 'c1', empresa_id: 'e1', data_vencimento: '2026-08-15', recorrencia_id: null, filial_id: 'f1', centro_custo_id: 'c1', ...extra })
const ocorrencia = (extra = {}) => ({ recorrenciaId: 'r1', serie: serie(), dataVencimento: '2026-08-15', competencia: '2026-08-01', contasVinculadas: [], ...extra })

test('vínculo bloqueia empresa filial e centro incompatíveis', () => {
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e2', serie: serie(), conta: conta(), autorizado: true }).codigo, 'EMPRESA_INVALIDA')
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e1', serie: serie(), conta: conta({ filial_id: 'f2' }), autorizado: true }).codigo, 'ORGANIZACAO_INCOMPATIVEL')
  assert.equal(validarSugestaoParaVinculo({ empresaId: 'e1', serie: serie(), conta: conta({ centro_custo_id: 'c2' }), autorizado: true }).codigo, 'ORGANIZACAO_INCOMPATIVEL')
})

test('conta manual já vinculada não pode ser vinculada novamente', () => {
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

test('contrato exige confirmação idempotência e auditoria futura', () => {
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.escritaDisponivel, false)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.exigeConfirmacaoExplicita, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.exigeIdempotencia, true)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.acoesAuditoriaAtivadas, false)
  assert.equal(AUDITORIA_ACOES_RECORRENCIAS.auditoriaAtomicaComEscrita, false)
})

test('central exibe ações somente como prévia desabilitada e não escreve', async () => {
  const pagina = await readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8')
  assert.match(pagina, /Vincular após revisão/)
  assert.match(pagina, /Gerar após revisão/)
  assert.match(pagina, /disabled/)
  assert.equal(/supabase\s*\.\s*from|supabase\.|functions\.invoke/.test(pagina), false)
})
