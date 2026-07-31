import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const pageSources = fs.readdirSync(path.join(root, 'src/pages'))
  .filter((name) => name.endsWith('.jsx'))
  .map((name) => [name, read(`src/pages/${name}`)])

test('padrões compartilhados oferecem cabeçalho, filtros, seções, tabela, estados e exportação', () => {
  const source = read('src/components/shared/PagePatterns.jsx')
  for (const component of ['PageHeader', 'PageActions', 'ExportMenu', 'FilterCard', 'FilterGrid', 'SectionCard', 'DataTableRegion', 'PageState']) {
    assert.match(source, new RegExp(`export function ${component}\\b`))
  }
  assert.match(source, /aria-label="Abrir opções de exportação"/)
  assert.match(source, /role="region"/)
})

test('componentes reutilizáveis possuem uso real em pelo menos três páginas', () => {
  const allPages = pageSources.map(([, source]) => source).join('\n')
  const count = (name) => (allPages.match(new RegExp(`<${name}\\b`, 'g')) || []).length
  assert.ok(count('PageHeader') >= 3)
  assert.ok(count('ExportMenu') >= 3)
  assert.ok(count('FilterCard') >= 3)
})

test('exportações existentes usam um único controle Exportar em vez de botões dispersos', () => {
  const sources = [
    'src/pages/AnaliseFinanceiraPage.jsx',
    'src/pages/ContasPage.jsx',
    'src/pages/ControleImpostosPage.jsx',
    'src/pages/FluxoCaixaPage.jsx',
    'src/pages/AuditoriaPage.jsx',
    'src/modules/folha/components/fechamento/FolhaExportacoes.jsx',
  ].map(read)
  for (const source of sources) assert.match(source, /<ExportMenu\b/)
  assert.doesNotMatch(sources.join('\n'), />\s*Exportar (?:CSV|Excel|XLSX|PDF)\s*</)
})

test('exportação fica indisponível sem dados válidos ou durante carregamento', () => {
  const sources = [
    read('src/pages/AnaliseFinanceiraPage.jsx'),
    read('src/pages/ContasPage.jsx'),
    read('src/pages/ControleImpostosPage.jsx'),
    read('src/pages/FluxoCaixaPage.jsx'),
    read('src/pages/AuditoriaPage.jsx'),
  ].join('\n')
  assert.match(sources, /controller\.carregado && !controller\.carregando && !controller\.erro/)
  assert.match(sources, /loading \|\| loadingConsultaContas \|\| contasFiltradas\.length === 0/)
  assert.match(sources, /disabled=\{!exportacaoDisponivel\}/)
  assert.match(sources, /disabled=\{!dadosDisponiveis \|\| !possuiMovimentos\}/)
  assert.match(sources, /disabled=\{!eventos\.length \|\| estado !== 'pronto'\}/)
})

test('contrato responsivo impede overflow da página e confina tabelas', () => {
  const css = read('src/components/shared/PagePatterns.css')
  assert.match(css, /\.app-frame-content\s*\{[\s\S]*?overflow-x:\s*clip/)
  assert.match(css, /\.df-data-region-scroll\s*\{[\s\S]*?overflow-x:\s*auto/)
  assert.match(css, /@media \(max-width: 640px\)/)
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\)/)
  const mobile = css.slice(css.indexOf('@media (max-width: 640px)'))
  assert.doesNotMatch(mobile, /(?:^|[;{])\s*width:\s*\d+px/)
})

test('cabeçalhos padronizados cobrem páginas gerenciais, operacionais e administrativas', () => {
  const representatives = [
    'src/pages/AnaliseFinanceiraPage.jsx',
    'src/pages/ContasPage.jsx',
    'src/pages/ReceitasPage.jsx',
    'src/pages/ConfiguracoesPage.jsx',
    'src/pages/UsuariosPage.jsx',
    'src/pages/FiliaisPage.jsx',
  ]
  for (const file of representatives) assert.match(read(file), /<PageHeader\b/)
  assert.match(read('src/modules/central-do-dia/components/agenda/AgendaOperacional.jsx'), /<PageHero\b/)
})

test('estados compartilhados distinguem vazio, carregamento e erro', () => {
  const component = read('src/components/shared/PagePatterns.jsx')
  assert.match(component, /type === 'error' \? 'alert' : 'status'/)
  assert.match(component, /aria-busy=\{type === 'loading'/)
  const analysis = read('src/pages/AnaliseFinanceiraPage.jsx')
  assert.match(analysis, /<PageState type="error"/)
  assert.match(analysis, /<PageState type="loading"/)
  assert.match(analysis, /<PageState title="Nenhum registro no recorte"/)
})
