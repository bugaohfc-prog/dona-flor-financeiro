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
  assert.match(source, /import \{ PageHeader \} from/)
  assert.match(source, /<PageHeader[\s\S]*?kicker="Operação"[\s\S]*?title="Notas"/)
  assert.match(source, /Acompanhamento de pendências, lembretes e observações operacionais\./)
  assert.doesNotMatch(source, /notes-redesign-header|Opera&#|pend&#/)
})

test('Receitas usa grids responsivos sem larguras mínimas que cortem campos', () => {
  const source = read('src/pages/ReceitasPage.jsx')
  assert.match(source, /\.receitas-filtros \{ display: grid; grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/)
  assert.match(source, /\.receitas-form \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(source, /@media \(max-width: 900px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(source, /@media \(max-width: 640px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(source, /\.receitas-form label\.wide \{ grid-column: 1 \/ -1; min-width: 0; \}/)
  assert.doesNotMatch(source, /\.receitas-form label \{[^}]*min-width: 170px/)
})

test('checkboxes e radios ficam fora do contrato dimensional de campos textuais', () => {
  const css = read('src/components/shared/PagePatterns.css')
  assert.match(css, /input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\)/)
  assert.match(css, /input\[type='checkbox'\][\s\S]*?width: 22px;[\s\S]*?height: 22px;/)
  assert.match(css, /label:has\(> :is\(input\[type='checkbox'\], input\[type='radio'\], \[role='switch'\]\)\)/)
})

test('valores monetários do Dashboard não quebram e usam uma coluna até 420px', () => {
  const css = read('src/styles.css')
  assert.match(css, /\.dashboard-home-kpi strong \{[\s\S]*?white-space: nowrap;/)
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.dashboard-home-kpi-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
})

test('kickers dos cabeçalhos escuros têm contraste explícito e escopo restrito', () => {
  const css = read('src/components/shared/PagePatterns.css')
  assert.match(css, /\.df-page-kicker,[\s\S]*?color: #ccfbf1 !important;/)
  assert.match(css, /\.importacao-page > header[\s\S]*?\.ferias-kicker[\s\S]*?color: #ccfbf1 !important;/)
  assert.doesNotMatch(css, /(?:^|\n)span\s*\{[^}]*color: #ccfbf1/)
})
