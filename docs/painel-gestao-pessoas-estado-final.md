# Painel - Gestao de Pessoas: estado visual

Data: 2026-06-01

## Objetivo

Registrar o estado visual validado do bloco Gestao de Pessoas no Painel, atual Area de trabalho da empresa.

O bloco continua sendo um resumo operacional seguro. Ele nao substitui as telas completas de Funcionarios, Ferias, Relatorios de Pessoas, Relatorios de Ferias ou Fechamento de Folha.

## Arquivo principal

- `src/components/dashboard/DashboardHome.jsx`

## Estado visual atual

- Cabecalho curto com `Gestao de Pessoas` e `Resumo da equipe`.
- Badge superior com `Equipe Ativa`.
- Ate 3 alertas principais no topo.
- Alertas em cards compactos, com quantidade em pilula.
- Agenda da equipe em faixa discreta no rodape do card.
- Textos curtos e escaneaveis.
- Layout responsivo com grid fluido.

## Prioridade dos alertas principais

1. Folha.
2. Exames.
3. Ferias.

O bloco mostra no maximo 3 alertas principais. Aniversariantes ficam fora dessa disputa e aparecem apenas na Agenda da equipe.

## Microcopy aplicada

- `Folha: Pendente` ou `Folha: Em conferencia`.
- `Exames Atrasados`.
- `Exames a Vencer`.
- `Ferias a Vencer`.
- `Aniversariantes`.
- `Equipe Ativa`.

## LGPD e dados proibidos

O bloco exibe apenas dados agregados e seguros.

Nao exibir no Painel:

- CPF;
- salario;
- valores de folha;
- compras/vales;
- faltas detalhadas;
- pensao;
- nomes individuais em alertas sensiveis;
- tipo de exame;
- dados medicos;
- laudos;
- resultados de exames;
- CID;
- documentos;
- anexos;
- lista completa de funcionarios.

## Escopo preservado

- Nao houve alteracao de banco, RLS ou migration.
- Nao houve alteracao de hook, service ou query.
- Nao houve alteracao de permissao.
- Nao houve alteracao em E-mail, GitHub Actions, secrets ou envio real.
- Nao houve alteracao de regra funcional de Gestao de Pessoas.

## Checklist manual

- Bloco aparece apenas para perfil autorizado.
- Perfil sem acesso continua sem visualizar o bloco.
- Painel carrega normalmente.
- Alertas aparecem com hierarquia clara.
- Agenda da equipe fica discreta no rodape.
- Mobile nao quebra.
- Nenhum dado sensivel aparece.
- Build aprovado quando houver alteracao em `src/`.
