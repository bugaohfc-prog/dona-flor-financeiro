export const CENTROS_CUSTO_ATUAIS = Object.freeze({
  ADMINISTRATIVO: 'Administrativo',
  ENCARGOS_TRABALHISTAS: 'Encargos Trabalhistas',
  FOLHA_BENEFICIOS: 'Folha e Benefícios',
  MARKETING_COMERCIAL: 'Marketing e Comercial',
  MEIOS_PAGAMENTO_FINANCEIRO: 'Meios de Pagamento e Financeiro',
  MERCADORIAS_COMPRAS: 'Mercadorias e Compras',
  OCUPACAO: 'Ocupação',
  PARCELAMENTOS_TRIBUTARIOS: 'Parcelamentos Tributários',
  PESSOAIS: 'Pessoais',
  PRO_LABORE: 'Pró-labore',
  SISTEMAS_TECNOLOGIA: 'Sistemas e Tecnologia',
  TRIBUTOS_TAXAS: 'Tributos e Taxas',
  TRIBUTOS_VENDAS: 'Tributos sobre Vendas',
  UTILIDADES: 'Utilidades',
  VEICULOS: 'Veículos'
})

function normalizarNomeCentro(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function ehCentroTributosTaxas(nome) {
  const normalizado = normalizarNomeCentro(nome)
  return normalizado === 'tributos e taxas' || normalizado === 'impostos e taxas'
}
