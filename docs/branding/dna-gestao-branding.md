# Branding DNA Gestao - Estado validado

Data de consolidacao: 2026-05-24

## Objetivo

Este documento consolida o estado validado da migracao visual de marca do antigo contexto Dona Flor Financeiro para o produto DNA Gestao.

DNA Gestao e o nome do produto/sistema. Dona Flor, Choco Arte e futuras empresas devem ser tratadas como empresas, clientes ou tenants dentro da plataforma.

A migracao foi feita de forma controlada e em fases para evitar confundir nome do produto com empresa ativa, preservar historico tecnico e reduzir risco em fluxos ja validados.

## Separacao conceitual

- Produto/sistema: DNA Gestao.
- Empresa ativa/tenant: Dona Flor, Choco Arte ou outra empresa selecionada.
- Historico/tecnico: nomes antigos podem permanecer em scripts, workflows, Supabase, package, documentos historicos, tabelas e paths tecnicos ate decisao especifica.

Exemplo correto:

- Produto que gerou: DNA Gestao.
- Empresa do relatorio ou alerta: Choco Arte.
- Texto: `Relatorio gerado pelo DNA Gestao`.

Exemplo incorreto:

- Empresa: DNA Gestao.
- Assunto sempre fixo com Dona Flor quando a empresa processada e Choco Arte.

## Fase 1 - Branding visivel

### O que foi alterado

A marca visivel principal da interface passou de Dona Flor Financeiro para DNA Gestao nos pontos centrais da aplicacao.

Pontos validados:

- Aba do navegador mostra DNA Gestao.
- Login mostra DNA Gestao.
- Topo mostra DNA Gestao.
- Sidebar mostra DNA Gestao.
- Menu mobile mostra DNA Gestao.
- Topo preserva a empresa ativa no subtitulo, por exemplo:
  - `Choco Arte • Gestao Financeira`
  - `Dona Flor • Gestao Financeira`
- Botao `Meu perfil` continuou funcionando.

### Arquivos envolvidos

- `index.html`
- `src/pages/Login.jsx`
- `src/components/layout/Topbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`

### Validacoes

- Build aprovado.
- Validacao manual aprovada.
- Empresa ativa continuou separada do nome do produto.

Resultado: aprovado.

## Fase 2A - Relatorios e Contas

### O que foi alterado

Os textos de produto/sistema em relatorios, PDF e HTML passaram a usar DNA Gestao. A empresa ativa continuou sendo exibida separadamente como dado do tenant.

Tambem foi ajustado fallback ruim de empresa em PDF/HTML de Contas para fallback neutro.

### Arquivos envolvidos

- `src/App.jsx`
- `src/pages/Relatorios.jsx`

### Exemplo validado

- Empresa: Choco Arte.
- Titulo: `Relatorio Financeiro - Choco Arte`.
- Rodape: `Relatorio gerado pelo DNA Gestao.`

### Validacoes

- Build aprovado.
- PDF validado com empresa ativa correta.
- Produto gerador exibido como DNA Gestao.
- Empresa ativa preservada como Dona Flor, Choco Arte ou outra empresa selecionada.

Resultado: aprovado.

## Fase 2B - E-mail automatico

### O que foi alterado

O template do e-mail automatico passou a usar DNA Gestao como produto, preservando a empresa processada como empresa ativa do alerta.

Pontos alterados e validados:

- Cabecalho do e-mail mostra DNA Gestao.
- Subtitulo mostra `Alertas financeiros automaticos`.
- Corpo preserva empresa correta.
- Rodape mostra `Mensagem automatica enviada pelo DNA Gestao.`
- Subject usa empresa ativa.
- Botao `Acessar sistema` continua aparecendo.
- Layout mobile aprovado.
- Logs do GitHub Actions continuam mascarando destinatarios e secrets.

### Arquivo envolvido

- `scripts/envio-automatico-dona-flor.mjs`

### Exemplo validado

- Cabecalho: DNA Gestao.
- Empresa: Dona Flor Financeiro.
- Rodape: `Mensagem automatica enviada pelo DNA Gestao.`
- Subject: `Alerta financeiro - Dona Flor Financeiro`.

### Validacoes

- Build aprovado.
- Sintaxe do script validada.
- GitHub Actions executou com sucesso.
- Envio real ocorreu para empresa com alerta.
- Choco Arte foi avaliada, mas nao enviou porque nao havia alerta.
- Visual HTML aprovado em mobile.

Resultado: aprovado.

## Itens propositalmente preservados

Os itens abaixo foram preservados de proposito, porque sao tecnicos, operacionais ou dependem de ciclo proprio:

- `MAIL_FROM` e remetente visual.
- Workflow `.github/workflows/envio-automatico-dona-flor.yml`.
- Nome do script `scripts/envio-automatico-dona-flor.mjs`.
- Dominio atual usado no botao `Acessar sistema`.
- `message-id` tecnico.
- Boundary MIME.
- `smtpClientName` / EHLO.
- Package name.
- Supabase project id.
- Tabelas `df_`.
- Documentos historicos.
- RLS, SQL, Edge Functions e service role.
- Secrets, SMTP, `DRY_RUN`, cron e Node 24.

## Atencao residual

O remetente visual ainda pode aparecer como Dona Flor Financeiro. Isso e esperado e nao e falha das fases de branding, porque `MAIL_FROM` ficou fora do escopo.

Alterar `MAIL_FROM` envolve secret/env, SMTP, reputacao de envio e validacao operacional. Deve ser feito apenas em ciclo proprio.

## Riscos de troca indevida

- Nao trocar empresa ativa por DNA Gestao.
- Nao renomear scripts, workflows ou paths tecnicos sem ciclo proprio.
- Nao alterar `MAIL_FROM` sem plano de secret/env e validacao SMTP.
- Nao alterar dominio sem dominio oficial definido.
- Nao reescrever documentacao historica sem preservar rastreabilidade.
- Nao renomear tabelas `df_` como parte de branding visual.
- Nao alterar Supabase project id, package name ou migrations sem decisao tecnica especifica.

## Proximos ciclos possiveis

- Revisar `MAIL_FROM` e remetente visual.
- Revisar dominio publico quando houver dominio oficial do DNA Gestao.
- Revisar nomes de arquivos exportados.
- Atualizar documentacao operacional do envio automatico apos estabilizacao completa.
- Avaliar evolucao futura para modulo Mini RH, incluindo funcionarios, fechamento mensal, aniversarios, admissao, ferias, contatos, informes de rendimento e rotinas internas.

