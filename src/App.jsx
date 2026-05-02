import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')

  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    buscarContas()
  }, [])

  async function buscarContas() {
    const { data } = await supabase
      .from('df_contas')
      .select('*')

    setContas(data || [])
    setLoading(false)
  }

  async function adicionarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha tudo')
      return
    }

    await supabase.from('df_contas').insert([
      {
        descricao,
        valor: Number(valor),
        data_vencimento: dataVencimento,
        status: 'pendente'
      }
    ])

    setDescricao('')
    setValor('')
    setDataVencimento('')
    buscarContas()
  }

  async function marcarComoPago(id) {
    await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Excluir essa conta?')) return

    await supabase
      .from('df_contas')
      .delete()
      .eq('id', id)

    buscarContas()
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function formatarValor(v) {
    return Number(v).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function estaVencida(data) {
    if (!data) return false
    return new Date(data + 'T00:00:00') < new Date()
  }

  function ordenarContas(lista) {
    return lista.sort((a, b) => {
      const aVencida = estaVencida(a.data_vencimento)
      const bVencida = estaVencida(b.data_vencimento)

      // 1️⃣ Vencidas primeiro
      if (aVencida && !bVencida) return -1
      if (!aVencida && bVencida) return 1

      // 2️⃣ Pendentes antes de pagas
      if (a.status !== 'pago' && b.status === 'pago') return -1
      if (a.status === 'pago' && b.status !== 'pago') return 1

      // 3️⃣ Mais próximas do vencimento primeiro
      return new Date(a.data_vencimento) - new Date(b.data_vencimento)
    })
  }

  const contasFiltradas = ordenarContas(
    contas
      .filter(c => {
        if (filtro === 'pendente') return c.status !== 'pago'
        if (filtro === 'pago') return c.status === 'pago'
        return true
      })
      .filter(c =>
        c.descricao.toLowerCase().includes(busca.toLowerCase())
      )
  )

  const total = contas.reduce((acc, c) => acc + Number(c.valor || 0), 0)
  const pago = contas
    .filter(c => c.status === 'pago')
    .reduce((acc, c) => acc
