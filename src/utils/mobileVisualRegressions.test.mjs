import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  resolverAcoesFlutuantesAppShell,
  ROTAS_COM_ACOES_FLUTUANTES,
} from './appShellLayout.js'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

test('Contas oculta o FAB e oferece Nova conta no cabeçalho com a permissão existente', () => {
  assert.equal(ROTAS_COM_ACOES_FLUTUANTES.includes('contas'), false)
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ telaAtual: 'contas' }), {
    bloqueioInteracaoAtivo: false,
    mostrarFab: false,
  })

  const app = read('src/App.jsx')
  const contas = read('src/pages/ContasPage.jsx')
  assert.match(app, /<LazyContasPage[\s\S]*?abrirNovaConta=\{abrirNovaConta\}/)
  assert.match(contas, /podeEditarFinanceiro && abrirNovaConta/)
  assert.match(contas, />Nova conta<\/button>/)
})

test('Notas usa diretamente o cabeçalho compartilhado com conteúdo legível', () => {
  const source = read('src/pages/NotasPage.jsx')
  const css = read('src/pages/NotasPage.css')
  assert.match(source, /import \{ PageHeader \} from/)
  assert.match(source, /import '\.\/NotasPage\.css'/)
  assert.match(source, /<PageHeader[\s\S]*?kicker="Operação"[\s\S]*?title="Notas"/)
  assert.match(source, /Acompanhamento de pendências, lembretes e observações operacionais\./)
  assert.doesNotMatch(source, /notes-redesign-header|Opera&#|pend&#/)
  assert.doesNotMatch(source, /styles\./)
  assert.match(css, /\.notes-page-section/)
  assert.doesNotMatch(css, /notes-redesign/)
})

test('Receitas usa grids responsivos sem larguras mínimas que cortem campos', () => {
  const source = read('src/pages/ReceitasPage.jsx')
  const css = read('src/pages/ReceitasPage.css')
  assert.match(source, /import '\.\/ReceitasPage\.css'/)
  assert.doesNotMatch(source, /const cssReceitas|<style/)
  assert.match(source, /<DataTableRegion[\s\S]*?className="receitas-table-region"/)
  assert.doesNotMatch(source, /receitas-mobile-list/)
  assert.match(css, /\.receitas-filtros[\s\S]*?grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.receitas-form[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(css, /\.receitas-form label\.wide[\s\S]*?grid-column: 1 \/ -1/)
  assert.doesNotMatch(css, /\.receitas-form label \{[^}]*min-width: 170px/)
})

test('Contas concentra o layout de filtros no CSS de domínio sem estilos inline estáticos', () => {
  const source = read('src/pages/ContasPage.jsx')
  const css = read('src/pages/ContasPage.css')
  const globalCss = read('src/styles.css')

  assert.match(source, /<FilterCard[\s\S]*?accounts-tabs-groups[\s\S]*?accounts-horizon-control[\s\S]*?accounts-search-row[\s\S]*?accounts-filter-controls[\s\S]*?advanced-filters/)
  assert.doesNotMatch(source, /styles\./)
  assert.match(css, /\.accounts-control-panel\.filters-desktop[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(css, /\.accounts-filter-controls[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 320px\)/)
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.accounts-filter-controls,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
  assert.doesNotMatch(globalCss, /\/\* Contas - contrato visual \*\/|\/\* Contas - harmonizacao visual final \*\//)
  assert.doesNotMatch(globalCss, /\.accounts-period-(?:group|header|copy|toggle|list|more)\b/)
})

test('estilos de página removidos do global permanecem isolados nos domínios', () => {
  const globalCss = read('src/styles.css')
  assert.doesNotMatch(globalCss, /\/\* Notas - redesenho visual \*\//)
  assert.doesNotMatch(globalCss, /\.notes-page-section\b/)
  assert.doesNotMatch(globalCss, /\.receitas-(?:page|filtros|form|table-region)\b/)
})

test('checkboxes e radios ficam fora do contrato dimensional de campos textuais', () => {
  const css = read('src/components/shared/PagePatterns.css')
  assert.match(css, /input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\)/)
  assert.match(css, /input\[type='checkbox'\][\s\S]*?width: 22px;[\s\S]*?height: 22px;/)
  assert.match(css, /label:has\(> :is\(input\[type='checkbox'\], input\[type='radio'\], \[role='switch'\]\)\)/)
})

test('valores monetários do Dashboard não quebram e usam uma coluna até 420px', () => {
  const css = read('src/components/dashboard/DashboardHome.css')
  assert.match(css, /\.dashboard-finance-kpis \.df-kpi-value \{[^}]*white-space: nowrap;/)
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.dashboard-finance-kpis \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
})

test('kickers dos cabeçalhos escuros têm contraste explícito e escopo restrito', () => {
  const css = read('src/components/shared/PagePatterns.css')
  assert.match(css, /\.df-page-kicker,[\s\S]*?color: #ccfbf1 !important;/)
  assert.match(css, /\.importacao-page > header[\s\S]*?\.ferias-kicker[\s\S]*?color: #ccfbf1 !important;/)
  assert.doesNotMatch(css, /(?:^|\n)span\s*\{[^}]*color: #ccfbf1/)
})
