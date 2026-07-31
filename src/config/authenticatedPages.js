export const CATEGORIAS_PAGINA_AUTENTICADA = Object.freeze({
  GERENCIAL: 'gerencial',
  OPERACIONAL: 'operacional',
  CADASTRO: 'cadastro/formulario',
  ADMINISTRACAO: 'configuracao/administracao',
})

const { GERENCIAL, OPERACIONAL, CADASTRO, ADMINISTRACAO } = CATEGORIAS_PAGINA_AUTENTICADA

export const INVENTARIO_PAGINAS_AUTENTICADAS = Object.freeze([
  { tela: 'dashboard', categoria: GERENCIAL, componente: 'DashboardRouteComposition' },
  { tela: 'agenda', categoria: OPERACIONAL, componente: 'AgendaPage' },
  { tela: 'notas', categoria: OPERACIONAL, componente: 'NotasPage' },
  { tela: 'contas', categoria: OPERACIONAL, componente: 'ContasPage', exportacoes: ['CSV', 'Excel', 'PDF'] },
  { tela: 'receitas', categoria: OPERACIONAL, componente: 'ReceitasPage' },
  { tela: 'fluxo-caixa', categoria: GERENCIAL, componente: 'FluxoCaixaPage', exportacoes: ['CSV', 'Excel'] },
  { tela: 'relatorios-contas', categoria: GERENCIAL, componente: 'AnaliseFinanceiraPage', exportacoes: ['CSV', 'Excel', 'PDF compacto', 'PDF gerencial'] },
  { tela: 'relatorios', categoria: GERENCIAL, componente: 'AnaliseFinanceiraPage', aliasDe: 'relatorios-contas' },
  { tela: 'recorrencias', categoria: OPERACIONAL, componente: 'RecorrenciasFinanceirasPage' },
  { tela: 'controle-impostos', categoria: OPERACIONAL, componente: 'ControleImpostosPage', exportacoes: ['CSV'] },
  { tela: 'importar', categoria: OPERACIONAL, componente: 'ImportarPage' },
  { tela: 'funcionarios', categoria: CADASTRO, componente: 'FuncionariosPage' },
  { tela: 'ferias', categoria: OPERACIONAL, componente: 'FeriasPage' },
  { tela: 'fechamento-folha', categoria: OPERACIONAL, componente: 'FechamentoFolhaPage', exportacoes: ['Compras', 'Contabilidade'] },
  { tela: 'relatorios-gestao-pessoas', categoria: GERENCIAL, componente: 'RelatoriosGestaoPessoasPage' },
  { tela: 'relatorios-pessoas', categoria: GERENCIAL, componente: 'RelatoriosPessoasPage' },
  { tela: 'relatorios-ferias', categoria: GERENCIAL, componente: 'RelatoriosFeriasPage' },
  { tela: 'usuarios', categoria: ADMINISTRACAO, componente: 'UsuariosPage' },
  { tela: 'master-empresas', categoria: ADMINISTRACAO, componente: 'MasterPanelPage' },
  { tela: 'configuracoes', categoria: ADMINISTRACAO, componente: 'ConfiguracoesPage' },
  { tela: 'billing', categoria: ADMINISTRACAO, componente: 'BillingPage' },
  { tela: 'onboarding', categoria: CADASTRO, componente: 'OnboardingPage' },
  { tela: 'filiais', categoria: CADASTRO, componente: 'FiliaisPage' },
  { tela: 'lixeira', categoria: ADMINISTRACAO, componente: 'LixeiraPage' },
  { tela: 'auditoria', categoria: ADMINISTRACAO, componente: 'AuditoriaPage', exportacoes: ['CSV', 'XLSX'] },
])

export function obterInventarioPaginaAutenticada(tela) {
  return INVENTARIO_PAGINAS_AUTENTICADAS.find((pagina) => pagina.tela === tela) || null
}

export function listarPaginasComExportacao() {
  return INVENTARIO_PAGINAS_AUTENTICADAS.filter((pagina) => pagina.exportacoes?.length)
}
