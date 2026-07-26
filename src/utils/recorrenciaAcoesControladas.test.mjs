import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registrarEventoAuditoriaSeguro } from '../services/auditoriaService.js'
import {
  gerarOcorrenciaRecorrencia,
  vincularContaManualRecorrencia
} from '../services/recorrenciaCoberturaService.js'
import {
  AUDITORIA_ACOES_RECORRENCIAS,
  detectarConflitoOcorrencia,
  montarPayloadAuditoriaGeracaoControlada,
  montarPayloadAuditoriaVinculoManual,
  montarPreviaPayloadGeracao,
  montarPreviaPayloadVinculo,
  validarOcorrenciaParaGeracao,
  validarSugestaoParaVinculo,
  validarVinculoManualConfirmado
} from './recorrenciaAcoesControladas.js'

const serie = (extra = {}) => ({ id: 'r1', empresa_id: 'e1', descricao: 'Aluguel', valor: 100, ativo: true, tipo_recorrencia: 'mensal', dia_vencimento: 15, data_inicio: '2026-01-01', filial_id: 'f1', centro_custo_id: 'c1', ...extra })
const conta = (extra = {}) => ({ id: 'c1', empresa_id: 'e1', descricao: 'Aluguel', valor: 100, data_vencimento: '2026-08-15', recorrencia_id: null, filial_id: 'f1', centro_custo_id: 'c1', excluido: false, deletado: false, ...extra })
const ocorrencia = (extra = {}) => ({ recorrenciaId: 'r1', serie: serie(), dataVencimento: '2026-08-15', competencia: '2026-08-01', cobertura: 'faltante', contasVinculadas: [], ...extra })

function criarSupabaseMock({
  series = [serie()],
  contas = [conta()],
  perfil = 'admin',
  isMaster = false,
  updateError = null,
  updateSemRetorno = false,
  insertError = null,
  onInsert = null
} = {}) {
  const chamadas = []
  const dados = {
    df_contas_recorrentes: [...series],
    df_contas: [...contas],
    df_usuarios_empresas: perfil ? [{ empresa_id: 'e1', user_id: 'u1', email: 'admin@teste.local', perfil }] : []
  }

  class Query {
    constructor(tabela) {
      this.tabela = tabela
      this.filtros = []
      this.payloadUpdate = null
      this.payloadInsert = null
    }

    select() { return this }
    limit() { return this }
    order() { return this }
    or() { return this }
    eq(campo, valor) { this.filtros.push({ tipo: 'eq', campo, valor }); return this }
    is(campo, valor) { this.filtros.push({ tipo: 'is', campo, valor }); return this }

    update(payload) {
      this.payloadUpdate = payload
      chamadas.push({ tipo: 'update', tabela: this.tabela, payload })
      return this
    }

    insert(payloads) {
      this.payloadInsert = Array.isArray(payloads) ? payloads[0] : payloads
      chamadas.push({ tipo: 'insert', tabela: this.tabela, payload: this.payloadInsert })
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
      if (this.payloadInsert) {
        onInsert?.(dados, this.payloadInsert)
        if (insertError) return { data: null, error: insertError }
        const criado = { id: `nova-${dados[this.tabela].length + 1}`, ...this.payloadInsert }
        dados[this.tabela].push(criado)
        return { data: { ...criado }, error: null }
      }
      if (this.payloadUpdate) {
        if (updateError) return { data: null, error: updateError }
        if (updateSemRetorno) return { data: null, error: null }
        const item = this.aplicarFiltros()[0] || null
        if (!item) return { data: null, error: null }
        Object.assign(item, this.payloadUpdate)
        return { data: { ...item }, error: null }
      }
      const item = this.aplicarFiltros()[0] || null
      return { data: item ? { ...item } : null, error: null }
    }

    async range() {
      return { data: this.aplicarFiltros(), error: null }
    }
  }

  return {
    chamadas,
    auth: {
      async getUser() {
        return { data: { user: { id: 'u1', email: 'admin@teste.local' } }, error: null }
      }
    },
    async rpc(nome) {
      assert.equal(nome, 'is_master')
      return { data: isMaster, error: null }
    },
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
  assert.match(pagina, /Gerar ocorrência/)
  assert.match(pagina, /podeVincularRecorrencia/)
  assert.match(pagina, /podeGerarRecorrencia/)
  assert.match(pagina, /Confirmar geração/)
  assert.equal(/supabase\s*\.\s*from|supabase\.|functions\.invoke/.test(pagina), false)
})

test('validacao confirmada bloqueia recorrencia inativa e ocorrencia coberta', () => {
  assert.equal(validarVinculoManualConfirmado({ empresaId: 'e1', serie: serie({ ativo: false }), conta: conta(), ocorrencia: ocorrencia(), autorizado: true }).codigo, 'RECORRENCIA_INATIVA')
  assert.equal(validarVinculoManualConfirmado({ empresaId: 'e1', serie: serie(), conta: conta(), ocorrencia: ocorrencia({ contasVinculadas: [conta({ id: 'c2', recorrencia_id: 'r1' })] }), autorizado: true }).codigo, 'OCORRENCIA_COBERTA')
})

test('vinculo manual valido executa somente update de recorrencia_id', async () => {
  const supabase = criarSupabaseMock()
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.error, null)
  assert.equal(resultado.bloqueado, false)
  assert.equal(resultado.data.recorrencia_id, 'r1')
  assert.deepEqual(supabase.chamadas, [{ tipo: 'update', tabela: 'df_contas', payload: { recorrencia_id: 'r1' } }])
})

test('usuário sem permissão é bloqueado no service antes de qualquer update', async () => {
  const supabase = criarSupabaseMock({ perfil: 'gerente' })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.codigo, 'SEM_PERMISSAO')
  assert.equal(supabase.chamadas.length, 0)
})

test('Master é autorizado pela fonte oficial do banco', async () => {
  const supabase = criarSupabaseMock({ perfil: null, isMaster: true })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.bloqueado, false)
  assert.equal(supabase.chamadas.length, 1)
})

test('vinculo manual e idempotente quando a conta ja cobre a mesma ocorrencia', async () => {
  const supabase = criarSupabaseMock({ contas: [conta({ recorrencia_id: 'r1' })] })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.idempotente, true)
  assert.equal(supabase.chamadas.length, 0)
})

test('vinculo manual bloqueia conta vinculada a outra recorrencia', async () => {
  const supabase = criarSupabaseMock({ contas: [conta({ recorrencia_id: 'r2' })] })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.bloqueado, true)
  assert.equal(resultado.codigo, 'CONTA_JA_VINCULADA')
})

test('vinculo manual bloqueia conflito do indice protegido', async () => {
  const supabase = criarSupabaseMock({ updateError: { code: '23505', message: 'duplicate key value violates unique constraint "uq_df_contas_recorrencia_vencimento_ativas"' } })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.bloqueado, true)
  assert.equal(resultado.codigo, 'CONFLITO_INDICE')
})

test('update sem linha retornada é tratado como conflito e não como sucesso', async () => {
  const supabase = criarSupabaseMock({ updateSemRetorno: true })
  const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
  assert.equal(resultado.bloqueado, true)
  assert.equal(resultado.codigo, 'CONFLITO_INDICE')
})

test('dois vínculos concorrentes convergem sem sobrescrever vínculo', async () => {
  const supabase = criarSupabaseMock()
  const argumentos = { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' }
  const resultados = await Promise.all([
    vincularContaManualRecorrencia(supabase, argumentos),
    vincularContaManualRecorrencia(supabase, argumentos)
  ])
  assert.equal(resultados.filter((item) => item.idempotente === false).length, 1)
  assert.equal(resultados.filter((item) => item.idempotente === true).length, 1)
  assert.equal(supabase.chamadas.length, 2)
  assert.ok(supabase.chamadas.every((chamada) => Object.keys(chamada.payload).join(',') === 'recorrencia_id'))
})

test('revalidação bloqueia série, vínculo, organização e visibilidade alterados antes do update', async () => {
  const cenarios = [
    { series: [serie({ ativo: false })], codigo: 'RECORRENCIA_INATIVA' },
    { contas: [conta({ recorrencia_id: 'r2' })], codigo: 'CONTA_JA_VINCULADA' },
    { contas: [conta({ filial_id: 'f2' })], codigo: 'ORGANIZACAO_INCOMPATIVEL' },
    { contas: [conta({ centro_custo_id: 'c2' })], codigo: 'ORGANIZACAO_INCOMPATIVEL' },
    { contas: [conta({ oculto: true })], codigo: 'CONTA_OCULTA' }
  ]
  for (const cenario of cenarios) {
    const supabase = criarSupabaseMock(cenario)
    const resultado = await vincularContaManualRecorrencia(supabase, { empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15' })
    assert.equal(resultado.codigo, cenario.codigo)
    assert.equal(supabase.chamadas.length, 0)
  }
})

test('auditoria do vinculo usa acao segura e sem dados financeiros completos', () => {
  const payload = montarPayloadAuditoriaVinculoManual({ empresaId: 'e1', contaId: 'c1', recorrenciaId: 'r1', dataVencimento: '2026-08-15', competencia: '2026-08-01', correlationId: 'corr' })
  assert.equal(payload.acao, 'financeiro.recorrencia.vinculo_manual')
  assert.deepEqual(payload.dados_depois, { recorrencia_id: 'r1' })
  assert.deepEqual(Object.keys(payload.metadados).sort(), ['competencia', 'conta_id', 'data_vencimento', 'recorrencia_id'].sort())
})

test('geração válida cria exatamente uma conta para a ocorrência faltante', async () => {
  const supabase = criarSupabaseMock({ contas: [] })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-15',
    competencia: '2026-08-01'
  })
  assert.equal(resultado.error, null)
  assert.equal(resultado.bloqueado, false)
  assert.equal(resultado.idempotente, false)
  assert.equal(resultado.auditoriaNecessaria, true)
  const inserts = supabase.chamadas.filter((chamada) => chamada.tipo === 'insert')
  assert.equal(inserts.length, 1)
  assert.equal(inserts[0].tabela, 'df_contas')
  assert.equal(inserts[0].payload.recorrencia_id, 'r1')
  assert.equal(inserts[0].payload.data_vencimento, '2026-08-15')
})

test('geração é idempotente quando a ocorrência já existe', async () => {
  const supabase = criarSupabaseMock({ contas: [conta({ recorrencia_id: 'r1' })] })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-15'
  })
  assert.equal(resultado.idempotente, true)
  assert.equal(resultado.auditoriaNecessaria, false)
  assert.equal(supabase.chamadas.some((chamada) => chamada.tipo === 'insert'), false)
})

test('duplicidade existente bloqueia geração', async () => {
  const supabase = criarSupabaseMock({
    contas: [
      conta({ id: 'c1', recorrencia_id: 'r1' }),
      conta({ id: 'c2', recorrencia_id: 'r1' })
    ]
  })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-15'
  })
  assert.equal(resultado.codigo, 'OCORRENCIA_DUPLICADA')
  assert.equal(supabase.chamadas.length, 0)
})

test('concorrência 23505 é reconciliada com a conta criada pela outra sessão', async () => {
  const contaConcorrente = conta({ id: 'concorrente', recorrencia_id: 'r1' })
  const supabase = criarSupabaseMock({
    contas: [],
    insertError: {
      code: '23505',
      message: 'duplicate key value violates unique constraint "uq_df_contas_recorrencia_vencimento_ativas"'
    },
    onInsert(dados) {
      dados.df_contas.push(contaConcorrente)
    }
  })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-15'
  })
  assert.equal(resultado.error, null)
  assert.equal(resultado.idempotente, true)
  assert.equal(resultado.reconciliado, true)
  assert.equal(resultado.data.id, 'concorrente')
  assert.equal(supabase.chamadas.filter((chamada) => chamada.tipo === 'insert').length, 1)
})

test('23505 sem ocorrência reconciliável retorna mensagem amigável de concorrência', async () => {
  const supabase = criarSupabaseMock({
    contas: [],
    insertError: {
      code: '23505',
      message: 'duplicate key value violates unique constraint "uq_df_contas_recorrencia_vencimento_ativas"'
    }
  })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-15'
  })
  assert.equal(resultado.codigo, 'CONFLITO_INDICE')
  assert.match(resultado.mensagem, /Outra conta cobriu esta ocorrencia/)
  assert.equal(supabase.chamadas.filter((chamada) => chamada.tipo === 'insert').length, 1)
})

test('série inativa e usuário sem permissão são bloqueados antes do insert', async () => {
  for (const cenario of [
    { series: [serie({ ativo: false })], codigo: 'RECORRENCIA_INATIVA' },
    { perfil: 'gerente', codigo: 'SEM_PERMISSAO' }
  ]) {
    const supabase = criarSupabaseMock({ contas: [], ...cenario })
    const resultado = await gerarOcorrenciaRecorrencia(supabase, {
      empresaId: 'e1',
      recorrenciaId: 'r1',
      dataVencimento: '2026-08-15'
    })
    assert.equal(resultado.codigo, cenario.codigo)
    assert.equal(supabase.chamadas.some((chamada) => chamada.tipo === 'insert'), false)
  }
})

test('vencimento incompatível com a regra atual não pode ser gerado', async () => {
  const supabase = criarSupabaseMock({ contas: [] })
  const resultado = await gerarOcorrenciaRecorrencia(supabase, {
    empresaId: 'e1',
    recorrenciaId: 'r1',
    dataVencimento: '2026-08-16'
  })
  assert.equal(resultado.codigo, 'DATA_INCOMPATIVEL')
  assert.equal(supabase.chamadas.some((chamada) => chamada.tipo === 'insert'), false)
})

test('falha de auditoria posterior não desfaz a geração concluída', async () => {
  const payload = montarPayloadAuditoriaGeracaoControlada({
    empresaId: 'e1',
    contaId: 'nova-1'
  })
  const supabase = {
    functions: {
      async invoke() {
        return { data: null, error: { code: 'AUDITORIA_INDISPONIVEL' } }
      }
    }
  }
  const resultado = await registrarEventoAuditoriaSeguro(supabase, payload, 'geração controlada de recorrência')
  assert.equal(payload.acao, 'financeiro.conta.criada')
  assert.deepEqual(payload.metadados, { conta_id: 'nova-1' })
  assert.ok(resultado.error)
})

test('App bloqueia duplo clique e atualiza cobertura, contas, Dashboard e Relatórios', async () => {
  const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8')
  assert.match(app, /geracaoControladaRecorrenciaEmAndamentoRef/)
  assert.match(app, /origem: 'geracao_controlada_recorrencia'/)
  assert.match(app, /buscarContasAposMutacao\(\)/)
  assert.match(app, /Ocorrência criada, mas a auditoria não foi registrada/)
  assert.match(app, /podeGerarRecorrencia[\s\S]*temPermissao\(\['admin'\]\)/)
  const pagina = await readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8')
  assert.match(pagina, /await fonte\.consultar\(\)/)
  assert.match(pagina, /ocorrencia\?\.cobertura !== 'faltante'/)
})

test('App invalida indicadores bloqueia duplo clique e nao gera recorrencias', async () => {
  const app = await readFile(new URL('../App.jsx', import.meta.url), 'utf8')
  assert.match(app, /vinculoManualRecorrenciaEmAndamentoRef/)
  assert.match(app, /buscarContasAposMutacao\(\)/)
  assert.match(app, /dna:fontes-financeiras-invalidar/)
  assert.match(app, /podeVincularRecorrencia[\s\S]*temPermissao\(\['admin'\]\)/)
  assert.match(app, /registrarEventoAuditoriaSeguro/)
  assert.match(app, /Conta vinculada, mas a auditoria nao foi registrada/)
  assert.match(app, /Vinculo concluido, mas a atualizacao local das contas falhou/)
  assert.doesNotMatch(app, /montarPreviaPayloadGeracao\(|inserirContasRecorrentes/)
})

test('fontes financeiras escutam invalidação após vínculo sem escrita adicional', async () => {
  const hook = await readFile(new URL('../hooks/useRelatorioFinanceiro.js', import.meta.url), 'utf8')
  assert.match(hook, /addEventListener\('dna:fontes-financeiras-invalidar'/)
  assert.match(hook, /evento\.detail\.empresaId !== empresaId/)
  assert.doesNotMatch(hook, /\.update\(|\.insert\(|\.delete\(/)
})
