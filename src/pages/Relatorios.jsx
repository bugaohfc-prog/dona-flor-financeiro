import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// 🔥 Ferramentas centralizadas (Fim do Bloco 0 gigante!)
import { money, dateBR } from '../utils/format';

export default function Relatorios({ voltar, contas = [] }) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualPadrao());

  // Funções estritamente necessárias para o relatório
  function mesAtualPadrao() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }

  function formatarPercentual(valor) {
    return `${Number(valor || 0).toFixed(1)}%`;
  }

  function estaVencida(data, status) {
    if (!data || status === 'Pago') return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(data + 'T00:00:00');
    vencimento.setHours(0, 0, 0, 0);
    return vencimento < hoje;
  }

  // Filtragem inteligente para o ciclo FCA (Fato e Causa)
  const contasDoMes = useMemo(() => {
    return contas.filter(c => {
      const dataVencimento = c.data_vencimento || c.vencimento;
      return String(dataVencimento).startsWith(mesSelecionado);
    });
  }, [contas, mesSelecionado]);

  // Métricas do Fato
  const total = contasDoMes.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const pagas = contasDoMes.filter(c => c.status === 'Pago');
  const totalPago = pagas.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const totalAberto = total - totalPago;

  return (
    <div style={{ paddingBottom: '24px' }}>
      <div className="dashboard-section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f766e' }}>Relatório Financeiro</h2>
          <small>Análise de métricas e centros de custo</small>
        </div>
        <button className="outline" onClick={voltar}>
          Voltar ao Painel
        </button>
      </div>

      <div className="dashboard-inline-filter">
        <input 
          type="month" 
          value={mesSelecionado} 
          onChange={(e) => setMesSelecionado(e.target.value)} 
          style={{ maxWidth: '220px' }}
        />
      </div>

      {/* Grid Suave: Os cartões ajustam-se automaticamente sem truncar */}
      <div className="grid3">
        <div className="caixaCinza card">
          <small style={{ color: '#64748b', fontWeight: 'bold' }}>Total do Mês</small>
          <strong style={{ fontSize: '24px', color: '#0f172a', marginTop: '8px' }}>
            {money(total)}
          </strong>
        </div>

        <div className="caixaCinza card">
          <small style={{ color: '#64748b', fontWeight: 'bold' }}>Total Pago</small>
          <strong style={{ fontSize: '24px', color: '#0f766e', marginTop: '8px' }}>
            {money(totalPago)}
          </strong>
          {total > 0 && (
            <small style={{ color: '#0f766e', marginTop: '4px' }}>
              {formatarPercentual((totalPago / total) * 100)} concluído
            </small>
          )}
        </div>

        <div className="caixaCinza card">
          <small style={{ color: '#64748b', fontWeight: 'bold' }}>Em Aberto</small>
          <strong style={{ fontSize: '24px', color: '#ef4444', marginTop: '8px' }}>
            {money(totalAberto)}
          </strong>
        </div>
      </div>

      {/* Detalhamento para isolar a Causa */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Detalhamento por Loja / Centro</h3>
        
        <div className="dashboard-open-list">
          {contasDoMes.map((conta) => {
            const vencida = estaVencida(conta.data_vencimento || conta.vencimento, conta.status);
            
            return (
              <div key={conta.id} className="dashboard-account-row">
                <div>
                  <strong style={{ fontSize: '15px' }}>{conta.descricao}</strong>
                  <small style={{ color: '#64748b' }}>
                    {conta.df_centros_custo?.nome || conta.centro || "Sem centro de custo"}
                  </small>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <b style={{ color: conta.status === 'Pago' ? '#0f766e' : '#111827', fontSize: '15px' }}>
                    {money(conta.valor)}
                  </b>
                  <small style={{ display: 'block', color: vencida ? '#ef4444' : '#64748b', fontWeight: vencida ? 'bold' : 'normal' }}>
                    Venc: {dateBR(conta.data_vencimento || conta.vencimento)}
                  </small>
                </div>
              </div>
            );
          })}

          {contasDoMes.length === 0 && (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
              Nenhuma movimentação registada neste mês.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
