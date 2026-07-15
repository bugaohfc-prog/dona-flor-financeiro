import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFuncionarios } from '../../../hooks/useFuncionarios.js'
import { supabase as supabasePadrao } from '../../../lib/supabase.js'
import { listarCompetenciasFolhaAgenda } from '../../../services/folhaService.js'
import { listarExamesPeriodicosAgenda } from '../../../services/funcionariosExamesPeriodicosService.js'
import { listarPeriodosFeriasAgenda } from '../../../services/funcionariosFeriasService.js'
import { mensagemSeguraErro } from '../../../utils/session.js'
import { hojeLocalISO, montarBaseOperacional } from '../domain/centralDoDiaRules.js'
import {
  calcularFimJanelaAgenda,
  normalizarPessoasDetalhadasAgenda
} from '../domain/centralDoDiaPeopleRules.js'
import {
  resumirAgendaOperacional,
  selecionarAgendaPorOrigem
} from '../domain/centralDoDiaSelectors.js'

const FONTES_PESSOAS = ['ferias', 'exames', 'folha']

function resultadoFonte(resposta) {
  if (resposta.status === 'rejected') return { dados: [], erro: resposta.reason }
  if (resposta.value?.error) return { dados: [], erro: resposta.value.error }
  return { dados: resposta.value?.data || [], erro: null }
}

export function useAgendaOperacional({
  empresaId,
  contas = [],
  notas = [],
  podeAcessarPessoas = false,
  atualizarContas,
  atualizarNotas,
  carregandoFinanceiro = false,
  supabase = supabasePadrao
} = {}) {
  const [filtroFilial, setFiltroFilial] = useState({ empresaId: empresaId || '', valor: '' })
  const [origemSelecionada, setOrigemSelecionada] = useState('todos')
  const [ferias, setFerias] = useState([])
  const [exames, setExames] = useState([])
  const [competenciasFolha, setCompetenciasFolha] = useState([])
  const [errosPessoas, setErrosPessoas] = useState({ ferias: null, exames: null, folha: null })
  const [carregandoFontesPessoas, setCarregandoFontesPessoas] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [empresaFuncionariosId, setEmpresaFuncionariosId] = useState('')
  const [empresaFontesPessoasId, setEmpresaFontesPessoasId] = useState('')
  const atualizandoRef = useRef(false)
  const requisicaoRef = useRef(0)
  const montadoRef = useRef(true)

  const {
    funcionarios,
    loading: carregandoFuncionarios,
    erro: erroFuncionarios,
    carregarFuncionarios
  } = useFuncionarios({
    empresaId,
    autoCarregar: false,
    supabase
  })

  const carregarFuncionariosAgenda = useCallback(async () => {
    if (!empresaId || !podeAcessarPessoas) {
      setEmpresaFuncionariosId('')
      return { data: [], error: null }
    }
    const resultado = await carregarFuncionarios({ empresaId })
    if (montadoRef.current && !resultado?.error && !resultado?.ignorado) setEmpresaFuncionariosId(empresaId)
    return resultado
  }, [carregarFuncionarios, empresaId, podeAcessarPessoas])

  const carregarFontesPessoas = useCallback(async () => {
    const requisicao = requisicaoRef.current + 1
    requisicaoRef.current = requisicao

    if (!empresaId || !podeAcessarPessoas) {
      setFerias([])
      setExames([])
      setCompetenciasFolha([])
      setEmpresaFontesPessoasId('')
      setErrosPessoas({ ferias: null, exames: null, folha: null })
      setCarregandoFontesPessoas(false)
      return []
    }

    setCarregandoFontesPessoas(true)
    setErrosPessoas({ ferias: null, exames: null, folha: null })
    const dataBaseISO = hojeLocalISO()
    const dataFimISO = calcularFimJanelaAgenda(dataBaseISO)

    const respostas = await Promise.allSettled([
      listarPeriodosFeriasAgenda({
        supabase,
        empresaId,
        dataInicioMinima: dataBaseISO,
        dataInicioMaxima: dataFimISO
      }),
      listarExamesPeriodicosAgenda({ supabase, empresaId }),
      listarCompetenciasFolhaAgenda({ supabase, empresaId })
    ])

    if (!montadoRef.current || requisicaoRef.current !== requisicao) return respostas

    const [resultadoFerias, resultadoExames, resultadoFolha] = respostas.map(resultadoFonte)
    setFerias(resultadoFerias.dados)
    setExames(resultadoExames.dados)
    setCompetenciasFolha(resultadoFolha.dados)
    setEmpresaFontesPessoasId(empresaId)
    setErrosPessoas({
      ferias: resultadoFerias.erro ? mensagemSeguraErro(resultadoFerias.erro, 'Não foi possível carregar férias.') : null,
      exames: resultadoExames.erro ? mensagemSeguraErro(resultadoExames.erro, 'Não foi possível carregar exames periódicos.') : null,
      folha: resultadoFolha.erro ? mensagemSeguraErro(resultadoFolha.erro, 'Não foi possível carregar competências da folha.') : null
    })
    setCarregandoFontesPessoas(false)
    return respostas
  }, [empresaId, podeAcessarPessoas, supabase])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      requisicaoRef.current += 1
    }
  }, [])

  useEffect(() => {
    setFiltroFilial({ empresaId: empresaId || '', valor: '' })
    setOrigemSelecionada('todos')
    setFerias([])
    setExames([])
    setCompetenciasFolha([])
    setEmpresaFuncionariosId('')
    setEmpresaFontesPessoasId('')
    Promise.allSettled([carregarFuncionariosAgenda(), carregarFontesPessoas()])
  }, [carregarFontesPessoas, carregarFuncionariosAgenda, empresaId])

  useEffect(() => {
    if (!podeAcessarPessoas && origemSelecionada === 'pessoas') setOrigemSelecionada('todos')
  }, [origemSelecionada, podeAcessarPessoas])

  const atualizar = useCallback(async () => {
    if (atualizandoRef.current || !empresaId) return
    atualizandoRef.current = true
    setAtualizando(true)
    try {
      await Promise.allSettled([
        typeof atualizarContas === 'function' ? atualizarContas() : Promise.resolve(),
        typeof atualizarNotas === 'function' ? atualizarNotas() : Promise.resolve(),
        podeAcessarPessoas ? carregarFuncionariosAgenda() : Promise.resolve(),
        podeAcessarPessoas ? carregarFontesPessoas() : Promise.resolve()
      ])
    } finally {
      atualizandoRef.current = false
      if (montadoRef.current) setAtualizando(false)
    }
  }, [atualizarContas, atualizarNotas, carregarFontesPessoas, carregarFuncionariosAgenda, empresaId, podeAcessarPessoas])

  const dataBaseISO = hojeLocalISO()
  const filialSelecionada = filtroFilial.empresaId === (empresaId || '') ? filtroFilial.valor : ''
  const setFilialSelecionada = useCallback((valor) => {
    setFiltroFilial({ empresaId: empresaId || '', valor })
  }, [empresaId])
  const funcionariosAtuais = empresaFuncionariosId === empresaId ? funcionarios : []
  const fontesPessoasAtuais = empresaFontesPessoasId === empresaId
    ? { ferias, exames, competenciasFolha }
    : { ferias: [], exames: [], competenciasFolha: [] }
  const itensPessoasDetalhados = useMemo(() => podeAcessarPessoas
    ? normalizarPessoasDetalhadasAgenda({
        funcionarios: funcionariosAtuais,
        ferias: fontesPessoasAtuais.ferias,
        exames: fontesPessoasAtuais.exames,
        competenciasFolha: fontesPessoasAtuais.competenciasFolha,
        dataBaseISO,
        filialId: filialSelecionada
      })
    : [], [dataBaseISO, filialSelecionada, fontesPessoasAtuais.competenciasFolha, fontesPessoasAtuais.exames, fontesPessoasAtuais.ferias, funcionariosAtuais, podeAcessarPessoas])

  const base = useMemo(() => montarBaseOperacional({
    contas,
    notas,
    itensPessoasDetalhados,
    dataBaseISO,
    filialId: filialSelecionada,
    podeAcessarPessoas,
    podeAcessarAuditoria: false
  }), [contas, dataBaseISO, filialSelecionada, itensPessoasDetalhados, notas, podeAcessarPessoas])

  const agenda = useMemo(
    () => selecionarAgendaPorOrigem(base, origemSelecionada),
    [base, origemSelecionada]
  )
  const resumo = useMemo(() => resumirAgendaOperacional(agenda), [agenda])
  const erros = useMemo(() => ({
    funcionarios: erroFuncionarios,
    ...errosPessoas
  }), [erroFuncionarios, errosPessoas])

  return {
    agenda,
    resumo,
    filialSelecionada,
    setFilialSelecionada,
    origemSelecionada,
    setOrigemSelecionada,
    carregandoInicial: Boolean(carregandoFinanceiro && !contas.length && !notas.length),
    carregandoPessoas: Boolean(carregandoFuncionarios || carregandoFontesPessoas),
    atualizando,
    erros,
    fontesComErro: ['funcionarios', ...FONTES_PESSOAS].filter((fonte) => erros[fonte]),
    atualizar
  }
}
