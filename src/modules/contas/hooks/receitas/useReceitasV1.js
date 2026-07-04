import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import {
  arquivarReceitaV1,
  listarReceitasV1,
  restaurarReceitaV1,
  salvarReceitaV1
} from '../../services/receitas/receitasService'

const FORM_INICIAL = {
  id: '',
  data_receita: '',
  filial_id: '',
  valor: '',
  origem: 'Venda de Loja',
  descricao: 'Receita',
  observacao: ''
}

export function useReceitasV1({ empresaId, mostrarAviso }) {
  const [receitas, setReceitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(FORM_INICIAL)
  const [filtros, setFiltros] = useState({
    ano: String(new Date().getFullYear()),
    mes: '',
    filialId: '',
    origem: '',
    status: 'ativos'
  })

  async function carregar() {
    if (!empresaId) {
      setReceitas([])
      setErro('Empresa ativa nao selecionada.')
      return
    }

    setLoading(true)
    setErro('')
    const { data, error } = await listarReceitasV1(supabase, empresaId)
    if (error) {
      setErro(error.message || 'Nao foi possivel carregar receitas.')
      setReceitas([])
    } else {
      setReceitas(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [empresaId])

  function atualizarForm(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function limparForm() {
    setForm(FORM_INICIAL)
  }

  function editarReceita(receita) {
    setForm({
      id: receita.id || '',
      data_receita: receita.data_receita || '',
      filial_id: receita.filial_id || '',
      valor: formatarValorInput(receita.valor),
      origem: receita.origem || 'Venda de Loja',
      descricao: receita.descricao || 'Receita',
      observacao: receita.observacao || ''
    })
  }

  async function salvar() {
    if (!empresaId) return false
    if (!form.data_receita || !form.filial_id) {
      mostrarAviso?.('Informe data e filial da receita.', 'erro')
      return false
    }

    const valor = parseValor(form.valor)
    if (valor <= 0) {
      mostrarAviso?.('Informe um valor de receita maior que zero.', 'erro')
      return false
    }

    setSalvando(true)
    const { error } = await salvarReceitaV1(supabase, empresaId, {
      ...form,
      valor
    })
    setSalvando(false)

    if (error) {
      const duplicidade = String(error.message || '').toLowerCase().includes('duplicate')
      mostrarAviso?.(
        duplicidade ? 'Ja existe receita para esta filial, mes e origem.' : (error.message || 'Nao foi possivel salvar receita.'),
        'erro'
      )
      return false
    }

    mostrarAviso?.(form.id ? 'Receita atualizada.' : 'Receita cadastrada.', 'sucesso')
    limparForm()
    await carregar()
    return true
  }

  async function arquivar(receitaId) {
    const { error } = await arquivarReceitaV1(supabase, empresaId, receitaId)
    if (error) {
      mostrarAviso?.(error.message || 'Nao foi possivel arquivar receita.', 'erro')
      return false
    }
    mostrarAviso?.('Receita arquivada.', 'sucesso')
    await carregar()
    return true
  }

  async function restaurar(receitaId) {
    const { error } = await restaurarReceitaV1(supabase, empresaId, receitaId)
    if (error) {
      mostrarAviso?.(error.message || 'Nao foi possivel restaurar receita.', 'erro')
      return false
    }
    mostrarAviso?.('Receita restaurada.', 'sucesso')
    await carregar()
    return true
  }

  const receitasFiltradas = useMemo(() => filtrarReceitas(receitas, filtros), [receitas, filtros])
  const resumo = useMemo(() => resumirReceitas(receitasFiltradas), [receitasFiltradas])
  const origens = useMemo(() => Array.from(new Set(receitas.map((receita) => receita.origem).filter(Boolean))).sort(), [receitas])

  return {
    receitas,
    receitasFiltradas,
    resumo,
    origens,
    loading,
    salvando,
    erro,
    form,
    filtros,
    setFiltros,
    atualizarForm,
    limparForm,
    editarReceita,
    salvar,
    arquivar,
    restaurar,
    carregar
  }
}

function filtrarReceitas(receitas, filtros) {
  return (receitas || []).filter((receita) => {
    if (filtros.ano && String(receita.ano) !== String(filtros.ano)) return false
    if (filtros.mes && String(receita.mes).padStart(2, '0') !== String(filtros.mes).padStart(2, '0')) return false
    if (filtros.filialId && receita.filial_id !== filtros.filialId) return false
    if (filtros.origem && receita.origem !== filtros.origem) return false
    if (filtros.status === 'ativos' && (receita.arquivado || receita.status !== 'ativo')) return false
    if (filtros.status === 'arquivados' && !receita.arquivado && receita.status !== 'arquivado') return false
    return true
  })
}

function resumirReceitas(receitas) {
  const total = receitas.reduce((soma, receita) => soma + Number(receita.valor || 0), 0)
  const filiais = new Map()

  receitas.forEach((receita) => {
    const nome = receita.df_filiais?.nome || 'Sem filial'
    filiais.set(nome, (filiais.get(nome) || 0) + Number(receita.valor || 0))
  })

  return {
    total,
    quantidade: receitas.length,
    media: receitas.length ? total / receitas.length : 0,
    porFilial: Array.from(filiais.entries()).map(([nome, valor]) => ({ nome, valor }))
  }
}

function parseValor(valor) {
  const texto = String(valor || '').replace(/\./g, '').replace(',', '.')
  const numero = Number(texto)
  return Number.isFinite(numero) ? Math.round((numero + Number.EPSILON) * 100) / 100 : 0
}

function formatarValorInput(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
