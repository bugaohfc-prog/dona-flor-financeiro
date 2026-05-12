const styles = {
  usuarioTopo: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    border: '1px solid #d8eee9',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 10px 24px rgba(15,118,110,0.10)',
    position: 'relative',
    zIndex: 20
  },
  logoMarca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    color: '#064e3b'
  },
  logoIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: '#e8f5ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    boxShadow: 'inset 0 0 0 1px #cfe8da'
  },
  logoImagem: {
    width: 48,
    height: 48,
    borderRadius: 16,
    objectFit: 'cover',
    background: '#0f766e',
    boxShadow: '0 8px 18px rgba(20,184,166,0.28)'
  },
  logoTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    lineHeight: 1.05
  },
  usuarioAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  usuarioTexto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: 13,
    color: '#1f2937'
  },
  btnMenuTopo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 22,
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(15,23,42,0.08)'
  },
  menuBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.22)',
    zIndex: 4000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: '76px 12px 12px 12px'
  },
  menuNavegacao: {
    width: 'min(360px, 94vw)',
    height: 'auto',
    maxHeight: 'calc(100dvh - 96px)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    touchAction: 'pan-y',
    background: '#ffffff',
    border: '1px solid #d8eee9',
    borderRadius: 22,
    padding: 14,
    display: 'grid',
    gap: 8,
    boxShadow: '0 24px 60px rgba(15,23,42,0.25)'
  },
  menuPerfil: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)',
    color: '#064e3b',
    marginBottom: 4
  },
  menuPerfilIcone: {
    width: 46,
    height: 46,
    borderRadius: 16,
    objectFit: 'cover',
    background: '#0f766e'
  },
  menuSecaoTitulo: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 800,
    color: '#6b7280',
    padding: '10px 8px 2px'
  },
  menuNavItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    background: '#f8faf9',
    border: '1px solid #edf1ef',
    borderRadius: 16,
    padding: '12px 14px',
    fontSize: 15,
    color: '#064e3b'
  },
  menuSairItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 16,
    padding: '12px 14px',
    fontSize: 15,
    color: '#be123c',
    fontWeight: 700
  },
  agendaResumoCard: {
    background: '#ffffff',
    border: '1px solid #dfe7e2',
    borderLeft: '5px solid #14b8a6',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    display: 'grid',
    gap: 10
  },
  agendaResumoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    fontSize: 12,
    color: '#374151'
  },
  btnAgendaCompleta: {
    border: 'none',
    borderRadius: 10,
    background: '#14b8a6',
    color: '#fff',
    padding: '10px 12px',
    fontWeight: 'bold'
  },
  uploadExcelBox: {
    border: '2px dashed #99f6e4',
    background: '#f0fdfa',
    borderRadius: 16,
    padding: 24,
    textAlign: 'center',
    display: 'grid',
    gap: 6,
    color: '#0f766e',
    cursor: 'pointer'
  },
  importDicasGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    margin: '12px 0'
  },
  previewImportacao: {
    display: 'grid',
    gap: 8,
    marginBottom: 12
  },
  previewLinha: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 10,
    display: 'grid',
    gap: 4
  },
  alertaSucesso: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    borderRadius: 12,
    padding: 10,
    fontWeight: 'bold'
  },
  btnSair: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontWeight: 'bold'
  },
  overlayConfirmacao: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    zIndex: 3000
  },
  modalConfirmacao: {
    background: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
    textAlign: 'center'
  },
  confirmacaoIcone: {
    fontSize: 38,
    marginBottom: 8
  },
  confirmacaoTitulo: {
    margin: '4px 0 8px',
    fontSize: 20
  },
  confirmacaoTexto: {
    margin: '0 0 16px',
    color: '#444',
    lineHeight: 1.4
  },
  confirmacaoAcoes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  btnConfirmarCancelar: {
    border: 'none',
    borderRadius: 10,
    padding: 11,
    background: '#6c757d',
    color: '#fff',
    fontWeight: 'bold'
  },
  btnConfirmarAcao: {
    border: 'none',
    borderRadius: 10,
    padding: 11,
    color: '#fff',
    fontWeight: 'bold'
  },
  headerExpansivel: {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 14,
    padding: '12px 14px',
    margin: '12px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  page: {
    padding: 16,
    maxWidth: 700,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: 100
  },
  titulo: { fontSize: 28, marginBottom: 12 },
  subtitulo: { fontSize: 22, marginBottom: 12 },
  bloco: { marginTop: 24 },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 12
  },
  boxTotal: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  boxPago: {
    background: '#d4edda',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxPendente: {
    background: '#fff3cd',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxVencido: {
    background: '#f8d7da',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  filtrosBox: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 8,
    boxSizing: 'border-box'
  },
  datas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8
  },
  filtros: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8
  },
  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '7px 11px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer'
  },
  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },
  resumoFiltro: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 14
  },
  cardConta: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 18,
    marginBottom: 4
  },
  cardInfo: {
    fontSize: 13,
    opacity: 0.75
  },
  cardDashboard: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 6,
    fontSize: 13
  },
  cardConfiguracao: {
    background: '#fff',
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  switchLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  configResumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontSize: 13,
    background: '#f8fafc',
    padding: 10,
    borderRadius: 10
  },
  cardAgenda: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  itemAgenda: {
    background: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  agendaDireita: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6
  },
  textoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#444',
    fontWeight: 'bold'
  },
  textoVencidoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#dc3545',
    fontWeight: 'bold'
  },
  cardLixeira: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  textoQuarentena: {
    display: 'block',
    marginTop: 8,
    color: '#64748b',
    fontWeight: 700
  },
  textoLiberado: {
    display: 'block',
    marginTop: 8,
    color: '#64748b',
    fontWeight: 700
  },
  cardNota: {
    background: '#eef2ff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  textoNota: {
    fontSize: 14,
    whiteSpace: 'pre-wrap'
  },
  acoes: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8
  },
  mensagemVazia: {
    fontSize: 13,
    opacity: 0.7
  },
  btnPago: {
    minHeight: 38,
    minWidth: 74,
    background: '#0f766e',
    color: '#fff',
    border: '1px solid #0f766e',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnVoltar: {
    minHeight: 38,
    minWidth: 74,
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnEditar: {
    minHeight: 38,
    minWidth: 74,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnExcluir: {
    minHeight: 38,
    minWidth: 74,
    background: '#fff1f2',
    color: '#e11d48',
    border: '1px solid #fecdd3',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSecundario: {
    background: '#f8fafc',
    color: '#0f766e',
    border: '1px solid #99f6e4',
    padding: '6px 10px',
    borderRadius: 8,
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnCinza: {
    background: '#64748b',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnRoxo: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnVerde: {
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  fab: {
    position: 'fixed',
    right: 22,
    bottom: 22,
    width: 54,
    height: 54,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.22)',
    fontSize: 28,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 38px rgba(15, 118, 110, 0.28)',
    zIndex: 3000,
    cursor: 'pointer'
  },
  menuFab: {
    position: 'fixed',
    right: 20,
    bottom: 86,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 3001
  },
  menuItem: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '0 14px',
    minWidth: 190,
    width: 190,
    height: 48,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'visible',
    cursor: 'pointer'
  },
  menuItemIcone: {
    display: 'inline-flex',
    width: 26,
    minWidth: 26,
    justifyContent: 'center',
    fontSize: 18,
    lineHeight: 1
  },
  menuItemTexto: {
    display: 'inline-block',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999
  },
  blocoNotificacaoConta: {
    background: '#f8fafc',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  blocoRecorrenciaConta: {
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  switchLinhaCompacta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e5e5',
    fontSize: 14
  },
  textoAjuda: {
    display: 'block',
    color: '#666',
    fontSize: 11,
    marginTop: 4
  },
  notificacaoChips: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 6
  },
  chipNotif: {
    background: '#eef6ff',
    color: '#0d6efd',
    border: '1px solid #b6d4fe',
    borderRadius: 999,
    padding: '3px 7px',
    fontSize: 11,
    fontWeight: 'bold'
  },
  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 14,
    width: '100%',
    maxWidth: 360
  },
  inputModal: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  textareaModal: {
    width: '100%',
    minHeight: 110,
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontFamily: 'Arial'
  },
  btnGhostAction: {
    width: 'auto',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '7px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    marginBottom: 0
  },
  btnSalvar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#14b8a6',
    color: '#fff',
    marginBottom: 8
  },
  btnCancelar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#6c757d',
    color: '#fff'
  },
  itemCentro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f1f1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13
  },
  btnMiniExcluir: {
    background: '#fee2e2',
    color: '#ef4444',
    border: '1px solid #f87171',
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 11
  },
  notasHeaderNovo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10
  },
  btnMiniVerde: {
    background: '#0f766e',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '6px 11px',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 1
  },
  notasListaNova: {
    display: 'grid',
    gap: 10
  },
  cardNotaAcao: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    border: '1px solid #e5e7eb',
    boxShadow: '0 8px 20px rgba(15,23,42,0.06)'
  },
  cardNotaNormal: {
    background: '#f8fafc',
    borderColor: '#e5e7eb'
  },
  cardNotaUrgente: {
    background: '#fffbeb',
    borderColor: '#fde68a'
  },
  cardNotaCritico: {
    background: '#fff7f7',
    borderColor: '#fecaca'
  },
  badgePrioridade: {
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: '900'
  },
  badgeNormal: {
    background: '#f1f5f9',
    color: '#475569'
  },
  badgeUrgente: {
    background: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a'
  },
  badgeCritico: {
    background: '#fff7f7',
    color: '#991b1b',
    border: '1px solid #fecaca'
  }

}

export default styles
