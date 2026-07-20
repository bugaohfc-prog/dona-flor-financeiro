export async function executarConsultaPaginada(criarConsulta, opcoes = {}) {
  const tamanhoPagina = Math.max(1, Number(opcoes.tamanhoPagina) || 500)
  const limitePaginas = Math.max(1, Number(opcoes.limitePaginas) || 1000)
  const registros = []

  for (let pagina = 0; pagina < limitePaginas; pagina += 1) {
    const inicio = pagina * tamanhoPagina
    const fim = inicio + tamanhoPagina - 1
    const resposta = await criarConsulta({ pagina, inicio, fim, tamanhoPagina }).range(inicio, fim)
    if (resposta.error) return { data: registros, error: resposta.error }
    const lote = Array.isArray(resposta.data) ? resposta.data : []
    registros.push(...lote)
    if (lote.length < tamanhoPagina) return { data: registros, error: null }
  }

  return { data: registros, error: new Error('A consulta excedeu o limite seguro de paginas.') }
}