import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ler = (arquivo) => readFile(new URL(arquivo, import.meta.url), 'utf8')

test('Recorrencias possui CSS de dominio e nao depende de Contas ou appStyles', async () => {
  const [pagina, estilos, app] = await Promise.all([
    ler('../pages/RecorrenciasFinanceirasPage.jsx'),
    ler('../pages/RecorrenciasFinanceirasPage.css'),
    ler('../App.jsx')
  ])
  assert.doesNotMatch(pagina, /accounts-|content-block|style=\{styles|\bstyles[,}]/)
  assert.match(pagina, /recurring-management-panel/)
  assert.match(estilos, /\.recurring-management-controls/)
  assert.match(estilos, /@media \(max-width: 700px\)[\s\S]*?\.recurring-management-controls/)
  const composicao = app.slice(app.indexOf("if (telaAtual === 'recorrencias')"), app.indexOf("if (telaAtual === 'controle-impostos')"))
  assert.doesNotMatch(composicao, /styles=\{styles\}/)
})

test('Controle de Impostos carrega CSS proprio sem herdar classes de Contas', async () => {
  const [pagina, estilos] = await Promise.all([
    ler('../pages/ControleImpostosPage.jsx'),
    ler('../pages/ControleImpostosPage.css')
  ])
  assert.match(pagina, /import '\.\/ControleImpostosPage\.css'/)
  assert.doesNotMatch(pagina, /accounts-/)
  assert.match(estilos, /\.tax-control-section/)
  assert.match(estilos, /@media \(max-width: 700px\)/)
  assert.match(estilos, /max-width: 100%;\s*overflow-wrap: anywhere;/s)
})

test('padroes compartilhados e CSS global nao conhecem os dominios isolados', async () => {
  const [padroes, global] = await Promise.all([
    ler('../components/shared/PagePatterns.css'),
    ler('../styles.css')
  ])
  assert.doesNotMatch(padroes, /\.(?:recurring|tax-control)-/)
  assert.doesNotMatch(global, /\.(?:accounts-recurring|tax-control)-/)
})

test('App nao envia styles para Contas, Notas ou Recorrencias', async () => {
  const app = await ler('../App.jsx')
  for (const componente of ['LazyContasPage', 'LazyNotasPage', 'LazyRecorrenciasFinanceirasPage']) {
    const trecho = app.match(new RegExp(`<${componente}\\b[\\s\\S]*?\/>`))?.[0] || ''
    assert.ok(trecho, `${componente} deve permanecer composto no App`)
    assert.doesNotMatch(trecho, /styles=\{styles\}/)
  }
})
