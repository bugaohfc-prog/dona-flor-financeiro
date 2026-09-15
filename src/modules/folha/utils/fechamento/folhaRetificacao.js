export function competenciaPermiteRetificacao(competencia) {
  return Boolean(competencia && ['aberta', 'em_conferencia'].includes(competencia.status) && !competencia.fechado_em)
}

export function ocorrenciaPermiteRetificacao({ item, lancamento, competencia, podeEditar }) {
  return Boolean(podeEditar && item?.id && lancamento?.id && !item.arquivado && !lancamento.arquivado &&
    item.categoria === 'falta_injustificada' && lancamento.categoria === item.categoria &&
    item.lancamento_id === lancamento.id && competenciaPermiteRetificacao(competencia))
}

export function validarRetificacao({ destino, origemId, data, motivo }) {
  if (!competenciaPermiteRetificacao(destino) || destino.id === origemId) throw new Error('Selecione outra competência aberta ou em conferência.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '') || new Date(`${data}T12:00:00Z`).toISOString().slice(0, 10) !== data || data.slice(0, 7) !== destino.competencia) throw new Error('A data deve pertencer à competência destino.')
  if (!String(motivo || '').trim() || motivo.trim().length > 1000) throw new Error('Informe o motivo da retificação (até 1000 caracteres).')
}
