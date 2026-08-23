import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

test('Funcionários e Férias possuem autoridade CSS própria sem estilos globais', () => {
  const app = read('src/App.jsx')
  const funcionarios = read('src/pages/FuncionariosPage.jsx')
  const ferias = read('src/pages/FeriasPage.jsx')
  const patterns = read('src/components/shared/PagePatterns.css')
  const globalCss = read('src/styles.css')

  assert.match(funcionarios, /import '\.\/FuncionariosPage\.css'/)
  assert.match(ferias, /import '\.\/FeriasPage\.css'/)
  assert.doesNotMatch(funcionarios, /\bstyles\b|style=/)
  assert.doesNotMatch(ferias, /\bstyles\b|style=|<style>/)
  assert.doesNotMatch(app, /<LazyFuncionariosPage[^>]*styles=\{styles\}/)
  assert.doesNotMatch(app, /<LazyFeriasPage[^>]*styles=\{styles\}/)
  assert.doesNotMatch(patterns, /\.(?:funcionarios|funcionario|ferias)-/)
  assert.doesNotMatch(globalCss, /\.(?:funcionarios|funcionario|ferias)-/)
})

test('Funcionários usa os padrões compartilhados para cabeçalho, filtros, KPIs e estados', () => {
  const source = read('src/pages/FuncionariosPage.jsx')

  assert.match(source, /import \{[\s\S]*?FilterCard[\s\S]*?FilterGrid[\s\S]*?KpiCard[\s\S]*?KpiGrid[\s\S]*?PageHeader[\s\S]*?PageState/)
  assert.match(source, /<PageHeader[\s\S]*?title="Funcionários"/)
  assert.match(source, /<FilterCard[\s\S]*?<FilterGrid/)
  assert.match(source, /<KpiGrid[\s\S]*?label="Equipe ativa"[\s\S]*?label="Afastados"[\s\S]*?label="Aniversariantes"[\s\S]*?label="Inativos"/)
  assert.match(source, /<PageState type="loading"/)
  assert.match(source, /<PageState type="error"/)
  assert.match(source, /<PageState[\s\S]*?Nenhum funcionário encontrado/)
})

test('modal de Funcionários mantém rolagem interna e largura limitada no mobile', () => {
  const source = read('src/pages/FuncionariosPage.jsx')
  const css = read('src/pages/FuncionariosPage.css')

  assert.match(source, /role="dialog"/)
  assert.match(source, /aria-modal="true"/)
  assert.match(css, /\.funcionario-modal \{[\s\S]*?width: min\(920px, 100%\);[\s\S]*?max-height: calc\(100dvh - 36px\);[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;/)
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?\.funcionario-modal \{[^}]*width: 100%;[^}]*max-height: calc\(100dvh - 16px\);/)
  assert.match(css, /\.funcionario-modal-header \{[^}]*position: sticky;/)
  assert.match(css, /\.funcionario-modal-actions \{[^}]*position: sticky;/)
})

test('Férias preserva um único DOM responsivo com estados explícitos', () => {
  const source = read('src/pages/FeriasPage.jsx')
  const css = read('src/pages/FeriasPage.css')

  assert.match(source, /<PageHeader[\s\S]*?title="Férias"/)
  assert.match(source, /type="loading"[\s\S]*?Carregando colaboradores/)
  assert.match(source, /type="error"[\s\S]*?Nao foi possivel carregar/)
  assert.match(source, /Nenhum colaborador encontrado/)
  assert.doesNotMatch(source, /mobile-(?:list|only)|desktop-(?:list|only)/)
  assert.match(css, /\.ferias-page-grid \{[^}]*grid-template-columns: minmax\(220px, \.68fr\) minmax\(0, 1\.55fr\)/)
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.ferias-page-grid,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?\.ferias-form-grid,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
})

test('CSS dos dois domínios evita overflow estrutural e novas exceções de cascata', () => {
  const funcionariosCss = read('src/pages/FuncionariosPage.css')
  const feriasCss = read('src/pages/FeriasPage.css')

  for (const css of [funcionariosCss, feriasCss]) {
    assert.match(css, /width: 100%;/)
    assert.match(css, /min-width: 0;/)
    assert.match(css, /max-width: 100%;/)
    assert.doesNotMatch(css, /!important/)
  }
})

test('ações cadastrais e de férias continuam conectadas aos hooks reais', () => {
  const funcionarios = read('src/pages/FuncionariosPage.jsx')
  const ferias = read('src/pages/FeriasPage.jsx')

  assert.match(funcionarios, /useFuncionarios\(/)
  assert.match(funcionarios, /useFuncionariosExamesOcupacionais\(/)
  assert.match(funcionarios, /criarFuncionario/)
  assert.match(funcionarios, /arquivarFuncionario/)
  assert.match(funcionarios, /reativarFuncionario/)
  assert.match(ferias, /useFuncionarios\(/)
  assert.match(ferias, /useFuncionariosFerias\(/)
  assert.match(ferias, /criarCiclo/)
  assert.match(ferias, /criarPeriodo/)
  assert.match(ferias, /arquivarPeriodo/)
  assert.match(ferias, /reativarPeriodo/)
})
