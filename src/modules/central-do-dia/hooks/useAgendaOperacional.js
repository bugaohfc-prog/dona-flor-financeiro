import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hojeLocalISO, montarBaseOperacional } from '../domain/centralDoDiaRules.js'
import {
  resumirAgendaOperacional,
  selecionarAgendaPorOrigem
} from '../domain/centralDoDiaSelectors.js'
import { useEventosPessoas } from './useEventosPessoas.js'
import { executarAtualizacaoCentral } from '../services/centralDoDiaRefresh.js'

export function useAgendaOperacional({
  empresaId,
  contas = [],
  notas = [],
  podeAcessarPessoas = false,
  atualizarContas,
  atualizarNotas,
  carregandoFinanceiro = false
} = {}) {
  const [filtroFilial, setFiltroFilial] = useState({ empresaId: empresaId || '', valor: '' })
  const [origemSelecionada, setOrigemSelecionada] = useState('todos')
  const [atualizando, setAtualizando] = useState(false)
  const atualizandoRef = useRef(false)
  const montadoRef = useRef(true)
  const filialSelecionada = filtroFilial.empresaId === (empresaId || '') ? filtroFilial.valor : ''
  const dataBaseISO = hojeLocalISO()

  const fontePessoas = useEventosPessoas({
    empresaId,
    filialId: filialSelecionada,
    podeAcessarPessoas,
    dataBaseISO
  })

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      atualizandoRef.current = false
    }
  }, [])

  useEffect(() => {
    setFiltroFilial({ empresaId: empresaId || '', valor: '' })
    setOrigemSelecionada('todos')
  }, [empresaId])

  useEffect(() => {
    if (!podeAcessarPessoas && origemSelecionada === 'pessoas') setOrigemSelecionada('todos')
  }, [origemSelecionada, podeAcessarPessoas])

  const atualizar = useCallback(async () => {
    if (atualizandoRef.current || !empresaId) return
    atualizandoRef.current = true
    setAtualizando(true)
    try {
      await executarAtualizacaoCentral([
        atualizarContas,
        atualizarNotas,
        podeAcessarPessoas ? () => fontePessoas.atualizar({ silencioso: true }) : null
      ])
    } finally {
      atualizandoRef.current = false
      if (montadoRef.current) setAtualizando(false)
    }
  }, [atualizarContas, atualizarNotas, empresaId, fontePessoas.atualizar, podeAcessarPessoas])

  const setFilialSelecionada = useCallback((valor) => {
    setFiltroFilial({ empresaId: empresaId || '', valor })
  }, [empresaId])

  const base = useMemo(() => montarBaseOperacional({
    contas,
    notas,
    itensPessoasDetalhados: fontePessoas.eventos,
    dataBaseISO,
    filialId: filialSelecionada,
    podeAcessarPessoas,
    podeAcessarAuditoria: false
  }), [contas, dataBaseISO, filialSelecionada, fontePessoas.eventos, notas, podeAcessarPessoas])

  const agenda = useMemo(
    () => selecionarAgendaPorOrigem(base, origemSelecionada),
    [base, origemSelecionada]
  )
  const resumo = useMemo(() => resumirAgendaOperacional(agenda), [agenda])

  return {
    agenda,
    resumo,
    filialSelecionada,
    setFilialSelecionada,
    origemSelecionada,
    setOrigemSelecionada,
    carregandoInicial: Boolean(carregandoFinanceiro && !contas.length && !notas.length),
    carregandoPessoas: fontePessoas.carregando,
    pessoasCarregadas: fontePessoas.carregado,
    atualizando,
    erros: fontePessoas.erros,
    fontesComErro: fontePessoas.fontesComErro,
    atualizar
  }
}
