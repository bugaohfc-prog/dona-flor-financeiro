# Auditoria: geracao de recorrencias com valor variavel

## Contexto

A frente de recorrencia com valor variavel ja possui:

- planejamento tecnico publicado;
- coluna `valor_variavel boolean not null default false` em `public.df_contas_recorrentes`;
- UI para marcar a serie como valor variavel;
- separacao entre editar somente a conta/parcela e editar a serie;
- prevencao de duplicidade ajustada para ignorar valor quando a serie e variavel.

Este documento audita a geracao automatica de contas recorrentes para confirmar se o comportamento atual atende a regra de valor variavel sem alterar codigo funcional neste ciclo.

## Arquivos e funcoes auditados

- `src/hooks/useContas.js`
  - `garantirContasRecorrentesDoMes`
  - `recorrenciaTemContaGerada`
  - `buscarContas`
- `src/services/contasService.js`
  - `listarRecorrenciasAtivas`
  - `listarContasDoMesParaRecorrencia`
  - `criarContasEmLote`
  - `listarContasAtivas`
- `src/utils/recorrencia.js`
  - `deveGerarRecorrenciaNoMes`
  - `montarDataRecorrente`
- `src/pages/ContasPage.jsx`
  - exibicao do badge `Valor variavel`
- `src/App.jsx`
  - chamadas de `buscarContas` com ou sem permissao para gerar recorrencias

## Estado atual da geracao

A geracao automatica ocorre em `garantirContasRecorrentesDoMes`, chamada por `buscarContas` quando `permitirGerarRecorrencias` esta habilitado.

Na inicializacao da empresa, `App.jsx` permite gerar recorrencias para perfis com operacao financeira. Em acoes comuns de contas, as recargas usam `permitirGerarRecorrencias: false`, evitando que a geracao rode sem necessidade em todo refresh operacional.

A geracao atual:

1. busca series ativas em `df_contas_recorrentes`;
2. calcula o mes atual;
3. busca contas do mes para comparacao;
4. verifica se a serie deve gerar conta naquele mes;
5. monta a data de vencimento pelo ano, mes e `dia_vencimento`;
6. evita duplicidade;
7. insere a nova conta em `df_contas`.

## Campos copiados para a conta gerada

A conta gerada recebe, a partir da serie:

- `empresa_id`;
- `descricao`;
- `valor`;
- `data_vencimento`;
- `vencimento`;
- `centro_custo_id`;
- `filial_id`;
- `recorrencia_id`;
- configuracoes de aviso;
- `status = 'pendente'`;
- `excluido = false`.

O valor gerado vem de `recorrencia.valor`. Para uma serie com `valor_variavel = true`, esse valor funciona como base ou estimativa inicial da parcela.

## Comportamento para recorrencia fixa

Para series fixas, o comportamento atual permanece adequado:

- o valor da serie e copiado para a conta gerada;
- o vencimento e calculado pelo dia de vencimento da serie;
- descricao, filial, centro de custo e demais campos operacionais sao copiados;
- `recorrencia_id` vincula a conta gerada a serie;
- a duplicidade mensal e evitada principalmente por `recorrencia_id + data_vencimento`.

Esse comportamento deve ser preservado.

## Comportamento para recorrencia com valor variavel

Para series variaveis, o comportamento atual tambem e aceitavel para a primeira versao funcional:

- a conta nasce com o valor base/estimado da serie;
- a conta fica vinculada a serie por `recorrencia_id`;
- o badge `Valor variavel` aparece porque as consultas de contas carregam `df_contas_recorrentes(tipo_recorrencia, valor_variavel)`;
- a verificacao de duplicidade da geracao nao depende do valor quando a serie possui `id`;
- alterar o valor de uma parcela individual nao altera o valor base da serie, conforme ciclo anterior;
- parcelas futuras continuam usando o valor base da serie, nao o valor de uma parcela editada.

Assim, uma parcela anterior com valor diferente nao deve impedir a geracao de uma nova competencia da mesma serie variavel.

## Regra de duplicidade na geracao

A funcao `recorrenciaTemContaGerada` usa a seguinte logica:

- primeiro compara a data de vencimento gerada;
- se a serie possui `id`, considera duplicidade quando existe conta com o mesmo `recorrencia_id`;
- quando a serie possui `id`, a comparacao por valor nao e usada;
- a comparacao por descricao, valor, centro e filial fica apenas como fallback para casos sem `recorrencia.id`.

Esse ponto e importante: series reais vindas de `df_contas_recorrentes` possuem `id`, entao o valor nao e criterio bloqueante na geracao mensal.

## Reativacao de serie variavel

A reativacao segue o comportamento geral das series:

- serie inativa nao gera conta;
- ao voltar para `ativo = true`, a proxima carga autorizada pode gerar a conta do mes atual;
- a geracao ainda respeita a trava por `recorrencia_id + data_vencimento`.

Nao ha regra especial de valor variavel nesse fluxo, e isso e adequado neste momento.

## Riscos identificados

1. Fallback sem `recorrencia.id`

   O fallback de duplicidade ainda compara valor. Isso nao afeta o fluxo normal, pois as series ativas do banco possuem `id`. Se no futuro algum fluxo montar uma recorrencia sem `id`, series variaveis podem voltar a sofrer bloqueio ou duplicidade por valor.

2. Dependencia da relacao para exibir badge

   O badge `Valor variavel` depende da relacao `df_contas_recorrentes.valor_variavel` carregada nas consultas. Se algum endpoint futuro listar contas sem essa relacao, o badge pode nao aparecer.

3. Valor estimado nao fica marcado na conta

   `df_contas` nao possui campo proprio indicando que o valor veio como estimativa. A informacao fica na serie. Isso e suficiente para a tela atual, mas relatorios ou exportacoes que nao carreguem a serie podem perder esse contexto.

4. Exclusao/lixeira e regeneracao

   A busca de contas do mes para recorrencia ignora contas excluidas. Assim, uma conta gerada e enviada para lixeira pode permitir nova geracao para a mesma serie e vencimento. Esse comportamento ja existia e nao e especifico de valor variavel, mas deve ser validado antes de mudar regras de lixeira/recorrencia.

5. Geracao apenas do mes atual

   A rotina gera a competencia do mes atual. Nao ha geracao retroativa ou de varios meses futuros nessa funcao. Isso reduz risco, mas deve ficar claro em validacoes futuras.

## Conclusao

A geracao atual ja atende ao comportamento minimo esperado para recorrencias com valor variavel.

Nao ha necessidade de alterar a geracao automatica neste momento, porque:

- o valor base da serie pode ser usado como estimativa;
- a conta gerada herda o vinculo com a serie;
- o badge aparece pela relacao com a serie;
- a trava de duplicidade da geracao para series reais nao usa valor;
- a edicao individual de parcela nao altera o valor base da serie.

## Plano recomendado

1. Nao alterar a geracao neste ciclo.
2. Validar manualmente uma serie variavel real:
   - criar serie variavel com valor estimado;
   - confirmar conta gerada com valor estimado;
   - editar somente a parcela para valor diferente;
   - confirmar que a serie manteve o valor base;
   - confirmar que o badge permanece na conta;
   - confirmar que uma nova carga nao duplica a mesma competencia.
3. Em ciclo futuro, se necessario, endurecer o fallback de `recorrenciaTemContaGerada` para ignorar valor quando `valor_variavel = true`, mesmo se a recorrencia estiver sem `id`.
4. Em ciclo futuro, avaliar se lixeira deve bloquear ou permitir nova geracao da mesma competencia.
5. Em ciclo futuro, avaliar textos visuais adicionais para deixar claro que o valor da parcela gerada e uma estimativa.

## Checklist de validacao futura

- Serie fixa continua gerando parcela com valor fixo.
- Serie fixa nao duplica a mesma competencia.
- Serie variavel gera parcela com valor estimado.
- Serie variavel mostra badge `Valor variavel`.
- Editar valor de parcela variavel nao altera a serie.
- Editar serie variavel altera apenas os campos da serie.
- Parcela anterior com valor diferente nao bloqueia geracao futura.
- Reativar serie variavel nao cria duplicidade se a competencia ja existir.
- Conta na lixeira tem comportamento validado conforme regra de produto.

## Rollback previsto

Este ciclo altera apenas documentacao. O rollback e:

```bash
git revert <commit>
```
