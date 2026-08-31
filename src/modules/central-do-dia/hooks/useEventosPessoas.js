import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../../../lib/supabase.js'
import { mensagemSeguraErro } from '../../../utils/session.js'
import { hojeLocalISO } from '../domain/centralDoDiaRules.js'
import { projetarEventosPessoas } from '../domain/centralDoDiaPeopleRules.js'
import {
  consultarFontesEventosPessoas,
  FONTES_EVENTOS_PESSOAS
} from '../services/eventosPessoasService.js'
const DADOS_VAZIOS = Object.freeze({
  funcionarios: [],
  ciclosFerias: [],
  periodosFerias: [],
  exames: [],
  folha: [],
  desligamentos: []
})

const MENSAGENS_FONTES = Object.freeze({
  funcionarios: 'Não foi possível carregar funcionários.',
  ciclosFerias: 'Não foi possível carregar ciclos de férias.',
  periodosFerias: 'Não foi possível carregar períodos de férias.',
  exames: 'Não foi possível carregar exames ocupacionais.',
  folha: 'Não foi possível carregar competências da folha.',
  desligamentos: 'Não foi possível carregar acertos de desligamentos.'
})

function normalizarErros(erros = {}) {
  return FONTES_EVENTOS_PESSOAS.reduce((resultado, fonte) => {
    resultado[fonte] = erros[fonte]
      ? mensagemSeguraErro(erros[fonte], MENSAGENS_FONTES[fonte])
      : null
    return resultado
  }, {})
}

export function useEventosPessoas({
  empresaId,
  filialId = '',
  podeAcessarPessoas = false,
  dataBaseISO = hojeLocalISO(),
  supabase = supabasePadrao
} = {}) {
  const [dados, setDados] = useState(DADOS_VAZIOS)
  const [erros, setErros] = useState({})
  const [carregando, setCarregando] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [empresaCarregadaId, setEmpresaCarregadaId] = useState('')
  const requisicaoRef = useRef(0)
  const montadoRef = useRef(true)

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    const requisicao = requisicaoRef.current + 1
    requisicaoRef.current = requisicao

    if (!empresaId || !podeAcessarPessoas) {
      setDados(DADOS_VAZIOS)
      setErros({})
      setCarregando(false)
      setCarregado(false)
      setEmpresaCarregadaId('')
      return { dados: DADOS_VAZIOS, erros: {}, fontesComErro: [] }
    }

    if (!silencioso) setCarregando(true)
    const resultado = await consultarFontesEventosPessoas({ supabase, empresaId })
    if (!montadoRef.current || requisicaoRef.current !== requisicao) return resultado

    setDados(resultado.dados)
    setErros(normalizarErros(resultado.erros))
    setEmpresaCarregadaId(empresaId)
    setCarregado(true)
    setCarregando(false)
    return resultado
  }, [empresaId, podeAcessarPessoas, supabase])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      requisicaoRef.current += 1
    }
  }, [])

  useEffect(() => {
    setDados(DADOS_VAZIOS)
    setErros({})
    setCarregado(false)
    setEmpresaCarregadaId('')
    carregar()
  }, [carregar, empresaId, podeAcessarPessoas])

  const dadosAtuais = empresaCarregadaId === empresaId ? dados : DADOS_VAZIOS
  const eventos = useMemo(() => podeAcessarPessoas
    ? projetarEventosPessoas({
        funcionarios: dadosAtuais.funcionarios,
        ciclosFerias: dadosAtuais.ciclosFerias,
        periodosFerias: dadosAtuais.periodosFerias,
        exames: dadosAtuais.exames,
        competenciasFolha: dadosAtuais.folha,
        desligamentos: dadosAtuais.desligamentos,
        dataBaseISO,
        filialId
      })
    : [], [dataBaseISO, dadosAtuais, filialId, podeAcessarPessoas])
  const fontesComErro = FONTES_EVENTOS_PESSOAS.filter((fonte) => erros[fonte])

  return {
    eventos,
    dados: dadosAtuais,
    erros,
    fontesComErro,
    carregando,
    carregado: Boolean(carregado && empresaCarregadaId === empresaId),
    podeVisualizar: Boolean(empresaId && podeAcessarPessoas),
    atualizar: carregar,
    tentarNovamente: carregar
  }
}

export default useEventosPessoas
