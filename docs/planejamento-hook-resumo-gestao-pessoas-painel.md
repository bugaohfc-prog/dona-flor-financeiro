# Planejamento do Hook `useResumoGestaoPessoasPainel` — DNA Gestão

## 1. Objetivo

Planejar um hook agregador futuro para fornecer ao Painel dados seguros, resumidos e acionáveis de Gestão de Pessoas.

Diretriz: consolidar antes de expandir.

Este documento não implementa o hook, não cria interface, não altera `src/`, não altera services, não altera banco, não altera RLS e não cria dados simulados. O objetivo é definir o contrato técnico e os limites de segurança para um ciclo futuro.

## 2. Contexto

O Painel principal foi validado como Área de trabalho da empresa.

Hoje o Painel possui:

- Resumo financeiro rápido;
- Próximos vencimentos;
- Notas e pendências.

O futuro bloco Gestão de Pessoas deve ser compacto, seguro e baseado em dados reais. Ele deve ajudar o usuário a perceber prazos e pendências relevantes sem transformar o Painel em relatório de pessoas, folha, férias ou funcionários.

Documentos de referência:

- `docs/planejamento-bloco-gestao-pessoas-painel.md`;
- `docs/diagnostico-dados-gestao-pessoas-painel.md`;
- `docs/dashboard-painel-area-trabalho-estado-final.md`.

## 3. Por que um hook agregador

Não é ideal colocar toda a lógica diretamente no `DashboardHome.jsx`.

Motivos:

- evitar componente pesado;
- evitar duplicação de lógica dos relatórios;
- centralizar agregações de Gestão de Pessoas;
- facilitar testes futuros;
- respeitar empresa ativa em um único ponto;
- respeitar permissões antes de retornar dados;
- evitar múltiplas consultas espalhadas pelo Painel;
- manter o Painel limpo e focado em renderização;
- reduzir risco de expor dados sensíveis por acidente.

O diagnóstico técnico mostrou que o `DashboardHome.jsx` hoje recebe dados financeiros, contas, notas, filiais e navegação, mas não recebe dados de funcionários, férias, exames ou folha. Por isso, o caminho mais seguro é planejar um agregador que entregue apenas resumos permitidos.

## 4. Nome proposto

Nome recomendado:

`useResumoGestaoPessoasPainel`

O nome deixa claro que:

- é um hook;
- retorna um resumo;
- pertence ao contexto de Gestão de Pessoas;
- é específico para o Painel;
- não é a tela completa de Pessoas, Férias, Exames ou Folha.

## 5. Responsabilidade do hook

O hook deverá, futuramente:

- receber `empresaId`;
- receber informações necessárias de perfil/permissões;
- respeitar empresa ativa;
- respeitar a regra de visibilidade de Gestão de Pessoas;
- buscar ou agregar dados reais de Pessoas;
- retornar apenas dados resumidos;
- não retornar dados sensíveis;
- fornecer `loading`;
- fornecer `erro`;
- indicar se o usuário pode visualizar o bloco;
- não alterar dados;
- não gravar nada;
- não chamar operações destrutivas;
- não arquivar, reativar, criar, atualizar ou excluir registros.

Responsabilidade fora do hook:

- renderização visual do card no Painel;
- navegação para telas completas;
- validação manual de UX;
- alteração de permissões, se algum dia for necessária, em ciclo próprio.

## 6. Dados candidatos para a primeira versão

### Férias próximas

Candidatos:

- quantidade de férias iniciando nos próximos 30 dias;
- quantidade de férias vencidas;
- quantidade de ciclos com limite de gozo próximo.

Fonte provável:

- `useFuncionariosFerias`;
- `funcionariosFeriasService`;
- `RelatoriosFeriasPage.jsx`.

Avaliação:

- bom candidato para a V1;
- dados já existem conceitualmente;
- exige cuidado para não duplicar lógica complexa dos relatórios;
- deve retornar contadores e alertas curtos, não lista longa.

### Exames a vencer

Candidatos:

- quantidade de exames vencidos;
- quantidade de exames a vencer;
- próximo periódico previsto, somente como resumo operacional.

Fonte provável:

- `useFuncionariosExamesPeriodicos`;
- `funcionariosExamesPeriodicosService`;
- `RelatoriosPessoasPage.jsx`;
- função `calcularProximoPeriodico`.

Atenção:

- somente datas e contadores;
- nunca laudos;
- nunca resultados;
- nunca CID;
- nunca informação clínica.

Avaliação:

- relevante, mas com risco LGPD maior;
- deve entrar apenas se o retorno for estritamente agregado e seguro;
- pode exigir agregação por funcionário ativo.

### Folha em aberto

Candidatos:

- competência em aberto;
- competência em revisão;
- indicador de pendência de fechamento.

Fonte provável:

- `useFolha`;
- `folhaService`;
- `FechamentoFolhaPage.jsx`.

Regras:

- sem valores;
- sem descontos;
- sem compras/vales;
- sem faltas;
- sem pensão;
- sem detalhes por colaborador.

Avaliação:

- possível para V1 se limitar a status agregado de competência;
- detalhes de lançamentos não devem ir para o Painel.

### Aniversários

Candidatos:

- aniversários da semana;
- aniversários do mês.

Fonte provável:

- `useFuncionarios`;
- `funcionariosService`;
- `RelatoriosPessoasPage.jsx`;
- campo `data_nascimento`.

Avaliação:

- parcialmente pronto;
- dado pessoal;
- usar somente se houver decisão de produto e permissão clara;
- preferir contador ou lista mínima sem dados sensíveis.

### Funcionários ativos

Candidato:

- total agregado de funcionários ativos.

Fonte provável:

- `useFuncionarios`;
- `funcionariosService`;
- campo `status`;
- campo `arquivado`.

Avaliação:

- candidato simples e seguro se exibido apenas como contador;
- não deve retornar lista detalhada sem necessidade.

## 7. Dados proibidos

O hook não deve retornar para o Painel:

- CPF;
- salário;
- valores de folha;
- descontos;
- compras/vales individuais;
- pensão;
- faltas detalhadas;
- observações sensíveis;
- dados médicos;
- laudos;
- resultados de exames;
- CID;
- documentos;
- anexos;
- detalhes individuais desnecessários.

Também não deve retornar listas longas de colaboradores, histórico completo de férias, lançamentos de folha ou dados que substituam telas especializadas.

## 8. Fontes técnicas prováveis

### `useFuncionarios`

Dados úteis:

- funcionários;
- status;
- arquivamento;
- datas de nascimento;
- datas de admissão.

Riscos:

- o service retorna campos sensíveis, como CPF, telefone, e-mail e observações;
- o hook agregador deve descartar esses campos e retornar apenas contadores seguros.

Reaproveitável:

- sim, com filtragem forte no agregador.

Cuidado:

- não passar lista bruta de funcionários para o Painel quando apenas resumo for necessário.

### `funcionariosService`

Dados úteis:

- `listarFuncionarios` por `empresaId`;
- campos de status e datas.

Riscos:

- retorno completo inclui dados proibidos para o Painel.

Reaproveitável:

- sim, preferencialmente dentro de um agregador que reduza o retorno.

### `useFuncionariosExamesPeriodicos`

Dados úteis:

- exames periódicos por funcionário;
- datas de exames;
- estados de arquivamento.

Riscos:

- depende de `funcionarioId`;
- pode gerar múltiplas consultas se usado diretamente para todos os funcionários;
- área sensível por proximidade com saúde ocupacional.

Reaproveitável:

- parcialmente.

Cuidado:

- avaliar consulta agregada ou estratégia controlada para não carregar dados excessivos.

### `funcionariosExamesPeriodicosService`

Dados úteis:

- `listarExamesPeriodicos`;
- `obterUltimoExamePeriodico`;
- `calcularProximoPeriodico`.

Riscos:

- retorno deve ser reduzido a contadores e datas operacionais;
- nunca expor informação clínica.

Reaproveitável:

- sim, com restrições.

### `useFuncionariosFerias`

Dados úteis:

- ciclos de férias;
- períodos de férias;
- loading e erro;
- funções de cálculo importadas do service.

Riscos:

- hook atual é orientado a funcionário/ciclo específico;
- pode não ser ideal para resumo geral do Painel.

Reaproveitável:

- parcialmente.

Cuidado:

- evitar duplicar lógica de `RelatoriosFeriasPage.jsx`.

### `funcionariosFeriasService`

Dados úteis:

- ciclos;
- períodos;
- `data_limite_gozo`;
- `data_inicio`;
- status;
- cálculos de fim, retorno, saldo e status.

Riscos:

- regras de férias podem ficar duplicadas se forem reimplementadas no Dashboard.

Reaproveitável:

- sim, especialmente para cálculos compartilhados.

### `useFolha`

Dados úteis:

- competências;
- lançamentos;
- resumo de competência.

Riscos:

- pode carregar lançamentos e valores sensíveis;
- não deve ser usado diretamente no Painel para detalhes.

Reaproveitável:

- parcialmente.

Cuidado:

- para o Painel, preferir somente status agregado de competência.

### `folhaService`

Dados úteis:

- `listarCompetenciasFolha`;
- status de competência;
- `calcularResumoFolhaCompetencia`.

Riscos:

- lançamentos de folha envolvem alto risco;
- valores e detalhes individuais devem ficar fora do Painel.

Reaproveitável:

- sim para competências;
- não recomendado para expor lançamentos no Painel.

## 9. Modelo de retorno sugerido

Formato conceitual, sem implementação neste ciclo:

```js
{
  loading,
  erro,
  podeVisualizar,
  resumo: {
    funcionariosAtivos,
    feriasProximas,
    feriasVencidas,
    examesAVencer,
    examesVencidos,
    folhaEmAberto,
    aniversariosSemana
  },
  alertas: [
    {
      tipo,
      titulo,
      descricao,
      prioridade,
      rotaDestino
    }
  ]
}
```

Regras do retorno:

- `podeVisualizar` deve ser `false` quando o usuário não tiver acesso a Gestão de Pessoas;
- `resumo` deve conter apenas números, estados agregados ou textos curtos não sensíveis;
- `alertas` deve ter no máximo poucos itens, definidos por prioridade;
- `rotaDestino` deve apontar apenas para rotas já existentes;
- nenhum item deve conter CPF, salário, dado médico, laudo, documento ou detalhe individual desnecessário.

## 10. Parâmetros sugeridos

Formato conceitual:

```js
useResumoGestaoPessoasPainel({
  empresaId,
  perfilUsuario,
  permissoesUsuario,
  ativo
})
```

Parâmetros:

- `empresaId`: obrigatório para qualquer consulta;
- `perfilUsuario`: usado apenas para decisão de visibilidade, se necessário;
- `permissoesUsuario`: fonte preferencial para validar acesso;
- `ativo`: permite desabilitar consultas quando o bloco não deve aparecer.

O hook não deve consultar dados se:

- não houver `empresaId`;
- o usuário não tiver permissão;
- o bloco estiver desativado;
- a empresa ativa ainda estiver carregando.

## 11. Permissões e visibilidade

Achados atuais:

- itens de Gestão de Pessoas no menu usam `peopleOnly: true`;
- `App.jsx` filtra itens `peopleOnly` por função de acesso a Gestão de Pessoas;
- `useAppNavigation.js` controla navegação, mas não define permissão.

Regra futura:

- o hook deve respeitar a mesma regra de acesso usada pelo menu;
- Admin/Master podem visualizar se a matriz atual permitir;
- Operador/Gerente não devem visualizar se não tiverem acesso a Gestão de Pessoas;
- se o usuário não tiver acesso, o hook deve retornar `podeVisualizar: false` e não buscar dados.

Não alterar permissões neste planejamento.

## 12. Priorização dos alertas

Ordem recomendada:

1. Itens vencidos ou atrasados;
2. Itens que vencem hoje;
3. Itens dos próximos 7 dias;
4. Itens dos próximos 30 dias;
5. Informativos do mês;
6. Resumos sem urgência.

Aplicação sugerida:

- férias vencidas antes de férias próximas;
- exames vencidos antes de exames a vencer;
- folha em aberto ou em revisão antes de informativos;
- aniversários apenas como item leve, sem competir com riscos operacionais.

## 13. Recomendações para a V1

Versão mínima recomendada:

- funcionários ativos;
- férias vencidas ou próximas;
- folha em aberto;
- aniversários da semana, somente se aprovado por produto.

Exames a vencer devem ser avaliados com mais cautela, porque envolvem saúde ocupacional. Podem entrar na V1 apenas se o retorno for agregado, sem nomes, sem resultado e sem qualquer dado clínico.

## 14. O que evitar na implementação futura

Evitar:

- chamar muitos hooks diretamente em `DashboardHome.jsx`;
- duplicar regras de `RelatoriosPessoasPage.jsx`;
- duplicar regras de `RelatoriosFeriasPage.jsx`;
- retornar arrays completos de funcionários;
- retornar lançamentos de folha;
- retornar observações;
- retornar CPF;
- retornar dados de exames além de datas/contadores;
- criar consultas sem respeitar `empresaId`;
- criar UI antes de confirmar permissões.

## 15. Ordem segura de implementação futura

### Ciclo 1 — Contrato do hook

Definir exatamente:

- parâmetros;
- retorno;
- permissões;
- indicadores da V1;
- rotas de destino.

### Ciclo 2 — Implementação do hook sem UI

Implementar o hook agregador, se aprovado, sem renderizar bloco no Painel.

Validar:

- sem dados sensíveis no retorno;
- sem consultas quando não houver permissão;
- loading e erro;
- empresa ativa.

### Ciclo 3 — Teste técnico do hook

Testar cenários:

- sem empresa ativa;
- sem permissão;
- empresa sem funcionários;
- funcionários sem férias;
- competências de folha abertas;
- dados arquivados.

### Ciclo 4 — Bloco visual mínimo

Criar o card compacto no Painel usando apenas o retorno seguro do hook.

### Ciclo 5 — Validação de perfis e mobile

Validar:

- Admin/Master veem;
- perfis sem acesso não veem;
- mobile continua leve;
- Painel não volta a parecer relatório.

### Ciclo 6 — Documentação do estado final

Registrar o comportamento aprovado e as regras de segurança.

## 16. Critérios de aceite futuro

Para a implementação futura:

- hook retorna apenas dados agregados;
- sem CPF;
- sem salário;
- sem valores de folha;
- sem dados médicos;
- sem laudos;
- sem resultados de exames;
- sem documentos;
- sem anexos;
- respeita `empresaId`;
- respeita permissões;
- não altera RLS;
- não cria dados simulados;
- não grava dados;
- não executa operação destrutiva;
- build aprovado;
- validação manual feita.

## 17. Arquivos consultados

Arquivos localizados e consultados:

- `docs/planejamento-bloco-gestao-pessoas-painel.md`;
- `docs/diagnostico-dados-gestao-pessoas-painel.md`;
- `docs/dashboard-painel-area-trabalho-estado-final.md`;
- `docs/plano-consolidacao-pre-expansao-dna-gestao.md`;
- `docs/rh/gestao-pessoas-funcionarios-estado-atual.md`;
- `docs/rh/gestao-pessoas-ferias-estado-atual.md`;
- `docs/rh/gestao-pessoas-ferias-planejamento.md`;
- `docs/rh/gestao-pessoas-fechamento-folha-planejamento.md`;
- `src/components/dashboard/DashboardHome.jsx`;
- `src/pages/DashboardPage.jsx`;
- `src/hooks/useFuncionarios.js`;
- `src/services/funcionariosService.js`;
- `src/pages/FuncionariosPage.jsx`;
- `src/hooks/useFuncionariosExamesPeriodicos.js`;
- `src/services/funcionariosExamesPeriodicosService.js`;
- `src/hooks/useFuncionariosFerias.js`;
- `src/services/funcionariosFeriasService.js`;
- `src/pages/FeriasPage.jsx`;
- `src/pages/RelatoriosFeriasPage.jsx`;
- `src/hooks/useFolha.js`;
- `src/services/folhaService.js`;
- `src/pages/FechamentoFolhaPage.jsx`;
- `src/pages/RelatoriosPessoasPage.jsx`;
- `src/config/menuSections.js`;
- `src/App.jsx`;
- `src/hooks/useAppNavigation.js`.

Nenhum arquivo listado no escopo permitido ficou ausente nesta verificação.

## 18. Próximo passo recomendado

Próximo microciclo recomendado:

Planejar o contrato detalhado da V1 do hook `useResumoGestaoPessoasPainel`.

Justificativa:

Antes de implementar, ainda é necessário decidir quais indicadores entram na primeira versão, quais rotas serão usadas, qual regra exata de permissão será aplicada e se exames periódicos entram ou ficam para uma versão posterior por risco LGPD. Essa decisão reduz risco técnico e evita criar um hook amplo demais.
