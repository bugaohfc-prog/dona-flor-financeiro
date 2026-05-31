# Contrato V1 do `useResumoGestaoPessoasPainel` — DNA Gestão

## 1. Objetivo

Definir o contrato da V1 do hook agregador `useResumoGestaoPessoasPainel` antes da implementação.

Diretriz: consolidar antes de expandir.

Este documento é apenas planejamento técnico. Não implementa hook, não altera `src/`, não altera hooks, não altera services, não altera banco/RLS, não cria UI e não cria dados simulados.

## 2. Contexto

O Painel já está validado como Área de trabalho da empresa.

Hoje o Painel exibe:

- Resumo financeiro rápido;
- Próximos vencimentos;
- Notas e pendências.

O bloco futuro de Gestão de Pessoas deve entrar apenas com dados reais, seguros e resumidos. Ele deve apoiar acompanhamento operacional, sem transformar o Painel em relatório completo de Funcionários, Férias, Exames periódicos ou Fechamento de Folha.

Documentos de referência:

- `docs/planejamento-bloco-gestao-pessoas-painel.md`;
- `docs/diagnostico-dados-gestao-pessoas-painel.md`;
- `docs/planejamento-hook-resumo-gestao-pessoas-painel.md`;
- `docs/dashboard-painel-area-trabalho-estado-final.md`.

## 3. Nome do hook

Nome oficial:

`useResumoGestaoPessoasPainel`

Finalidade do nome:

- `use`: indica hook React;
- `Resumo`: indica que não retorna listas completas;
- `GestaoPessoas`: indica o domínio funcional;
- `Painel`: indica que o contrato é específico para a Área de trabalho.

O hook não deve ser usado como substituto das telas de Funcionários, Férias, Relatórios de Pessoas, Relatórios de Férias ou Fechamento de Folha.

## 4. Entrada esperada

Assinatura conceitual da V1:

```js
useResumoGestaoPessoasPainel({
  empresaId,
  perfilUsuario,
  podeAcessarGestaoPessoas
})
```

### Parâmetros

`empresaId`

- Tipo conceitual: `string | null | undefined`;
- obrigatório para carregar qualquer dado;
- deve representar a empresa ativa;
- sem `empresaId`, o hook não deve consultar dados.

`perfilUsuario`

- Tipo conceitual: `string | null | undefined`;
- usado apenas como apoio para diagnóstico/visibilidade;
- não deve substituir a regra consolidada de permissões.

`podeAcessarGestaoPessoas`

- Tipo conceitual: `boolean`;
- deve vir da mesma regra usada para itens `peopleOnly` do menu;
- se for `false`, o hook deve retornar `podeVisualizar: false` e não buscar dados.

### Parâmetros que não devem entrar na V1

Não incluir na V1:

- filtros complexos;
- paginação;
- busca textual;
- seleção manual de funcionário;
- seleção manual de ciclo de férias;
- seleção manual de competência de folha;
- flags para carregar dados sensíveis;
- parâmetros que permitam retornar listas completas.

## 5. Retorno esperado

Formato conceitual da V1:

```js
{
  loading,
  erro,
  podeVisualizar,
  resumo: {
    funcionariosAtivos,
    feriasProximas,
    feriasVencidas,
    folhaEmAberto,
    aniversariosSemana
  },
  alertas: [
    {
      id,
      tipo,
      titulo,
      descricao,
      prioridade,
      rotaDestino
    }
  ]
}
```

### Campos de controle

`loading`

- `true` enquanto o hook estiver carregando dados permitidos;
- `false` quando não houver permissão, não houver empresa ativa, ocorrer erro final ou a carga terminar.

`erro`

- deve conter mensagem segura;
- não deve expor erro bruto de banco com dados sensíveis;
- pode ser `null` quando não houver erro.

`podeVisualizar`

- `true` somente quando o usuário puder ver Gestão de Pessoas;
- `false` quando não houver permissão;
- se `false`, `resumo` deve retornar zerado/nulo e `alertas` deve retornar vazio.

### Objeto `resumo`

O objeto `resumo` deve conter apenas números, booleanos ou textos curtos não sensíveis.

Campos da V1:

- `funcionariosAtivos`: número;
- `feriasProximas`: número;
- `feriasVencidas`: número;
- `folhaEmAberto`: objeto resumido ou `null`;
- `aniversariosSemana`: número.

### Lista `alertas`

`alertas` deve conter poucos itens, preferencialmente no máximo 3 a 5.

Cada alerta deve ser operacional e acionável, sem expor dados sensíveis.

Campos:

- `id`: identificador local do alerta, não necessariamente id de banco;
- `tipo`: categoria do alerta;
- `titulo`: texto curto;
- `descricao`: texto curto e seguro;
- `prioridade`: `alta`, `media` ou `baixa`;
- `rotaDestino`: rota existente para aprofundar.

## 6. Indicadores da V1

### 6.1 Funcionários ativos

Objetivo:

- exibir total agregado de funcionários ativos.

Fonte provável:

- `useFuncionarios`;
- `funcionariosService`;
- campos `status` e `arquivado`.

Regra conceitual:

- contar funcionários não arquivados com `status` igual a `ativo`.

Rota de destino:

- `funcionarios`.

Risco:

- médio, desde que seja apenas contador.

Permitido no Painel:

- sim, como número agregado.

### 6.2 Férias próximas

Objetivo:

- indicar férias iniciando nos próximos 30 dias ou ciclos com prazo próximo, conforme regra técnica validada no ciclo de implementação.

Fonte provável:

- `useFuncionariosFerias`;
- `funcionariosFeriasService`;
- `RelatoriosFeriasPage.jsx`.

Regra conceitual:

- usar dados reais de ciclos/períodos;
- evitar duplicar lógica complexa dos relatórios;
- retornar apenas contador e alerta resumido.

Rota de destino:

- `relatorios-ferias` ou `ferias`.

Risco:

- médio.

Permitido no Painel:

- sim, como contador ou alerta curto.

### 6.3 Férias vencidas

Objetivo:

- alertar sobre ciclos vencidos ou saldo pendente fora do prazo.

Fonte provável:

- `RelatoriosFeriasPage.jsx`;
- `funcionariosFeriasService`.

Regra conceitual:

- retornar somente quantidade;
- não retornar lista completa de colaboradores.

Rota de destino:

- `relatorios-ferias`.

Risco:

- médio.

Permitido no Painel:

- sim, como alerta agregado.

### 6.4 Folha em aberto

Objetivo:

- indicar se existe competência de folha aberta ou em revisão.

Fonte provável:

- `useFolha`;
- `folhaService`;
- `FechamentoFolhaPage.jsx`.

Regra conceitual:

- buscar competências;
- identificar status operacional;
- retornar apenas competência e status.

Rota de destino:

- `fechamento-folha`.

Risco:

- alto.

Permitido no Painel:

- sim, somente como status agregado.

Proibido:

- valores;
- descontos;
- lançamentos;
- vales/compras;
- faltas;
- pensão;
- detalhes por colaborador.

### 6.5 Aniversários da semana

Objetivo:

- indicar quantidade de aniversários da semana.

Fonte provável:

- `useFuncionarios`;
- `funcionariosService`;
- `RelatoriosPessoasPage.jsx`;
- campo `data_nascimento`.

Regra conceitual:

- retornar apenas contador na V1;
- não retornar CPF, data completa em massa ou lista longa.

Rota de destino:

- `relatorios-pessoas`.

Risco:

- médio/alto, por usar dado pessoal.

Permitido no Painel:

- condicional. Entrar na V1 somente se o produto validar que o contador é adequado e seguro.

### 6.6 Exames periódicos

Decisão para V1:

- não entrar como indicador obrigatório da V1.

Motivo:

- envolve saúde ocupacional;
- exige agregação por funcionário;
- exige cuidado adicional para não expor dado clínico.

Pode entrar em versão futura se:

- retornar somente contador;
- usar apenas datas;
- nunca retornar laudo, resultado, CID, diagnóstico ou informação clínica;
- a permissão estiver confirmada.

## 7. Dados proibidos

O hook não deve retornar:

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
- diagnósticos;
- CID;
- documentos;
- anexos;
- telefone;
- e-mail;
- lista completa de funcionários;
- lista completa de lançamentos de folha;
- histórico completo de férias;
- qualquer dado individual desnecessário para o Painel.

## 8. Permissões

Regra principal:

- o hook deve respeitar a mesma regra de acesso usada pelos itens `peopleOnly` do menu.

Comportamento esperado:

- se `podeAcessarGestaoPessoas` for `false`, não consultar dados;
- se `empresaId` estiver ausente, não consultar dados;
- se o usuário não tiver permissão, retornar `podeVisualizar: false`;
- o bloco visual futuro não deve aparecer quando `podeVisualizar` for `false`.

Perfis:

- Admin/Master podem visualizar se a matriz atual permitir;
- Operador/Gerente não devem visualizar se não têm acesso a Gestão de Pessoas;
- nenhuma permissão deve ser alterada por este hook.

## 9. Loading e erro

### Sem empresa ativa

Retorno esperado:

```js
{
  loading: false,
  erro: null,
  podeVisualizar: false,
  resumo: resumoVazio,
  alertas: []
}
```

### Sem permissão

Retorno esperado:

```js
{
  loading: false,
  erro: null,
  podeVisualizar: false,
  resumo: resumoVazio,
  alertas: []
}
```

### Carregando

Retorno esperado:

```js
{
  loading: true,
  erro: null,
  podeVisualizar: true,
  resumo: resumoVazio,
  alertas: []
}
```

### Erro de consulta

Retorno esperado:

```js
{
  loading: false,
  erro: 'Mensagem segura para o usuário',
  podeVisualizar: true,
  resumo: resumoVazio,
  alertas: []
}
```

Regras:

- não vazar detalhes sensíveis no erro;
- não expor resposta bruta do Supabase;
- não quebrar o Painel se uma consulta falhar.

## 10. Rotas de destino

Rotas existentes previstas:

| Indicador | Rota de destino | Observação |
|---|---|---|
| Funcionários ativos | `funcionarios` | Aprofundamento no cadastro de colaboradores. |
| Férias próximas | `relatorios-ferias` ou `ferias` | Preferir relatório quando o foco for visão consolidada. |
| Férias vencidas | `relatorios-ferias` | Melhor destino para vencimentos e saldos. |
| Folha em aberto | `fechamento-folha` | Abrir tela operacional de competências. |
| Aniversários da semana | `relatorios-pessoas` | Evitar lista no Painel. |
| Exames periódicos futuros | `relatorios-pessoas` | Somente se entrar em versão futura. |

O hook deve apenas retornar `rotaDestino`. A navegação deve continuar sendo responsabilidade do componente visual futuro via `navegarPara`.

## 11. Priorização dos alertas

Ordem recomendada:

1. Férias vencidas;
2. Folha em aberto ou em revisão;
3. Férias próximas;
4. Aniversários da semana;
5. Funcionários ativos como resumo informativo.

Exames periódicos, se entrarem em versão futura, devem seguir esta ordem:

1. Exames vencidos;
2. Exames a vencer nos próximos 30 dias.

## 12. Resumo vazio

Formato conceitual:

```js
const resumoVazio = {
  funcionariosAtivos: 0,
  feriasProximas: 0,
  feriasVencidas: 0,
  folhaEmAberto: null,
  aniversariosSemana: 0
}
```

Regras:

- `resumoVazio` deve ser usado quando não houver empresa, permissão, dados ou quando ocorrer erro;
- o retorno vazio não deve gerar placeholder falso;
- ausência de dados reais deve ser tratada como estado vazio, não como dado inventado.

## 13. Critérios para implementação futura

Antes de implementar, confirmar:

- regra exata de `podeAcessarGestaoPessoas`;
- se aniversários entram ou ficam para versão posterior;
- se exames periódicos ficam fora da V1;
- se férias usam `relatorios-ferias` como destino padrão;
- se folha deve exibir apenas competência mais recente aberta;
- se o hook deve chamar services diretamente ou reaproveitar hooks existentes;
- como evitar múltiplas consultas por funcionário;
- como testar perfis sem acesso.

## 14. Critérios de aceite futuro

Para a implementação futura do hook:

- recebe `empresaId`;
- respeita `podeAcessarGestaoPessoas`;
- não consulta dados sem permissão;
- retorna `loading`, `erro`, `podeVisualizar`, `resumo` e `alertas`;
- retorna apenas dados agregados;
- não retorna CPF;
- não retorna salário;
- não retorna valores de folha;
- não retorna dados médicos;
- não retorna laudos, resultados, diagnósticos ou CID;
- não retorna documentos ou anexos;
- não grava dados;
- não executa operações destrutivas;
- não altera RLS;
- não cria dados simulados;
- build aprovado no ciclo de implementação;
- validação manual feita.

## 15. Fora do escopo da V1

Ficam fora da V1:

- detalhes individuais de colaboradores;
- lista de aniversariantes;
- lista de funcionários em férias;
- exames periódicos com nomes;
- valores de folha;
- pendências de vales/compras;
- faltas;
- pensão;
- documentos;
- anexos;
- exportações;
- notificações automáticas;
- integração externa;
- alteração de permissões.

## 16. Arquivos consultados

Arquivos localizados e consultados:

- `docs/planejamento-bloco-gestao-pessoas-painel.md`;
- `docs/diagnostico-dados-gestao-pessoas-painel.md`;
- `docs/planejamento-hook-resumo-gestao-pessoas-painel.md`;
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

## 17. Próximo passo recomendado

Próximo microciclo recomendado:

Implementar o hook `useResumoGestaoPessoasPainel` sem UI.

Justificativa:

O contrato da V1 já limita entrada, retorno, permissões, indicadores e dados proibidos. Implementar primeiro o hook sem bloco visual reduz risco, permite validar retorno agregado e evita expor dados sensíveis no Painel antes da validação técnica.
