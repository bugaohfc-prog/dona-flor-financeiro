import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ler = (caminho) => readFile(new URL(caminho, import.meta.url), 'utf8')

test('KpiCard preserva semântica estática e interativa acessível', async () => {
  const [componente, css] = await Promise.all([
    ler('../components/shared/PagePatterns.jsx'),
    ler('../components/shared/PagePatterns.css'),
  ])

  assert.match(componente, /export function KpiGrid/)
  assert.match(componente, /export function KpiCard/)
  assert.match(componente, /if \(onClick\)[\s\S]*?<button type="button"/)
  assert.match(componente, /return <article className=\{classes\}/)
  assert.match(componente, /disabled=\{disabled\}/)
  assert.match(css, /\.df-kpi-grid/)
  assert.match(css, /button\.df-kpi-card:focus-visible/)
})

test('as três áreas usam o mesmo padrão compartilhado de indicadores', async () => {
  const [dashboard, fluxo, analise] = await Promise.all([
    ler('../components/dashboard/DashboardHome.jsx'),
    ler('../pages/FluxoCaixaPage.jsx'),
    ler('../pages/AnaliseFinanceiraPage.jsx'),
  ])

  for (const fonte of [dashboard, fluxo, analise]) {
    assert.match(fonte, /KpiGrid/)
    assert.match(fonte, /KpiCard/)
  }
})

test('Dashboard financeiro possui CSS de domínio e não depende do global', async () => {
  const [dashboard, globalCss, css] = await Promise.all([
    ler('../components/dashboard/DashboardHome.jsx'),
    ler('../styles.css'),
    ler('../components/dashboard/DashboardHome.css'),
  ])

  assert.match(dashboard, /import '\.\/DashboardHome\.css'/)
  assert.match(css, /\.dashboard-finance-filters/)
  assert.match(css, /\.dashboard-priorities/)
  assert.doesNotMatch(globalCss, /dashboard-finance-|dashboard-priorities/)
})

test('Fluxo de Caixa usa CSS externo e uma única tabela por conjunto em todos os viewports', async () => {
  const [pagina, css] = await Promise.all([
    ler('../pages/FluxoCaixaPage.jsx'),
    ler('../pages/FluxoCaixaPage.css'),
  ])

  assert.match(pagina, /import '\.\/FluxoCaixaPage\.css'/)
  assert.doesNotMatch(pagina, /cssFluxoCaixa|<style>|fluxo-mobile-list/)
  assert.equal((pagina.match(/<table className="fluxo-table/g) || []).length, 2)
  assert.equal((pagina.match(/<DataTableRegion/g) || []).length, 2)
  assert.doesNotMatch(css, /fluxo-mobile-list|display:\s*none[^}]*fluxo-table/)
})

test('PagePatterns não conhece classes internas dos três domínios', async () => {
  const css = await ler('../components/shared/PagePatterns.css')
  assert.doesNotMatch(css, /(?:fluxo-caixa-|analise-|dashboard-)/)
})

test('Análise confina rolagem horizontal à região compartilhada da tabela', async () => {
  const [css, compartilhado] = await Promise.all([
    ler('../pages/AnaliseFinanceiraPage.css'),
    ler('../components/shared/PagePatterns.css'),
  ])

  assert.doesNotMatch(css, /overflow-x:\s*clip/)
  assert.doesNotMatch(css, /\.analise-table\s*\{[^}]*overflow-x:/)
  assert.match(compartilhado, /\.df-data-region-scroll\s*\{[^}]*overflow-x:\s*auto/)
})

test('cadeia do Dashboard remove somente totais financeiros legados sem tocar no loading operacional', async () => {
  const [rota, dashboard] = await Promise.all([
    ler('../components/routes/DashboardRoute.jsx'),
    ler('../components/dashboard/DashboardHome.jsx'),
  ])

  assert.doesNotMatch(rota, /\b(?:total|pago|pendente|vencido)=\{/)
  assert.doesNotMatch(dashboard, /loadingHistoricoFinanceiro|historicoFinanceiroCarregado|erroHistoricoFinanceiro|onRetryHistoricoFinanceiro/)
  assert.match(dashboard, /carregando=\{loading\}/)
})
