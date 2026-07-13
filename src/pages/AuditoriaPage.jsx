import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

export default function AuditoriaPage({ styles, empresaId, permissoesUsuario, navegarPara }) {
  const [eventos, setEventos] = useState([])
  const [pagina, setPagina] = useState(0)
  const [total, setTotal] = useState(0)
  const [filtros, setFiltros] = useState({ modulo: '', acao: '', severidade: '', status: '' })
  const [estado, setEstado] = useState('carregando')
  const [erro, setErro] = useState('')

  const autorizado = Boolean(permissoesUsuario?.isMaster || ['admin'].includes(permissoesUsuario?.perfilEmpresa))

  useEffect(() => {
    if (!autorizado || !empresaId) return
    let ativo = true
    const carregar = async () => {
      setEstado('carregando'); setErro('')
      let query = supabase.from('df_auditoria_eventos').select('id,criado_em,modulo,acao,entidade_tipo,entidade_id,severidade,status,origem,ator_email_hash,metadados,dados_antes,dados_depois', { count: 'exact' }).eq('empresa_id', empresaId).order('criado_em', { ascending: false }).range(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE - 1)
      Object.entries(filtros).forEach(([campo, valor]) => { if (valor) query = query.eq(campo, valor) })
      const { data, error, count } = await query
      if (!ativo) return
      if (error) { setErro(error.message || 'Não foi possível carregar a auditoria.'); setEstado('erro'); return }
      setEventos(data || []); setTotal(count || 0); setEstado('pronto')
    }
    carregar()
    return () => { ativo = false }
  }, [autorizado, empresaId, pagina, filtros])

  if (!autorizado) return <section className="page-section"><div className="empty-state-card"><strong>Acesso restrito</strong><p>Somente Admin ou Master podem consultar a auditoria.</p><button className="admin-btn admin-btn-secondary" onClick={() => navegarPara('dashboard')}>Voltar</button></div></section>

  return <section className="page-section audit-page">
    <header className="page-hero page-hero-standard"><span className="page-hero-kicker">Administração</span><h1>Auditoria e logs</h1><p>Eventos sanitizados da empresa, em modo somente leitura.</p></header>
    <div className="audit-toolbar">
      {['modulo', 'acao', 'severidade', 'status'].map((campo) => <label key={campo}><span>{campo}</span><input value={filtros[campo]} onChange={(e) => { setPagina(0); setFiltros((atual) => ({ ...atual, [campo]: e.target.value })) }} /></label>)}
    </div>
    {estado === 'erro' && <div className="empty-state-card"><strong>Não foi possível carregar</strong><p>{erro}</p></div>}
    {estado === 'carregando' && <div className="empty-state-card"><strong>Carregando auditoria…</strong></div>}
    {estado === 'pronto' && !eventos.length && <div className="empty-state-card"><strong>Nenhum evento encontrado</strong><p>Ajuste os filtros ou aguarde novos eventos.</p></div>}
    {estado === 'pronto' && eventos.length > 0 && <div className="audit-list">{eventos.map((evento) => <article className="audit-event-card" key={evento.id}><div><strong>{evento.acao}</strong><span>{evento.modulo} · {evento.entidade_tipo}</span></div><time>{new Date(evento.criado_em).toLocaleString('pt-BR')}</time><small>{evento.severidade} · {evento.status} · {evento.origem}</small></article>)}</div>}
    <div className="audit-pagination"><button disabled={pagina === 0} onClick={() => setPagina((v) => v - 1)}>Anterior</button><span>{total ? `${pagina * PAGE_SIZE + 1}–${Math.min((pagina + 1) * PAGE_SIZE, total)} de ${total}` : '0 eventos'}</span><button disabled={(pagina + 1) * PAGE_SIZE >= total} onClick={() => setPagina((v) => v + 1)}>Próxima</button></div>
  </section>
}
