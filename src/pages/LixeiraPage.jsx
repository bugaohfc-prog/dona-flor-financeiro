import { useMemo, useState } from 'react'

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

const itemKey = (type, id) => `${type}:${id}`

export default function LixeiraPage({
  styles,
  contasLixeira = [],
  notasLixeira = [],
  podeGerenciarLixeira = false,
  podeExcluirDefinitivoFinanceiro = false,
  navegarPara,
  abrirConfirmacao,
  restaurarConta,
  excluirContaDefinitivo,
  restaurarNota,
  excluirNotaDefinitivo,
  diasNaLixeira,
  podeExcluirDefinitivo,
  formatarValor,
  formatarData
}) {
  const [contasAberta, setContasAberta] = useState(true)
  const [notasAberta, setNotasAberta] = useState(true)
  const [selecionados, setSelecionados] = useState(() => new Set())

  const totalItensLixeira = contasLixeira.length + notasLixeira.length

  const contasSelecionadas = useMemo(
    () => contasLixeira.filter((conta) => selecionados.has(itemKey('conta', conta.id))),
    [contasLixeira, selecionados]
  )

  const notasSelecionadas = useMemo(
    () => notasLixeira.filter((nota) => selecionados.has(itemKey('nota', nota.id))),
    [notasLixeira, selecionados]
  )

  const selecionadosTotal = contasSelecionadas.length + notasSelecionadas.length
  const selecionadosElegiveisExclusao = [
    ...contasSelecionadas.filter((conta) => podeExcluirDefinitivo(conta.excluido_em)),
    ...notasSelecionadas.filter((nota) => podeExcluirDefinitivo(nota.excluido_em))
  ]

  const atualizarSelecao = (key, checked) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      if (checked) proximo.add(key)
      else proximo.delete(key)
      return proximo
    })
  }

  const selecionarTodasContas = () => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      contasLixeira.forEach((conta) => proximo.add(itemKey('conta', conta.id)))
      return proximo
    })
  }

  const selecionarTodasNotas = () => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      notasLixeira.forEach((nota) => proximo.add(itemKey('nota', nota.id)))
      return proximo
    })
  }

  const limparSelecaoContas = () => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      contasLixeira.forEach((conta) => proximo.delete(itemKey('conta', conta.id)))
      return proximo
    })
  }

  const limparSelecaoNotas = () => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      notasLixeira.forEach((nota) => proximo.delete(itemKey('nota', nota.id)))
      return proximo
    })
  }

  const limparSelecaoProcessada = (contas, notas) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      contas.forEach((conta) => proximo.delete(itemKey('conta', conta.id)))
      notas.forEach((nota) => proximo.delete(itemKey('nota', nota.id)))
      return proximo
    })
  }

  const confirmarRestaurarSelecionados = () => {
    if (!selecionadosTotal) return

    abrirConfirmacao({
      titulo: 'Restaurar selecionados',
      mensagem: `Restaurar ${selecionadosTotal} item(ns) selecionado(s)?`,
      textoConfirmar: 'Restaurar',
      tipo: 'sucesso',
      acao: async () => {
        for (const conta of contasSelecionadas) await restaurarConta(conta.id)
        for (const nota of notasSelecionadas) await restaurarNota(nota.id)
        limparSelecaoProcessada(contasSelecionadas, notasSelecionadas)
      }
    })
  }

  const confirmarExcluirSelecionados = () => {
    if (!podeExcluirDefinitivoFinanceiro || selecionadosElegiveisExclusao.length === 0) return

    const contasElegiveis = contasSelecionadas.filter((conta) => podeExcluirDefinitivo(conta.excluido_em))
    const notasElegiveis = notasSelecionadas.filter((nota) => podeExcluirDefinitivo(nota.excluido_em))
    const totalElegivel = contasElegiveis.length + notasElegiveis.length
    const temNaoElegivel = selecionadosTotal > totalElegivel

    abrirConfirmacao({
      titulo: 'Excluir definitivamente',
      mensagem: `Excluir definitivamente ${totalElegivel} item(ns)? Esta ação não pode ser desfeita.${temNaoElegivel ? ' Itens ainda em quarentena serão mantidos.' : ''}`,
      textoConfirmar: 'Excluir definitivo',
      tipo: 'perigo',
      acao: async () => {
        for (const conta of contasElegiveis) await excluirContaDefinitivo(conta)
        for (const nota of notasElegiveis) await excluirNotaDefinitivo(nota)
        limparSelecaoProcessada(contasElegiveis, notasElegiveis)
      }
    })
  }

  if (!podeGerenciarLixeira) {
    return (
      <div className="trash-page">
        <div className="trash-page-header">
          <div>
            <h1 style={styles.titulo}>Lixeira</h1>
            <p style={styles.textoNota}>Área de recuperação e exclusão definitiva de registros.</p>
          </div>
        </div>

        <section style={styles.cardConfiguracao} className="trash-access-card">
          <span className="trash-type-badge trash-type-restricted">Restrito</span>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite acessar a lixeira.</p>
          <button className="trash-back-button" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>Voltar</button>
        </section>
      </div>
    )
  }

  return (
    <div className="trash-page">
      <div className="trash-page-header">
        <div>
          <h1 style={styles.titulo}>Lixeira</h1>
          <p style={styles.textoNota}>Recupere itens excluídos ou conclua a remoção definitiva com segurança.</p>
        </div>
        <button className="trash-back-button" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          Voltar ao painel
        </button>
      </div>

      <section className="trash-summary" aria-label="Resumo da lixeira">
        <div>
          <span>Total</span>
          <strong>{totalItensLixeira}</strong>
        </div>
        <div>
          <span>Contas</span>
          <strong>{contasLixeira.length}</strong>
        </div>
        <div>
          <span>Notas</span>
          <strong>{notasLixeira.length}</strong>
        </div>
      </section>

      <section className="trash-bulk-bar" aria-label="Ações em massa da lixeira">
        <span>{selecionadosTotal} item(ns) selecionado(s)</span>
        <div>
          <button type="button" className="trash-bulk-restore" disabled={!selecionadosTotal} onClick={confirmarRestaurarSelecionados}>
            Restaurar selecionados
          </button>
          <button
            type="button"
            className="trash-bulk-danger"
            disabled={!podeExcluirDefinitivoFinanceiro || selecionadosElegiveisExclusao.length === 0}
            onClick={confirmarExcluirSelecionados}
          >
            Excluir definitivos
          </button>
        </div>
      </section>

      <div className="trash-sections-grid">
        <section className="trash-section trash-section-accounts" style={styles.bloco}>
          <div className="trash-section-header">
            <div>
              <span className="trash-kicker">Recuperação financeira</span>
              <h2 style={styles.subtitulo}>Contas excluídas</h2>
              <p>Contas ficam em quarentena por até 60 dias antes da remoção definitiva.</p>
            </div>
            <div className="trash-section-tools">
              <span className="trash-count-badge">{contasLixeira.length}</span>
              <button
                type="button"
                className="trash-toggle-button"
                aria-label={contasAberta ? 'Recolher contas excluídas' : 'Expandir contas excluídas'}
                onClick={() => setContasAberta((aberta) => !aberta)}
              >
                {contasAberta ? '−' : '+'}
              </button>
            </div>
          </div>

          <div className="trash-selection-row">
            <span>{contasSelecionadas.length} conta(s) selecionada(s)</span>
            <div>
              <button type="button" onClick={selecionarTodasContas} disabled={contasLixeira.length === 0}>Selecionar todas</button>
              <button type="button" onClick={limparSelecaoContas} disabled={contasSelecionadas.length === 0}>Limpar</button>
            </div>
          </div>

          {contasAberta && (
            <div className="trash-list">
              {contasLixeira.length === 0 && (
                <EmptyState icon="🧹" title="Nenhuma conta na lixeira" description="As contas excluídas aparecerão aqui durante o período de quarentena." />
              )}

              {contasLixeira.map((conta) => {
                const dias = diasNaLixeira(conta.excluido_em)
                const liberada = podeExcluirDefinitivo(conta.excluido_em)
                const key = itemKey('conta', conta.id)

                return (
                  <div key={conta.id} className="trash-card trash-card-account" style={styles.cardLixeira}>
                    <div className="trash-card-top" style={styles.cardTopo}>
                      <label className="trash-card-check">
                        <input
                          type="checkbox"
                          checked={selecionados.has(key)}
                          onChange={(event) => atualizarSelecao(key, event.target.checked)}
                        />
                        <span className="trash-type-badge trash-type-account">Conta</span>
                      </label>
                      <strong>{conta.descricao}</strong>
                      <span className="trash-card-value">{formatarValor(conta.valor)}</span>
                    </div>

                    <div className="trash-card-meta" style={styles.cardInfo}>
                      <span>Venc.: {formatarData(conta.data_vencimento)}</span>
                      <span>Centro: {conta.df_centros_custo?.nome || 'Sem centro'}</span>
                    </div>

                    <small className={`trash-quarantine ${liberada ? 'trash-quarantine-ready' : 'trash-quarantine-safe'}`} style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                      Excluída há {dias} dia(s) • restauração disponível por 60 dias
                    </small>

                    <div className="trash-card-actions" style={styles.acoes}>
                      <button className="trash-action-restore" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar conta', mensagem: `Deseja restaurar a conta ${conta.descricao}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarConta(conta.id) })}>
                        Restaurar
                      </button>

                      {podeExcluirDefinitivoFinanceiro && (
                        <button className="trash-action-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a conta ${conta.descricao}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirContaDefinitivo(conta) })}>
                          Excluir definitivo
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="trash-section trash-section-notes" style={styles.bloco}>
          <div className="trash-section-header">
            <div>
              <span className="trash-kicker">Recuperação operacional</span>
              <h2 style={styles.subtitulo}>Notas excluídas</h2>
              <p>Notas removidas podem ser restauradas dentro do período de segurança.</p>
            </div>
            <div className="trash-section-tools">
              <span className="trash-count-badge">{notasLixeira.length}</span>
              <button
                type="button"
                className="trash-toggle-button"
                aria-label={notasAberta ? 'Recolher notas excluídas' : 'Expandir notas excluídas'}
                onClick={() => setNotasAberta((aberta) => !aberta)}
              >
                {notasAberta ? '−' : '+'}
              </button>
            </div>
          </div>

          <div className="trash-selection-row">
            <span>{notasSelecionadas.length} nota(s) selecionada(s)</span>
            <div>
              <button type="button" onClick={selecionarTodasNotas} disabled={notasLixeira.length === 0}>Selecionar todas</button>
              <button type="button" onClick={limparSelecaoNotas} disabled={notasSelecionadas.length === 0}>Limpar</button>
            </div>
          </div>

          {notasAberta && (
            <div className="trash-list">
              {notasLixeira.length === 0 && (
                <EmptyState icon="🗒️" title="Nenhuma nota na lixeira" description="As notas excluídas aparecerão aqui antes da remoção definitiva." />
              )}

              {notasLixeira.map((nota) => {
                const dias = diasNaLixeira(nota.excluido_em)
                const liberada = podeExcluirDefinitivo(nota.excluido_em)
                const key = itemKey('nota', nota.id)

                return (
                  <div key={nota.id} className="trash-card trash-card-note" style={styles.cardLixeira}>
                    <div className="trash-card-top">
                      <label className="trash-card-check">
                        <input
                          type="checkbox"
                          checked={selecionados.has(key)}
                          onChange={(event) => atualizarSelecao(key, event.target.checked)}
                        />
                        <span className="trash-type-badge trash-type-note">Nota</span>
                      </label>
                      <strong>{nota.titulo}</strong>
                    </div>

                    {nota.conteudo && (
                      <p className="trash-note-preview" style={styles.textoNota}>{nota.conteudo}</p>
                    )}

                    <small className={`trash-quarantine ${liberada ? 'trash-quarantine-ready' : 'trash-quarantine-safe'}`} style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                      Excluída há {dias} dia(s) • restauração disponível por 60 dias
                    </small>

                    <div className="trash-card-actions" style={styles.acoes}>
                      <button className="trash-action-restore" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar nota', mensagem: `Deseja restaurar a nota ${nota.titulo}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarNota(nota.id) })}>
                        Restaurar
                      </button>

                      {podeExcluirDefinitivoFinanceiro && (
                        <button className="trash-action-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a nota ${nota.titulo}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirNotaDefinitivo(nota) })}>
                          Excluir definitivo
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
