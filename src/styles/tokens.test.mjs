import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const tokensCss = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const baseCss = readFileSync(new URL('./base.css', import.meta.url), 'utf8')
const pagePatternsCss = readFileSync(
  new URL('../components/shared/PagePatterns.css', import.meta.url),
  'utf8',
)
const appSource = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
const appShellSource = readFileSync(
  new URL('../components/shell/AppShell.jsx', import.meta.url),
  'utf8',
)
const domainCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

const TOKENS_COMPARTILHADOS = [
  ...tokensCss.matchAll(/(--df-[a-z0-9-]+)\s*:/g),
].map((match) => match[1])

function contarDefinicoes(conteudo, token) {
  return [...conteudo.matchAll(new RegExp(`${token}\\s*:`, 'g'))].length
}

test('cada token compartilhado possui uma unica definicao na camada de estilos', () => {
  const camadas = [tokensCss, baseCss, pagePatternsCss, domainCss]

  for (const token of TOKENS_COMPARTILHADOS) {
    const total = camadas.reduce(
      (quantidade, conteudo) => quantidade + contarDefinicoes(conteudo, token),
      0,
    )
    assert.equal(total, 1, `${token} deve possuir uma unica definicao`)
    assert.equal(contarDefinicoes(tokensCss, token), 1)
  }
})

test('App carrega tokens, base, componentes e dominio nessa ordem', () => {
  const imports = [
    "import './styles/tokens.css'",
    "import './styles/base.css'",
    "import './components/shared/PagePatterns.css'",
    "import './styles.css'",
  ]
  const posicoes = imports.map((item) => appSource.indexOf(item))

  assert.ok(posicoes.every((posicao) => posicao >= 0))
  assert.deepEqual(posicoes, [...posicoes].sort((a, b) => a - b))
})

test('camadas antigas nao importam novamente base ou componentes compartilhados', () => {
  assert.doesNotMatch(domainCss, /@import\s+['"]\.\/styles\/base\.css['"]/)
  assert.doesNotMatch(appShellSource, /import\s+['"]\.\.\/shared\/PagePatterns\.css['"]/)
})

test('base e PagePatterns consomem tokens sem redefinir variaveis compartilhadas', () => {
  for (const token of TOKENS_COMPARTILHADOS) {
    assert.equal(contarDefinicoes(baseCss, token), 0)
    assert.equal(contarDefinicoes(pagePatternsCss, token), 0)
  }
})
