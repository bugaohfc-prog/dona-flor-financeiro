# Recorrência com valor variável - plano técnico

Data da auditoria: 24/06/2026

## Objetivo

Permitir que uma série recorrente seja identificada como de valor variável, mantendo o valor da série como estimativa e exigindo conferência da conta gerada em cada competência.

Este documento é somente planejamento. Nenhuma migration, alteração de dados, mudança de UI ou mudança de regra foi executada neste ciclo.

## Estado da implementação estrutural

Em 24/06/2026 foi criada e aplicada a migration
`20260624224625_add_valor_variavel_df_contas_recorrentes.sql`.

A migration adiciona somente `public.df_contas_recorrentes.valor_variavel`
como `boolean not null default false`. Todas as séries existentes permanecem
com comportamento de valor fixo. Na etapa estrutural, UI, services, hooks,
geração, duplicidade, edição de parcela/série, RLS e policies não foram
alterados.

Em 24/06/2026, o campo passou a ser usado pelo fluxo existente de contas:

- o modal exibe `Valor variável` somente para conta recorrente;
- criação e edição da série persistem `valor_variavel`;
- edição de conta vinculada carrega o valor da série, com fallback `false`;
- cards de contas vinculadas exibem o badge `Valor variável` quando aplicável;
- geração e prevenção de duplicidade permanecem com a regra anterior.

## Estado atual

### Banco

A série é armazenada em `public.df_contas_recorrentes`. A conta gerada fica em `public.df_contas` e referencia a série por `df_contas.recorrencia_id`.

Campos atuais de `df_contas_recorrentes`:

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
- `enviar_whatsapp`
- `enviar_email`
- `enviar_push`
- `dias_aviso`
- `created_at`

Não existe campo equivalente a:

- `valor_variavel`
- `tipo_valor`
- `valor_estimado`
- `valor_base` para recorrência
- `permite_valor_variavel`
- `recorrencia_valor_variavel`

Também não existe campo de instrução ou observação na série. A referência a `recorrencia.observacao` durante a geração não encontra coluna correspondente no schema atual.

Estado consultado em produção:

- 81 séries;
- 70 ativas e 11 inativas;
- todas as 81 séries são mensais;
- nenhuma série está sem valor ou com valor zero;
- 105 contas estão vinculadas a 80 séries;
- 5 contas vinculadas estão ocultas e 5 estão na lixeira.

### Criação e edição

O modal `src/components/modals/AccountModal.jsx` permite:

- marcar a conta como recorrente;
- selecionar o tipo mensal;
- definir o dia de vencimento;
- informar o valor usado tanto na conta atual quanto na série;
- ler a orientação de que despesas variáveis devem usar o valor como estimativa.

O estado e a gravação ficam em `src/hooks/useContas.js`. As operações de leitura e escrita ficam em `src/services/contasService.js`.

Ao salvar uma nova conta recorrente:

1. a conta é criada;
2. o sistema procura uma série ativa semelhante;
3. reutiliza a série encontrada ou cria uma nova;
4. vincula a conta pela coluna `recorrencia_id`.

A busca de série semelhante usa empresa, descrição, valor, tipo, dia, centro e filial. Portanto, hoje uma mudança de valor pode fazer o sistema considerar que se trata de outra série.

Ao editar uma conta já vinculada, os dados da série também são atualizados automaticamente, inclusive `descricao`, `valor`, `dia_vencimento`, centro e filial. Esse comportamento é inadequado para valor variável: a correção de uma parcela isolada não deve alterar a estimativa da série sem decisão explícita.

### Geração automática

O fluxo em `src/hooks/useContas.js` gera somente a competência do mês atual quando a carga é executada com permissão de edição financeira.

Para cada série ativa mensal:

1. valida se `data_inicio` permite geração no mês;
2. monta a data usando `dia_vencimento`, limitado ao último dia do mês;
3. procura conta não excluída com a mesma data e o mesmo `recorrencia_id`;
4. cria a conta pendente usando `df_contas_recorrentes.valor`.

A trava principal já é compatível com valor variável porque usa série e vencimento, não o valor da parcela. O fallback por descrição, valor, centro e filial só é usado para séries sem `id`.

Contas ocultas continuam participando da verificação e evitam nova geração. Contas na lixeira são ignoradas pela verificação, podendo permitir nova geração para a mesma série e vencimento em uma carga posterior.

### Desativação e reativação

Desativar ou reativar altera somente `df_contas_recorrentes.ativo`.

- série inativa não gera nova conta;
- contas já vinculadas permanecem intactas;
- reativar não cria conta no mesmo comando;
- a próxima carga autorizada pode gerar a conta do mês atual, se ela ainda não existir.

O futuro campo `valor_variavel` deve ser preservado nas duas operações.

### Tela de recorrências

`src/pages/RecorrenciasFinanceirasPage.jsx` mostra valor, tipo, dia, início, próxima referência, centro, filial, quantidade de contas vinculadas, situação ativa/inativa e alertas de duplicidade.

A chave visual de duplicidade também inclui o valor. Para séries variáveis, isso pode ocultar duplicidades operacionais quando duas séries equivalentes tiverem estimativas diferentes.

## Migration proposta

Criar uma migration versionada, sem executá-la junto com mudanças de UI:

```sql
alter table public.df_contas_recorrentes
  add column if not exists valor_variavel boolean not null default false;

comment on column public.df_contas_recorrentes.valor_variavel is
  'Indica que o valor da serie e apenas uma estimativa e deve ser conferido em cada conta gerada.';
```

Decisões:

- não criar `valor_base` ou `valor_estimado` neste momento;
- manter `df_contas_recorrentes.valor` como valor estimado/base;
- não alterar `df_contas`;
- não preencher séries existentes como variáveis;
- o `default false` preserva o comportamento das 81 séries existentes;
- não alterar RLS na migration de coluna.

A tabela possui RLS habilitada, mas usa atualmente uma policy legada `ALL`. A migration proposta não deve ampliar permissões. Eventual endurecimento das policies deve ser tratado em ciclo próprio de segurança, com testes de Admin, Master, Gerente, Operador e isolamento por `empresa_id`.

## Regra funcional recomendada

### Série de valor fixo

- `valor_variavel = false`;
- comportamento atual;
- `valor` representa o valor esperado e é copiado para a conta gerada;
- alteração do valor da série afeta apenas gerações futuras.

### Série de valor variável

- `valor_variavel = true`;
- `valor` representa uma estimativa, nunca uma confirmação de cobrança;
- a conta mensal é gerada com a estimativa para preservar previsão financeira;
- o usuário revisa e edita o valor da conta gerada antes da baixa;
- editar uma parcela isolada não altera o valor estimado da série;
- alterar a estimativa da série exige ação explícita de edição da série;
- relatórios continuam usando o valor efetivo armazenado em cada conta.

### Identidade e duplicidade

A existência da conta mensal deve continuar sendo validada por:

- `empresa_id`;
- `recorrencia_id`;
- vencimento/competência gerada;
- conta não excluída.

Para prevenir nova série duplicada:

- série fixa pode manter a comparação atual, incluindo valor;
- série variável deve comparar empresa, descrição, tipo, dia, centro e filial sem usar valor como identidade;
- uma série semelhante deve gerar confirmação ou reutilização controlada, não criação silenciosa;
- a verificação deve permanecer limitada à empresa ativa.

Não é recomendado criar índice único nesta primeira etapa. Existem séries históricas semelhantes e a normalização de descrição ainda ocorre apenas na aplicação. Uma trava de banco exige auditoria e limpeza prévias.

## Alterações futuras por camada

### Banco

- adicionar `df_contas_recorrentes.valor_variavel`;
- validar default `false` e ausência de alteração nas séries existentes;
- não adicionar coluna à conta nesta primeira versão.

### Service e hook

Em `src/services/contasService.js`:

- incluir `valor_variavel` nas seleções relacionadas à série;
- adaptar a busca de série semelhante conforme o tipo de valor;
- manter todas as consultas filtradas por `empresa_id`.

Em `src/hooks/useContas.js`:

- criar estado `valorVariavelRecorrencia`;
- carregar o campo ao editar conta vinculada;
- enviar o campo somente no payload da série;
- manter `valor` da conta e `valor` da série como dados distintos na edição;
- não atualizar a série ao editar uma parcela sem confirmação explícita;
- preservar a trava de geração por `recorrencia_id` e data.

### Frontend

Em `src/components/modals/AccountModal.jsx`:

- mostrar a opção `Valor variável` somente quando `Conta recorrente` estiver marcada;
- explicar que o valor informado é uma estimativa;
- ao editar parcela vinculada, diferenciar `Editar somente esta conta` de `Atualizar série`;
- não permitir marcar valor variável em conta avulsa.

Em `src/pages/RecorrenciasFinanceirasPage.jsx`:

- mostrar badge discreto `Valor variável`;
- apresentar o valor como `Estimativa`;
- incluir o campo na busca/filtro somente se isso não poluir a tela;
- ajustar a análise de duplicidade para não depender do valor em séries variáveis.

Em cards de contas:

- a primeira versão não precisa adicionar novo badge;
- se o dado da série for incluído no relacionamento, pode ser exibido um aviso curto para revisão antes da baixa.

## Riscos

1. **Alterar a série ao editar uma parcela:** é o maior risco funcional atual. Precisa ser separado antes de liberar valor variável.
2. **Criar série duplicada por valor diferente:** a busca atual inclui valor e precisa de regra específica para séries variáveis.
3. **Duplicidade por concorrência:** a prevenção é feita na aplicação e não elimina corrida entre duas gravações simultâneas.
4. **Regeneração após lixeira:** uma conta excluída deixa de bloquear geração para o mesmo mês.
5. **Reativação:** uma série reativada pode gerar a competência atual na próxima carga autorizada.
6. **Previsão financeira:** o valor estimado será exibido como previsto até a conta ser revisada.
7. **Relatórios:** relatórios baseados em `df_contas.valor` continuarão corretos para a parcela, mas devem distinguir estimativa não revisada se essa informação for necessária.
8. **Séries antigas:** nenhuma deve ser marcada automaticamente como variável.
9. **Permissões:** a policy `ALL` existente em recorrências merece ciclo separado de revisão; esta frente não deve ampliá-la.

## Plano em etapas

### Etapa 1 - estrutura

- criar migration somente com `valor_variavel`;
- aplicar em ciclo controlado;
- validar schema, contagens e default `false`;
- confirmar que nenhuma série ou conta mudou.

### Etapa 2 - regra de edição

- separar edição da parcela e edição da série;
- definir padrão seguro: editar somente a conta;
- exigir ação explícita para atualizar a série;
- manter desativação e reativação sem efeitos colaterais.

### Etapa 3 - UI e persistência

- adicionar controle no modal;
- persistir e recarregar `valor_variavel`;
- adicionar badge e rótulo de estimativa na página de recorrências;
- adaptar busca de série semelhante.

### Etapa 4 - geração e testes

- validar geração mensal com valor fixo e variável;
- validar que mudança de valor da parcela não cria outra série;
- validar que duas cargas não geram duas contas para a mesma série e data;
- validar série inativa, reativada, conta oculta e conta na lixeira.

### Etapa 5 - relatórios

- avaliar se é necessário identificar previsão baseada em estimativa;
- não alterar realizado, baixa, pagamento parcial ou impostos;
- manter o valor efetivo da conta como fonte dos relatórios financeiros.

## Checklist de validação

- [ ] Migration adiciona somente `valor_variavel`.
- [ ] Todas as séries existentes permanecem com `valor_variavel = false`.
- [ ] Total de séries e contas não muda.
- [ ] Conta avulsa não exibe nem grava valor variável.
- [ ] Série variável exibe badge e valor como estimativa.
- [ ] Série fixa mantém o comportamento atual.
- [ ] Conta gerada recebe o valor estimado da série.
- [ ] Editar uma parcela não altera a série por padrão.
- [ ] Atualizar a série exige confirmação explícita.
- [ ] Valor diferente não cria nova série variável equivalente.
- [ ] Apenas uma conta é gerada por série e vencimento.
- [ ] Série inativa não gera conta.
- [ ] Reativação não gera conta imediatamente.
- [ ] Conta oculta não é duplicada.
- [ ] Comportamento da lixeira é validado antes da publicação.
- [ ] Isolamento por `empresa_id` é preservado.
- [ ] Admin/Master/Gerente mantêm somente as permissões já autorizadas.
- [ ] Operador não ganha escrita.
- [ ] Baixa, estorno, pagamento parcial e impostos permanecem inalterados.
- [ ] Build e testes mobile/desktop passam no ciclo de implementação.

## Rollback previsto

Rollback de código:

```bash
git revert <commit-da-implementacao>
```

Rollback da coluna, somente após remover o uso no frontend e confirmar que não há séries marcadas:

```sql
alter table public.df_contas_recorrentes
  drop column if exists valor_variavel;
```

Se houver séries marcadas, exportar o snapshot de `id`, `empresa_id` e `valor_variavel` antes de remover a coluna. O rollback estrutural não deve ser executado enquanto código publicado depender do campo.

## Atualizacao de implementacao - separacao de edicao

Em 27/06/2026, a edicao de conta vinculada passou a separar explicitamente o escopo:

- `Editar somente esta conta` atualiza apenas `df_contas` e nao altera `df_contas_recorrentes`;
- `Editar serie recorrente` atualiza apenas os dados da serie, incluindo `valor_variavel`;
- editar o valor de uma parcela de serie com valor variavel nao altera o valor base/estimado da serie;
- parcelas ja lancadas nao sao reescritas ao editar a serie;
- geracao automatica e prevencao de duplicidade permanecem com a regra anterior.

## Atualizacao de implementacao - duplicidade de serie variavel

Em 27/06/2026, a busca de serie semelhante passou a respeitar `valor_variavel`:

- series fixas continuam comparando valor, descricao, tipo, dia, centro, filial, empresa e status ativo;
- series variaveis comparam descricao, tipo, dia, centro, filial, empresa, status ativo e `valor_variavel = true`, sem usar valor como identidade;
- editar uma parcela individual nao cria nem atualiza serie;
- geracao automatica de parcelas permanece inalterada.
