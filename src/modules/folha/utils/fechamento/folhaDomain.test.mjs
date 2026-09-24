import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  ajustarDatasFaltasFolha,
  calcularPremiacaoFolha,
  CATEGORIAS_OPERACIONAIS_FOLHA,
  categoriaFolhaEhRepetivelPorLancamento,
  categoriaFolhaUsaItens,
  dataPertenceCompetenciaFolha,
  formatarMoedaEntradaFolha,
  funcionarioSelecionavelParaNovaFolha,
  horasFolhaParaPersistencia,
  horasFolhaParaTexto,
  localizarLancamentoParaSalvarFolha,
  mascararHorasFolha,
  mensagemDataCompetenciaFolha,
  obterLimitesCompetenciaFolha,
  ordenarItensFolha,
  parseMoedaEntradaFolha,
  planejarInclusaoCompraFolha,
  planejarInclusaoPremiacaoFolha,
  planejarSincronizacaoFaltasFolha,
  quantidadeFaltasFolha,
  quantidadeHorasFolha,
  resumirLancamentosFuncionarioFolha,
  resumirOutrosDescontosFolha,
  resolverValorLancamentoFolha,
  resolverIdentidadeHistoricaFolha,
  totalItensFinanceirosFolha,
  validarDatasFaltasFolha,
  validarHorasFolha,
  validarOutroDescontoFolha
} from './folhaDomain.js'
import {
  montarControleComprasFolha,
  montarFechamentoFolhaContabilidade
} from './folhaExport.js'
import { createXlsxBlob } from '../../../../services/export/reportExportService.js'

const funcionarios = [
  { id: 'func-1', nome: 'SMOKE-FOLHA', filial_id: 'filial-1' },
  { id: 'func-2', nome: 'SMOKE-FOLHA', filial_id: 'filial-2' }
]
const filiais = [
  { id: 'filial-1', nome: 'Matriz', razao_social: 'Dona Flor Matriz Ltda.' },
  { id: 'filial-2', nome: 'Matriz' }
]
const lancamentos = [
  { id: 'compras-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'compras_vales', valor: 100, arquivado: false },
  { id: 'plano-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'plano_saude', valor: 45.67, arquivado: false },
  { id: 'premio-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'premiacao', quantidade: 10000, percentual: 2, valor: 200, arquivado: false },
  { id: 'he50-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_50', valor: 0, arquivado: false },
  { id: 'he60-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_60', valor: 0, arquivado: false },
  { id: 'he100-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_100', valor: 0, arquivado: false },
  { id: 'falta-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'falta_injustificada', valor: 0, arquivado: false },
  { id: 'obs-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'informativo', categoria: 'observacao_administrativa', valor: null, observacao_administrativa: 'SMOKE-FOLHA CONTABILIDADE', arquivado: false },
  { id: 'compras-2', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-2', filial_id: 'filial-2', natureza: 'desconto', categoria: 'compras_vales', valor: 30, arquivado: false },
  { id: 'ignorado', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'compras_vales', valor: 999, arquivado: true }
]
const itensLancamentos = [
  { id: 'c1', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 40, criado_em: '2026-07-01T10:00:00Z', arquivado: false },
  { id: 'c2', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 60, criado_em: '2026-07-01T11:00:00Z', arquivado: false },
  { id: 'c3', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 500, arquivado: true },
  { id: 'he50-a', lancamento_id: 'he50-1', funcionario_id: 'func-1', categoria: 'hora_extra_50', data_referencia: '2026-07-05', quantidade: 2 + 20 / 60, valor: 0, criado_em: '2026-07-05T10:00:00Z', arquivado: false },
  { id: 'he50-b', lancamento_id: 'he50-1', funcionario_id: 'func-1', categoria: 'hora_extra_50', data_referencia: '2026-07-18', quantidade: 2, valor: 0, criado_em: '2026-07-18T10:00:00Z', arquivado: false },
  { id: 'he60', lancamento_id: 'he60-1', funcionario_id: 'func-1', categoria: 'hora_extra_60', quantidade: 5.5, valor: 0, arquivado: false },
  { id: 'he100', lancamento_id: 'he100-1', funcionario_id: 'func-1', categoria: 'hora_extra_100', quantidade: 4 + 28 / 60, valor: 0, arquivado: false },
  { id: 'f1', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-02', valor: 0, arquivado: false },
  { id: 'f2', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-03', valor: 0, arquivado: false },
  { id: 'f3', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-03', valor: 0, arquivado: false },
  { id: 'f4', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-04', valor: 0, arquivado: true }
]
const params = { empresaId: 'emp-1', competenciaId: 'comp-1', competencia: '2026-07', funcionarios, filiais, lancamentos, itensLancamentos }

test('transição do lançamento legado preserva primeira compra antes da nova', () => {
  const pai = { id: 'pai', valor: 40, descricao: 'Compra original' }
  const plano = planejarInclusaoCompraFolha({ lancamento: pai, itens: [], novaCompra: { valor: 60 } })
  assert.deepEqual(plano.map((item) => item.valor), [40, 60])
  assert.equal(totalItensFinanceirosFolha(plano), 100)
  assert.equal(resolverValorLancamentoFolha({ ...pai, valor: 100 }, plano.map((item, index) => ({ ...item, id: `${index}`, lancamento_id: 'pai' }))), 100)
})

test('snapshot histórico prevalece sobre cadastro atual e fallback cobre legado sem snapshot', () => {
  const filiaisPorId = new Map(filiais.map((item) => [item.id, item]))
  const atual = { id: 'func-1', pessoa_id: 'pessoa-nova', nome: 'Nome atual', filial_id: 'filial-2', cargo: 'Cargo novo', data_admissao: '2026-08-01' }
  const historico = resolverIdentidadeHistoricaFolha({
    funcionario_id: 'func-1',
    pessoa_id_snapshot: 'pessoa-antiga',
    funcionario_nome_snapshot: 'Nome histórico',
    filial_id_snapshot: 'filial-1',
    filial_nome_snapshot: 'Filial histórica',
    cargo_snapshot: 'Cargo antigo',
    data_admissao_snapshot: '2020-01-02',
    snapshot_origem: 'capturado_criacao_v1'
  }, atual, filiaisPorId)

  assert.deepEqual(historico, {
    funcionarioId: 'func-1',
    pessoaId: 'pessoa-antiga',
    nome: 'Nome histórico',
    filialId: 'filial-1',
    filialNome: 'Filial histórica',
    cargo: 'Cargo antigo',
    dataAdmissao: '2020-01-02',
    origemSnapshot: 'capturado_criacao_v1'
  })

  const legado = resolverIdentidadeHistoricaFolha({ funcionario_id: 'func-1' }, atual, filiaisPorId)
  assert.equal(legado.nome, 'Nome atual')
  assert.equal(legado.filialNome, 'Matriz')
  assert.equal(legado.origemSnapshot, 'fallback_legado')
})

test('desligado permanece histórico mas não é selecionável para nova Folha', () => {
  assert.equal(funcionarioSelecionavelParaNovaFolha({ status: 'ativo', arquivado: false }), true)
  assert.equal(funcionarioSelecionavelParaNovaFolha({ status: 'afastado', arquivado: false }), true)
  assert.equal(funcionarioSelecionavelParaNovaFolha({ status: 'desligado', arquivado: false }), false)
  assert.equal(funcionarioSelecionavelParaNovaFolha({ status: 'ativo', arquivado: true }), false)
})

test('exportação usa nome e filial snapshotados sem contaminar valores', () => {
  const modelo = montarFechamentoFolhaContabilidade({
    ...params,
    funcionarios: [{ ...funcionarios[0], nome: 'Nome atual', filial_id: 'filial-2' }],
    lancamentos: [{
      ...lancamentos[1],
      funcionario_nome_snapshot: 'Nome histórico',
      filial_id_snapshot: 'filial-1',
      filial_nome_snapshot: 'Filial histórica',
      snapshot_origem: 'capturado_criacao_v1'
    }],
    itensLancamentos: []
  })
  assert.equal(modelo.blocos[0].filial, 'Filial histórica')
  assert.equal(modelo.blocos[0].linhas[0].colaborador, 'Nome histórico')
  assert.equal(modelo.blocos[0].linhas[0].planoSaude, 45.67)
})

test('compras preservam created_at ascendente, desempate por id e legado como Compra 1', () => {
  const itens = ordenarItensFolha([
    { id: 'b', valor: 50, created_at: '2026-07-10T11:00:00Z' },
    { id: 'c', valor: 25, created_at: '2026-07-10T11:00:00Z' },
    { id: 'a', valor: 100, created_at: '2026-07-10T10:00:00Z' },
    { id: 'legado', valor: 30, origem_item: 'transicao_lancamento_legado', created_at: '2026-07-11T10:00:00Z' }
  ])
  assert.deepEqual(itens.map((item) => item.id), ['legado', 'a', 'b', 'c'])
  assert.deepEqual(ordenarItensFolha(itens.slice(1, 3)).map((item) => item.valor), [100, 50])
  assert.equal(totalItensFinanceirosFolha([{ valor: 100 }, { valor: 50 }]), 150)
})

test('máscara monetária pt-BR aceita digitação, colagem e valor persistido', () => {
  assert.equal(formatarMoedaEntradaFolha(40), 'R$ 40,00')
  assert.equal(formatarMoedaEntradaFolha('1.250,50'), 'R$ 1.250,50')
  assert.equal(formatarMoedaEntradaFolha('10000,00'), 'R$ 10.000,00')
  assert.equal(parseMoedaEntradaFolha('1.250,50'), 1250.5)
  assert.equal(parseMoedaEntradaFolha('1250,50'), 1250.5)
  assert.equal(parseMoedaEntradaFolha('R$ 40,00'), 40)
})

test('entrada monetária da Folha aplica a máscara durante a digitação', async () => {
  const pagina = await readFile(new URL('../../../../pages/FechamentoFolhaPage.jsx', import.meta.url), 'utf8')
  const mascararDigitacao = (valor) => {
    const digitos = String(valor ?? '').replace(/\D/g, '')
    return digitos ? formatarMoedaEntradaFolha(Number(digitos) / 100) : ''
  }

  assert.equal(mascararDigitacao('4000'), 'R$ 40,00')
  assert.equal(mascararDigitacao('1.250,50'), 'R$ 1.250,50')
  assert.equal(mascararDigitacao('1250,50'), 'R$ 1.250,50')
  assert.equal(mascararDigitacao('1000000'), 'R$ 10.000,00')
  assert.equal(mascararDigitacao('R$ 40,0'), 'R$ 4,00')
  assert.equal(mascararDigitacao(''), '')
  assert.equal(parseMoedaEntradaFolha(mascararDigitacao('4000')), 40)
  assert.match(pagina, /onChange=\{\(event\) => onChange\(mascararMoedaFolhaDuranteDigitacao\(event\.target\.value\)\)\}/)
  assert.match(pagina, /inputMode="decimal"/)
})

test('máscara HH:MM usa teclado numérico sem limitar horas a 23', () => {
  assert.equal(mascararHorasFolha('0'), '0')
  assert.equal(mascararHorasFolha('04'), '04:')
  assert.equal(mascararHorasFolha('042'), '04:2')
  assert.equal(mascararHorasFolha('0420'), '04:20')
  assert.equal(mascararHorasFolha('0530'), '05:30')
  assert.equal(mascararHorasFolha('04', { apagando: true }), '04')
  assert.equal(mascararHorasFolha(''), '')
  assert.equal(validarHorasFolha('12:60'), false)
  assert.equal(validarHorasFolha('25:30'), true)
})

test('competência define limites e bloqueia datas de outro mês ou ano', () => {
  assert.deepEqual(obterLimitesCompetenciaFolha('2026-07'), { primeiroDia: '2026-07-01', ultimoDia: '2026-07-31' })
  assert.equal(dataPertenceCompetenciaFolha('2026-07-01', '2026-07'), true)
  assert.equal(dataPertenceCompetenciaFolha('2026-07-31', '2026-07'), true)
  assert.equal(dataPertenceCompetenciaFolha('2026-06-30', '2026-07'), false)
  assert.equal(dataPertenceCompetenciaFolha('2026-08-01', '2026-07'), false)
  assert.equal(dataPertenceCompetenciaFolha('2025-07-10', '2026-07'), false)
  assert.deepEqual(obterLimitesCompetenciaFolha('2028-02'), { primeiroDia: '2028-02-01', ultimoDia: '2028-02-29' })
  assert.equal(dataPertenceCompetenciaFolha('2028-02-29', '2028-02'), true)
  assert.equal(dataPertenceCompetenciaFolha('2028-03-01', '2028-02'), false)
  assert.equal(mensagemDataCompetenciaFolha('2026-07'), 'A data deve pertencer à competência 07/2026.')
})

test('faltas derivam campos e quantidade exclusivamente das ocorrências ativas', () => {
  assert.deepEqual(ajustarDatasFaltasFolha([], 1), [''])
  assert.deepEqual(ajustarDatasFaltasFolha(['2026-07-10'], 2), ['2026-07-10', ''])
  assert.equal(validarDatasFaltasFolha(['', '2026-07-21'], '2026-07').codigo, 'DATAS_OBRIGATORIAS')
  assert.equal(validarDatasFaltasFolha(['2026-07-10', '2026-07-10'], '2026-07').codigo, 'DATAS_DUPLICADAS')
  assert.equal(validarDatasFaltasFolha(['2026-07-10', '2026-08-01'], '2026-07').codigo, 'DATA_FORA_COMPETENCIA')
  assert.equal(validarDatasFaltasFolha(['2026-07-10', '2026-07-21'], '2026-07').valido, true)
  const pai = { id: 'faltas', quantidade: 99 }
  const itens = [{ lancamento_id: 'faltas', quantidade: 1 }, { lancamento_id: 'faltas', quantidade: 1, arquivado: true }]
  assert.equal(quantidadeFaltasFolha(pai, itens), 1)
  assert.equal(quantidadeFaltasFolha(pai, itens.map((item) => ({ ...item, arquivado: false }))), 2)
  const plano = planejarSincronizacaoFaltasFolha([
    { id: 'f1', data_referencia: '2026-07-10', criado_em: '2026-07-01T10:00:00Z' },
    { id: 'f2', data_referencia: '2026-07-21', criado_em: '2026-07-01T11:00:00Z' }
  ], ['2026-07-10'])
  assert.deepEqual(plano.criar, [])
  assert.deepEqual(plano.manter.map((item) => item.id), ['f1'])
  assert.deepEqual(plano.arquivar.map((item) => item.id), ['f2'])
})

test('horas com data somam ocorrências ativas e preservam retorno HH:MM', () => {
  const pai = { id: 'he' }
  const itens = [
    { lancamento_id: 'he', data_referencia: '2026-07-05', quantidade: horasFolhaParaPersistencia('02:20') },
    { lancamento_id: 'he', data_referencia: '2026-07-18', quantidade: horasFolhaParaPersistencia('02:00') }
  ]
  assert.equal(horasFolhaParaTexto(quantidadeHorasFolha(pai, itens)), '04:20')
})

test('item arquivado sai do total e reativado volta', () => {
  const itens = [{ valor: 40, arquivado: false }, { valor: 60, arquivado: true }]
  assert.equal(totalItensFinanceirosFolha(itens), 40)
  assert.equal(totalItensFinanceirosFolha(itens.map((item) => ({ ...item, arquivado: false }))), 100)
})

test('premiação usa somente vendas vezes percentual', () => {
  assert.equal(calcularPremiacaoFolha(10000, 2), 200)
})

test('premiação detalhada preserva legado e soma novas ocorrências sem substituir', () => {
  const pai = { id: 'premio', quantidade: 10000, percentual: 2, valor: 200 }
  const plano = planejarInclusaoPremiacaoFolha({
    lancamento: pai,
    itens: [],
    novaPremiacao: { valor_base: 5000, percentual: 3, observacao_administrativa: 'Meta adicional' }
  })
  assert.equal(plano.erro, null)
  assert.deepEqual(plano.criacoes.map((item) => item.valor), [200, 150])
  const persistidos = plano.criacoes.map((item, indice) => ({ ...item, id: `premio-${indice}`, lancamento_id: pai.id, arquivado: false }))
  assert.equal(resolverValorLancamentoFolha(pai, persistidos), 350)
  assert.equal(persistidos[0].origem_item, 'transicao_lancamento_legado')

  const proxima = planejarInclusaoPremiacaoFolha({
    lancamento: { ...pai, valor: 350 },
    itens: persistidos,
    novaPremiacao: { valor_base: 1000, percentual: 1 }
  })
  assert.deepEqual(proxima.criacoes.map((item) => item.valor), [10])
})

test('premiação legada incompleta mantém fallback e bloqueia transição inventada', () => {
  const pai = { id: 'premio-incompleto', quantidade: null, percentual: null, valor: 200 }
  const plano = planejarInclusaoPremiacaoFolha({
    lancamento: pai,
    itens: [],
    novaPremiacao: { valor_base: 5000, percentual: 3 }
  })
  assert.match(plano.erro, /não possui base e percentual confiáveis/)
  assert.deepEqual(plano.criacoes, [])
  assert.equal(resolverValorLancamentoFolha(pai, []), 200)
})

test('arquivamento e reativação de uma premiação recalculam somente itens ativos', () => {
  const pai = { id: 'premio', valor: 350 }
  const itens = [
    { id: 'p1', lancamento_id: pai.id, valor: 200, arquivado: false },
    { id: 'p2', lancamento_id: pai.id, valor: 150, arquivado: true }
  ]
  assert.equal(resolverValorLancamentoFolha(pai, itens), 200)
  assert.equal(resolverValorLancamentoFolha(pai, itens.map((item) => ({ ...item, arquivado: false }))), 350)
})

test('contrato diferencia itens detalhados e categorias repetíveis por lançamento', () => {
  assert.equal(categoriaFolhaUsaItens('premiacao'), true)
  assert.equal(categoriaFolhaUsaItens('compras_vales'), true)
  assert.equal(categoriaFolhaEhRepetivelPorLancamento('plano_saude'), true)
  assert.equal(categoriaFolhaEhRepetivelPorLancamento('outro_desconto'), true)
  assert.equal(categoriaFolhaEhRepetivelPorLancamento('outro_credito'), true)
  assert.equal(categoriaFolhaEhRepetivelPorLancamento('observacao_administrativa'), true)
  assert.equal(categoriaFolhaEhRepetivelPorLancamento('pensao_alimenticia'), false)
})

test('nova categoria repetível cria ocorrência e edição altera somente o ID escolhido', () => {
  const existentes = [
    { id: 'desconto-40', funcionario_id: 'func-1', categoria: 'outro_desconto', valor: 40, arquivado: false },
    { id: 'desconto-25', funcionario_id: 'func-1', categoria: 'outro_desconto', valor: 25, arquivado: false }
  ]
  assert.equal(localizarLancamentoParaSalvarFolha({
    lancamentos: existentes,
    funcionarioId: 'func-1',
    categoria: 'outro_desconto'
  }), null)
  assert.equal(localizarLancamentoParaSalvarFolha({
    lancamentos: existentes,
    funcionarioId: 'func-1',
    categoria: 'outro_desconto',
    lancamentoEditandoId: 'desconto-25'
  })?.id, 'desconto-25')
  assert.equal(existentes[0].valor, 40)
})

test('outros descontos estruturados validam descricao e valor positivo', () => {
  assert.equal(validarOutroDescontoFolha({ descricao: '', valor: 'R$ 400,00' }).valido, false)
  assert.equal(validarOutroDescontoFolha({ descricao: 'Poupanca', valor: 'R$ 0,00' }).valido, false)
  assert.equal(validarOutroDescontoFolha({ descricao: 'Poupanca', valor: -1 }).valido, false)
  assert.deepEqual(validarOutroDescontoFolha({ descricao: '  Poupanca  mensal ', valor: 'R$ 400,00' }).dados, { descricao: 'Poupanca mensal', valor: 400 })
})

test('resumo de outros descontos cobre vazio, multiplos e remocao logica', () => {
  assert.equal(resumirOutrosDescontosFolha([], 'func-1').total, 0)
  const descontos = [
    { id: '1', funcionario_id: 'func-1', categoria: 'outro_desconto', descricao: 'Poupanca', valor: 400, arquivado: false },
    { id: '2', funcionario_id: 'func-1', categoria: 'outro_desconto', descricao: 'Uniforme', valor: 80, arquivado: false },
    { id: '3', funcionario_id: 'func-1', categoria: 'outro_desconto', descricao: 'Adiantamento', valor: 150, arquivado: false },
    { id: '4', funcionario_id: 'func-1', categoria: 'outro_desconto', descricao: 'Removido', valor: 999, arquivado: true },
    { id: '5', funcionario_id: 'func-2', categoria: 'outro_desconto', descricao: 'Outro vinculo', valor: 700, arquivado: false },
    { id: '6', funcionario_id: 'func-1', categoria: 'observacao_administrativa', observacao_administrativa: 'Outro desconto: R$ 900,00', valor: null, arquivado: false }
  ]
  const resumo = resumirOutrosDescontosFolha(descontos, 'func-1')
  assert.equal(resumo.total, 630)
  assert.deepEqual(resumo.itens.map((item) => item.descricao), ['Poupanca', 'Uniforme', 'Adiantamento'])
  const comArquivados = resumirOutrosDescontosFolha(descontos, 'func-1', true)
  assert.equal(comArquivados.itens.length, 4)
  assert.equal(comArquivados.total, 630)
})

test('outros descontos entram exatamente uma vez no total e reduzem o saldo informado', () => {
  const resumo = resumirLancamentosFuncionarioFolha([
    { id: 'salario', funcionario_id: 'func-1', natureza: 'credito', categoria: 'outro_credito', valor: 2000, arquivado: false },
    { id: 'plano', funcionario_id: 'func-1', natureza: 'desconto', categoria: 'plano_saude', valor: 100, arquivado: false },
    { id: 'compras', funcionario_id: 'func-1', natureza: 'desconto', categoria: 'compras_vales', valor: 200, arquivado: false },
    { id: 'poupanca', funcionario_id: 'func-1', natureza: 'desconto', categoria: 'outro_desconto', descricao: 'Poupanca', valor: 400, arquivado: false }
  ], [], 'func-1')
  assert.equal(resumo.descontos, 700)
  assert.equal(resumo.outrosDescontos, 400)
  assert.equal(resumo.saldoInformativo, 1300)
})

test('horas fazem ida e volta sem perda nos casos do smoke', () => {
  for (const hora of ['04:20', '05:30', '04:28']) {
    assert.equal(horasFolhaParaTexto(horasFolhaParaPersistencia(hora)), hora)
  }
})

test('controle de compras usa uma aba, blocos por ID e compras dinâmicas', () => {
  const modelo = montarControleComprasFolha(params)
  assert.equal(modelo.aba, 'Controle de Compras')
  assert.equal(modelo.blocos.length, 2)
  assert.equal(modelo.blocos[0].filial, 'Dona Flor Matriz Ltda.')
  assert.equal(modelo.maximoCompras, 2)
  assert.deepEqual(modelo.blocos[0].linhas[0].compras, [40, 60])
  assert.equal(modelo.blocos[0].linhas[0].total, 100)
  assert.equal(modelo.totalGeral, 130)
  assert.equal(modelo.sheet.landscape, true)
  assert.deepEqual(modelo.sheet.currencyColumns, [1, 2, 3])
})

test('controle de compras mantém R$ 100 como Compra 1 e R$ 50 como Compra 2', () => {
  const modelo = montarControleComprasFolha({
    ...params,
    lancamentos: [lancamentos[0]],
    funcionarios: [funcionarios[0]],
    filiais: [filiais[0]],
    itensLancamentos: [
      { id: 'compra-2', lancamento_id: 'compras-1', valor: 50, criado_em: '2026-07-10T11:00:00Z', arquivado: false },
      { id: 'compra-1', lancamento_id: 'compras-1', valor: 100, criado_em: '2026-07-10T10:00:00Z', arquivado: false }
    ]
  })
  assert.deepEqual(modelo.blocos[0].linhas[0].compras, [100, 50])
  assert.equal(modelo.blocos[0].linhas[0].total, 150)
})

test('fechamento contábil consolida valores, horas, faltas e observações sem duplicar', () => {
  const modelo = montarFechamentoFolhaContabilidade(params)
  assert.equal(modelo.aba, 'Fechamento de Folha')
  assert.equal(modelo.blocos.length, 2)
  assert.equal(modelo.blocos[0].filial, 'Dona Flor Matriz Ltda.')
  const linha = modelo.blocos[0].linhas[0]
  assert.equal(linha.compras, 100)
  assert.equal(linha.planoSaude, 45.67)
  assert.equal(linha.premiacao, 200)
  assert.equal(linha.he50, '04:20')
  assert.equal(linha.he60, '05:30')
  assert.equal(linha.he100, '04:28')
  assert.equal(linha.faltas, 3)
  assert.deepEqual(linha.datasFaltas, ['2026-07-02', '2026-07-03'])
  assert.equal(linha.observacoes.includes('SMOKE-FOLHA CONTABILIDADE'), true)
  assert.equal(linha.observacoes.includes('HE 50%: 05/07/2026 — 02:20; 18/07/2026 — 02:00'), true)
  assert.equal(linha.outrosDescontos, 0)
  assert.deepEqual(modelo.sheet.currencyColumns, [1, 2, 3, 4])
  const controle = montarControleComprasFolha(params)
  assert.equal(linha.compras, controle.blocos[0].linhas[0].total)
})

test('fechamento contábil bloqueia falta ativa fora da competência sem considerar item arquivado', () => {
  assert.throws(
    () => montarFechamentoFolhaContabilidade({
      ...params,
      itensLancamentos: [
        ...itensLancamentos.filter((item) => item.categoria !== 'falta_injustificada'),
        { id: 'falta-fora', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-08-01', valor: 0, arquivado: false }
      ]
    }),
    /a falta de 01\/08\/2026 não pertence à competência 2026-07/
  )

  const modelo = montarFechamentoFolhaContabilidade({
    ...params,
    itensLancamentos: [
      ...itensLancamentos,
      { id: 'falta-fora-arquivada', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-08-01', valor: 0, arquivado: true }
    ]
  })
  assert.deepEqual(modelo.blocos[0].linhas[0].datasFaltas, ['2026-07-02', '2026-07-03'])
})

test('fechamento soma premiações e planos repetidos e identifica todos os outros descontos', () => {
  const lancamentosRepetidos = [
    { ...lancamentos[0], valor: 100 },
    { ...lancamentos[2], valor: 350 },
    { ...lancamentos[1], id: 'plano-1', valor: 45.67 },
    { ...lancamentos[1], id: 'plano-2', valor: 54.33 },
    { id: 'desconto-1', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Adiantamento', valor: 40, arquivado: false },
    { id: 'desconto-2', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Ajuste uniforme', valor: 25, arquivado: false },
    { id: 'desconto-arquivado', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Não exportar', valor: 999, arquivado: true }
  ]
  const itensRepetidos = [
    { id: 'compra-1', lancamento_id: 'compras-1', categoria: 'compras_vales', valor: 40, arquivado: false },
    { id: 'compra-2', lancamento_id: 'compras-1', categoria: 'compras_vales', valor: 60, arquivado: false },
    { id: 'premio-1', lancamento_id: 'premio-1', categoria: 'premiacao', valor_base: 10000, percentual: 2, valor: 200, arquivado: false },
    { id: 'premio-2', lancamento_id: 'premio-1', categoria: 'premiacao', valor_base: 5000, percentual: 3, valor: 150, arquivado: false },
    { id: 'premio-arquivado', lancamento_id: 'premio-1', categoria: 'premiacao', valor_base: 1000, percentual: 10, valor: 100, arquivado: true }
  ]
  const modelo = montarFechamentoFolhaContabilidade({
    ...params,
    funcionarios: [funcionarios[0]],
    filiais: [filiais[0]],
    lancamentos: lancamentosRepetidos,
    itensLancamentos: itensRepetidos
  })
  const linha = modelo.blocos[0].linhas[0]
  assert.equal(linha.compras, 100)
  assert.equal(linha.premiacao, 350)
  assert.equal(linha.planoSaude, 100)
  assert.equal(linha.outrosDescontos, 65)
  assert.equal(modelo.blocos[0].headers.includes('Outros descontos'), true)
  assert.equal(linha.observacoes.includes('Outro desconto: Adiantamento — R$ 40,00'), true)
  assert.equal(linha.observacoes.includes('Outro desconto: Ajuste uniforme — R$ 25,00'), true)
  assert.equal(linha.observacoes.some((item) => item.includes('Não exportar')), false)
})

test('outros descontos estruturados somam 400 + 80 + 150 uma única vez e preservam detalhes', () => {
  const modelo = montarFechamentoFolhaContabilidade({
    ...params,
    funcionarios: [funcionarios[0]],
    filiais: [filiais[0]],
    lancamentos: [
      { id: 'poupanca', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Poupança', valor: 400, arquivado: false },
      { id: 'uniforme', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Uniforme', valor: 80, arquivado: false },
      { id: 'adiantamento', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'outro_desconto', natureza: 'desconto', descricao: 'Adiantamento', valor: 150, arquivado: false },
      { id: 'observacao-legada', funcionario_id: 'func-1', filial_id: 'filial-1', categoria: 'observacao_administrativa', natureza: 'informativo', valor: null, observacao_administrativa: 'Outro desconto: texto legado R$ 999,00', arquivado: false }
    ],
    itensLancamentos: []
  })
  const linha = modelo.blocos[0].linhas[0]
  assert.equal(linha.outrosDescontos, 630)
  assert.equal(linha.observacoes.includes('Outro desconto: Poupança — R$ 400,00'), true)
  assert.equal(linha.observacoes.includes('Outro desconto: Uniforme — R$ 80,00'), true)
  assert.equal(linha.observacoes.includes('Outro desconto: Adiantamento — R$ 150,00'), true)
  assert.equal(linha.observacoes.includes('Outro desconto: texto legado R$ 999,00'), true)
})

test('workbooks Excel são arquivos únicos, monetários e ajustados em paisagem', async () => {
  for (const modelo of [montarControleComprasFolha(params), montarFechamentoFolhaContabilidade(params)]) {
    const blob = createXlsxBlob([modelo.sheet])
    const bytes = new Uint8Array(await blob.arrayBuffer())
    assert.deepEqual(Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04])
    const conteudo = new TextDecoder().decode(bytes)
    assert.match(conteudo, /orientation="landscape"/)
    assert.match(conteudo, /fitToWidth="1"/)
    assert.match(conteudo, /numFmtId="164"/)
    assert.match(conteudo, /<mergeCells/)
    assert.match(conteudo, /showGridLines="0"/)
    assert.match(conteudo, /<pageMargins/)
    assert.match(conteudo, /style="thin"/)
    assert.equal(modelo.arquivo.endsWith('.xlsx'), true)
  }
  const fechamento = montarFechamentoFolhaContabilidade(params)
  assert.equal(fechamento.sheet.rows.flat().includes('02/07/2026, 03/07/2026'), true)
  assert.equal(fechamento.sheet.name, 'Fechamento de Folha')
  assert.equal(montarControleComprasFolha(params).sheet.name, 'Controle de Compras')
})

test('seletor expõe apenas categorias operacionais e nunca categorias técnicas', () => {
  assert.equal(CATEGORIAS_OPERACIONAIS_FOLHA.includes('falta_injustificada'), true)
  assert.equal(CATEGORIAS_OPERACIONAIS_FOLHA.includes('data_falta'), false)
  assert.equal(CATEGORIAS_OPERACIONAIS_FOLHA.includes('status_conferencia'), false)
  assert.equal(CATEGORIAS_OPERACIONAIS_FOLHA.includes('origem_lancamento'), false)
})

test('arquitetura da Folha não usa styles globais nem DOM responsivo duplicado', async () => {
  const [app, pagina, css, patterns, global, service] = await Promise.all([
    readFile(new URL('../../../../App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../../../pages/FechamentoFolhaPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../../../pages/FechamentoFolhaPage.css', import.meta.url), 'utf8'),
    readFile(new URL('../../../../components/shared/PagePatterns.css', import.meta.url), 'utf8'),
    readFile(new URL('../../../../styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../../../../services/folhaService.js', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(app, /<LazyFechamentoFolhaPage[\s\S]{0,120}styles=/)
  assert.match(pagina, /import '\.\/FechamentoFolhaPage\.css'/)
  assert.doesNotMatch(pagina, /style=\{|styles\.|estilosLocais/)
  assert.doesNotMatch(patterns, /\.folha-/)
  assert.doesNotMatch(global, /\.folha-/)
  assert.doesNotMatch(css, /!important/)
  assert.doesNotMatch(pagina, /folha-(desktop|mobile)-(list|table|cards)/)
  assert.match(css, /@media \(max-width: 560px\)/)
  assert.match(pagina, /competenciaLancamentosCarregadaId === competenciaSelecionadaId/)
  assert.match(pagina, /salvandoCompraRapida/)
  assert.match(pagina, /planejarInclusaoPremiacaoFolha/)
  assert.match(pagina, /lancamentoEditandoId/)
  assert.match(pagina, /localizarLancamentoParaSalvarFolha/)
  assert.match(pagina, /Adicionar desconto/)
  assert.match(pagina, /Nenhum outro desconto/)
  assert.match(pagina, /salvandoOutroDescontoRef/)
  assert.match(pagina, /contextoNavegacao\?\.competenciaId/)
  assert.match(pagina, /setCompetenciaSelecionadaId\(competenciaId\)/)
  assert.doesNotMatch(pagina, /title="[1-5]\. /)
  assert.doesNotMatch(pagina, /data_falta|status_conferencia|origem_lancamento/)
  assert.match(pagina, /inputMode="decimal"/)
  assert.match(pagina, /inputMode="numeric"/)
  assert.match(service, /\.order\('criado_em', \{ ascending: true \}\)\s*\.order\('id', \{ ascending: true \}\)/)
})
