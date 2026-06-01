# Painel — Gestão de Pessoas: Estado Final Validado

## 1. Objetivo

Registrar o estado final validado do bloco Gestão de Pessoas no Painel principal do DNA Gestão.

Este documento consolida as regras funcionais, visuais, de prioridade e de segurança/LGPD aprovadas para a primeira versão do bloco.

## 2. Contexto

O Painel principal foi reposicionado como Área de trabalho da empresa. Ele deixou de ser uma tela de Análise Financeira e passou a concentrar blocos operacionais de acompanhamento rápido.

O estado atual aprovado do Painel inclui:

- Resumo financeiro rápido;
- Próximos vencimentos;
- Gestão de Pessoas;
- Notas e pendências.

O bloco Gestão de Pessoas foi incluído como um bloco operacional seguro, com dados reais, agregados e acionáveis. A V1 evita listas longas e não substitui as telas completas de Funcionários, Férias, Relatórios de Pessoas ou Fechamento de Folha.

## 3. Arquivos envolvidos

- `src/hooks/useResumoGestaoPessoasPainel.js`: hook agregador que carrega e organiza dados seguros de Gestão de Pessoas para o Painel.
- `src/components/dashboard/DashboardHome.jsx`: renderiza o bloco Gestão de Pessoas, aplica prioridade visual, limite de itens e separa Agenda da equipe.
- `src/styles.css`: contém ajustes visuais específicos para manter o card compacto, alinhado ao topo e sem altura forçada.

## 4. Contrato do hook

O hook `useResumoGestaoPessoasPainel` retorna:

- `loading`;
- `erro`;
- `podeVisualizar`;
- `resumo`;
- `alertas`.

O bloco consome apenas dados agregados e seguros. A estrutura de resumo contempla contadores e estados sintéticos como funcionários ativos, férias próximas, férias vencidas, exames vencidos, exames a vencer, folha em aberto e aniversários da semana.

O hook não retorna lista completa de funcionários, nomes individuais, CPF, salários, valores de folha, dados médicos, documentos, anexos, laudos ou resultados de exames.

## 5. Indicadores validados

### Folha em aberto

- aparece quando existe competência aberta ou em revisão;
- não exibe valores;
- não exibe descontos, compras, vales, faltas, pensão ou detalhes por colaborador;
- direciona para a área de Fechamento de Folha.

### Exames periódicos

- exames vencidos aparecem como alerta agregado;
- exames a vencer devem aparecer quando houver ocorrência real;
- usa a regra de próximo periódico baseada no padrão já existente: último exame periódico ativo + 1 ano; se não houver periódico, exame admissional + 1 ano;
- não exibe tipo de exame, laudos, resultados, CID, documentos, anexos, observações clínicas ou dados médicos;
- direciona para Relatórios de Pessoas.

### Férias próximas

- aparece quando existe período/parcela agendada nos próximos 30 dias;
- considera status `agendada`;
- usa a data de início do período/parcela;
- não exibe nome do funcionário;
- direciona para Férias.

### Aniversários da semana

- aparece quando existe aniversário nos próximos 7 dias;
- exibe apenas contador agregado;
- foi separado como Agenda da equipe;
- não compete com os 3 alertas principais;
- não exibe nome, CPF ou dados sensíveis;
- direciona para Relatórios de Pessoas.

### Funcionários ativos

- é item informativo;
- tem baixa prioridade;
- sai da lista quando existem alertas mais relevantes;
- não deve impedir alertas operacionais ou a Agenda da equipe de aparecerem.

## 6. Regra de prioridade final

Ordem final dos alertas principais:

1. Folha em aberto/revisão;
2. Férias vencidas;
3. Exames periódicos vencidos;
4. Férias próximas;
5. Exames periódicos a vencer;
6. Funcionários ativos como complemento.

Regras consolidadas:

- o bloco mostra até 3 alertas operacionais principais;
- aniversários aparecem como Agenda da equipe, separadamente, quando existirem;
- aniversários não competem com os 3 alertas principais;
- funcionários ativos permanece como complemento de baixa prioridade.

## 7. Regra de visibilidade

- o bloco aparece somente para perfil autorizado;
- segue o acesso de Gestão de Pessoas;
- a regra atual foi validada para Admin/Master;
- perfis sem acesso não devem visualizar o bloco;
- não houve alteração de matriz de permissões neste ciclo.

## 8. LGPD e dados proibidos

A V1 não exibe:

- CPF;
- salário;
- valores de folha;
- compras/vales;
- faltas detalhadas;
- pensão;
- observações sensíveis;
- dados médicos;
- laudos;
- resultados de exames;
- CID;
- documentos;
- anexos;
- lista completa de funcionários;
- nomes individuais.

Qualquer evolução futura deve manter essa restrição como padrão mínimo.

## 9. Validações manuais realizadas

Foram validados com dados reais:

- aniversário real gerou item de Aniversários da semana;
- férias agendada real gerou item Férias próximas;
- exame periódico vencido gerou item Exames vencidos;
- Folha em aberto apareceu corretamente;
- Funcionários ativos saiu quando existiam alertas mais relevantes;
- o bloco respeitou o limite dos alertas principais;
- o visual foi aprovado como funcional e aceitável para seguir;
- nenhum CPF, salário, dado médico, laudo, resultado, CID, documento, anexo ou nome individual foi exibido.

## 10. Observação de UX futura

O bloco foi validado, mas há melhoria visual futura no radar:

- deixar Agenda da equipe mais discreta;
- revisar o badge atual de itens para algo como `3 alertas` ou apenas `alertas`;
- encurtar texto de aniversário;
- evitar aparência de lista longa;
- manter o bloco leve no desktop e no mobile.

Essas melhorias não devem ser implementadas neste documento. Devem entrar em ciclo próprio, com escopo visual fechado.

## 11. Pontos de atenção

- performance futura: o hook ainda agrega dados no frontend e pode consultar férias/exames por funcionário;
- se a base crescer, pode ser necessário otimizar as consultas;
- manter atenção para não expor dados sensíveis em evoluções futuras;
- validar mobile após novas inclusões;
- não adicionar listas longas ao Painel;
- não transformar o bloco em uma tela completa de Gestão de Pessoas.

## 12. Regras para evoluções futuras

- não exibir nomes individuais sem decisão formal;
- não exibir dados médicos, laudos, resultados, CID, documentos ou anexos;
- não exibir valores de folha;
- manter até 3 alertas principais;
- aniversários devem continuar como informativo complementar;
- qualquer detalhe deve ir para telas específicas;
- o Painel deve continuar leve;
- novos indicadores devem ser agregados, seguros e acionáveis.

## 13. Checklist de validação futura

- [ ] Bloco aparece para perfil autorizado.
- [ ] Bloco não aparece para perfil sem acesso.
- [ ] Não há CPF.
- [ ] Não há salário.
- [ ] Não há dados médicos.
- [ ] Não há nomes individuais.
- [ ] Máximo de 3 alertas principais.
- [ ] Aniversários aparecem como Agenda da equipe.
- [ ] Férias próximas aparecem com período/parcela agendada.
- [ ] Exames vencidos/a vencer aparecem com dados reais.
- [ ] Funcionários ativos é baixa prioridade.
- [ ] Visual desktop/mobile aprovado.
- [ ] Build aprovado quando houver código.

## 14. Próximo passo recomendado

Próximo passo mais seguro: validar mobile.

Justificativa:

- o bloco já foi validado funcionalmente com dados reais;
- não há necessidade imediata de alterar cálculo, hook, service, banco ou permissões;
- a principal observação pendente é visual/UX;
- validar mobile reduz risco antes de qualquer nova lapidação visual.

Após a validação mobile, uma melhoria possível é abrir ciclo específico para lapidar Agenda da equipe e revisar o badge do bloco.
