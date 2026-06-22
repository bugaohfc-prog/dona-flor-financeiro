import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const COLUNAS_OBRIGATORIAS = [
  'descricao',
  'filial_unidade',
  'centro_custo',
  'imposto_tipo',
  'competencia',
  'competencia_referencia',
  'vencimento_sugerido',
  'valor',
  'status_sugerido',
  'observacao'
]

const ARQUIVOS_ESPERADOS = [
  'brilho_dourado_simples_inss_importacao_contas.csv',
  'cfs_matos_simples_inss_importacao_contas.csv',
  'dona_flor_andradina_simples_inss_importacao_contas.csv',
  'dona_flor_paranaiba_simples_inss_importacao_contas.csv'
]

function dividirLinhaCsv(linha, separador = ';') {
  const campos = []
  let atual = ''
  let emAspas = false

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i]
    const proximo = linha[i + 1]

    if (caractere === '"' && emAspas && proximo === '"') {
      atual += '"'
      i += 1
      continue
    }

    if (caractere === '"') {
      emAspas = !emAspas
      continue
    }

    if (caractere === separador && !emAspas) {
      campos.push(atual)
      atual = ''
      continue
    }

    atual += caractere
  }

  campos.push(atual)
  return campos.map((campo) => campo.trim())
}

function lerCsv(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf8').replace(/^\uFEFF/, '')
  const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim())
  const cabecalho = dividirLinhaCsv(linhas[0]).map((coluna) => coluna.replace(/^"|"$/g, '').trim())

  const registros = linhas.slice(1).map((linha, indice) => {
    const valores = dividirLinhaCsv(linha)
    return cabecalho.reduce((registro, coluna, posicao) => {
      registro[coluna] = valores[posicao] || ''
      registro.__linha = indice + 2
      return registro
    }, {})
  })

  return { cabecalho, registros }
}

function localizarArquivos(baseDir) {
  const encontrados = []

  function visitar(diretorio) {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
      const caminho = path.join(diretorio, entrada.name)
      if (entrada.isDirectory()) {
        visitar(caminho)
      } else if (ARQUIVOS_ESPERADOS.includes(entrada.name)) {
        encontrados.push(caminho)
      }
    }
  }

  visitar(baseDir)
  return encontrados.sort()
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizarValor(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return 0

  const semMoeda = texto.replace(/[R$\s]/g, '')
  const comCentavosPorEspaco = texto.match(/^(\d{1,3}(?:\.\d{3})*|\d+)\s+(\d{2})$/)
  let normalizado

  if (comCentavosPorEspaco) {
    normalizado = `${comCentavosPorEspaco[1].replace(/\./g, '')}.${comCentavosPorEspaco[2]}`
  } else if (semMoeda.includes(',')) {
    normalizado = semMoeda.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+\.\d{1,2}$/.test(semMoeda)) {
    normalizado = semMoeda
  } else {
    normalizado = semMoeda.replace(/\./g, '')
  }

  const numero = Number(normalizado)
  if (!Number.isFinite(numero)) return NaN
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

function ehDataIso(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))
}

function competenciaEhPrimeiroDiaMes(valor) {
  return ehDataIso(valor) && String(valor).slice(8, 10) === '01'
}

function extrairDataArrecadacao(observacao) {
  const texto = String(observacao || '')
  const match = texto.match(/data de arrecada[cç][aã]o\s+(\d{2})\/(\d{2})\/(\d{4})/i)
  if (!match) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

function extrairNumeroDocumento(registro) {
  const direto = String(registro.numero_documento || '').trim()
  if (direto) return direto
  const match = String(registro.observacao || '').match(/documento\s+([0-9]+)/i)
  return match ? match[1] : null
}

function extrairReceita(registro) {
  const direto = String(registro.receita_codigo || '').trim()
  if (direto) return direto
  const match = String(registro.observacao || '').match(/receita\s+([0-9]+)/i)
  return match ? match[1] : null
}

function extrairPeriodoApuracao(registro) {
  const match = String(registro.observacao || '').match(/per[ií]odo de apura[cç][aã]o\s+([0-9/]+)/i)
  if (match) return match[1]

  const competenciaReferencia = String(registro.competencia_referencia || '').trim()
  return /^\d{2}\/\d{4}$/.test(competenciaReferencia) ? competenciaReferencia : null
}

function origemEhPagamento(registro) {
  const origem = normalizarTexto(registro.origem)
  const observacao = normalizarTexto(registro.observacao)
  return origem.includes('relatorio de pagamentos receita federal')
    || observacao.includes('relatorio de pagamentos receita federal')
    || observacao.includes('relatorio de pagamentos rfb')
    || observacao.includes('importado do relatorio de pagamentos rfb')
    || observacao.includes('pagamento receita federal')
}

function origemEhSituacaoFiscal(registro) {
  const origem = normalizarTexto(registro.origem)
  const observacao = normalizarTexto(registro.observacao)
  return origem.includes('relatorio de situacao fiscal receita federal')
    || observacao.includes('relatorio de situacao fiscal receita federal')
    || observacao.includes('relatorio de situacao fiscal rfb')
    || observacao.includes('situacao fiscal')
}

function validarCabecalho(cabecalho, arquivo) {
  const faltantes = COLUNAS_OBRIGATORIAS.filter((coluna) => !cabecalho.includes(coluna))
  if (faltantes.length) {
    throw new Error(`Arquivo ${arquivo} sem colunas obrigatorias: ${faltantes.join(', ')}`)
  }
}

function normalizarRegistro(registro, arquivo) {
  const valor = normalizarValor(registro.valor)
  const receita = extrairReceita(registro)
  const documento = extrairNumeroDocumento(registro)
  const periodoApuracao = extrairPeriodoApuracao(registro)
  const dataArrecadacao = extrairDataArrecadacao(registro.observacao)
  const vemDePagamento = origemEhPagamento(registro)
  const vemDeSituacaoFiscal = origemEhSituacaoFiscal(registro)
  const podeEntrarPago = vemDePagamento
    && Boolean(dataArrecadacao)
    && Boolean(documento)
    && Boolean(receita)
    && Boolean(periodoApuracao)
    && Number.isFinite(valor)
    && valor > 0

  return {
    arquivo,
    linha: registro.__linha,
    descricao: String(registro.descricao || '').trim(),
    filial_unidade: String(registro.filial_unidade || '').trim(),
    centro_custo: String(registro.centro_custo || '').trim(),
    imposto_tipo: String(registro.imposto_tipo || '').trim(),
    competencia: String(registro.competencia || '').trim(),
    competencia_referencia: String(registro.competencia_referencia || '').trim(),
    vencimento_sugerido: String(registro.vencimento_sugerido || '').trim(),
    valor,
    status_sugerido: String(registro.status_sugerido || '').trim(),
    observacao: String(registro.observacao || '').trim(),
    origem: String(registro.origem || '').trim(),
    receita,
    documento,
    periodo_apuracao: periodoApuracao,
    data_arrecadacao: dataArrecadacao,
    origem_tipo: vemDePagamento ? 'pagamento' : (vemDeSituacaoFiscal ? 'pendencia_fiscal' : 'desconhecida'),
    status_importacao: podeEntrarPago ? 'pago' : 'pendente',
    pode_entrar_pago: podeEntrarPago
  }
}

export function carregarSimplesInssCsvs(baseDir) {
  const arquivos = localizarArquivos(baseDir)
  const porArquivo = []
  const validos = []
  const erros = []
  const ignorados = []

  for (const arquivo of arquivos) {
    const nomeArquivo = path.basename(arquivo)
    const { cabecalho, registros } = lerCsv(arquivo)
    validarCabecalho(cabecalho, nomeArquivo)

    const resumoArquivo = {
      arquivo: nomeArquivo,
      caminho: arquivo,
      lidas: registros.length,
      validas: 0,
      ignoradas: 0,
      erros: 0
    }

    for (const registro of registros) {
      const normalizado = normalizarRegistro(registro, nomeArquivo)
      const errosRegistro = []

      if (!['simples_nacional', 'inss'].includes(normalizado.imposto_tipo)) errosRegistro.push('imposto_tipo invalido')
      if (normalizado.centro_custo !== 'Impostos e Taxas') errosRegistro.push('centro_custo diferente de Impostos e Taxas')
      if (!competenciaEhPrimeiroDiaMes(normalizado.competencia)) errosRegistro.push('competencia invalida ou nao e primeiro dia do mes')
      if (!ehDataIso(normalizado.vencimento_sugerido)) errosRegistro.push('vencimento_sugerido invalido')
      if (!Number.isFinite(normalizado.valor)) errosRegistro.push('valor invalido')
      if (!normalizado.descricao) errosRegistro.push('descricao vazia')
      if (!normalizado.filial_unidade) errosRegistro.push('filial_unidade vazia')
      if (
        normalizado.imposto_tipo === 'simples_nacional'
        && normalizado.receita
        && !['3333', 'SIMPLES'].includes(normalizado.receita)
      ) errosRegistro.push('receita incompativel com simples_nacional')
      if (
        normalizado.imposto_tipo === 'inss'
        && normalizado.receita
        && !['1410', '1082', '1082-01', '1082-21', '1099', '1099-01'].includes(normalizado.receita)
      ) errosRegistro.push('receita incompativel com inss')

      if (errosRegistro.length) {
        resumoArquivo.erros += 1
        erros.push({ ...normalizado, erros: errosRegistro })
        continue
      }

      if (normalizado.valor <= 0) {
        resumoArquivo.ignoradas += 1
        ignorados.push({ ...normalizado, motivo: 'valor zerado ou negativo' })
        continue
      }

      resumoArquivo.validas += 1
      validos.push(normalizado)
    }

    porArquivo.push(resumoArquivo)
  }

  return {
    baseDir,
    arquivosEsperados: ARQUIVOS_ESPERADOS,
    arquivosEncontrados: arquivos.map((arquivo) => path.basename(arquivo)),
    porArquivo,
    validos,
    erros,
    ignorados
  }
}

function somarPor(lista, chave) {
  return lista.reduce((resumo, registro) => {
    const grupo = registro[chave] || 'sem_informacao'
    const atual = resumo[grupo] || { total: 0, valorTotal: 0 }
    atual.total += 1
    atual.valorTotal = Math.round((atual.valorTotal + registro.valor + Number.EPSILON) * 100) / 100
    resumo[grupo] = atual
    return resumo
  }, {})
}

function sqlTexto(valor) {
  return `'${String(valor || '').replace(/'/g, "''")}'`
}

function formatarObservacaoFiscal(registro) {
  if (registro.origem_tipo === 'pagamento') {
    return [
      'Origem: Relatorio de Pagamentos Receita Federal',
      `receita ${registro.receita || 'nao informada'}`,
      `documento ${registro.documento || 'nao informado'}`,
      `periodo de apuracao ${registro.periodo_apuracao || registro.competencia_referencia}`
    ].join('; ') + '.'
  }

  const situacao = normalizarTexto(registro.observacao).includes('a analisar') ? 'a_analisar' : 'pendente'
  return [
    'Origem: Relatorio de Situacao Fiscal Receita Federal',
    `receita ${registro.receita || 'nao informada'}`,
    `referencia ${registro.competencia_referencia || registro.periodo_apuracao || 'nao informada'}`,
    `situacao ${situacao}`,
    `valor consolidado ${registro.valor}`
  ].join('; ') + '.'
}

function gerarSqlImportacao(registros, filial) {
  const valores = registros.map((registro) => {
    const observacao = formatarObservacaoFiscal(registro)
    const observacaoPagamento = registro.status_importacao === 'pago' ? observacao : ''
    return `(${[
      sqlTexto(registro.filial_unidade),
      sqlTexto(registro.imposto_tipo),
      sqlTexto(registro.competencia),
      sqlTexto(registro.vencimento_sugerido),
      registro.valor,
      sqlTexto(registro.descricao),
      sqlTexto(registro.status_importacao),
      sqlTexto(registro.data_arrecadacao || ''),
      sqlTexto(observacao),
      sqlTexto(observacaoPagamento)
    ].join(',')})`
  }).join(',')

  return `with entrada(filial_unidade,imposto_tipo,competencia,vencimento_sugerido,valor,descricao,status_importacao,data_pagamento,observacao,observacao_pagamento) as (values ${valores}), mapeada as (select e.*, f.empresa_id, f.id filial_id, cc.id centro_custo_id from entrada e join public.df_filiais f on f.nome=e.filial_unidade join public.df_centros_custo cc on cc.nome='Impostos e Taxas' and cc.empresa_id=f.empresa_id), candidatos as (select m.* from mapeada m where not exists (select 1 from public.df_contas c where c.empresa_id=m.empresa_id and c.filial_id=m.filial_id and c.centro_custo_id=m.centro_custo_id and c.imposto_tipo=m.imposto_tipo and c.competencia=m.competencia::date and coalesce(c.data_vencimento,c.vencimento)=m.vencimento_sugerido::date and abs(c.valor-m.valor::numeric)<0.01 and coalesce(c.excluido,false)=false) and not exists (select 1 from public.df_contas c where c.empresa_id=m.empresa_id and c.filial_id=m.filial_id and c.centro_custo_id=m.centro_custo_id and c.imposto_tipo is null and coalesce(c.excluido,false)=false and abs(c.valor-m.valor::numeric)<1 and (coalesce(c.data_vencimento,c.vencimento)=m.vencimento_sugerido::date or abs(coalesce(c.data_vencimento,c.vencimento)-m.vencimento_sugerido::date)<=1 or date_trunc('month',coalesce(c.data_vencimento,c.vencimento)-interval '1 month')::date=m.competencia::date) and ((m.imposto_tipo='simples_nacional' and lower(c.descricao) like '%simples%') or (m.imposto_tipo='inss' and (lower(c.descricao) like '%inss%' or lower(c.descricao) like '%cp-segur%' or lower(c.descricao) like '%segur%'))))), inseridos as (insert into public.df_contas (descricao,valor,vencimento,data_vencimento,centro,status,observacao,centro_custo_id,empresa_id,filial_id,imposto_tipo,competencia,valor_pago,data_pagamento,observacao_pagamento,excluido,deletado,oculto) select descricao,valor::numeric,vencimento_sugerido::date,vencimento_sugerido::date,'Impostos e Taxas',status_importacao,observacao,centro_custo_id,empresa_id,filial_id,imposto_tipo,competencia::date,case when status_importacao='pago' then valor::numeric else null end,case when status_importacao='pago' then data_pagamento::date else null end,case when status_importacao='pago' then observacao_pagamento else null end,false,false,false from candidatos returning id,descricao,filial_id,imposto_tipo,status,competencia,vencimento,valor,valor_pago,data_pagamento) select ${sqlTexto(filial)} filial,count(*) inseridos,count(*) filter (where status='pago') pagos,count(*) filter (where status='pendente') pendentes,coalesce(jsonb_agg(jsonb_build_object('id',id,'imposto_tipo',imposto_tipo,'status',status,'competencia',competencia,'valor',valor) order by imposto_tipo,competencia) filter (where id is not null),'[]'::jsonb) registros from inseridos;`
}

function gerarArquivosSql(resultado, destino) {
  fs.mkdirSync(destino, { recursive: true })
  const porFilial = resultado.validos.reduce((grupos, registro) => {
    const grupo = grupos[registro.filial_unidade] || []
    grupo.push(registro)
    grupos[registro.filial_unidade] = grupo
    return grupos
  }, {})

  return Object.entries(porFilial).map(([filial, registros]) => {
    const slug = normalizarTexto(filial).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const arquivo = path.join(destino, `tmp_simples_inss_insert_${slug}.sql`)
    fs.writeFileSync(arquivo, gerarSqlImportacao(registros, filial), 'utf8')
    return arquivo
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const baseDir = process.env.SIMPLES_INSS_IMPORT_DIR || 'tmp_simples_inss_import'
  const resultado = carregarSimplesInssCsvs(baseDir)

  if (process.env.IMPORTAR_SIMPLES_INSS === '1') {
    throw new Error('Este script valida os CSVs em dry-run local. A importacao real deve ser executada por SQL revisado contra o Supabase.')
  }

  const pagamentos = resultado.validos.filter((registro) => registro.status_importacao === 'pago')
  const pendentes = resultado.validos.filter((registro) => registro.status_importacao === 'pendente')
  const relatorio = {
    modo: 'DRY_RUN_LOCAL',
    baseDir,
    arquivosEncontrados: resultado.arquivosEncontrados,
    porArquivo: resultado.porArquivo,
    totalLido: resultado.porArquivo.reduce((total, arquivo) => total + arquivo.lidas, 0),
    totalValido: resultado.validos.length,
    totalIgnorado: resultado.ignorados.length,
    totalErros: resultado.erros.length,
    pagamentosComoPagos: pagamentos.length,
    pendenciasComoPendentes: pendentes.length,
    porFilial: somarPor(resultado.validos, 'filial_unidade'),
    porImposto: somarPor(resultado.validos, 'imposto_tipo'),
    porOrigem: somarPor(resultado.validos, 'origem_tipo'),
    porStatusImportacao: somarPor(resultado.validos, 'status_importacao'),
    erros: resultado.erros,
    ignorados: resultado.ignorados
  }

  console.log(JSON.stringify(relatorio, null, 2))

  const emitirSql = process.argv.find((arg) => arg.startsWith('--emit-sql-dir='))
  if (emitirSql) {
    const destino = emitirSql.split('=')[1] || '.'
    const arquivos = gerarArquivosSql(resultado, destino)
    console.error(`SQL gerado: ${arquivos.join(', ')}`)
  }
}
