export function criarControleBaixaConta() {
  let emAndamento = false

  return Object.freeze({
    estaEmAndamento() {
      return emAndamento
    },

    async executar(confirmar, payload) {
      if (emAndamento) {
        return Object.freeze({ sucesso: false, ignorado: true, erro: null })
      }

      emAndamento = true
      try {
        const sucesso = await confirmar(payload)
        return Object.freeze({ sucesso: sucesso === true, ignorado: false, erro: null })
      } catch (erro) {
        return Object.freeze({ sucesso: false, ignorado: false, erro })
      } finally {
        emAndamento = false
      }
    }
  })
}
