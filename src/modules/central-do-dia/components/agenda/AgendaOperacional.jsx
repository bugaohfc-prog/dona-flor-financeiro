import { useEffect, useMemo, useState } from 'react'
import AccountPaymentModal from '../../../../components/modals/AccountPaymentModal.jsx'
import PageHero from '../../../../components/shared/PageHero.jsx'
import { useAgendaOperacional } from '../../hooks/useAgendaOperacional.js'
import { criarDestinoContextualEventoPessoas } from '../../domain/centralDoDiaPeopleRules.js'
import AgendaOperacionalSection from './AgendaOperacionalSection.jsx'
import './AgendaOperacional.css'

const FILTROS_ORIGEM = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'financeiro', rotulo: 'Financeiro' },
  { id: 'impostos', rotulo: 'Impostos' },
  { id: 'notas', rotulo: 'Notas' },
  { id: 'pessoas', rotulo: 'Pessoas', requerPessoas: true }
]

const SECOES = [
  { id: 'atrasados', titulo: 'Atrasadas', descricao: 'Compromissos vencidos que exigem ação.', abrirPrimeiroDia: true },
  { id: 'hoje', titulo: 'Hoje', descricao: 'Compromissos com vencimento hoje.', abrirPrimeiroDia: true },
  { id: 'proximosSeteDias', titulo: 'Próximos 7 dias', descricao: 'Compromissos imediatos da próxima semana.', abrirPrimeiroDia: true },
  { id: 'futuras', titulo: 'Futuras', descricao: 'Demais compromissos futuros, organizados por dia.' },
  { id: 'excecoes', titulo: 'Exceções', descricao: 'Inconsistências objetivas que precisam de revisão.' },
  { id: 'semDataAcionaveis', titulo: 'Ações sem data', descricao: 'Ações válidas sem prazo temporal definido.' }
]

function mensagemFonte(fonte, erro) {
  const rotulos = {
    funcionarios: 'Funcionários',
    ciclosFerias: 'Ciclos de férias',
    periodosFerias: 'Períodos de férias',
    exames: 'Exames periódicos',
    folha: 'Fechamento de Folha'
  }
  return `${rotulos[fonte] || fonte}: ${erro}`
}

export default function AgendaOperacional({
  styles,
  empresaId,
  filiais = [],
  contas = [],
  notas = [],
  carregandoFinanceiro = false,
  podeAcessarPessoas = false,
  atualizarContas,
  atualizarNotas,
  navegarPara,
  navegarParaOrigemAgenda,
  podeEditarFinanceiro = false,
  abrirEdicaoConta,
  marcarComoPago,
  formatarValor,
  formatarData,
  limitarDataInput
}) {
  const [contaEmBaixa, setContaEmBaixa] = useState(null)
  const {
    agenda,
    resumo,
    filialSelecionada,
    setFilialSelecionada,
    origemSelecionada,
    setOrigemSelecionada,
    carregandoInicial,
    carregandoPessoas,
    atualizando,
    erros,
    fontesComErro,
    atualizar
  } = useAgendaOperacional({
    empresaId,
    contas,
    notas,
    podeAcessarPessoas,
    atualizarContas,
    atualizarNotas,
    carregandoFinanceiro
  })

  const filiaisAtivas = useMemo(
    () => (filiais || []).filter((filial) => filial?.ativo !== false),
    [filiais]
  )
  const contasPorId = useMemo(
    () => new Map((contas || []).map((conta) => [String(conta?.id || ''), conta])),
    [contas]
  )
  const filtrosVisiveis = FILTROS_ORIGEM.filter((filtro) => !filtro.requerPessoas || podeAcessarPessoas)

  useEffect(() => {
    if (
      filialSelecionada &&
      !filiaisAtivas.some((filial) => String(filial?.id || '') === String(filialSelecionada))
    ) setFilialSelecionada('')
  }, [filialSelecionada, filiaisAtivas, setFilialSelecionada])

  function abrirOrigem(item) {
    const referencia = item?.referenciaOrigem
    if (referencia?.tipo === 'conta' && referencia.id) {
      navegarParaOrigemAgenda('conta', referencia.id)
      return
    }
    if (item?.destino === 'notas' && referencia?.tipo === 'nota' && referencia.id) {
      navegarParaOrigemAgenda('nota', referencia.id)
      return
    }
    if (item?.origemOperacional === 'pessoas' && item?.destino) {
      const destino = criarDestinoContextualEventoPessoas(item, 'agenda')
      navegarPara(destino.tela, destino.opcoes)
      return
    }
    if (item?.destino) navegarPara(item.destino)
  }

  function obterConta(item) {
    if (item?.referenciaOrigem?.tipo !== 'conta') return null
    return contasPorId.get(String(item.referenciaOrigem.id)) || null
  }

  async function confirmarPagamento(payload) {
    if (!contaEmBaixa?.id || typeof marcarComoPago !== 'function') return false
    return marcarComoPago(contaEmBaixa.id, payload)
  }

  const acoesCabecalho = (
    <>
      <div className="agenda-operacional-filial">
        <label htmlFor="agenda-operacional-filial">Filial</label>
        <select
          id="agenda-operacional-filial"
          value={filialSelecionada}
          onChange={(evento) => setFilialSelecionada(evento.target.value)}
          disabled={!empresaId || atualizando}
        >
          <option value="">Todas as filiais</option>
          {filiaisAtivas.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
        </select>
      </div>
      <button type="button" onClick={atualizar} disabled={!empresaId || atualizando}>
        {atualizando ? 'Atualizando…' : 'Atualizar'}
      </button>
      <button type="button" className="outline" onClick={() => navegarPara('dashboard')}>Voltar ao painel</button>
    </>
  )

  if (!empresaId) {
    return (
      <main className="agenda-operacional-page">
        <PageHero kicker="Operação" title="Agenda operacional" description="Acompanhe compromissos por dia e aja apenas no que exige atenção." actions={acoesCabecalho} />
        <section className="agenda-operacional-estado" role="status">
          <h2>Selecione uma empresa</h2>
          <p>A Agenda será carregada quando houver uma empresa ativa.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="agenda-operacional-page">
      <PageHero
        kicker="Operação"
        title="Agenda operacional"
        description="Acompanhe compromissos por dia e aja apenas no que exige atenção."
        actions={acoesCabecalho}
        actionsClassName="agenda-operacional-acoes-cabecalho"
      />

      <section className="agenda-operacional-filtros" aria-label="Filtrar Agenda por origem">
        {filtrosVisiveis.map((filtro) => (
          <button
            type="button"
            key={filtro.id}
            className={origemSelecionada === filtro.id ? 'agenda-operacional-filtro ativo' : 'agenda-operacional-filtro'}
            aria-pressed={origemSelecionada === filtro.id}
            onClick={() => setOrigemSelecionada(filtro.id)}
          >
            {filtro.rotulo}
          </button>
        ))}
      </section>

      {fontesComErro.length > 0 && (
        <section className="agenda-operacional-erros" role="alert" aria-label="Fontes temporariamente indisponíveis">
          <strong>Parte das informações de Pessoas não pôde ser carregada.</strong>
          <ul>{fontesComErro.map((fonte) => <li key={fonte}>{mensagemFonte(fonte, erros[fonte])}</li>)}</ul>
        </section>
      )}

      {carregandoPessoas && <p className="agenda-operacional-carregando-pessoas" role="status">Atualizando informações de Pessoas…</p>}

      {carregandoInicial || (carregandoPessoas && resumo.totalItens === 0) ? (
        <section className="agenda-operacional-estado" role="status">
          <h2>Carregando Agenda</h2>
          <p>Organizando as ações disponíveis.</p>
        </section>
      ) : resumo.totalItens === 0 ? (
        <section className="agenda-operacional-estado" role="status">
          <h2>{origemSelecionada === 'todos' ? 'Nenhuma ação pendente' : 'Nenhum item neste filtro'}</h2>
          <p>{origemSelecionada === 'todos' ? 'Não há ações dentro da janela operacional atual.' : 'Escolha outra origem para consultar os demais itens.'}</p>
        </section>
      ) : (
        <div className="agenda-operacional-secoes">
          {SECOES.map((secao) => (
            <AgendaOperacionalSection
              key={secao.id}
              {...secao}
              itens={agenda.secoes[secao.id] || []}
              formatarValor={formatarValor}
              formatarData={formatarData}
              obterConta={obterConta}
              onAbrir={abrirOrigem}
              onEditar={abrirEdicaoConta}
              onPagar={setContaEmBaixa}
              podeEditarFinanceiro={podeEditarFinanceiro}
            />
          ))}
        </div>
      )}

      <AccountPaymentModal
        styles={styles}
        conta={contaEmBaixa}
        formatarValor={formatarValor}
        formatarData={formatarData}
        limitarDataInput={limitarDataInput}
        onClose={() => setContaEmBaixa(null)}
        onConfirm={confirmarPagamento}
      />
    </main>
  )
}
