import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHero from '../components/shared/PageHero.jsx'
import { supabase } from '../lib/supabase'
import { createXlsxBlob, downloadBlob } from '../services/export/reportExportService'
import { listarUsuariosEmpresa, normalizarPerfilUsuario } from '../services/usuariosService'

const MODULOS = [
  ['financeiro', 'Financeiro']
]

const ACOES = [
  ['financeiro.conta.criada', 'Conta criada'],
  ['financeiro.conta.atualizada', 'Conta atualizada'],
  ['financeiro.pagamento_parcial.criado', 'Pagamento parcial criado']
]

const ENTIDADES = [
  ['df_contas', 'Conta'],
  ['df_contas_pagamentos', 'Pagamento parcial']
]

const SEVERIDADES = [['info', 'Informação'], ['warning', 'Atenção'], ['critical', 'Crítico']]
const STATUS = [['sucesso', 'Sucesso'], ['falha', 'Falha'], ['bloqueado', 'Bloqueado']]
const ORIGENS = [['app', 'Aplicação'], ['edge_function', 'Função do servidor'], ['sistema', 'Sistema']]
const TAMANHOS_PAGINA = [25, 50, 100]
const FILTROS_INICIAIS = { inicio: '', fim: '', modulo: '', acao: '', entidade_tipo: '', user_id: '', severidade: '', status: '' }

const mapa = (opcoes) => Object.fromEntries(opcoes)
const ROTULOS_MODULOS = mapa(MODULOS)
const ROTULOS_ACOES = mapa(ACOES)
const ROTULOS_ENTIDADES = mapa(ENTIDADES)
const ROTULOS_SEVERIDADES = mapa(SEVERIDADES)
const ROTULOS_STATUS = mapa(STATUS)
const ROTULOS_ORIGENS = mapa(ORIGENS)

function humanizarChave(chave) {
  return String(chave || '').replaceAll('_', ' ').replace(/\b\w/g, (letra) => letra.toUpperCase())
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_GLOBAL_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi

function protegerValorTecnico(valor) {
  if (Array.isArray(valor)) return valor.map(protegerValorTecnico)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([chave, conteudo]) => [chave, protegerValorTecnico(conteudo)]))
  }
  if (typeof valor === 'string') {
    if (UUID_PATTERN.test(valor.trim())) return 'Identificador protegido'
    return valor.replace(UUID_GLOBAL_PATTERN, 'Identificador protegido')
  }
  return valor
}

function formatarValorAuditoria(valor) {
  if (valor === undefined || valor === null || valor === '') return 'Não informado'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (Array.isArray(valor)) return valor.length ? valor.map(formatarValorAuditoria).join(', ') : 'Nenhum'
  if (typeof valor === 'object') {
    const entradas = Object.entries(protegerValorTecnico(valor))
    if (!entradas.length) return 'Nenhuma informação'
    return entradas.map(([chave, conteudo]) => `${humanizarChave(chave)}: ${formatarValorAuditoria(conteudo)}`).join(' · ')
  }
  const texto = String(protegerValorTecnico(valor))
  return texto.length > 280 ? `${texto.slice(0, 277)}…` : texto
}

function protegerCorrelationId(valor) {
  const partes = String(valor || '').split(':')
  const referencia = partes.at(-1) || ''
  return referencia ? `Operação …${referencia.slice(-8)}` : 'Operação protegida'
}

function linhasComparacao(antes, depois) {
  const valorAntes = antes && typeof antes === 'object' && !Array.isArray(antes) ? antes : {}
  const valorDepois = depois && typeof depois === 'object' && !Array.isArray(depois) ? depois : {}
  const chaves = [...new Set([...Object.keys(valorAntes), ...Object.keys(valorDepois)])]
  return chaves.map((chave) => ({
    chave,
    rotulo: humanizarChave(chave),
    antes: formatarValorAuditoria(valorAntes[chave]),
    depois: formatarValorAuditoria(valorDepois[chave])
  }))
}

function LinhasMetadados({ dados }) {
  const entradas = Object.entries(dados || {})
  if (!entradas.length) return <p className="audit-no-details">Nenhuma informação adicional registrada.</p>
  return <dl className="audit-metadata-list">
    {entradas.map(([chave, valor]) => <div key={chave}><dt>{humanizarChave(chave)}</dt><dd>{formatarValorAuditoria(valor)}</dd></div>)}
  </dl>
}

function OptionList({ opcoes }) {
  return opcoes.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)
}

export default function AuditoriaPage({ empresaId, permissoesUsuario, usuariosEmpresa = [], navegarPara }) {
  const [eventos, setEventos] = useState([])
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(50)
  const [total, setTotal] = useState(0)
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIAIS)
  const [estado, setEstado] = useState('carregando')
  const [erro, setErro] = useState('')
  const [eventoAberto, setEventoAberto] = useState(null)
  const [recarregar, setRecarregar] = useState(0)
  const [usuariosAuditoria, setUsuariosAuditoria] = useState(usuariosEmpresa)

  const autorizado = Boolean(permissoesUsuario?.isMaster || normalizarPerfilUsuario(permissoesUsuario?.perfilEmpresa) === 'admin')
  const responsaveis = useMemo(() => usuariosAuditoria
    .filter((usuario) => Boolean(usuario?.user_id))
    .map((usuario) => ({
      id: usuario.user_id,
      rotulo: String(usuario.nome || 'Usuário da empresa').trim()
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')), [usuariosAuditoria])
  const responsaveisPorId = useMemo(() => Object.fromEntries(
    responsaveis.map((responsavel) => [responsavel.id, responsavel.rotulo])
  ), [responsaveis])

  useEffect(() => {
    if (usuariosEmpresa.length > 0) setUsuariosAuditoria(usuariosEmpresa)
  }, [usuariosEmpresa])

  useEffect(() => {
    let cancelado = false
    if (!autorizado || !empresaId || usuariosAuditoria.length > 0) return undefined
    listarUsuariosEmpresa(empresaId)
      .then((usuarios) => { if (!cancelado) setUsuariosAuditoria(usuarios || []) })
      .catch(() => { if (!cancelado) setUsuariosAuditoria([]) })
    return () => { cancelado = true }
  }, [autorizado, empresaId, usuariosAuditoria.length])

  const carregar = useCallback(async () => {
    if (!autorizado) return
    if (!empresaId) {
      setEventos([])
      setTotal(0)
      setEstado('sem_empresa')
      return
    }
    setEstado('carregando')
    setErro('')

    let query = supabase
      .from('df_auditoria_eventos')
      .select('id,empresa_id,user_id,criado_em,modulo,acao,entidade_tipo,entidade_id,severidade,status,origem,motivo,metadados,dados_antes,dados_depois,correlation_id', { count: 'exact' })
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
      .range(pagina * porPagina, pagina * porPagina + porPagina - 1)

    for (const campo of ['modulo', 'acao', 'entidade_tipo', 'severidade', 'status']) {
      if (filtrosAplicados[campo]) query = query.eq(campo, filtrosAplicados[campo])
    }
    if (filtrosAplicados.user_id) query = query.eq('user_id', filtrosAplicados.user_id)
    if (filtrosAplicados.inicio) query = query.gte('criado_em', `${filtrosAplicados.inicio}T00:00:00-03:00`)
    if (filtrosAplicados.fim) query = query.lte('criado_em', `${filtrosAplicados.fim}T23:59:59.999-03:00`)

    const { data, error, count } = await query
    if (error) {
      setErro(error.message || 'Não foi possível carregar os eventos.')
      setEstado('erro')
      return
    }
    setEventos(data || [])
    setTotal(count || 0)
    setEstado('pronto')
  }, [autorizado, empresaId, filtrosAplicados, pagina, porPagina])

  useEffect(() => { carregar() }, [carregar, recarregar])

  useEffect(() => {
    if (!eventoAberto) return undefined
    const fecharComEscape = (evento) => {
      if (evento.key === 'Escape') setEventoAberto(null)
    }
    window.addEventListener('keydown', fecharComEscape)
    return () => window.removeEventListener('keydown', fecharComEscape)
  }, [eventoAberto])

  const aplicarFiltros = () => {
    if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
      setErro('A data final precisa ser igual ou posterior à data inicial.')
      setEstado('erro')
      return
    }
    setPagina(0)
    setFiltrosAplicados(filtros)
  }

  const limparFiltros = () => {
    setPagina(0)
    setFiltros(FILTROS_INICIAIS)
    setFiltrosAplicados(FILTROS_INICIAIS)
  }

  const exportarCsv = () => {
    const linhas = [['data', 'acao', 'modulo', 'entidade', 'severidade', 'status', 'origem'], ...eventos.map((evento) => [evento.criado_em, evento.acao, evento.modulo, evento.entidade_tipo, evento.severidade, evento.status, evento.origem])]
    const csv = linhas.map((linha) => linha.map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'auditoria-eventos.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const exportarXlsx = () => {
    const linhas = [['data', 'acao', 'modulo', 'entidade', 'severidade', 'status', 'origem'], ...eventos.map((evento) => [evento.criado_em, evento.acao, evento.modulo, evento.entidade_tipo, evento.severidade, evento.status, evento.origem])]
    downloadBlob('auditoria-eventos.xlsx', createXlsxBlob([{ name: 'Auditoria', rows: linhas }]))
  }

  if (!autorizado) {
    return <section className="page-section"><div className="empty-state-card" role="alert"><strong>Acesso restrito</strong><p>Somente Admin ou Master podem consultar a auditoria.</p><button type="button" className="admin-btn admin-btn-secondary" onClick={() => navegarPara('dashboard')}>Voltar ao painel</button></div></section>
  }

  return <section className="page-section audit-page">
    <PageHero
      kicker="Administração"
      title="Auditoria e logs"
      description="Acompanhe alterações e eventos operacionais da empresa em modo somente leitura."
      className="audit-page-hero"
      actions={<button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRecarregar((valor) => valor + 1)}>Atualizar</button>}
    />

    <section className="audit-filter-panel" aria-labelledby="audit-filter-title">
      <div className="audit-panel-heading"><div><span className="audit-section-kicker">Consulta</span><h2 id="audit-filter-title">Filtrar eventos</h2></div><span className="audit-result-count">{total} evento(s)</span></div>
      <div className="audit-toolbar">
        <label><span>Data inicial</span><input type="date" value={filtros.inicio} onChange={(e) => setFiltros((atual) => ({ ...atual, inicio: e.target.value }))} /></label>
        <label><span>Data final</span><input type="date" value={filtros.fim} onChange={(e) => setFiltros((atual) => ({ ...atual, fim: e.target.value }))} /></label>
        <label><span>Módulo</span><select value={filtros.modulo} onChange={(e) => setFiltros((atual) => ({ ...atual, modulo: e.target.value }))}><option value="">Todos os módulos</option><OptionList opcoes={MODULOS} /></select></label>
        <label><span>Ação</span><select value={filtros.acao} onChange={(e) => setFiltros((atual) => ({ ...atual, acao: e.target.value }))}><option value="">Todas as ações</option><OptionList opcoes={ACOES} /></select></label>
        <label><span>Tipo de registro</span><select value={filtros.entidade_tipo} onChange={(e) => setFiltros((atual) => ({ ...atual, entidade_tipo: e.target.value }))}><option value="">Todos os registros</option><OptionList opcoes={ENTIDADES} /></select></label>
        <label><span>Responsável</span><select value={filtros.user_id} onChange={(e) => setFiltros((atual) => ({ ...atual, user_id: e.target.value }))}><option value="">Todos os responsáveis</option>{responsaveis.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.rotulo}</option>)}</select></label>
        <label><span>Severidade</span><select value={filtros.severidade} onChange={(e) => setFiltros((atual) => ({ ...atual, severidade: e.target.value }))}><option value="">Todas as severidades</option><OptionList opcoes={SEVERIDADES} /></select></label>
        <label><span>Status</span><select value={filtros.status} onChange={(e) => setFiltros((atual) => ({ ...atual, status: e.target.value }))}><option value="">Todos os status</option><OptionList opcoes={STATUS} /></select></label>
      </div>
      <div className="audit-filter-actions">
        <button type="button" className="admin-btn admin-btn-primary" onClick={aplicarFiltros}>Aplicar filtros</button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={limparFiltros}>Limpar filtros</button>
      </div>
    </section>

    <div className="audit-list-toolbar">
      <label><span>Eventos por página</span><select value={porPagina} onChange={(e) => { setPagina(0); setPorPagina(Number(e.target.value)) }}>{TAMANHOS_PAGINA.map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select></label>
      <div className="audit-actions"><button type="button" className="admin-btn admin-btn-secondary" onClick={exportarCsv} disabled={!eventos.length}>Exportar CSV</button><button type="button" className="admin-btn admin-btn-secondary" onClick={exportarXlsx} disabled={!eventos.length}>Exportar XLSX</button></div>
    </div>

    {estado === 'erro' && <div className="empty-state-card" role="alert"><strong>Não foi possível concluir a consulta</strong><p>{erro}</p><button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRecarregar((valor) => valor + 1)}>Tentar novamente</button></div>}
    {estado === 'sem_empresa' && <div className="empty-state-card" role="alert"><strong>Selecione uma empresa</strong><p>Escolha uma empresa para consultar os eventos de auditoria.</p></div>}
    {estado === 'carregando' && <div className="empty-state-card" role="status" aria-live="polite"><strong>Carregando eventos…</strong><p>Aguarde enquanto consultamos o histórico.</p></div>}
    {estado === 'pronto' && !eventos.length && <div className="empty-state-card"><strong>Nenhum evento encontrado</strong><p>Não existem eventos para os filtros aplicados.</p></div>}
    {estado === 'pronto' && eventos.length > 0 && <div className="audit-list">{eventos.map((evento) => {
      const aberto = eventoAberto === evento.id
      const alteracoes = linhasComparacao(evento.dados_antes, evento.dados_depois)
      const responsavel = evento.user_id
        ? responsaveisPorId[evento.user_id] || 'Usuário não disponível'
        : evento.origem === 'sistema' ? 'Sistema' : 'Não informado'
      const acaoLegivel = ROTULOS_ACOES[evento.acao] || humanizarChave(evento.acao.replaceAll('.', ' '))
      const moduloLegivel = ROTULOS_MODULOS[evento.modulo] || humanizarChave(evento.modulo)
      const entidadeLegivel = ROTULOS_ENTIDADES[evento.entidade_tipo] || humanizarChave(evento.entidade_tipo)
      const severidadeLegivel = ROTULOS_SEVERIDADES[evento.severidade] || humanizarChave(evento.severidade)
      const statusLegivel = ROTULOS_STATUS[evento.status] || humanizarChave(evento.status)
      const origemLegivel = ROTULOS_ORIGENS[evento.origem] || humanizarChave(evento.origem)
      return <article className="audit-event-card" key={evento.id}>
        <button type="button" className="audit-event-toggle" aria-expanded={aberto} aria-controls={`evento-${evento.id}`} onClick={() => setEventoAberto(aberto ? null : evento.id)}>
          <span className="audit-event-header">
            <span className="audit-event-title">
              <strong>{acaoLegivel}</strong>
              <span className="audit-event-context"><span>{moduloLegivel}</span><span aria-hidden="true">·</span><span>{entidadeLegivel}</span></span>
            </span>
            <span className="audit-event-expand" aria-hidden="true">{aberto ? '−' : '+'}</span>
          </span>
          <time className="audit-event-date" dateTime={evento.criado_em}>{new Date(evento.criado_em).toLocaleString('pt-BR')}</time>
          <span className="audit-event-meta" aria-label="Classificação do evento">
            <span className={`audit-badge audit-badge-${evento.severidade || 'info'}`}>{severidadeLegivel}</span>
            <span className={`audit-badge audit-badge-${evento.status || 'sucesso'}`}>{statusLegivel}</span>
            <span className="audit-badge audit-badge-origin">{origemLegivel}</span>
          </span>
          <span className="audit-event-owner">Responsável: {responsavel}</span>
        </button>
        {aberto && <div className="audit-event-details" id={`evento-${evento.id}`}>
          <h3>Detalhes do evento</h3>
          <dl className="audit-event-summary">
            <div><dt>Responsável</dt><dd>{responsavel}</dd></div>
            <div><dt>Origem</dt><dd>{origemLegivel}</dd></div>
            <div><dt>Código do evento</dt><dd>{evento.acao}</dd></div>
            {evento.motivo && <div><dt>Motivo</dt><dd>{evento.motivo}</dd></div>}
            {evento.correlation_id && <div><dt>Referência</dt><dd>{protegerCorrelationId(evento.correlation_id)}</dd></div>}
          </dl>
          <section className="audit-change-section">
            <h4>Alterações registradas</h4>
            {alteracoes.length > 0
              ? <div className="audit-change-table" role="table" aria-label="Comparação entre valores anteriores e posteriores">
                  <div className="audit-change-header" role="row"><span role="columnheader">Campo</span><span role="columnheader">Antes</span><span role="columnheader">Depois</span></div>
                  {alteracoes.map((alteracao) => <div className="audit-change-row" role="row" key={alteracao.chave}><strong role="rowheader">{alteracao.rotulo}</strong><span data-label="Antes" role="cell">{alteracao.antes}</span><span data-label="Depois" role="cell">{alteracao.depois}</span></div>)}
                </div>
              : <p className="audit-no-details">Este evento não registrou alterações de campos.</p>}
          </section>
          {evento.metadados && Object.keys(evento.metadados).length > 0 && <section className="audit-event-metadata"><h4>Informações adicionais</h4><LinhasMetadados dados={evento.metadados} /></section>}
        </div>}
      </article>
    })}</div>}

    <nav className="audit-pagination" aria-label="Paginação dos eventos">
      <button type="button" className="admin-btn admin-btn-secondary" disabled={pagina === 0 || estado === 'carregando'} onClick={() => setPagina((valor) => valor - 1)}>Anterior</button>
      <span>{total ? `${pagina * porPagina + 1}–${Math.min((pagina + 1) * porPagina, total)} de ${total}` : '0 eventos'}</span>
      <button type="button" className="admin-btn admin-btn-secondary" disabled={(pagina + 1) * porPagina >= total || estado === 'carregando'} onClick={() => setPagina((valor) => valor + 1)}>Próxima</button>
    </nav>
  </section>
}
