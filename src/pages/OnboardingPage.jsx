import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { converterValor } from '../utils/format'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function normalizarTexto(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ')
}

function StepCard({ numero, titulo, descricao, concluido, ativo, children }) {
  return (
    <section className={`onboarding-step-card ${concluido ? 'done' : ''} ${ativo ? 'active' : ''}`}>
      <div className="onboarding-step-head">
        <div className="onboarding-step-number">{concluido ? '✓' : numero}</div>
        <div>
          <span>{concluido ? 'Concluído' : ativo ? 'Próximo passo' : 'Pendente'}</span>
          <h3>{titulo}</h3>
          <p>{descricao}</p>
        </div>
      </div>
      {ativo && <div className="onboarding-step-body">{children}</div>}
    </section>
  )
}

export default function OnboardingPage({
  styles,
  empresaId,
  empresaNome,
  filiais = [],
  centros = [],
  contas = [],
  mostrarAviso,
  onRefresh,
  voltarPainel,
  abrirDashboard
}) {
  const [salvando, setSalvando] = useState(false)
  const [nomeFilial, setNomeFilial] = useState('Loja Centro')
  const [nomeCentro, setNomeCentro] = useState('Operacional')
  const [contaDescricao, setContaDescricao] = useState('Primeira conta de teste')
  const [contaValor, setContaValor] = useState('100,00')
  const [contaData, setContaData] = useState(hojeISO())
  const [filialContaId, setFilialContaId] = useState('')
  const [centroContaId, setCentroContaId] = useState('')

  const filiaisAtivas = useMemo(() => filiais.filter((filial) => filial?.ativo !== false), [filiais])
  const contasAtivas = useMemo(() => contas.filter((conta) => conta?.excluido !== true), [contas])

  const status = {
    empresa: Boolean(empresaId),
    filial: filiaisAtivas.length > 0,
    centro: centros.length > 0,
    conta: contasAtivas.length > 0
  }

  const progresso = Math.round(([status.empresa, status.filial, status.centro, status.conta].filter(Boolean).length / 4) * 100)
  const onboardingCompleto = progresso === 100
  const proximaEtapa = !status.empresa ? 'empresa' : !status.filial ? 'filial' : !status.centro ? 'centro' : !status.conta ? 'conta' : 'dashboard'

  async function recarregar() {
    await onRefresh?.()
  }

  async function criarPrimeiraFilial() {
    const nome = normalizarTexto(nomeFilial)
    if (!empresaId) return mostrarAviso?.('Empresa não identificada para onboarding.', 'erro')
    if (nome.length < 2) return mostrarAviso?.('Informe o nome da primeira filial.', 'erro')

    setSalvando(true)
    try {
      const { error } = await supabase
        .from('df_filiais')
        .insert([{ empresa_id: empresaId, nome, ativo: true }])

      if (error) throw error
      mostrarAviso?.('Primeira filial criada com sucesso.', 'info')
      await recarregar()
    } catch (error) {
      mostrarAviso?.('Erro ao criar filial: ' + error.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function criarPrimeiroCentro() {
    const nome = normalizarTexto(nomeCentro)
    if (!empresaId) return mostrarAviso?.('Empresa não identificada para onboarding.', 'erro')
    if (nome.length < 2) return mostrarAviso?.('Informe o nome do primeiro centro de custo.', 'erro')

    setSalvando(true)
    try {
      const { error } = await supabase
        .from('df_centros_custo')
        .insert([{ empresa_id: empresaId, nome }])

      if (error) throw error
      mostrarAviso?.('Centro de custo criado com sucesso.', 'info')
      await recarregar()
    } catch (error) {
      mostrarAviso?.('Erro ao criar centro de custo: ' + error.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function criarPrimeiraConta() {
    if (!empresaId) return mostrarAviso?.('Empresa não identificada para onboarding.', 'erro')
    const descricao = normalizarTexto(contaDescricao)
    const valorNumerico = converterValor(contaValor)
    const filialEscolhida = filialContaId || filiaisAtivas[0]?.id || null
    const centroEscolhido = centroContaId || centros[0]?.id || null

    if (descricao.length < 2) return mostrarAviso?.('Informe a descrição da primeira conta.', 'erro')
    if (!valorNumerico || valorNumerico <= 0) return mostrarAviso?.('Informe um valor válido para a primeira conta.', 'erro')
    if (!contaData) return mostrarAviso?.('Informe o vencimento da primeira conta.', 'erro')

    setSalvando(true)
    try {
      const payload = {
        empresa_id: empresaId,
        descricao,
        valor: valorNumerico,
        data_vencimento: contaData,
        vencimento: contaData,
        status: 'pendente',
        centro_custo_id: centroEscolhido,
        filial_id: filialEscolhida,
        excluido: false
      }

      const { error } = await supabase
        .from('df_contas')
        .insert([payload])

      if (error) throw error
      mostrarAviso?.('Primeira conta criada. Dashboard pronto para uso.', 'info')
      await recarregar()
    } catch (error) {
      mostrarAviso?.('Erro ao criar primeira conta: ' + error.message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <h1 style={styles.titulo}>🚀 Onboarding SaaS</h1>
      <button style={styles.btnCinza} onClick={voltarPainel}>← Voltar</button>

      <section style={styles.cardConfiguracao} className="onboarding-hero">
        <div>
          <span className="onboarding-eyebrow">Configuração inicial</span>
          <h2 style={styles.subtitulo}>Deixe a empresa pronta para operar</h2>
          <p style={styles.textoNota}>
            Empresa: <strong>{empresaNome || 'Empresa atual'}</strong>. Este fluxo prepara a primeira unidade, centro de custo e conta para liberar o dashboard operacional.
          </p>
        </div>
        <div className="onboarding-progress-box">
          <span>{progresso}%</span>
          <small>{onboardingCompleto ? 'Onboarding completo' : 'Em implantação'}</small>
          <div className="onboarding-progress"><i style={{ width: `${progresso}%` }} /></div>
        </div>
      </section>

      <section className="onboarding-kpi-grid">
        <div><span>Filiais</span><strong>{filiaisAtivas.length}</strong></div>
        <div><span>Centros de custo</span><strong>{centros.length}</strong></div>
        <div><span>Contas ativas</span><strong>{contasAtivas.length}</strong></div>
        <div><span>Status</span><strong>{onboardingCompleto ? 'Pronto' : 'Guiado'}</strong></div>
      </section>

      <div className="onboarding-steps-grid">
        <StepCard
          numero="1"
          titulo="Empresa ativa"
          descricao="A empresa atual já está definida no tenant selecionado."
          concluido={status.empresa}
          ativo={proximaEtapa === 'empresa'}
        >
          <p style={styles.textoNota}>Selecione ou crie uma empresa pelo Painel Master antes de continuar.</p>
        </StepCard>

        <StepCard
          numero="2"
          titulo="Primeira filial"
          descricao="Crie a unidade inicial para separar operação e indicadores."
          concluido={status.filial}
          ativo={proximaEtapa === 'filial'}
        >
          <input style={styles.input} value={nomeFilial} onChange={(e) => setNomeFilial(e.target.value)} placeholder="Ex: Loja Centro" />
          <button style={styles.btnSalvar} disabled={salvando} onClick={criarPrimeiraFilial}>{salvando ? 'Criando...' : 'Criar primeira filial'}</button>
        </StepCard>

        <StepCard
          numero="3"
          titulo="Centro de custo"
          descricao="Crie uma classificação financeira básica para as primeiras contas."
          concluido={status.centro}
          ativo={proximaEtapa === 'centro'}
        >
          <input style={styles.input} value={nomeCentro} onChange={(e) => setNomeCentro(e.target.value)} placeholder="Ex: Operacional" />
          <button style={styles.btnSalvar} disabled={salvando} onClick={criarPrimeiroCentro}>{salvando ? 'Criando...' : 'Criar centro de custo'}</button>
        </StepCard>

        <StepCard
          numero="4"
          titulo="Primeira conta"
          descricao="Registre uma conta inicial para alimentar KPIs, ranking e dashboard."
          concluido={status.conta}
          ativo={proximaEtapa === 'conta'}
        >
          <div className="onboarding-form-grid">
            <input style={styles.input} value={contaDescricao} onChange={(e) => setContaDescricao(e.target.value)} placeholder="Descrição" />
            <input style={styles.input} value={contaValor} onChange={(e) => setContaValor(e.target.value)} placeholder="Valor" />
            <input style={styles.input} type="date" value={contaData} onChange={(e) => setContaData(e.target.value)} />
            <select style={styles.input} value={filialContaId} onChange={(e) => setFilialContaId(e.target.value)}>
              <option value="">{filiaisAtivas[0]?.nome || 'Filial padrão'}</option>
              {filiaisAtivas.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
            </select>
            <select style={styles.input} value={centroContaId} onChange={(e) => setCentroContaId(e.target.value)}>
              <option value="">{centros[0]?.nome || 'Centro padrão'}</option>
              {centros.map((centro) => <option key={centro.id} value={centro.id}>{centro.nome}</option>)}
            </select>
          </div>
          <button style={styles.btnSalvar} disabled={salvando} onClick={criarPrimeiraConta}>{salvando ? 'Criando...' : 'Criar primeira conta'}</button>
        </StepCard>

        <StepCard
          numero="5"
          titulo="Dashboard pronto"
          descricao="A operação inicial já pode ser acompanhada no dashboard."
          concluido={onboardingCompleto}
          ativo={proximaEtapa === 'dashboard'}
        >
          <p style={styles.textoNota}>Base inicial concluída. Revise os KPIs, ranking de unidades e filtros por filial.</p>
          <button style={styles.btnSalvar} onClick={abrirDashboard}>Ir para o dashboard</button>
        </StepCard>
      </div>
    </>
  )
}
