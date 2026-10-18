import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const componente = readFileSync(new URL('./ResumoOperacionalDashboard.jsx', import.meta.url), 'utf8')

test('nao exibe alerta quando o mapa de erros esta vazio', () => {
  assert.match(componente, /fontesIndisponiveis\.length > 0/)
  assert.doesNotMatch(componente, /!carregando && erroParcial &&/)
})

test('mantem o alerta para fontes com falha real', () => {
  assert.match(componente, /Object\.keys\(erroParcial\)\.filter\(\(fonte\) => erroParcial\[fonte\]\)/)
  assert.match(componente, /Parte das informações está indisponível/)
})

test('mantem os demais dados do resumo operacional renderizados', () => {
  assert.match(componente, /aria-label="Contadores de obrigações operacionais"/)
  assert.match(componente, /CONTADORES\.map/)
  assert.match(componente, /prioridades\.map/)
})
