import { useState } from 'react'
import { useFuncionariosChecklistCatalogo } from '../../hooks/useFuncionariosChecklistCatalogo'
import { mensagemSeguraErro } from '../../utils/session'

export function FuncionariosChecklistCatalogo({ empresaId, podeGerenciar = false, mostrarAviso }) {
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [itemEditando, setItemEditando] = useState(null)
  const [tituloEditando, setTituloEditando] = useState('')
  const [descricaoEditando, setDescricaoEditando] = useState('')
  const { itens, loading, salvando, erro, carregar, criar, editar, alterarAtividade } = useFuncionariosChecklistCatalogo({
    empresaId,
    habilitado: podeGerenciar
  })

  if (!podeGerenciar) return null

  async function criarItem(event) {
    event.preventDefault()
    const resposta = await criar({ titulo: novoTitulo, descricaoOperacional: novaDescricao })
    if (resposta.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o item.'), 'erro')
      return
    }
    setNovoTitulo('')
    setNovaDescricao('')
    mostrarAviso?.('Item do checklist criado.', 'sucesso')
  }

  function iniciarEdicao(item) {
    setItemEditando(item.id)
    setTituloEditando(item.titulo)
    setDescricaoEditando(item.descricao_operacional || '')
  }

  async function salvarItem(item) {
    const resposta = await editar(item.id, { titulo: tituloEditando, descricaoOperacional: descricaoEditando })
    if (resposta.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível editar o item.'), 'erro')
      return
    }
    setItemEditando(null)
    setTituloEditando('')
    setDescricaoEditando('')
    mostrarAviso?.('Item do catálogo atualizado. Itens históricos não foram alterados.', 'sucesso')
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
        <label className="span-2">
          <span>Descrição operacional (opcional)</span>
          <textarea
            className="funcionarios-input"
            value={novaDescricao}
            onChange={(event) => setNovaDescricao(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Orientação administrativa curta, sem regra legal automática."
            disabled={!empresaId || salvando}
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
                <div className="funcionario-catalogo-edicao">
                  <label>
                    <span>Título</span>
                    <input className="funcionarios-input" value={tituloEditando} onChange={(event) => setTituloEditando(event.target.value)} minLength={3} maxLength={160} disabled={salvando} />
                  </label>
                  <label>
                    <span>Descrição operacional (opcional)</span>
                    <textarea className="funcionarios-input" value={descricaoEditando} onChange={(event) => setDescricaoEditando(event.target.value)} maxLength={500} rows={3} disabled={salvando} />
                  </label>
                </div>
              ) : (
                <div className="funcionario-catalogo-identidade">
                  <div>
                    <strong>{item.titulo}</strong>
                    {item.descricao_operacional && <p>{item.descricao_operacional}</p>}
                  </div>
                  <span className={`funcionario-exame-status ${item.ativo ? 'realizado' : 'cancelado'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
              )}
              <div className="funcionario-catalogo-acoes">
                {itemEditando === item.id ? (
                  <>
                    <button className="funcionarios-btn funcionarios-btn-primary" type="button" onClick={() => salvarItem(item)} disabled={salvando || tituloEditando.trim().length < 3}>Salvar alterações</button>
                    <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => { setItemEditando(null); setTituloEditando(''); setDescricaoEditando('') }} disabled={salvando}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => iniciarEdicao(item)} disabled={salvando}>Editar</button>
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
