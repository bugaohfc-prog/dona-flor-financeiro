import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {

  // =========================
  // BLOCO 1 — CONTAS
  // =========================
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  // =========================
  // BLOCO 2 — NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)

  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')

  // =========================
  // BLOCO 4 — CENTROS
  // =========================
  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 5 — MENU
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    await Promise.all([buscarContas(), buscarCentros(), buscarNotas()])
    setLoading(false)
  }

  // =========================
  // BLOCO 0 — UTIL
  // =========================
  const formatarValor = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatarData = (d) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'

  const converterValor = (v) =>
    Number(String(v).replace(',', '.'))

  const estaVencida = (d, s) => {
    if (!d || s === 'pago') return false
    const hoje = new Date()
    hoje.setHours(0,0,0,0)
    const v = new Date(d + 'T00:00:00')
    v.setHours(0,0,0,0)
    return v < hoje
  }

  // =========================
  // CONTAS
  // =========================
  async function buscarContas() {
    const { data } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

    setContas(data || [])
  }

  function abrirConta(conta=null){
    if(conta){
      setEditandoContaId(conta.id)
      setDescricao(conta.descricao)
      setValor(conta.valor)
      setData(conta.data_vencimento)
      setCentroCustoId(conta.centro_custo_id)
    } else {
      setEditandoContaId(null)
      setDescricao('')
      setValor('')
      setData('')
      setCentroCustoId('')
    }
    setModalConta(true)
    setMenuAberto(false)
  }

  async function salvarConta(){
    const payload={
      descricao,
      valor: converterValor(valor),
      data_vencimento:data,
      centro_custo_id: centroCustoId || null
    }

    if(editandoContaId){
      await supabase.from('df_contas').update(payload).eq('id',editandoContaId)
    } else {
      await supabase.from('df_contas').insert([{...payload,status:'pendente'}])
    }

    setModalConta(false)
    buscarContas()
  }

  async function marcarComoPago(id){
    await supabase.from('df_contas').update({status:'pago'}).eq('id',id)
    buscarContas()
  }

  async function voltarParaPendente(id){
    await supabase.from('df_contas').update({status:'pendente'}).eq('id',id)
    buscarContas()
  }

  async function excluirConta(id){
    await supabase.from('df_contas').delete().eq('id',id)
    buscarContas()
  }

  const contasFiltradas = contas
    .filter(c => !centroFiltro || c.centro_custo_id === centroFiltro)
    .filter(c => c.descricao?.toLowerCase().includes(busca.toLowerCase()))

  // =========================
  // NOTAS
  // =========================
  async function buscarNotas(){
    const {data}= await supabase.from('df_notas').select('*').order('created_at',{ascending:false})
    setNotas(data||[])
  }

  function abrirNota(n=null){
    if(n){
      setEditandoNotaId(n.id)
      setTituloNota(n.titulo)
      setConteudoNota(n.conteudo)
    } else {
      setEditandoNotaId(null)
      setTituloNota('')
      setConteudoNota('')
    }
    setModalNota(true)
    setMenuAberto(false)
  }

  async function salvarNota(){
    const payload={titulo:tituloNota,conteudo:conteudoNota}

    if(editandoNotaId){
      await supabase.from('df_notas').update(payload).eq('id',editandoNotaId)
    } else {
      await supabase.from('df_notas').insert([payload])
    }

    setModalNota(false)
    buscarNotas()
  }

  async function excluirNota(id){
    await supabase.from('df_notas').delete().eq('id',id)
    buscarNotas()
  }

  const notasFiltradas = notas.filter(n =>
    `${n.titulo} ${n.conteudo}`.toLowerCase().includes(buscaNota.toLowerCase())
  )

  // =========================
  // CENTROS
  // =========================
  async function buscarCentros(){
    const {data}= await supabase.from('df_centros_custo').select('*').order('nome')
    setCentros(data||[])
  }

  async function salvarCentro(){
    await supabase.from('df_centros_custo').insert([{nome:novoCentro}])
    setNovoCentro('')
    buscarCentros()
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{padding:20,paddingBottom:120}}>

      <h1>📊 Contas</h1>

      <input placeholder="buscar" value={busca} onChange={e=>setBusca(e.target.value)} />

      {contasFiltradas.map(c=>{
        const vencida = estaVencida(c.data_vencimento,c.status)

        return (
          <div key={c.id} style={{
            background: c.status==='pago'?'#d4edda':vencida?'#ffb3b3':'#fff3cd',
            padding:12,
            marginTop:8,
            borderRadius:12
          }}>
            <b>{c.descricao}</b> — {formatarValor(c.valor)}<br/>
            {formatarData(c.data_vencimento)}

            <div style={{marginTop:6}}>
              <button onClick={()=>marcarComoPago(c.id)}>Pago</button>
              <button onClick={()=>voltarParaPendente(c.id)}>Voltar</button>
              <button onClick={()=>abrirConta(c)}>Editar</button>
              <button onClick={()=>excluirConta(c.id)}>Excluir</button>
            </div>
          </div>
        )
      })}

      <h2>📝 Notas</h2>

      {notasFiltradas.map(n=>(
        <div key={n.id} style={{background:'#eee',padding:10,marginTop:6}}>
          <b>{n.titulo}</b>
          <p>{n.conteudo}</p>
          <button onClick={()=>abrirNota(n)}>Editar</button>
          <button onClick={()=>excluirNota(n.id)}>Excluir</button>
        </div>
      ))}

      {/* BOTÃO */}
      <button onClick={()=>setMenuAberto(!menuAberto)} style={{
        position:'fixed',bottom:20,right:20,width:60,height:60,borderRadius:'50%'
      }}>+</button>

      {menuAberto && (
        <div style={{position:'fixed',bottom:90,right:20}}>
          <button onClick={()=>abrirConta()}>Conta</button>
          <button onClick={()=>abrirNota()}>Nota</button>
          <button onClick={()=>setModalCentro(true)}>Centro</button>
        </div>
      )}

      {/* MODAL CONTA */}
      {modalConta && (
        <div style={overlay}>
          <div style={modal}>
            <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="descrição"/>
            <input value={valor} onChange={e=>setValor(e.target.value)} placeholder="valor"/>
            <input type="date" value={data} onChange={e=>setData(e.target.value)}/>
            <button onClick={salvarConta}>Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL NOTA */}
      {modalNota && (
        <div style={overlay}>
          <div style={modal}>
            <input value={tituloNota} onChange={e=>setTituloNota(e.target.value)} placeholder="titulo"/>
            <textarea value={conteudoNota} onChange={e=>setConteudoNota(e.target.value)}/>
            <button onClick={salvarNota}>Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL CENTRO */}
      {modalCentro && (
        <div style={overlay}>
          <div style={modal}>
            <input
              value={novoCentro}
              onChange={(e)=>setNovoCentro(e.target.value)}
              placeholder="novo centro"
            />
            <button onClick={salvarCentro}>Salvar</button>
          </div>
        </div>
      )}

    </div>
  )
}

const overlay = {
  position:'fixed',
  inset:0,
  background:'#0008',
  display:'flex',
  alignItems:'center',
  justifyContent:'center'
}

const modal = {
  background:'#fff',
  padding:20,
  borderRadius:10
}
