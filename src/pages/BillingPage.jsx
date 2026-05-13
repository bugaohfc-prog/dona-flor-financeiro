import { useEffect, useMemo, useState } from 'react'
import { PLANOS_BASE, buscarResumoBilling, salvarAssinaturaEmpresa } from '../services/billingService'

function formatarLimite(valor, singular, plural) {
  if (valor === null || valor === undefined || valor === '') return 'Ilimitado'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'Ilimitado'
  return `${numero} ${numero === 1 ? singular : plural}`
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined) return 'Sob consulta'
  if (Number(valor) === 0) return 'R$ 0,00'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BillingPage({ styles, empresaId, empresaNome, filiais = [], usuarios = [], mostrarAviso, podeEditar = false, voltarPainel }) {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [planos, setPlanos] = useState(PLANOS_BASE)
  const [assinatura, setAssinatura] = useState(null)
  const [planoSelecionado, setPlanoSelecionado] = useState('profissional')
  const [statusSelecionado, setStatusSelecionado] = useState('trial')
  const [limiteFiliais, setLimiteFiliais] = useState(5)
  const [limiteUsuarios, setLimiteUsuarios] = useState(15)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!empresaId) return
      setLoading(true)
      try {
        const resumo = await buscarResumoBilling(empresaId)
        if (!ativo) return
        setPlanos(resumo.planos || PLANOS_BASE)
        setAssinatura(resumo.assinatura)
        setPlanoSelecionado(resumo.assinatura?.plano_codigo || resumo.planoAtual?.codigo || 'profissional')
        setStatusSelecionado(resumo.assinatura?.status || 'trial')
        setLimiteFiliais(resumo.planoAtual?.limite_filiais ?? '')
        setLimiteUsuarios(resumo.planoAtual?.limite_usuarios ?? '')
      } catch (error) {
        console.error('Erro ao carregar billing:', error)
        if (ativo) mostrarAviso?.('Não foi possível carregar o billing: ' + error.message, 'erro')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [empresaId, mostrarAviso])

  const planoAtual = useMemo(() => {
    return planos.find((plano) => plano.codigo === planoSelecionado) || PLANOS_BASE.find((plano) => plano.codigo === 'profissional')
  }, [planos, planoSelecionado])

  const totalFiliais = filiais.length
  const totalUsuarios = usuarios.length
  const limiteFiliaisNumero = limiteFiliais === '' ? null : Number(limiteFiliais)
  const limiteUsuariosNumero = limiteUsuarios === '' ? null : Number(limiteUsuarios)
  const percentualFiliais = limiteFiliaisNumero ? Math.min(100, Math.round((totalFiliais / limiteFiliaisNumero) * 100)) : 100
  const percentualUsuarios = limiteUsuariosNumero ? Math.min(100, Math.round((totalUsuarios / limiteUsuariosNumero) * 100)) : 100
  const filiaisNoLimite = limiteFiliaisNumero !== null && totalFiliais >= limiteFiliaisNumero
  const usuariosNoLimite = limiteUsuariosNumero !== null && totalUsuarios >= limiteUsuariosNumero

  function selecionarPlano(codigo) {
    const plano = planos.find((item) => item.codigo === codigo)
    setPlanoSelecionado(codigo)
    setLimiteFiliais(plano?.limite_filiais ?? '')
    setLimiteUsuarios(plano?.limite_usuarios ?? '')
  }

  async function salvarBilling() {
    if (!podeEditar) return
    setSalvando(true)
    try {
      const novaAssinatura = await salvarAssinaturaEmpresa({
        empresaId,
        planoCodigo: planoSelecionado,
        status: statusSelecionado,
        limiteFiliais: limiteFiliais === '' ? null : Number(limiteFiliais),
        limiteUsuarios: limiteUsuarios === '' ? null : Number(limiteUsuarios)
      })
      setAssinatura(novaAssinatura)
      mostrarAviso?.('Billing atualizado com sucesso.', 'info')
    } catch (error) {
      console.error('Erro ao salvar billing:', error)
      mostrarAviso?.('Erro ao salvar billing: ' + error.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <h1 style={styles.titulo}>💼 Billing Foundation</h1>

      <button style={styles.btnCinza} onClick={voltarPainel}>← Voltar</button>

      <section style={styles.cardConfiguracao} className="billing-hero">
        <div>
          <h2 style={styles.subtitulo}>Base comercial SaaS</h2>
          <p style={styles.textoNota}>
            Empresa: <strong>{empresaNome || 'Empresa atual'}</strong> • Status: <strong>{assinatura?.status || 'trial estrutural'}</strong>
          </p>
          <p style={styles.textoAjuda}>
            Esta fase cria a fundação de planos, limites e assinatura. Ainda não bloqueia o uso do app; os bloqueios comerciais ficam para o hardening posterior.
          </p>
        </div>
        <div className="billing-current-plan">
          <span>Plano atual</span>
          <strong>{planoAtual?.nome || 'Profissional'}</strong>
          <small>{formatarPreco(planoAtual?.valor_mensal)} / mês</small>
        </div>
      </section>

      <section className="billing-kpi-grid">
        <div className={`billing-kpi-card ${filiaisNoLimite ? 'warning' : ''}`}>
          <span>Filiais em uso</span>
          <strong>{totalFiliais}</strong>
          <small>{formatarLimite(limiteFiliaisNumero, 'filial liberada', 'filiais liberadas')}</small>
          <div className="billing-progress"><span style={{ width: `${percentualFiliais}%` }} /></div>
        </div>

        <div className={`billing-kpi-card ${usuariosNoLimite ? 'warning' : ''}`}>
          <span>Usuários em uso</span>
          <strong>{totalUsuarios}</strong>
          <small>{formatarLimite(limiteUsuariosNumero, 'usuário liberado', 'usuários liberados')}</small>
          <div className="billing-progress"><span style={{ width: `${percentualUsuarios}%` }} /></div>
        </div>

        <div className="billing-kpi-card">
          <span>Status comercial</span>
          <strong>{statusSelecionado}</strong>
          <small>{assinatura?.trial_fim ? `Trial até ${assinatura.trial_fim}` : 'Trial preparado'}</small>
        </div>
      </section>

      <section style={styles.cardConfiguracao}>
        <h2 style={styles.subtitulo}>Planos disponíveis</h2>
        <div className="billing-plan-grid">
          {planos.map((plano) => (
            <button
              key={plano.codigo}
              type="button"
              className={`billing-plan-card ${planoSelecionado === plano.codigo ? 'selected' : ''}`}
              onClick={() => selecionarPlano(plano.codigo)}
              disabled={!podeEditar}
            >
              <span>{plano.nome}</span>
              <strong>{formatarPreco(plano.valor_mensal)}</strong>
              <small>{plano.descricao}</small>
              <ul>
                {(plano.recursos || []).map((recurso) => <li key={recurso}>{recurso}</li>)}
              </ul>
            </button>
          ))}
        </div>
      </section>

      <section style={styles.cardConfiguracao}>
        <div className="billing-section-header">
          <div>
            <h2 style={styles.subtitulo}>Assinatura e limites</h2>
            <p style={styles.textoNota}>Defina os limites comerciais da empresa sem alterar os dados operacionais já validados.</p>
          </div>
          {!podeEditar && <span className="billing-readonly">Somente leitura</span>}
        </div>

        <div className="billing-form-grid">
          <label>
            <span>Plano</span>
            <select style={styles.input} value={planoSelecionado} disabled={!podeEditar} onChange={(e) => selecionarPlano(e.target.value)}>
              {planos.map((plano) => <option key={plano.codigo} value={plano.codigo}>{plano.nome}</option>)}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select style={styles.input} value={statusSelecionado} disabled={!podeEditar} onChange={(e) => setStatusSelecionado(e.target.value)}>
              <option value="trial">Trial</option>
              <option value="ativa">Ativa</option>
              <option value="pausada">Pausada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>

          <label>
            <span>Limite de filiais</span>
            <input style={styles.input} type="number" min="0" placeholder="Ilimitado" value={limiteFiliais} disabled={!podeEditar} onChange={(e) => setLimiteFiliais(e.target.value)} />
          </label>

          <label>
            <span>Limite de usuários</span>
            <input style={styles.input} type="number" min="0" placeholder="Ilimitado" value={limiteUsuarios} disabled={!podeEditar} onChange={(e) => setLimiteUsuarios(e.target.value)} />
          </label>
        </div>

        {podeEditar && (
          <button style={styles.btnSalvar} disabled={loading || salvando} onClick={salvarBilling}>
            {salvando ? 'Salvando...' : 'Salvar billing'}
          </button>
        )}
      </section>
    </>
  )
}
