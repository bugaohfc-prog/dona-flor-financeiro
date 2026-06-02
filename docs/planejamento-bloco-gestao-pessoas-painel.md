# Planejamento do Bloco Gestao de Pessoas no Painel - DNA Gestao

## 1. Objetivo

Planejar um bloco futuro de Gestao de Pessoas para a Area de trabalho do DNA Gestao, sem implementar agora.

Diretriz principal: consolidar antes de expandir.

Este ciclo registra criterios de produto, UX, seguranca, permissao e sequenciamento. Nao cria componente, rota, service, hook, SQL, migration, RLS, dados simulados ou placeholder visual.

## 2. Contexto do Painel atual

O Painel principal foi validado como Area de trabalho da empresa.

Hoje o Painel deve exibir:

- Resumo financeiro rapido;
- Proximos vencimentos;
- Notas e pendencias.

Tambem pode preservar:

- filtro de filial, se existir;
- empresa ativa;
- caminhos para telas completas.

O espaco aberto pela remocao dos blocos financeiros analiticos pode receber futuramente um bloco de Gestao de Pessoas, desde que ele use dados reais, seguros, uteis e respeite permissoes.

## 3. Principios de seguranca/LGPD

Gestao de Pessoas deve ser tratada como area de risco ALTO/ALTISSIMO por envolver dados de colaboradores.

Regras obrigatorias:

- nao exibir CPF no Painel;
- nao exibir salario;
- nao exibir dados medicos;
- nao exibir laudos, diagnosticos, CID, documentos ou anexos;
- nao exibir observacoes sensiveis;
- nao expor dados de funcionarios para perfis sem permissao;
- respeitar permissoes Admin/Master e a regra `peopleOnly`;
- evitar qualquer dado que possa constranger colaborador;
- usar apenas resumos operacionais;
- nao criar dados simulados;
- nao criar campos novos sem ciclo proprio;
- nao alterar RLS ou permissoes sem matriz validada.

## 4. Possiveis informacoes do bloco

As possibilidades abaixo sao planejamento. Nada deve ser implementado neste ciclo.

### 4.1 Ferias proximas

Exemplos:

- ferias iniciando nos proximos 30 dias;
- ciclos com limite de gozo proximo;
- ferias vencidas;
- ferias aguardando programacao.

Fonte provavel: Ferias e Relatorios de Ferias.

### 4.2 Exames periodicos

Exemplos:

- exames a vencer;
- exames vencidos;
- proximo periodico previsto.

Atencao: somente datas. Nunca laudos, resultados, CID, diagnostico ou informacao clinica.

Fonte provavel: Funcionarios, exames periodicos e Relatorios de Pessoas.

### 4.3 Aniversarios

Exemplos:

- aniversarios da semana;
- aniversarios do mes.

Fonte provavel: data de nascimento em funcionarios e Relatorios de Pessoas.

Cuidados: data de nascimento e dado pessoal. Exibir somente se houver permissao e criterio de produto.

### 4.4 Admissoes

Exemplos:

- aniversarios de empresa;
- admissoes recentes.

Fonte provavel: data de admissao em funcionarios e Relatorios de Pessoas.

### 4.5 Fechamento de Folha

Exemplos:

- competencia em aberto;
- competencia em revisao;
- pendencias de lancamento.

Fonte provavel: Fechamento de Folha e `useFolha`.

Cuidados: nao expor salario, detalhes individuais, descontos, vales, pensao, faltas detalhadas ou informacoes sensiveis.

### 4.6 Funcionarios

Exemplos:

- total de ativos;
- afastados;
- desligados;
- arquivados apenas se fizer sentido.

Fonte provavel: Funcionarios e `useFuncionarios`.

Cuidados: nao transformar o bloco em listagem de colaboradores.

## 5. O que deve aparecer no Painel

O bloco deve ser compacto e operacional, com no maximo 3 a 5 alertas/resumos.

Exemplos aceitaveis:

- Ferias proximas;
- Exames a vencer;
- Folha em aberto;
- Aniversarios da semana;
- Funcionarios ativos.

Cada item deve levar a uma tela existente quando exigir acao.

## 6. O que NAO deve aparecer no Painel

Nao exibir:

- CPF;
- salario;
- compras/vales individuais;
- detalhes de folha;
- pensao;
- faltas com justificativa detalhada;
- observacoes administrativas sensiveis;
- dados medicos;
- laudos;
- anexos;
- documentos;
- dados completos de funcionarios;
- listas longas.

O Painel nao deve duplicar Funcionarios, Ferias, Fechamento de Folha ou Relatorios de Pessoas.

## 7. Criterios de prioridade

Ordem recomendada para alertas:

1. Vencidos/atrasados;
2. Vencem hoje;
3. Proximos 7 dias;
4. Proximos 30 dias;
5. Informativos do mes;
6. Resumos sem urgencia.

Essa prioridade deve ser apenas de apresentacao no Painel. As telas completas continuam responsaveis pela gestao, busca, filtros e historico.

## 8. Fonte dos dados

Arquivos consultados e localizados:

- `src/pages/FuncionariosPage.jsx`;
- `src/pages/FeriasPage.jsx`;
- `src/pages/RelatoriosPessoasPage.jsx`;
- `src/pages/RelatoriosFeriasPage.jsx`;
- `src/pages/FechamentoFolhaPage.jsx`;
- `src/hooks/useFuncionarios.js`;
- `src/hooks/useFuncionariosExamesPeriodicos.js`;
- `src/hooks/useFuncionariosFerias.js`;
- `src/hooks/useFolha.js`;
- `src/services/funcionariosService.js`;
- `src/services/funcionariosExamesPeriodicosService.js`;
- `src/services/funcionariosFeriasService.js`;
- `src/services/folhaService.js`;
- `src/components/dashboard/DashboardHome.jsx`;
- `src/pages/DashboardPage.jsx`;
- `docs/dashboard-painel-area-trabalho-estado-final.md`;
- `docs/plano-consolidacao-pre-expansao-dna-gestao.md`;
- `docs/rh/gestao-pessoas-funcionarios-estado-atual.md`;
- `docs/rh/gestao-pessoas-ferias-estado-atual.md`;
- `docs/rh/gestao-pessoas-ferias-planejamento.md`;
- `docs/rh/gestao-pessoas-fechamento-folha-planejamento.md`.

Arquivo nao localizado:

- `docs/archive/diagnosticos/auditoria-visual-ux-dna-gestao.md`.

### Funcionarios

Fonte provavel:

- pagina: `src/pages/FuncionariosPage.jsx`;
- hook: `src/hooks/useFuncionarios.js`;
- service: `src/services/funcionariosService.js`.

Dados que parecem existir:

- nome;
- cargo;
- status;
- data de nascimento;
- data de admissao;
- data de exame admissional;
- arquivamento logico.

Pronto para uso no Painel:

- parcialmente. Parece haver base real para totais e datas, mas um bloco no Painel exigiria nova composicao local ou hook especifico de resumo.

Exige nova consulta:

- provavelmente sim, se o Dashboard ainda nao carrega funcionarios.

Exige novo service/hook:

- pode exigir um hook/resumo especifico em ciclo futuro para evitar carregar telas inteiras.

Depende de permissao:

- sim, deve respeitar `peopleOnly`, Admin/Master e matriz validada.

### Ferias

Fonte provavel:

- pagina: `src/pages/FeriasPage.jsx`;
- relatorio: `src/pages/RelatoriosFeriasPage.jsx`;
- hook: `src/hooks/useFuncionariosFerias.js`;
- service: `src/services/funcionariosFeriasService.js`.

Dados que parecem existir:

- ciclos de ferias;
- periodos;
- data limite de gozo;
- data de inicio;
- status;
- arquivamento logico;
- ferias vencidas e a vencer nos relatorios.

Pronto para uso no Painel:

- conceitualmente promissor, mas requer diagnostico tecnico para nao duplicar regra de relatorio.

Exige nova consulta:

- provavelmente sim, se o Dashboard nao recebe ferias hoje.

Exige novo service/hook:

- pode exigir um resumo proprio para o Painel.

Depende de permissao:

- sim.

### Exames periodicos

Fonte provavel:

- pagina: `src/pages/FuncionariosPage.jsx`;
- relatorio: `src/pages/RelatoriosPessoasPage.jsx`;
- hook: `src/hooks/useFuncionariosExamesPeriodicos.js`;
- service: `src/services/funcionariosExamesPeriodicosService.js`.

Dados que parecem existir:

- data do exame;
- calculo de proximo periodico;
- exames ativos/arquivados.

Pronto para uso no Painel:

- nao diretamente. A informacao existe, mas o Painel deve exibir somente datas/resumos e nunca conteudo clinico.

Exige nova consulta:

- provavelmente sim.

Exige novo service/hook:

- possivelmente, para consolidar proximos vencimentos sem carregar dados excessivos.

Depende de permissao:

- sim, com cuidado adicional de LGPD.

### Folha

Fonte provavel:

- pagina: `src/pages/FechamentoFolhaPage.jsx`;
- hook: `src/hooks/useFolha.js`;
- service: `src/services/folhaService.js`.

Dados que parecem existir:

- competencias;
- status da competencia;
- lancamentos;
- resumo por competencia.

Pronto para uso no Painel:

- apenas para resumo de competencia, se for validado em ciclo proprio. Nao deve exibir valores individuais.

Exige nova consulta:

- provavelmente sim, se o Dashboard nao recebe folha hoje.

Exige novo service/hook:

- talvez seja necessario um resumo especifico para evitar carregar lancamentos sensiveis.

Depende de permissao:

- sim, risco alto.

### Relatorios de Pessoas

Fonte provavel:

- `src/pages/RelatoriosPessoasPage.jsx`.

Dados que parecem existir:

- aniversariantes;
- admissoes/aniversarios de empresa;
- previsao de exames periodicos;
- resumo visual interno.

Pronto para uso no Painel:

- nao diretamente. A tela ja compoe dados para relatorio; o Painel deve consumir resumo seguro, nao duplicar a tela.

Exige nova consulta:

- sim, caso o Dashboard nao tenha esses dados.

Exige novo service/hook:

- recomendado avaliar.

Depende de permissao:

- sim.

### Relatorios de Ferias

Fonte provavel:

- `src/pages/RelatoriosFeriasPage.jsx`.

Dados que parecem existir:

- ferias vencidas;
- ferias a vencer;
- retornos;
- funcionarios com saldo.

Pronto para uso no Painel:

- bom candidato para primeiro recorte, desde que o resumo seja minimo e seguro.

Exige nova consulta:

- provavelmente sim.

Exige novo service/hook:

- possivelmente, para evitar duplicacao da logica do relatorio.

Depende de permissao:

- sim.

## 9. Modelo visual sugerido

Card compacto:

Titulo:

- Gestao de Pessoas

Subtitulo:

- Alertas e prazos da equipe

Itens possiveis:

- Ferias proximas: X
- Exames a vencer: X
- Folha em aberto: competencia X
- Aniversarios da semana: X

Botao:

- Ver Gestao de Pessoas
- ou Ver relatorios de pessoas

Quando for implementado, o botao deve usar rota ja existente. Nao criar rota nova apenas para esse bloco.

## 10. Permissoes

Definicao recomendada:

- Admin/Master podem visualizar;
- Operador/Gerente nao devem visualizar se nao tem acesso a Gestao de Pessoas;
- nao alterar permissoes sem matriz;
- o bloco deve respeitar a mesma regra `peopleOnly` ja usada no menu;
- se o usuario nao tiver acesso, o bloco nao aparece.

Observacao:

- o menu de Gestao de Pessoas ja marca itens como `peopleOnly`;
- qualquer revisao de permissao deve ocorrer em ciclo proprio.

## 11. Riscos e cuidados

Riscos principais:

- risco LGPD;
- risco de expor dados sensiveis;
- risco de duplicar logica dos relatorios;
- risco de carregar muitos dados no Painel;
- risco de deixar o Painel pesado novamente;
- risco de misturar financeiro, folha e pessoas sem criterio;
- risco de expor dados de colaboradores para perfis indevidos.

Mitigacao:

- exibir apenas resumos;
- limitar quantidade de itens;
- usar rotas existentes;
- respeitar `peopleOnly`;
- validar mobile;
- validar permissao antes da implementacao;
- nao criar placeholder falso.

## 12. Ordem segura de implementacao futura

### Ciclo 1 - Confirmar dados disponiveis

Diagnostico tecnico dos hooks/services ja existentes.

Saida esperada:

- mapa de dados realmente disponiveis;
- definicao de qual resumo pode ser usado sem risco;
- nenhuma implementacao visual ainda.

### Ciclo 2 - Implementar bloco minimo

Apenas com dados reais ja disponiveis:

- ferias proximas;
- exames a vencer;
- folha em aberto.

O escopo deve ser reduzido se algum dado exigir consulta nova arriscada.

### Ciclo 3 - Validar permissoes

Validar:

- Admin/Master veem;
- Operador/Gerente nao veem quando nao possuem acesso;
- `peopleOnly` e respeitado;
- nenhum dado sensivel aparece.

### Ciclo 4 - Ajustar UX/mobile

Garantir que:

- o card e compacto;
- o Painel nao volta a ficar pesado;
- nao ha listas longas;
- o mobile continua aceitavel.

### Ciclo 5 - Documentar estado final

Registrar decisao final, blocos exibidos, permissoes e criterios de seguranca.

## 13. Criterios de aceite futuro

Para quando implementar:

- usa somente dados reais;
- sem CPF;
- sem dados medicos;
- sem laudos/documentos;
- sem dados de salario;
- respeita permissoes;
- nao altera RLS;
- nao cria dados simulados;
- mobile continua leve;
- build aprovado;
- validacao manual feita.

## 14. Proximo passo recomendado

Opcao recomendada:

1. Diagnostico tecnico dos dados disponiveis para o bloco Gestao de Pessoas.

Justificativa:

Gestao de Pessoas envolve dados pessoais, ferias, exames e folha. Antes de qualquer implementacao visual, e mais seguro confirmar quais dados o Dashboard pode receber, quais hooks/services ja podem ser reutilizados, quais permissoes controlam o acesso e qual recorte minimiza risco LGPD.

As outras opcoes continuam validas, mas devem vir depois:

2. Pausar Painel e validar mobile;
3. Revisar padronizacao visual de botoes/cards.
