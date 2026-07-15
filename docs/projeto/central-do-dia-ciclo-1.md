# Central do Dia — Ciclo 1

## Objetivo e decisão arquitetural

O Ciclo 1 adiciona ao Dashboard da V1 uma camada somente leitura que organiza dados já carregados em quatro blocos: ações imediatas, próximos vencimentos, exceções e atividade recente.

A Central foi incorporada progressivamente ao Dashboard porque os dados de Contas e Notas já estão disponíveis nessa composição. Uma nova rota exigiria consultas duplicadas e aumentaria o custo de navegação sem entregar valor adicional neste ciclo. Os indicadores e widgets existentes permanecem intactos.

Não há persistência de prioridade, responsável, prazo, automação ou agregação. Banco, RLS, migrations, Edge Functions e V2 não são alterados.

## Matriz técnica

| Tipo de atenção | Módulo | Condição objetiva | Severidade | Informação exibida | Próxima ação | Destino | Fonte oficial | Limitação |
|---|---|---|---|---|---|---|---|---|
| Conta vencida | Contas | status diferente de pago, registro ativo e vencimento anterior a hoje | crítica | título, atraso e valor | revisar ou registrar pagamento | Contas | array de contas do `useContas` | abre o módulo; não há deep link estável por conta |
| Conta vencendo hoje | Contas | registro ativo com vencimento igual a hoje | atenção | título, prazo e valor | conferir vencimento | Contas | array de contas do `useContas` | abre o módulo com o filtro de filial já ativo no Painel |
| Próximo vencimento | Contas | registro ativo entre 1 e 30 dias | informativa/atenção | título, dias e valor | conferir vencimento | Contas | array de contas do `useContas` | no máximo quatro itens por faixa |
| Imposto estruturado | Controle de Impostos | `imposto_tipo` igual a `simples_nacional`, `inss` ou `fgts` | conforme prazo | título, prazo e valor | conferir vencimento | Controle de Impostos | mesmos dados oficiais de Contas | outros tributos não são inferidos por texto |
| Nota atrasada | Notas | nota aberta com data anterior a hoje | atenção | título e atraso | revisar nota pendente | Notas | array de notas do `useNotas` | conteúdo da nota não é levado à Central |
| Nota urgente | Notas | nota aberta com prioridade urgente ou crítica | atenção/crítica | título e prioridade | revisar nota pendente | Notas | prioridade oficial da nota | nota sem data permanece acionável, mas não entra nas faixas de vencimento |
| Folha em aberto | Fechamento de Folha | alerta já produzido pelo resumo oficial de Gestão de Pessoas | atenção | competência e status | abrir acompanhamento | Fechamento de Folha | `useResumoGestaoPessoasPainel` | disponível apenas a perfil autorizado |
| Férias/exames | Férias e Funcionários | alerta objetivo já produzido pelo resumo oficial | atenção/informativa | quantidade e período resumido | abrir acompanhamento | módulo indicado pelo alerta | `useResumoGestaoPessoasPainel` | agregados; não identifica colaborador na Central |
| Falha ou bloqueio operacional | Auditoria e Logs | evento visível com status falha ou bloqueado | crítica/alta | ação, módulo, horário e ator seguro | consultar histórico | Auditoria | `df_auditoria_eventos` | somente Admin/Master e conforme RLS |
| Atividade recente | Auditoria e Logs | últimos eventos visíveis da empresa | informativa | ação legível, módulo, horário, status e ator seguro | consultar histórico | Auditoria | `df_auditoria_eventos` | não consulta `df_auditoria_admin`; não exibe JSON ou UUID |

### Módulos avaliados e não agregados

- Agenda: é uma visão derivada de Contas, Notas e Gestão de Pessoas; consultar novamente duplicaria a regra.
- Receitas: não existe neste ciclo uma regra oficial de exceção ou vencimento que possa ser aplicada sem inventar comportamento.
- Fluxo de Caixa: não é recalculado e não fornece uma exceção operacional objetiva para a Central.
- Registros sem centro ou filial: não são sinalizados porque a obrigatoriedade não é universal e não há regra oficial única.
- IPTU, taxas, financiamentos e classificações contábeis: permanecem fora para não criar regra fiscal/contábil nova.

## Arquitetura

| Camada | Responsabilidade |
|---|---|
| `domain/centralDoDiaRules.js` | normalização, prioridade, ordenação, agrupamento e estados puros |
| `services/centralDoDiaService.js` | consulta única, limitada e filtrada por empresa da atividade recente |
| `hooks/useCentralDoDia.js` | coordenação das fontes, proteção contra respostas antigas e atualização independente |
| `components/` | apresentação sem conhecimento de schema ou regras de negócio |
| `DashboardHome.jsx` | composição da seção com dados já disponíveis |
| `App.jsx` | passagem mínima dos arrays brutos e callbacks de leitura |

A leitura de Auditoria seleciona somente campos necessários, limita o resultado e mantém o filtro de `empresa_id`; a RLS continua sendo a proteção principal. Usuários sem permissão não iniciam essa consulta.

## Contrato normalizado

```js
{
  id,
  tipo,
  modulo,
  titulo,
  descricao,
  dataReferencia,
  dataHora,
  dias,
  valor,
  severidade,
  prioridade,
  status,
  inconsistencia,
  proximaAcao,
  destino,
  referenciaOrigem,
  ator
}
```

O contrato existe somente em memória. Conteúdo de notas, payloads, metadados, UUIDs e dados pessoais não são apresentados.

## Regra de prioridade

1. falha crítica;
2. evento bloqueado;
3. vencido;
4. vence hoje;
5. vence em até sete dias;
6. inconsistência objetiva;
7. informação.

Desempate: maior atraso, maior severidade, maior valor, data mais próxima e identificador interno em ordem estável.

## Estados e resiliência

Cada bloco trata carregamento, vazio, erro, empresa ausente e falta de permissão. Falha em Auditoria ou Gestão de Pessoas é apresentada como indisponibilidade parcial e não remove dados de Contas e Notas. A consulta de Auditoria usa um identificador de requisição para impedir que resposta antiga sobrescreva a nova.

A atualização manual recarrega Contas sem gerar recorrências, Notas e Auditoria. Gestão de Pessoas mantém o ciclo de carregamento oficial já existente para evitar uma segunda cadeia de consultas e o N+1 de férias.

## Navegação

A Central utiliza `navegarPara`, mecanismo oficial da V1. Como não existe contrato estável de deep link por registro, o Ciclo 1 abre o módulo de origem sem armazenar filtros em variáveis globais ou `localStorage`. O filtro de filial do Dashboard é aplicado antes da normalização de Contas e Notas.

## Testes e validações

Os testes puros cobrem prioridade, desempate, agrupamento por período, exclusão de concluídos, normalização, valor ausente, data inválida, estados de falha, ordenação estável, permissão e item sem destino. Componentes são validados no build e manualmente nos estados disponíveis, pois o projeto não possui runner de componentes instalado e nenhuma dependência foi adicionada.

Resoluções de validação visual: 360×800, 390×844, 768×1024, 1024×768, 1366×768 e 1440×900.

## Limitações e riscos residuais

- O Dashboard recebe os erros iniciais de Contas e Notas apenas pelos avisos existentes; esses hooks ainda não expõem um estado de erro consultável pela Central.
- A atualização manual não reinicia o resumo de Gestão de Pessoas para evitar novas consultas N+1.
- O ator da Auditoria aparece de forma genérica quando apenas `user_id` está disponível; não há consulta adicional de usuários.
- A navegação abre o módulo, sem destacar o registro, porque não existe deep link oficial para todos os módulos.
- A regra usa a data local do navegador, consistente com os widgets atuais do Dashboard.

## Plano técnico dos ciclos 2 a 7

| Ciclo | Objetivo e valor | Dependências e banco | Riscos | Módulos | Critério de conclusão |
|---|---|---|---|---|---|
| 2 — Responsável, prioridade e prazo | permitir filas explícitas e responsabilidade operacional | exige definição de modelo, migration e RLS | atribuição indevida e vazamento entre empresas | Central, usuários e módulos de origem | atribuição, prazos e permissões auditados ponta a ponta |
| 3 — Próxima ação e filas por exceção | organizar trabalho pendente por tipo e responsável | depende do Ciclo 2; pode exigir novas colunas/serviço | regras conflitantes entre módulos | Financeiro, Pessoas, Notas e Auditoria | filas determinísticas e origem rastreável |
| 4 — Indicadores acionáveis | transformar indicadores em listas explicáveis | depende das filas e de contratos estáveis; banco a avaliar | divergência entre KPI e lista | Dashboard e Relatórios | cada indicador abre o conjunto que o compõe |
| 5 — Aprovação e justificativa | registrar decisões críticas e sua justificativa | requer workflow, migration, RLS e auditoria | bloqueio indevido e exposição sensível | Financeiro, Folha, Administração | aprovação imutável, segregação e rollback definidos |
| 6 — Sugestões e automações | reduzir tarefas repetitivas com revisão humana | depende de regras aprovadas e novas funções; banco/Edge a avaliar | automação incorreta ou opaca | módulos priorizados pelos ciclos anteriores | sugestões explicáveis, opt-in e com desfazer |
| 7 — Histórico e melhoria contínua | medir tempo, recorrência e resolução das ações | depende de eventos completos e retenção definida | métricas incompletas e volume | Central, Auditoria e Relatórios | histórico compreensível, métricas validadas e operação documentada |

Nenhum ciclo futuro é implementado neste lote.
