import HeaderExpansivel from '../components/ui/HeaderExpansivel.jsx'
import { primeiraLetraMaiuscula } from '../utils/format'

export default function ConfiguracoesPage({
  styles,
  podeAcessarConfiguracoes = false,
  podeEditarConfiguracoes = false,
  podeGerenciarDestinatariosAlertas = false,
  podeGerenciarCentroCusto = false,
  navegarPara,
  notificacoesAtivas,
  setNotificacoesAtivas,
  configEmail,
  diasAlertaContas,
  setDiasAlertaContas,
  setDiasAvisoPadrao,
  alertarContasVencidas,
  setAlertarContasVencidas,
  destacarContasCriticas,
  setDestacarContasCriticas,
  diasAlertaNotas,
  setDiasAlertaNotas,
  destacarNotasUrgentes,
  setDestacarNotasUrgentes,
  nomeEmpresa,
  setNomeEmpresa,
  whatsappPadrao,
  setWhatsappPadrao,
  emailPadrao,
  setEmailPadrao,
  mostrarConfigNotificacoes,
  setMostrarConfigNotificacoes,
  mostrarConfigNegocio,
  setMostrarConfigNegocio,
  mostrarConfigDestinatarios,
  setMostrarConfigDestinatarios,
  mostrarDestinatariosInativos,
  setMostrarDestinatariosInativos,
  mostrarConfigRecorrencias,
  setMostrarConfigRecorrencias,
  mostrarConfigCentros,
  setMostrarConfigCentros,
  destinatarios = [],
  loadingDestinatarios,
  salvandoDestinatario,
  erroDestinatarios,
  destinatarioEditandoId,
  formDestinatarioAlerta,
  salvarDestinatarioAlerta,
  atualizarCampoDestinatarioAlerta,
  limparFormularioDestinatarioAlerta,
  preencherFormularioDestinatarioAlerta,
  alternarStatusDestinatarioAlerta,
  centros = [],
  setModalCentro,
  salvarConfiguracoes
}) {
  if (!podeAcessarConfiguracoes) {
    return (
      <>
        <h1 style={styles.titulo}>⚙️ Configurações</h1>
        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite acessar configurações.</p>
          <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>← Voltar</button>
        </section>
      </>
    )
  }

  return (
    <>
      <h1 style={styles.titulo}>⚙️ Configurações</h1>

      <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section style={styles.cardConfiguracao} className="settings-card settings-notifications-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🔔 Notificações"
          aberto={mostrarConfigNotificacoes}
          onClick={() => setMostrarConfigNotificacoes(!mostrarConfigNotificacoes)}
        />

        {mostrarConfigNotificacoes && (
          <>
            <label className="checkbox-row-fix" style={styles.switchLinha}>
              <div>
                <strong>Notificações ativas</strong>
                <small>Controle geral dos disparos automáticos da empresa.</small>
              </div>

              <input
                type="checkbox"
                checked={notificacoesAtivas}
                onChange={(e) => setNotificacoesAtivas(e.target.checked)}
              />
            </label>

            <div style={styles.configResumo}>
              <strong>Contas</strong>
              <span>Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário.</span>
            </div>

            <input
              style={styles.input}
              type="number"
              min="0"
              placeholder="Avisar contas antes do vencimento. Ex: 1"
              value={diasAlertaContas}
              onChange={(e) => { setDiasAlertaContas(e.target.value); setDiasAvisoPadrao(e.target.value) }}
            />

            <label className="checkbox-row-fix" style={styles.switchLinha}>
              <div>
                <strong>Notificar contas vencidas</strong>
                <small>Exibir contas em atraso nas notificações e destaques.</small>
              </div>
              <input type="checkbox" checked={alertarContasVencidas} onChange={(e) => setAlertarContasVencidas(e.target.checked)} />
            </label>

            <label className="checkbox-row-fix" style={styles.switchLinha}>
              <div>
                <strong>Destacar contas críticas</strong>
                <small>Dar prioridade visual para contas vencidas ou muito próximas do vencimento.</small>
              </div>
              <input type="checkbox" checked={destacarContasCriticas} onChange={(e) => setDestacarContasCriticas(e.target.checked)} />
            </label>

            <div style={styles.configResumo}>
              <strong>Notas</strong>
              <span>Regras para pendências e prioridades do bloco de notas.</span>
            </div>

            <input
              style={styles.input}
              type="number"
              min="0"
              placeholder="Avisar notas pendentes após quantos dias. Ex: 3"
              value={diasAlertaNotas}
              onChange={(e) => setDiasAlertaNotas(e.target.value)}
            />

            <label className="checkbox-row-fix" style={styles.switchLinha}>
              <div>
                <strong>Destacar notas urgentes</strong>
                <small>Manter notas urgentes e críticas no topo do acompanhamento.</small>
              </div>
              <input type="checkbox" checked={destacarNotasUrgentes} onChange={(e) => setDestacarNotasUrgentes(e.target.checked)} />
            </label>

            <div style={styles.configResumo}>
              <strong>Envio automático atual</strong>
              <span>E-mail: {configEmail ? 'Ativo para os alertas automáticos' : 'Desligado'}</span>
              <span>WhatsApp e Push: não configurados no fluxo atual.</span>
            </div>
          </>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-business-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🏢 Dados do negócio"
          aberto={mostrarConfigNegocio}
          onClick={() => setMostrarConfigNegocio(!mostrarConfigNegocio)}
        />

        {mostrarConfigNegocio && (
          <>
            <input
              style={styles.input}
              placeholder="Nome da empresa"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(primeiraLetraMaiuscula(e.target.value))}
            />

            <input
              style={styles.input}
              placeholder="WhatsApp da empresa (contato). Ex: 5511999999999"
              value={whatsappPadrao}
              onChange={(e) => setWhatsappPadrao(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="E-mail padrão da empresa"
              value={emailPadrao}
              onChange={(e) => setEmailPadrao(e.target.value)}
            />
          </>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-alert-recipients-card">
        <HeaderExpansivel
          styles={styles}
          titulo="✉️ Destinatários de alertas"
          aberto={mostrarConfigDestinatarios}
          onClick={() => setMostrarConfigDestinatarios(!mostrarConfigDestinatarios)}
        />

        {mostrarConfigDestinatarios && (
          <>
            <p style={styles.textoNota}>
              Cadastre e-mails de donos ou responsáveis para receber alertas sem criar usuários no sistema.
            </p>

            {!podeGerenciarDestinatariosAlertas && (
              <p style={styles.textoNota}>Somente Admin/Master podem alterar destinatários.</p>
            )}

            <div style={styles.configResumo}>
              <span>{loadingDestinatarios ? 'Carregando destinatários...' : `${destinatarios.length} destinatário(s) exibido(s)`}</span>
              <span>Integração com envio automático será feita em ciclo próprio.</span>
            </div>

            {erroDestinatarios && (
              <p style={{ ...styles.textoNota, color: '#b91c1c', fontWeight: 700 }}>{erroDestinatarios}</p>
            )}

            <label className="checkbox-row-fix" style={styles.switchLinha}>
              <div>
                <strong>Mostrar inativos</strong>
                <small>Destinatários inativos ficam arquivados logicamente, sem DELETE físico.</small>
              </div>
              <input
                type="checkbox"
                checked={mostrarDestinatariosInativos}
                onChange={(e) => setMostrarDestinatariosInativos(e.target.checked)}
              />
            </label>

            {podeGerenciarDestinatariosAlertas && (
              <form onSubmit={salvarDestinatarioAlerta} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <input
                    style={styles.input}
                    placeholder="Nome do destinatário"
                    value={formDestinatarioAlerta.nome}
                    onChange={(e) => atualizarCampoDestinatarioAlerta('nome', primeiraLetraMaiuscula(e.target.value))}
                    disabled={salvandoDestinatario}
                  />
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="E-mail do destinatário"
                    value={formDestinatarioAlerta.email}
                    onChange={(e) => atualizarCampoDestinatarioAlerta('email', e.target.value)}
                    disabled={salvandoDestinatario}
                  />
                </div>

                <input
                  style={styles.input}
                  placeholder="Observação administrativa opcional"
                  value={formDestinatarioAlerta.observacao}
                  onChange={(e) => atualizarCampoDestinatarioAlerta('observacao', e.target.value)}
                  disabled={salvandoDestinatario}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, alignItems: 'stretch' }}>
                  <label className="checkbox-row-fix" style={{ ...styles.switchLinha, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span>Contas</span>
                    <input
                      type="checkbox"
                      style={{ flexShrink: 0 }}
                      checked={formDestinatarioAlerta.recebe_contas}
                      onChange={(e) => atualizarCampoDestinatarioAlerta('recebe_contas', e.target.checked)}
                      disabled={salvandoDestinatario}
                    />
                  </label>
                  <label className="checkbox-row-fix" style={{ ...styles.switchLinha, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span>Notas</span>
                    <input
                      type="checkbox"
                      style={{ flexShrink: 0 }}
                      checked={formDestinatarioAlerta.recebe_notas}
                      onChange={(e) => atualizarCampoDestinatarioAlerta('recebe_notas', e.target.checked)}
                      disabled={salvandoDestinatario}
                    />
                  </label>
                  <label className="checkbox-row-fix" style={{ ...styles.switchLinha, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span>Resumo</span>
                    <input
                      type="checkbox"
                      style={{ flexShrink: 0 }}
                      checked={formDestinatarioAlerta.recebe_resumo}
                      onChange={(e) => atualizarCampoDestinatarioAlerta('recebe_resumo', e.target.checked)}
                      disabled={salvandoDestinatario}
                    />
                  </label>
                  <label className="checkbox-row-fix" style={{ ...styles.switchLinha, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span>Ativo</span>
                    <input
                      type="checkbox"
                      style={{ flexShrink: 0 }}
                      checked={formDestinatarioAlerta.ativo}
                      onChange={(e) => atualizarCampoDestinatarioAlerta('ativo', e.target.checked)}
                      disabled={salvandoDestinatario}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button style={styles.btnSalvar} type="submit" disabled={salvandoDestinatario}>
                    {destinatarioEditandoId ? 'Salvar edição' : 'Adicionar destinatário'}
                  </button>

                  {destinatarioEditandoId && (
                    <button style={styles.btnCinza} type="button" onClick={limparFormularioDestinatarioAlerta} disabled={salvandoDestinatario}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {!loadingDestinatarios && destinatarios.length === 0 && (
                <p style={styles.textoNota}>Nenhum destinatário cadastrado para a empresa ativa.</p>
              )}

              {destinatarios.map((destinatario) => (
                <div
                  key={destinatario.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                    background: destinatario.ativo === false ? '#f8fafc' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{destinatario.nome || 'Sem nome'}</strong>
                      <p style={{ ...styles.textoNota, margin: 0 }}>{destinatario.email}</p>
                    </div>
                    <span style={{ fontWeight: 800, color: destinatario.ativo === false ? '#64748b' : '#15803d' }}>
                      {destinatario.ativo === false ? 'Inativo' : 'Ativo'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}>
                    {destinatario.recebe_contas !== false && <span>Contas</span>}
                    {destinatario.recebe_notas !== false && <span>Notas</span>}
                    {destinatario.recebe_resumo !== false && <span>Resumo</span>}
                    {destinatario.observacao && <span>Obs.: {destinatario.observacao}</span>}
                  </div>

                  {podeGerenciarDestinatariosAlertas && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button style={styles.btnCinza} type="button" onClick={() => preencherFormularioDestinatarioAlerta(destinatario)}>
                        Editar
                      </button>
                      <button style={styles.btnCinza} type="button" onClick={() => alternarStatusDestinatarioAlerta(destinatario)} disabled={salvandoDestinatario}>
                        {destinatario.ativo === false ? 'Reativar' : 'Inativar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-recurrence-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🔁 Recorrências"
          aberto={mostrarConfigRecorrencias}
          onClick={() => setMostrarConfigRecorrencias(!mostrarConfigRecorrencias)}
        />

        {mostrarConfigRecorrencias && (
          <>
            <p style={styles.textoNota}>
              As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original.
            </p>

            <div style={styles.configResumo}>
              <strong>Padrão atual</strong>
              <span>Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir.</span>
            </div>
          </>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-costcenter-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🏷 Centros de custo"
          aberto={mostrarConfigCentros}
          onClick={() => setMostrarConfigCentros(!mostrarConfigCentros)}
        />

        {mostrarConfigCentros && (
          <>
            <p style={styles.textoNota}>
              Cadastre e gerencie os centros usados nas contas e nos relatórios.
            </p>

            <div style={styles.configResumo}>
              <span>Total de centros: {centros.length}</span>
              <span>Uso nos filtros e relatórios</span>
            </div>

            {podeGerenciarCentroCusto && (
              <button style={styles.btnSalvar} onClick={() => setModalCentro(true)}>
                Gerenciar centros
              </button>
            )}
          </>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-branches-card">
        {podeEditarConfiguracoes ? (
          <HeaderExpansivel
            styles={styles}
            titulo="🏬 Filiais / Unidades"
            aberto={false}
            onClick={() => navegarPara('filiais')}
          />
        ) : (
          <div style={styles.headerExpansivel}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#0f172a',
                fontWeight: 900,
                lineHeight: 1.1
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>🏬</span>
              <span>Filiais / Unidades</span>
            </span>
          </div>
        )}

        <p style={styles.textoNota}>
          Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa para organizar melhor a operação.
        </p>

        <div style={styles.configResumo}>
          <span>Organização: empresa → filial → centro de custo → conta</span>
          <span>Isolamento por empresa ativo</span>
        </div>

        {podeEditarConfiguracoes && (
          <button style={styles.btnSalvar} onClick={() => navegarPara('filiais')}>
            Gerenciar filiais
          </button>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card settings-usage-card">
        <h2 style={styles.subtitulo}>🧠 Como o sistema vai usar</h2>

        <p style={styles.textoNota}>
          O envio automático atual usa e-mail. WhatsApp e Push permanecem apenas como configurações
          reservadas, sem disparo automático ativo neste fluxo.
        </p>

        <div style={styles.configResumo}>
          <span>Geral: {notificacoesAtivas ? 'Ligado' : 'Desligado'}</span>
          <span>E-mail: {configEmail ? 'Ativo' : 'Desligado'}</span>
          <span>WhatsApp: não configurado para envio automático</span>
          <span>Push: não configurado para envio automático</span>
        </div>
      </section>

      {podeEditarConfiguracoes && (
        <button style={styles.btnSalvar} onClick={salvarConfiguracoes}>
          Salvar configurações
        </button>
      )}
    </>
  )
}
