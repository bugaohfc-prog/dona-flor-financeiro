// 🚀 RELATÓRIOS PRO — VERSÃO AVANÇADA
// Arquivo completo

import React from 'react'

export default function Relatorios() {

  // =========================
  // BLOCO 1 — MOCK (substitui depois pelo seu estado real)
  // =========================
  const total = 456
  const pago = 0
  const pendente = 456
  const vencido = 0

  const crescimento = 28.1

  // =========================
  // BLOCO 2 — SCORE INTELIGENTE
  // =========================
  let score = 100

  if (pendente > 0) score -= 20
  if (crescimento > 20) score -= 20

  let nivel = 'Saudável'
  let cor = '#198754'

  if (score < 70) {
    nivel = 'Atenção'
    cor = '#ffc107'
  }

  if (score < 50) {
    nivel = 'Crítico'
    cor = '#dc3545'
  }

  // =========================
  // BLOCO 3 — RESUMO EXECUTIVO
  // =========================
  function resumo() {
    if (pendente > 0) {
      return 'Existem valores pendentes. Priorize pagamentos para manter o controle financeiro.'
    }

    if (crescimento > 20) {
      return 'Os custos estão crescendo acima do esperado. Monitorar tendência.'
    }

    return 'Situação financeira controlada.'
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>📊 Relatórios PRO</h2>

      {/* SCORE */}
      <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
        <strong>Saúde financeira: {nivel}</strong>
        <div style={{ height: 8, background: '#eee', marginTop: 8 }}>
          <div style={{ width: score + '%', background: cor, height: 8 }} />
        </div>
        <small>{score}/100</small>
      </div>

      {/* RESUMO */}
      <div style={{ marginTop: 12, background: '#fff', padding: 12, borderRadius: 10 }}>
        <strong>Resumo executivo</strong>
        <p>{resumo()}</p>
      </div>

      {/* CARDS */}
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <div>Total: R$ {total}</div>
        <div>Pago: R$ {pago}</div>
        <div>Pendente: R$ {pendente}</div>
        <div>Vencido: R$ {vencido}</div>
      </div>

      {/* PREVISÃO */}
      <div style={{ marginTop: 12, background: '#fff', padding: 12 }}>
        <strong>📈 Previsão</strong>
        <p>
          Mantendo o ritmo atual, o próximo mês pode chegar em R$ {Math.round(total * 1.28)}
        </p>
      </div>

      {/* ALERTAS */}
      <div style={{ marginTop: 12 }}>
        {pendente > 0 && <p>⚠️ Existem contas pendentes</p>}
        {crescimento > 20 && <p>🚨 Crescimento acima do normal</p>}
      </div>

    </div>
  )
}
