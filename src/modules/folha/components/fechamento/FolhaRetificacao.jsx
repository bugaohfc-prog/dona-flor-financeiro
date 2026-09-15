import { useEffect, useRef, useState } from 'react'
import { competenciaPermiteRetificacao, validarRetificacao } from '../../utils/fechamento/folhaRetificacao'
import { formatarData } from '../../utils/fechamento/folhaFormatters'

export default function FolhaRetificacao({ original, destinos, carregando, erroCarga, salvar, fechar }) {
  const [destinoId, setDestinoId] = useState('')
  const [data, setData] = useState(original.item.data_referencia || '')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const envio = useRef(false)
  const pedido = useRef(null)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  const opcoes = destinos.filter((c) => c.id !== original.competencia.id && competenciaPermiteRetificacao(c))
  async function confirmar(event) {
    event.preventDefault()
    if (envio.current) return
    setErro('')
    try {
      validarRetificacao({ destino: opcoes.find((c) => c.id === destinoId), origemId: original.competencia.id, data, motivo })
      const assinatura = JSON.stringify([destinoId, data, motivo.trim()])
      if (pedido.current?.assinatura !== assinatura) pedido.current = { assinatura, correlation: crypto.randomUUID() }
      envio.current = true
      setSalvando(true)
      const resposta = await salvar({ item_original_id: original.item.id, competencia_destino_id: destinoId,
        data_referencia_corrigida: data, motivo, correlation_id: pedido.current.correlation })
      if (resposta?.error) throw resposta.error
      if (!resposta?.data?.ok) throw new Error('Não foi possível comprovar a retificação.')
      fechar(true)
    } catch (e) {
      setErro(e.message || 'Não foi possível retificar. Nenhuma etapa deve ser salva parcialmente.')
    } finally {
      envio.current = false
      setSalvando(false)
    }
  }
  return <section className="folha-retificacao" aria-label="Retificar histórico" tabIndex={-1} ref={ref}>
    <h3>Retificar histórico</h3>
    <p>{original.nome} · {original.competencia.competencia} · {formatarData(original.item.data_referencia)} · Falta injustificada</p>
    <p>O registro original será preservado e arquivado. O vínculo não será reativado.</p>
    {carregando ? <p role="status">Carregando competências elegíveis…</p> : erroCarga ? <p role="alert">{erroCarga}</p> : !opcoes.length ? <p>Nenhuma competência destino elegível.</p> : null}
    <form className="folha-lancamento-form" onSubmit={confirmar}>
      <label className="folha-field"><span>Competência destino</span><select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} required disabled={salvando || carregando}><option value="">Selecione</option>{opcoes.map((c) => <option key={c.id} value={c.id}>{c.competencia}{c.arquivado ? ' · Arquivada' : ''}</option>)}</select></label>
      <label className="folha-field"><span>Data corrigida</span><input type="date" value={data} onChange={(e) => setData(e.target.value)} required disabled={salvando} /></label>
      <label className="folha-field"><span>Motivo da retificação</span><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} required disabled={salvando} /></label>
      {erro ? <p role="alert">{erro}</p> : null}
      <div className="folha-row-actions"><button className="folha-btn folha-btn-primary" type="submit" disabled={salvando || carregando || Boolean(erroCarga) || !opcoes.length}>{salvando ? 'Retificando…' : 'Confirmar retificação'}</button><button className="folha-btn folha-btn-secondary" type="button" disabled={salvando} onClick={() => fechar(false)}>Cancelar</button></div>
    </form>
  </section>
}
