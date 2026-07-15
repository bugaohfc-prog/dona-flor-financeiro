import { useEffect, useMemo } from 'react'
import PageHero from '../../../../components/shared/PageHero.jsx'
import { useAgendaOperacional } from '../../hooks/useAgendaOperacional.js'
import AgendaOperacionalItem from './AgendaOperacionalItem.jsx'
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
  { id: 'atrasados', titulo: 'Atrasados', descricao: 'Itens com prazo vencido que exigem atenção.' },
  { id: 'hoje', titulo: 'Hoje', descricao: 'Ações e prazos previstos para hoje.' },
  { id: 'proximosSeteDias', titulo: 'Próximos 7 dias', descricao: 'Prioridades da próxima semana.' },
  { id: 'proximosQuinzeDias', titulo: 'De 8 a 15 dias', descricao: 'Prazos para preparar com antecedência.' },
  { id: 'proximosTrintaDias', titulo: 'De 16 a 30 dias', descricao: 'Compromissos do restante da janela operacional.' },
  { id: 'excecoes', titulo: 'Exceções', descricao: 'Inconsistências objetivas que precisam de revisão.' },
  { id: 'semDataAcionaveis', titulo: 'Ações sem data', descricao: 'Ações válidas sem prazo temporal definido.' }
]

const CONTADORES = [
  ['atrasados', 'Atrasados'],
  ['hoje', 'Hoje'],
  ['proximosSeteDias', 'Próximos 7 dias'],
  ['oitoATrintaDias', 'De 8 a 30 dias'],
  ['excecoes', 'Exceções']
]

function mensagemFonte(fonte, erro) {
  const rotulos = {
    funcionarios: 'Funcionários',
    ferias: 'Férias',
    exames: 'Exames periódicos',
    folha: 'Fechamento de Folha'
  }
  return `${rotulos[fonte] || fonte}: ${erro}`
}

export default function AgendaOperacional({
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
  formatarValor,
  formatarData
}) {
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
  const filtrosVisiveis = FILTROS_ORIGEM.filter((filtro) => !filtro.requerPessoas || podeAcessarPessoas)

  useEffect(() => {
    if (
      filialSelecionada &&
      !filiaisAtivas.some((filial) => String(filial?.id || '') === String(filialSelecionada))
    ) setFilialSelecionada('')
  }, [filialSelecionada, filiaisAtivas, setFilialSelecionada])

  function abrirOrigem(item) {
    const referencia = item?.referenciaOrigem
    if (item?.destino === 'contas' && referencia?.tipo === 'conta' && referencia.id) {
      navegarParaOrigemAgenda('conta', referencia.id)
      return
    }
    if (item?.destino === 'notas' && referencia?.tipo === 'nota' && referencia.id) {
      navegarParaOrigemAgenda('nota', referencia.id)
      return
    }
    if (item?.destino) navegarPara(item.destino)
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
        <PageHero kicker="Operação" title="Agenda — Central de ações" description="Acompanhe prazos, pendências e ações que exigem atenção." actions={acoesCabecalho} />
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
        title="Agenda — Central de ações"
        description="Acompanhe prazos, pendências e ações que exigem atenção."
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

      <section className="agenda-operacional-contadores" aria-label="Resumo da Agenda">
        {CONTADORES.map(([chave, rotulo]) => (
          <article key={chave} className="agenda-operacional-contador">
            <span>{rotulo}</span>
            <strong>{resumo.contadores[chave]}</strong>
          </article>
        ))}
      </section>

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
        <>
          {resumo.atencaoPrimeiro.length > 0 && (
            <section className="agenda-operacional-atencao" aria-labelledby="agenda-atencao-titulo">
              <div className="agenda-operacional-titulo-secao">
                <h2 id="agenda-atencao-titulo">Atenção primeiro</h2>
                <p>As três maiores prioridades entre as seções abaixo.</p>
              </div>
              <div className="agenda-operacional-atencao-grid">
                {resumo.atencaoPrimeiro.map((item) => (
                  <AgendaOperacionalItem key={item.id} item={item} formatarValor={formatarValor} formatarData={formatarData} onAbrir={abrirOrigem} />
                ))}
              </div>
            </section>
          )}

          <div className="agenda-operacional-secoes">
            {SECOES.map((secao) => (
              <AgendaOperacionalSection
                key={secao.id}
                {...secao}
                itens={agenda.secoes[secao.id] || []}
                formatarValor={formatarValor}
                formatarData={formatarData}
                onAbrir={abrirOrigem}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
