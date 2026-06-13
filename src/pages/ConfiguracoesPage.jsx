import { useState } from 'react'
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
  const [mostrarConfigFiliais, setMostrarConfigFiliais] = useState(true)
  const [mostrarResumoUso, setMostrarResumoUso] = useState(true)

  if (!podeAcessarConfiguracoes) {
    return (
      <div className="admin-page">
        <div className="admin-page-hero">
          <div>
            <span className="admin-kicker">Administração</span>
            <h1 style={styles.titulo}>Configurações</h1>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar configurações.</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={() => navegarPara('contas')}>← Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page settings-admin-page">
      <div className="admin-page-hero">
        <div>
          <span className="admin-kicker">Administração da empresa</span>
          <h1 style={styles.titulo}>Configurações</h1>
          <p style={styles.textoNota}>Centralize alertas, dados do negócio, destinatários e parâmetros operacionais.</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={() => navegarPara('dashboard')}>← Painel</button>
      </div>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-notifications-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🔔 Notificações"
          subtitulo="Alertas de contas e notas"
          meta={notificacoesAtivas ? 'Ativas' : 'Desligadas'}
          aberto={mostrarConfigNotificacoes}
          onClick={() => setMostrarConfigNotificacoes(!mostrarConfigNotificacoes)}
        />

        {mostrarConfigNotificacoes && (
          <div className="admin-section-body">
            <label className="admin-switch-row checkbox-row-fix">
              <div>
                <strong>Notificações ativas</strong>
                <small>Controle geral dos disparos automáticos da empresa.</small>
              </div>
              <input type="checkbox" checked={notificacoesAtivas} onChange={(e) => setNotificacoesAtivas(e.target.checked)} />
            </label>

            <div className="admin-config-grid">
              <div className="admin-field-group">
                <span>Contas</span>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="Avisar antes do vencimento. Ex: 1"
                  value={diasAlertaContas}
                  onChange={(e) => { setDiasAlertaContas(e.target.value); setDiasAvisoPadrao(e.target.value) }}
                />
                <label className="admin-switch-row checkbox-row-fix">
                  <div>
                    <strong>Notificar contas vencidas</strong>
                    <small>Exibir contas em atraso nas notificações e destaques.</small>
                  </div>
                  <input type="checkbox" checked={alertarContasVencidas} onChange={(e) => setAlertarContasVencidas(e.target.checked)} />
                </label>
                <label className="admin-switch-row checkbox-row-fix">
                  <div>
                    <strong>Destacar contas críticas</strong>
                    <small>Dar prioridade visual para contas vencidas ou próximas do vencimento.</small>
                  </div>
                  <input type="checkbox" checked={destacarContasCriticas} onChange={(e) => setDestacarContasCriticas(e.target.checked)} />
                </label>
              </div>

              <div className="admin-field-group">
                <span>Notas</span>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="Avisar pendências após quantos dias. Ex: 3"
                  value={diasAlertaNotas}
                  onChange={(e) => setDiasAlertaNotas(e.target.value)}
                />
                <label className="admin-switch-row checkbox-row-fix">
                  <div>
                    <strong>Destacar notas urgentes</strong>
                    <small>Manter notas urgentes e críticas no topo do acompanhamento.</small>
                  </div>
                  <input type="checkbox" checked={destacarNotasUrgentes} onChange={(e) => setDestacarNotasUrgentes(e.target.checked)} />
                </label>
              </div>
            </div>

            <div className="admin-summary-strip">
              <span>E-mail: {configEmail ? 'Ativo para alertas automáticos' : 'Desligado'}</span>
              <span>WhatsApp e Push: não configurados no fluxo atual</span>
            </div>
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-business-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🏢 Dados do negócio"
          subtitulo="Empresa e contatos institucionais"
          aberto={mostrarConfigNegocio}
          onClick={() => setMostrarConfigNegocio(!mostrarConfigNegocio)}
        />

        {mostrarConfigNegocio && (
          <div className="admin-section-body admin-form-grid">
            <label>
              <span>Nome da empresa</span>
              <input style={styles.input} value={nomeEmpresa} onChange={(e) => setNomeEmpresa(primeiraLetraMaiuscula(e.target.value))} />
            </label>
            <label>
              <span>WhatsApp da empresa</span>
              <input style={styles.input} placeholder="Ex: 5511999999999" value={whatsappPadrao} onChange={(e) => setWhatsappPadrao(e.target.value)} />
            </label>
            <label>
              <span>E-mail padrão da empresa</span>
              <input style={styles.input} value={emailPadrao} onChange={(e) => setEmailPadrao(e.target.value)} />
            </label>
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-alert-recipients-card">
        <HeaderExpansivel
          styles={styles}
          titulo="✉️ Destinatários de alertas"
          subtitulo="E-mails administrativos sem criar usuários"
          meta={loadingDestinatarios ? 'Carregando' : `${destinatarios.length} exibido(s)`}
          aberto={mostrarConfigDestinatarios}
          onClick={() => setMostrarConfigDestinatarios(!mostrarConfigDestinatarios)}
        />

        {mostrarConfigDestinatarios && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>Cadastre e-mails de donos ou responsáveis para receber alertas sem criar usuários no sistema.</p>
            {!podeGerenciarDestinatariosAlertas && <p style={styles.textoNota}>Somente Admin/Master podem alterar destinatários.</p>}
            {erroDestinatarios && <p className="admin-error-text">{erroDestinatarios}</p>}

            <label className="admin-switch-row checkbox-row-fix">
              <div>
                <strong>Mostrar inativos</strong>
                <small>Destinatários inativos ficam arquivados logicamente, sem DELETE físico.</small>
              </div>
              <input type="checkbox" checked={mostrarDestinatariosInativos} onChange={(e) => setMostrarDestinatariosInativos(e.target.checked)} />
            </label>

            {podeGerenciarDestinatariosAlertas && (
              <form onSubmit={salvarDestinatarioAlerta} className="admin-recipient-form">
                <div className="admin-form-grid">
                  <label>
                    <span>Nome</span>
                    <input style={styles.input} value={formDestinatarioAlerta.nome} onChange={(e) => atualizarCampoDestinatarioAlerta('nome', primeiraLetraMaiuscula(e.target.value))} disabled={salvandoDestinatario} />
                  </label>
                  <label>
                    <span>E-mail</span>
                    <input style={styles.input} type="email" value={formDestinatarioAlerta.email} onChange={(e) => atualizarCampoDestinatarioAlerta('email', e.target.value)} disabled={salvandoDestinatario} />
                  </label>
                </div>

                <label className="admin-field-full">
                  <span>Observação administrativa</span>
                  <input style={styles.input} value={formDestinatarioAlerta.observacao} onChange={(e) => atualizarCampoDestinatarioAlerta('observacao', e.target.value)} disabled={salvandoDestinatario} />
                </label>

                <div className="admin-chip-grid">
                  {[
                    ['recebe_contas', 'Contas'],
                    ['recebe_notas', 'Notas'],
                    ['recebe_resumo', 'Resumo'],
                    ['ativo', 'Ativo']
                  ].map(([campo, label]) => (
                    <label key={campo} className="admin-check-chip checkbox-row-fix">
                      <span>{label}</span>
                      <input type="checkbox" checked={formDestinatarioAlerta[campo]} onChange={(e) => atualizarCampoDestinatarioAlerta(campo, e.target.checked)} disabled={salvandoDestinatario} />
                    </label>
                  ))}
                </div>

                <div className="admin-actions-row">
                  <button className="admin-btn admin-btn-primary" type="submit" disabled={salvandoDestinatario}>
                    {destinatarioEditandoId ? 'Salvar edição' : 'Adicionar destinatário'}
                  </button>
                  {destinatarioEditandoId && (
                    <button className="admin-btn admin-btn-secondary" type="button" onClick={limparFormularioDestinatarioAlerta} disabled={salvandoDestinatario}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="admin-card-list">
              {!loadingDestinatarios && destinatarios.length === 0 && (
                <div className="empty-state-card">
                  <strong>Nenhum destinatário cadastrado</strong>
                  <p>Cadastre responsáveis para receber alertas da empresa ativa.</p>
                </div>
              )}

              {destinatarios.map((destinatario) => (
                <article key={destinatario.id} className={`admin-item-card ${destinatario.ativo === false ? 'inactive' : 'active'}`}>
                  <div className="admin-item-head">
                    <div>
                      <strong>{destinatario.nome || 'Sem nome'}</strong>
                      <small>{destinatario.email}</small>
                    </div>
                    <span className={`admin-status-badge ${destinatario.ativo === false ? 'muted' : 'success'}`}>
                      {destinatario.ativo === false ? 'Inativo' : 'Ativo'}
                    </span>
                  </div>

                  <div className="admin-item-tags">
                    {destinatario.recebe_contas !== false && <span>Contas</span>}
                    {destinatario.recebe_notas !== false && <span>Notas</span>}
                    {destinatario.recebe_resumo !== false && <span>Resumo</span>}
                    {destinatario.observacao && <span>Obs.: {destinatario.observacao}</span>}
                  </div>

                  {podeGerenciarDestinatariosAlertas && (
                    <div className="admin-actions-row">
                      <button className="admin-btn admin-btn-secondary" type="button" onClick={() => preencherFormularioDestinatarioAlerta(destinatario)}>Editar</button>
                      <button className={`admin-btn ${destinatario.ativo === false ? 'admin-btn-primary' : 'admin-btn-danger'}`} type="button" onClick={() => alternarStatusDestinatarioAlerta(destinatario)} disabled={salvandoDestinatario}>
                        {destinatario.ativo === false ? 'Reativar' : 'Inativar'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-recurrence-card">
        <HeaderExpansivel styles={styles} titulo="🔁 Recorrências" subtitulo="Padrão de geração mensal" aberto={mostrarConfigRecorrencias} onClick={() => setMostrarConfigRecorrencias(!mostrarConfigRecorrencias)} />
        {mostrarConfigRecorrencias && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original.</p>
            <div className="admin-summary-strip">
              <span>Frequência mensal</span>
              <span>Dia de vencimento configurável</span>
              <span>Geração automática no mês vigente quando ainda não existir</span>
            </div>
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-costcenter-card">
        <HeaderExpansivel styles={styles} titulo="🏷 Centros de custo" subtitulo="Classificação financeira" meta={`${centros.length} centro(s)`} aberto={mostrarConfigCentros} onClick={() => setMostrarConfigCentros(!mostrarConfigCentros)} />
        {mostrarConfigCentros && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>Cadastre e gerencie os centros usados nas contas e nos relatórios.</p>
            <div className="admin-summary-strip">
              <span>Total de centros: {centros.length}</span>
              <span>Uso nos filtros e relatórios</span>
            </div>
            {podeGerenciarCentroCusto && <button className="admin-btn admin-btn-primary" onClick={() => setModalCentro(true)}>Gerenciar centros</button>}
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-branches-card">
        <HeaderExpansivel styles={styles} titulo="🏬 Filiais / Unidades" subtitulo="Unidades operacionais da empresa" aberto={mostrarConfigFiliais} onClick={() => setMostrarConfigFiliais(!mostrarConfigFiliais)} />
        {mostrarConfigFiliais && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa para organizar melhor a operação.</p>
            <div className="admin-summary-strip">
              <span>Organização: empresa → filial → centro de custo → conta</span>
              <span>Isolamento por empresa ativo</span>
            </div>
            {podeEditarConfiguracoes && <button className="admin-btn admin-btn-primary" onClick={() => navegarPara('filiais')}>Gerenciar filiais</button>}
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="settings-card admin-config-card settings-usage-card">
        <HeaderExpansivel styles={styles} titulo="🧠 Resumo de uso" subtitulo="Canais e escopo atual" aberto={mostrarResumoUso} onClick={() => setMostrarResumoUso(!mostrarResumoUso)} />
        {mostrarResumoUso && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>O envio automático atual usa e-mail. WhatsApp e Push permanecem apenas como configurações reservadas, sem disparo automático ativo neste fluxo.</p>
            <div className="admin-summary-strip">
              <span>Geral: {notificacoesAtivas ? 'Ligado' : 'Desligado'}</span>
              <span>E-mail: {configEmail ? 'Ativo' : 'Desligado'}</span>
              <span>WhatsApp: não configurado</span>
              <span>Push: não configurado</span>
            </div>
          </div>
        )}
      </section>

      {podeEditarConfiguracoes && (
        <div className="admin-sticky-actions">
          <button className="admin-btn admin-btn-primary" onClick={salvarConfiguracoes}>Salvar configurações</button>
        </div>
      )}
    </div>
  )
}
