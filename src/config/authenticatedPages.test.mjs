import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const navigation = await import(pathToFileURL(`${root}/src/utils/navigation.js`).href)
const inventory = await import(pathToFileURL(`${root}/src/config/authenticatedPages.js`).href)

test('inventário visual cobre todas as rotas autenticadas permitidas', () => {
  const inventariadas = new Set(inventory.INVENTARIO_PAGINAS_AUTENTICADAS.map((pagina) => pagina.tela))
  assert.deepEqual([...inventariadas].sort(), [...navigation.TELAS_NAVEGACAO_PERMITIDAS].sort())
})

test('inventário classifica páginas e registra apenas exportações existentes', () => {
  const categorias = new Set(Object.values(inventory.CATEGORIAS_PAGINA_AUTENTICADA))
  assert.ok(inventory.INVENTARIO_PAGINAS_AUTENTICADAS.every((pagina) => categorias.has(pagina.categoria)))
  assert.deepEqual(inventory.obterInventarioPaginaAutenticada('controle-impostos').exportacoes, ['CSV'])
  assert.equal(inventory.obterInventarioPaginaAutenticada('receitas').exportacoes, undefined)
  assert.equal(inventory.obterInventarioPaginaAutenticada('relatorios').aliasDe, 'relatorios-contas')
})

test('shell carrega os tokens compartilhados para todas as páginas autenticadas', () => {
  const source = fs.readFileSync(`${root}/src/components/shell/AppShell.jsx`, 'utf8')
  assert.match(source, /shared\/PagePatterns\.css/)
  assert.match(source, /app-frame-content/)
})
