const menuSections = [
  {
    id: 'principal',
    titulo: 'Principal',
    items: [
      { tela: 'dashboard', icon: '🏠', label: 'Painel', desc: 'Resumo financeiro' },
      { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Vencimentos e previsões' },
      { tela: 'notas', icon: '📝', label: 'Notas', desc: 'Pendências e histórico de notas' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: '💳', label: 'Contas', desc: 'Contas a pagar e filtros' }
    ]
  },
  {
    id: 'analise',
    titulo: 'Análise',
    items: [
      { tela: 'relatorios', icon: '📊', label: 'Relatórios', desc: 'Análises e indicadores' }
    ]
  },
  {
    id: 'master',
    titulo: 'Master',
    items: [
      { tela: 'master-empresas', icon: '🏢', label: 'Empresas', desc: 'Administração de empresas', masterOnly: true }
    ]
  },
  ]

export default menuSections
