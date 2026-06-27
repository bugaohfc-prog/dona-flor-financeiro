# Plano: parcelamento de contas

## Contexto

Este documento audita a estrutura atual do Financeiro e propõe um caminho seguro para implementar parcelamento de contas em ciclo futuro.

Este ciclo foi somente leitura/documentação:

- não alterou banco;
- não criou migration;
- não alterou UI funcional;
- não alterou services/hooks;
- não executou UPDATE;
- não criou, excluiu, baixou ou reclassificou contas.

## Estado atual de `df_contas`

A tabela real `public.df_contas` foi auditada por metadados do Supabase e pelo código/migrations do repositório.

Campos relevantes atuais:

- identificação e multiempresa:
  - `id`
  - `empresa_id`
  - `user_id`
  - `criado_por`
  - `criado_em`
  - `atualizado_em`
- dados principais:
  - `descricao`
  - `valor`
  - `vencimento`
  - `data_vencimento`
  - `centro`
  - `centro_custo_id`
  - `filial_id`
  - `observacao`
- status e baixa:
  - `status`
  - `valor_pago`
  - `data_pagamento`
  - `juros_multa`
  - `desconto`
  - `observacao_pagamento`
- lixeira:
  - `deletado`
  - `data_exclusao`
  - `excluido`
  - `excluido_em`
- ocultação operacional:
  - `oculto`
  - `oculto_em`
- recorrência:
  - `recorrencia_id`
- fiscal:
  - `imposto_tipo`
  - `competencia`
- notificações:
  - `enviar_whatsapp`
  - `enviar_email`
  - `enviar_push`
  - `dias_aviso`

Campos atuais de pagamento real:

- `valor_pago`
- `data_pagamento`
- `juros_multa`
- `desconto`
- `observacao_pagamento`

A trigger `df_contas_calcular_baixa_pagamento` mantém a lógica binária de baixa:

- se `status = 'pago'`, preenche/usa dados de pagamento;
- se `status <> 'pago'`, limpa `valor_pago`, `data_pagamento`, `juros_multa`, `desconto` e `observacao_pagamento`.

## Pagamento parcial existente

Pagamento parcial já usa tabela própria:

- `public.df_contas_pagamentos`

Campos principais:

- `id`
- `empresa_id`
- `conta_id`
- `valor_pago`
- `data_pagamento`
- `observacao`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`
- `criado_por`
- `atualizado_por`

O vínculo é por `conta_id`, então cada pagamento parcial pertence a uma conta específica. Isso é compatível com parcelamento: cada parcela será uma conta independente e poderá ter seus próprios pagamentos parciais.

## Recorrência existente

Recorrências usam:

- `public.df_contas_recorrentes`
- `df_contas.recorrencia_id`

Campos principais da série:

- `id`
- `empresa_id`
- `descricao`
- `valor`
- `centro_custo_id`
- `filial_id`
- `tipo_recorrencia`
- `dia_vencimento`
- `data_inicio`
- `ativo`
- `valor_variavel`

O fluxo de recorrência gera contas ao longo do tempo. Parcelamento não deve usar essa tabela, porque parcelamento cria um conjunto finito de contas independentes no momento da criação.

## Existe estrutura atual de parcelamento?

Não existe estrutura de parcelamento financeiro hoje.

Auditoria por nomes de tabelas/colunas no schema `public` encontrou apenas `numero_parcela` no módulo de férias:

- `public.df_funcionarios_ferias_periodos.numero_parcela`

Não foram encontrados, no Financeiro:

- tabela de parcelas financeiras;
- `grupo_parcelamento_id`;
- `parcelamento_id`;
- `conta_origem_id`;
- `conta_origem_parcelamento_id`;
- `parcela_atual`;
- `parcela_numero`;
- `parcelas_total`;
- `total_parcelas`.

## Fluxo atual de criação de conta

Arquivos auditados:

- `src/components/modals/AccountModal.jsx`
- `src/hooks/useContas.js`
- `src/services/contasService.js`

O fluxo atual cria uma única conta por envio do modal:

1. `AccountModal.jsx` coleta descrição, valor, vencimento, filial, centro, fiscal, observação, notificações e recorrência.
2. `useContas.salvarConta` valida campos obrigatórios.
3. `useContas.salvarContaInterno` monta `payload`.
4. Para nova conta, chama `criarConta`.
5. Se `contaRecorrente` estiver marcada, cria ou reaproveita uma série recorrente e vincula a conta inicial.

Pontos importantes:

- criação de conta avulsa e criação de recorrência já estão misturadas no modal, mas a separação de edição de conta/série foi estabilizada;
- recorrência tem prevenção de duplicidade própria;
- pagamento parcial é posterior à criação da conta e não interfere na criação;
- baixa normal altera apenas a conta escolhida.

## Riscos de parcelamento com frentes existentes

### Pagamento parcial

Cada parcela deve ser uma conta independente. Assim, pagamentos parciais continuam vinculados a uma parcela específica por `df_contas_pagamentos.conta_id`.

Risco: exibir saldo do parcelamento inteiro como se fosse saldo de uma parcela. A primeira versão deve manter pagamento parcial sempre no nível da conta/parcela.

### Baixa normal

A baixa integral deve continuar atuando em uma única conta. Baixar a parcela 2/6 não deve baixar as demais.

Risco: criar ação em lote sem confirmação. Não recomendado na primeira versão.

### Estorno integral

Estorno integral deve continuar revertendo apenas a conta/parcela selecionada.

Risco: usuário esperar estorno do parcelamento inteiro. A UI precisa deixar claro que a ação é por parcela.

### Recorrência

Parcelamento não deve criar série recorrente e não deve depender de `df_contas_recorrentes`.

Risco: usuário marcar "Conta recorrente" e "Parcelar conta" ao mesmo tempo. A UI futura deve tratar como opções mutuamente exclusivas.

### Valor variável

Valor variável é característica de série recorrente. Parcelamento deve ter valores definidos por parcela e não usar `valor_variavel`.

Risco: confundir valor variável com parcelamento. Textos e badges devem ser diferentes.

### Impostos

Parcelas fiscais podem existir, mas a primeira versão deve apenas copiar `imposto_tipo` e `competencia` se o usuário informar. Não deve criar regras fiscais automáticas.

Risco: parcelar imposto e gerar competências erradas. Para impostos, pode ser necessário orientar revisão manual.

### Ocultar/reexibir

Ocultar uma parcela deve ocultar apenas aquela conta.

Risco: usuário esperar ocultação do grupo inteiro. Ação em lote deve ficar para ciclo futuro.

### Lixeira

Enviar uma parcela para lixeira deve afetar apenas aquela conta.

Risco: manter grupo incompleto visualmente. O card deve continuar mostrando a posição da parcela para facilitar conferência.

### Relatórios

Relatórios que somam `df_contas.valor` passarão a refletir cada parcela no seu vencimento. Isso é desejável para fluxo de caixa.

Risco: relatórios de "valor total contratado" não existirão automaticamente. Se necessário, usar `valor_total_parcelamento` no futuro.

### Filtros de contas abertas/pagas

Cada parcela deve seguir o status próprio:

- parcela aberta aparece em abertas/vencidas;
- parcela paga aparece em pagas;
- outras parcelas do mesmo grupo não mudam.

### Cards mobile

O badge deve ser curto:

- `Parcelado`
- `Parcela 1/6`

Risco: poluir os cards já densos. O texto deve ficar compacto e não competir com pagamento parcial, imposto ou recorrência.

## Modelo recomendado

### Recomendação

Para a primeira versão segura, recomenda-se adicionar campos opcionais diretamente em `df_contas`, sem criar tabela nova:

- `grupo_parcelamento_id uuid null`
- `parcela_numero integer null`
- `parcelas_total integer null`
- `valor_total_parcelamento numeric(12,2) null`

Essa opção é mais simples e segura porque:

- cada parcela continua sendo uma conta comum;
- não exige nova tabela exposta via API;
- não exige novas policies/RLS;
- não muda baixa, estorno, pagamento parcial, lixeira ou impostos;
- permite agrupar visualmente as parcelas quando necessário;
- preserva o comportamento atual dos relatórios por vencimento.

### Por que não começar com tabela separada?

Uma tabela `df_contas_parcelamentos` daria mais rastreabilidade de cabeçalho, mas traria mais risco e mais superfície:

- nova tabela pública;
- RLS/policies/grants;
- triggers de timestamps e bloqueio de DELETE;
- validação de `empresa_id`;
- service novo;
- sincronização entre cabeçalho e parcelas;
- mais risco de inconsistência se o cabeçalho existir sem parcelas ou vice-versa.

Como a regra desejada diz que as parcelas devem ser contas independentes, a tabela separada não é necessária para a primeira entrega funcional.

Ela pode ser considerada depois se houver necessidade de:

- editar o parcelamento inteiro em lote;
- cancelar grupo inteiro;
- registrar contrato/documento do parcelamento;
- controlar valor total contratado independentemente da soma das parcelas;
- criar auditoria de grupo.

## Migration proposta para ciclo futuro

Não executar neste ciclo.

```sql
alter table public.df_contas
  add column if not exists grupo_parcelamento_id uuid null,
  add column if not exists parcela_numero integer null,
  add column if not exists parcelas_total integer null,
  add column if not exists valor_total_parcelamento numeric(12,2) null;

alter table public.df_contas
  drop constraint if exists df_contas_parcelamento_consistente,
  add constraint df_contas_parcelamento_consistente
    check (
      (
        grupo_parcelamento_id is null
        and parcela_numero is null
        and parcelas_total is null
        and valor_total_parcelamento is null
      )
      or
      (
        grupo_parcelamento_id is not null
        and parcela_numero is not null
        and parcelas_total is not null
        and parcela_numero >= 1
        and parcelas_total >= 2
        and parcela_numero <= parcelas_total
        and (valor_total_parcelamento is null or valor_total_parcelamento >= 0)
      )
    );

create index if not exists idx_df_contas_empresa_grupo_parcelamento
on public.df_contas (empresa_id, grupo_parcelamento_id)
where grupo_parcelamento_id is not null;

create index if not exists idx_df_contas_empresa_parcelamento_ordem
on public.df_contas (empresa_id, grupo_parcelamento_id, parcela_numero)
where grupo_parcelamento_id is not null;

comment on column public.df_contas.grupo_parcelamento_id is
  'Identificador lógico que agrupa contas criadas no mesmo parcelamento. Cada parcela continua sendo uma conta independente.';

comment on column public.df_contas.parcela_numero is
  'Número da parcela dentro do grupo de parcelamento.';

comment on column public.df_contas.parcelas_total is
  'Quantidade total de parcelas do grupo.';

comment on column public.df_contas.valor_total_parcelamento is
  'Valor total informado no momento da criação do parcelamento, usado apenas para conferência visual.';
```

Observação: `grupo_parcelamento_id` deve ser gerado pela aplicação no momento de criar o lote de parcelas. Não precisa referenciar outra tabela nesta primeira versão.

## Regra funcional proposta

Na criação de conta:

1. Usuário marca `Parcelar conta`.
2. Informa:
   - valor total;
   - número de parcelas;
   - primeiro vencimento;
   - periodicidade mensal.
3. Sistema calcula as parcelas.
4. Sistema cria várias linhas em `df_contas`, uma por parcela.
5. Todas recebem o mesmo `grupo_parcelamento_id`.
6. Cada linha recebe:
   - `parcela_numero`;
   - `parcelas_total`;
   - `valor_total_parcelamento`;
   - valor da parcela;
   - vencimento da parcela;
   - demais campos principais copiados do formulário.

Cada parcela:

- pode ser baixada individualmente;
- pode receber pagamento parcial individualmente;
- pode ser editada individualmente;
- pode ser ocultada individualmente;
- pode ir para lixeira individualmente;
- não cria recorrência;
- não altera outras parcelas do grupo automaticamente.

## Cálculo de valores

Regra recomendada:

- dividir o valor total pelo número de parcelas;
- arredondar para 2 casas decimais;
- aplicar eventual diferença de centavos na última parcela;
- garantir que a soma das parcelas seja exatamente igual ao valor total informado.

Exemplo:

- valor total: R$ 100,00;
- 3 parcelas:
  - R$ 33,33;
  - R$ 33,33;
  - R$ 33,34.

## Vencimentos

Regra recomendada:

- primeira parcela usa o vencimento informado;
- demais parcelas usam periodicidade mensal;
- quando o dia não existir no mês seguinte, usar o último dia do mês, seguindo padrão já usado em recorrência.

Exemplo:

- primeira parcela em 31/01;
- segunda em 28/02 ou 29/02;
- terceira em 31/03.

## UI futura

No modal de conta:

- adicionar opção `Parcelar conta`;
- quando marcada, esconder/desabilitar recorrência;
- campos:
  - valor total;
  - número de parcelas;
  - primeiro vencimento;
  - periodicidade mensal;
  - prévia das parcelas, se simples e segura.

Nos cards/lista:

- badge `Parcelado`;
- texto compacto `Parcela 1/6`;
- manter valor e vencimento da parcela individual;
- não misturar com badge de recorrência;
- não misturar com badge de pagamento parcial.

## Impactos por área

### Baixa e estorno

Sem alteração de regra no primeiro ciclo funcional. Ações continuam por conta.

### Pagamento parcial

Sem alteração estrutural. Pagamentos parciais continuam por `conta_id`.

### Recorrência

Parcelamento e recorrência devem ser mutuamente exclusivos na criação.

### Valor variável

Sem relação direta. Valor variável continua sendo apenas de recorrência.

### Impostos

Campos fiscais podem ser copiados para cada parcela, mas sem automação fiscal adicional.

### Relatórios

Relatórios existentes devem continuar somando as parcelas como contas normais nos respectivos vencimentos.

### Dashboard/Agenda

Como cada parcela é uma conta, Agenda e Dashboard devem enxergar cada vencimento individualmente.

## Riscos principais

1. **Duplicidade por duplo submit:** criar várias parcelas duas vezes. Mitigar com loading, bloqueio de duplo submit e, se possível, validação por `grupo_parcelamento_id`.
2. **Arredondamento incorreto:** soma das parcelas não fecha com o total. Mitigar com função utilitária testada.
3. **Confusão com recorrência:** usuário pode achar que parcelamento gera contas indefinidamente. Mitigar com opções mutuamente exclusivas.
4. **Ações em lote não existentes:** usuário pode esperar editar/excluir todo o grupo. Primeira versão deve deixar claro que cada parcela é independente.
5. **Relatórios de valor total:** relatórios atuais verão parcelas por vencimento, não contrato total. Isso é desejável para fluxo de caixa, mas precisa ser comunicado.
6. **Lixeira parcial:** excluir uma parcela deixa grupo incompleto. Não corrigir automaticamente.
7. **Impostos parcelados:** podem exigir regra fiscal específica depois. Não automatizar neste primeiro ciclo.

## Plano em etapas

### Etapa 1 - Migration estrutural

- adicionar campos opcionais em `df_contas`;
- criar constraints de consistência;
- criar índices por `empresa_id + grupo_parcelamento_id`;
- não alterar dados existentes;
- não criar tabela nova.

### Etapa 2 - Utilitário de cálculo

- criar função pura para gerar plano de parcelas;
- validar arredondamento;
- validar datas mensais;
- sem acesso ao banco.

### Etapa 3 - Criação em lote

- adicionar opção no modal;
- gerar `grupo_parcelamento_id`;
- inserir parcelas via lote;
- bloquear duplo submit;
- não permitir recorrência simultânea.

### Etapa 4 - Exibição visual

- badge `Parcelado`;
- texto `Parcela N/T`;
- filtros continuam iguais.

### Etapa 5 - Revisão de relatórios

- confirmar se relatórios atuais por vencimento já bastam;
- só criar visão de grupo se houver necessidade operacional.

## Checklist de validação futura

- Criar conta avulsa normal continua igual.
- Criar conta recorrente continua igual.
- Criar parcelamento de 2 parcelas cria 2 contas.
- Criar parcelamento de 6 parcelas cria 6 contas.
- Soma dos valores das parcelas fecha com o total.
- Vencimentos mensais são calculados corretamente.
- Cada parcela baixa individualmente.
- Cada parcela aceita pagamento parcial individual.
- Estorno integral afeta só a parcela selecionada.
- Ocultar/reexibir afeta só a parcela selecionada.
- Lixeira afeta só a parcela selecionada.
- Relatórios somam parcelas nos meses corretos.
- Mobile não estoura cards nem modal.
- Não há rolagem lateral.

## Rollback previsto

Para documentação:

```bash
git revert <commit>
```

Para migration futura, se autorizada e ainda sem dados em produção:

```sql
alter table public.df_contas
  drop column if exists valor_total_parcelamento,
  drop column if exists parcelas_total,
  drop column if exists parcela_numero,
  drop column if exists grupo_parcelamento_id;
```

Se já houver parcelas criadas em produção, não remover os campos sem plano de migração/arquivamento dos dados.
