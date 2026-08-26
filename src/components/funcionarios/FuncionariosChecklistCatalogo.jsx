import { useState } from 'react'
import { useFuncionariosChecklistCatalogo } from '../../hooks/useFuncionariosChecklistCatalogo'
import { mensagemSeguraErro } from '../../utils/session'

export function FuncionariosChecklistCatalogo({ empresaId, podeGerenciar = false, mostrarAviso }) {
  const [novoTitulo, setNovoTitulo] = useState('')
  const [itemEditando, setItemEditando] = useState(null)
  const [tituloEditando, setTituloEditando] = useState('')
  const { itens, loading, salvando, erro, carregar, criar, editarTitulo, alterarAtividade } = useFuncionariosChecklistCatalogo({
    empresaId,
    habilitado: podeGerenciar
  })

  if (!podeGerenciar) return null

  async function criarItem(event) {
    event.preventDefault()
    const resposta = await criar(novoTitulo)
    if (resposta.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o item.'), 'erro')
      return
    }
    setNovoTitulo('')
    mostrarAviso?.('Item do checklist criado.', 'sucesso')
  }

  function iniciarEdicao(item) {
    setItemEditando(item.id)
    setTituloEditando(item.titulo)
  }

  async function salvarTitulo(item) {
    const resposta = await editarTitulo(item.id, tituloEditando)
    if (resposta.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível editar o item.'), 'erro')
      return
    }
    setItemEditando(null)
    setTituloEditando('')
    mostrarAviso?.('Título do catálogo atualizado. Itens históricos não foram alterados.', 'sucesso')
  }

  async function alternarAtividade(item) {
    const resposta = await alterarAtividade(item.id, !item.ativo)
    if (resposta.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível alterar o item.'), 'erro')
      return
    }
    mostrarAviso?.(item.ativo ? 'Item inativado.' : 'Item reativado.', 'sucesso')
  }

  return (
    <section className="funcionarios-panel funcionario-catalogo-panel" aria-labelledby="catalogo-checklist-title">
      <div className="funcionario-catalogo-header">
        <div>
          <span className="funcionarios-kicker">Configuração administrativa</span>
          <h2 id="catalogo-checklist-title">Itens do checklist de desligamento</h2>
          <p>Configure opções administrativas da empresa. Nenhum item é obrigatório ou criado automaticamente.</p>
        </div>
      </div>

      <form className="funcionario-catalogo-criar" onSubmit={criarItem}>
        <label>
          <span>Título do item</span>
          <input
            className="funcionarios-input"
            value={novoTitulo}
            onChange={(event) => setNovoTitulo(event.target.value)}
            minLength={3}
            maxLength={160}
            placeholder="Ex.: Conferência administrativa"
            disabled={!empresaId || salvando}
            required
          />
        </label>
        <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={!empresaId || salvando || novoTitulo.trim().length < 3}>
          {salvando ? 'Salvando...' : 'Criar item'}
        </button>
      </form>

      {loading ? (
        <div className="funcionario-exames-empty" role="status">Carregando itens configurados...</div>
      ) : erro ? (
        <div className="funcionario-catalogo-error" role="alert">
          <span>{erro}</span>
          <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={carregar}>Tentar novamente</button>
        </div>
      ) : itens.length === 0 ? (
        <div className="funcionario-exames-empty">Nenhum item configurado.</div>
      ) : (
        <div className="funcionario-catalogo-lista">
          {itens.map((item) => (
            <article className={`funcionario-catalogo-item ${item.ativo ? '' : 'is-inativo'}`} key={item.id}>
              {itemEditando === item.id ? (
                <label className="funcionario-catalogo-edicao">
                  <span>Novo título</span>
                  <input className="funcionarios-input" value={tituloEditando} onChange={(event) => setTituloEditando(event.target.value)} minLength={3} maxLength={160} disabled={salvando} />
                </label>
              ) : (
                <div className="funcionario-catalogo-identidade">
                  <strong>{item.titulo}</strong>
                  <span className={`funcionario-exame-status ${item.ativo ? 'realizado' : 'cancelado'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
              )}
              <div className="funcionario-catalogo-acoes">
                {itemEditando === item.id ? (
                  <>
                    <button className="funcionarios-btn funcionarios-btn-primary" type="button" onClick={() => salvarTitulo(item)} disabled={salvando || tituloEditando.trim().length < 3}>Salvar título</button>
                    <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => setItemEditando(null)} disabled={salvando}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => iniciarEdicao(item)} disabled={salvando}>Editar título</button>
                    <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => alternarAtividade(item)} disabled={salvando}>{item.ativo ? 'Inativar' : 'Reativar'}</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
