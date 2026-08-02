function inteiroPositivo(valor, mensagem) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) throw new Error(mensagem)
  return numero
}

export function periodoFeriasConsomeSaldo(periodo) {
  return Boolean(periodo && !periodo.arquivado && periodo.status !== 'cancelada')
}

export function calcularSaldoDiasFerias({ diasDireito = 30, periodosAtivos = [] } = {}) {
  const direito = inteiroPositivo(diasDireito, 'Dias de direito deve ser maior que zero.')
  const diasUsados = (periodosAtivos || [])
    .filter(periodoFeriasConsomeSaldo)
    .reduce((total, periodo) => total + inteiroPositivo(
      periodo.quantidade_dias,
      'Quantidade de dias do periodo deve ser maior que zero.'
    ), 0)

  return Math.max(direito - diasUsados, 0)
}
