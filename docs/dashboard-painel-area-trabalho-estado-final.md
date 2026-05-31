# Dashboard/Painel - Estado Final Validado como Area de Trabalho

## 1. Objetivo

Registrar o estado final validado do Painel principal do DNA Gestao como Area de trabalho da empresa.

O Painel deixa de ser tratado como uma tela financeira pesada e passa a funcionar como ponto inicial de acompanhamento rapido, com blocos operacionais e caminhos claros para as telas completas.

## 2. Decisao de produto

O Painel principal nao e Analise Financeira.

O Painel tambem nao e:

- lista completa de Contas;
- historico completo de Notas;
- area de graficos financeiros detalhados;
- ranking ou comparativo gerencial financeiro.

O Painel e a area inicial de acao da empresa. Sua funcao e mostrar o que exige acompanhamento rapido e direcionar o usuario para as telas especializadas quando for necessario aprofundar.

## 3. Blocos mantidos no Painel

### Resumo financeiro rapido

O bloco permanece como leitura curta do financeiro operacional.

Campos mantidos:

- Total;
- Pago;
- Pendente;
- Vencido.

Acao mantida:

- botao Ver Analise Financeira.

Funcao:

- oferecer uma visao curta do estado financeiro;
- permitir acesso rapido a Analise Financeira;
- nao substituir KPIs detalhados, graficos ou comparativos.

### Proximos vencimentos

O bloco permanece como acompanhamento operacional por prazo.

Funcao:

- mostrar vencimentos proximos;
- apoiar acao diaria;
- manter a leitura do que precisa ser acompanhado no curto prazo.

Acao mantida:

- botao Ver contas.

Esse bloco nao substitui a tela Contas. A tela Contas continua sendo o local correto para listagem completa, filtros, busca, pagamento e gestao detalhada.

### Notas e pendencias

O bloco do Painel passa a representar pendencias prioritarias, e nao historico completo.

Comportamento validado:

- inicia expandido;
- exibe ate 5 notas;
- prioriza notas criticas;
- depois notas urgentes;
- depois notas vencidas;
- depois notas com prazo hoje;
- depois notas dos proximos 7 dias;
- usa pendentes recentes como fallback quando faltarem itens mais relevantes.

Acao mantida:

- botao Ver notas.

A pagina Notas continua sendo o local correto para todas as notas, historico completo, busca, filtros e gestao completa.

### Filtro de filial / empresa ativa

Quando existir, o filtro de filial deve ser preservado.

Regras preservadas:

- nao alterar empresa ativa;
- nao alterar regra de filtro;
- nao alterar permissoes;
- nao alterar origem dos dados.

## 4. Blocos removidos da renderizacao principal

Foram removidos da abertura principal do Painel:

- Ranking de unidades;
- Maior pendencia;
- Risco vencido;
- Comparativo por filial;
- Saude financeira;
- Fluxo atual;
- Centros de custo;
- Contas em aberto como lista longa;
- card separado de Analise Financeira.

Motivo:

Esses blocos pertencem a Analise Financeira ou as telas especificas. Mantelos no Painel fazia a area inicial parecer uma tela analitica financeira, contrariando o posicionamento do DNA Gestao como plataforma modular.

## 5. Destino das informacoes removidas

Mapeamento oficial:

- Ranking, comparativos, saude financeira, fluxo financeiro e centros de custo devem ficar em Analise Financeira;
- lista completa de contas deve ficar em Contas;
- historico completo de notas deve ficar em Notas.

O Painel deve apenas apontar para essas areas, nao duplicar suas funcoes completas.

## 6. Regras para evolucoes futuras

Regras de preservacao do conceito:

- nao recolocar graficos financeiros pesados no Painel;
- nao recriar lista longa de contas no Painel;
- nao transformar Notas do Painel em historico completo;
- qualquer novo bloco deve ser operacional, acionavel e de leitura rapida;
- futuro bloco de Gestao de Pessoas deve usar dados reais;
- nao criar placeholder falso;
- nao inventar compromissos, alertas ou indicadores;
- nao exibir dados sensiveis de pessoas sem planejamento especifico;
- nao alterar regras de empresa ativa, permissoes ou filtros sem ciclo proprio.

## 7. Espaco futuro para Gestao de Pessoas

O Painel ficou preparado para receber, em ciclo proprio, blocos reais de Gestao de Pessoas.

Possibilidades futuras:

- ferias proximas;
- exames a vencer;
- aniversarios;
- folha em aberto;
- pendencias de funcionarios.

Criterios para evolucao:

- usar somente dados reais ja disponiveis ou criados em ciclo especifico;
- respeitar permissoes;
- evitar CPF e dados sensiveis em listagens;
- nao exibir dados medicos, laudos, documentos, CID ou diagnosticos;
- nao criar placeholders falsos;
- planejar visual, seguranca e permissao antes da implementacao.

## 8. Checklist de validacao futura

- [ ] Painel abre leve;
- [ ] Resumo financeiro rapido aparece;
- [ ] botao Ver Analise Financeira funciona;
- [ ] Proximos vencimentos aparece;
- [ ] botao Ver contas funciona;
- [ ] Notas e pendencias aparece expandido;
- [ ] botao Ver notas funciona;
- [ ] nao ha graficos financeiros pesados;
- [ ] nao ha ranking financeiro;
- [ ] nao ha lista longa de contas;
- [ ] mobile aceitavel;
- [ ] build aprovado quando houver codigo.

## 9. Proximos passos recomendados

1. Validar mobile com calma.
2. Planejar futuro bloco Gestao de Pessoas.
3. Documentar ou revisar padroes de botoes e cards depois.
4. Nao mexer novamente no Painel financeiro sem necessidade.
