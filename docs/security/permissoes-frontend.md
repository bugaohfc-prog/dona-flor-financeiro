# Matriz de permissoes frontend - DNA Gestao

Data: 2026-06-01

Estado: atualizado apos revisao das permissoes administrativas do perfil Gerente.

## Escopo

Esta documentacao descreve os guardrails frontend por perfil no app DNA Gestao.

As regras abaixo controlam exibicao de menus, botoes e bloqueios diretos em acoes sensiveis do frontend. Elas reduzem risco operacional e evitam que perfis sem autorizacao executem acoes pela interface.

Importante: guardrails frontend nao substituem RLS, policies, validacoes backend ou Edge Functions. Qualquer mudanca futura em rotas, botoes ou chamadas diretas deve respeitar esta matriz e continuar protegida por validacoes server-side quando aplicavel.

## Perfis

### Operador

- Apenas visualiza.
- Nao cria contas ou notas.
- Nao edita contas ou notas.
- Nao exclui contas ou notas.
- Nao paga contas.
- Nao volta conta para pendente.
- Nao exporta PDF, CSV ou Excel.
- Nao importa contas.
- Nao acessa Lixeira.
- Nao acessa areas administrativas.

### Gerente

- Opera financeiro.
- Cria e edita contas.
- Marca contas como pagas.
- Volta contas para pendente.
- Cria, edita e conclui notas.
- Exporta dados.
- Acessa relatorios.
- Continua vendo Configuracoes, sem edicao sensivel.
- Nao acessa Filiais/Unidades.
- Nao importa contas.
- Nao acessa Lixeira.
- Nao administra usuarios.
- Nao acessa plano comercial/Billing.
- Nao acessa Configuracao inicial.

### Admin

- Operacao financeira completa.
- Importa e exporta dados.
- Acessa e administra usuarios, respeitando protecao de master.
- Edita plano comercial/Billing.
- Acessa e edita Configuracoes.
- Gerencia Filiais/Unidades.
- Gerencia centro de custo.
- Acessa Lixeira completa.
- Pode restaurar e excluir definitivamente.

### Master

- Tudo que admin pode fazer.
- Acesso adicional a area Empresas/Master.

## Matriz por area/tela

| Area/tela | Operador | Gerente | Admin | Master |
| --- | --- | --- | --- | --- |
| Painel | Visualiza | Visualiza e opera acoes financeiras | Acesso completo | Acesso completo |
| Agenda | Visualiza | Pode marcar conta como paga | Acesso completo | Acesso completo |
| Notas | Visualiza | Cria, edita, conclui e exclui | Acesso completo | Acesso completo |
| Contas | Visualiza | Cria, edita, paga, volta para pendente e exclui | Acesso completo | Acesso completo |
| Relatorios | Visualiza | Visualiza e exporta | Acesso completo | Acesso completo |
| Exportacoes | Nao acessa | PDF, CSV e Excel | PDF, CSV e Excel | PDF, CSV e Excel |
| Importar contas | Nao acessa | Nao acessa | Acessa e importa | Acessa e importa |
| Lixeira | Nao acessa | Nao acessa | Acessa, restaura e exclui definitivamente | Acessa, restaura e exclui definitivamente |
| Configuracoes | Nao acessa | Acessa sem edicao sensivel | Acessa e edita | Acessa e edita |
| Usuarios | Nao acessa | Nao acessa | Administra usuarios com protecao de master | Administra usuarios |
| Billing/plano comercial | Nao acessa | Nao acessa | Edita | Edita |
| Configuracao inicial | Nao acessa | Nao acessa | Edita | Edita |
| Filiais/Unidades | Nao acessa | Nao acessa | Gerencia | Gerencia |
| Empresas/Master | Nao acessa | Nao acessa | Nao acessa | Acessa |

## Matriz por acao sensivel

| Acao | Operador | Gerente | Admin | Master |
| --- | --- | --- | --- | --- |
| Criar conta/nota | Nao | Sim | Sim | Sim |
| Editar conta/nota | Nao | Sim | Sim | Sim |
| Excluir conta/nota | Nao | Sim | Sim | Sim |
| Pagar conta | Nao | Sim | Sim | Sim |
| Voltar conta para pendente | Nao | Sim | Sim | Sim |
| Exportar PDF/CSV/Excel | Nao | Sim | Sim | Sim |
| Importar contas | Nao | Nao | Sim | Sim |
| Restaurar da lixeira | Nao | Nao | Sim | Sim |
| Excluir definitivamente | Nao | Nao | Sim | Sim |
| Salvar configuracoes | Nao | Nao | Sim | Sim |
| Gerenciar destinatarios de alertas | Nao | Nao | Sim | Sim |
| Gerenciar Filiais/Unidades | Nao | Nao | Sim | Sim |
| Convidar usuario | Nao | Nao | Sim, com protecao de master | Sim |
| Administrar usuarios | Nao | Nao | Sim, com protecao de master | Sim |
| Editar Billing/plano comercial | Nao | Nao | Sim | Sim |
| Gerenciar centro de custo | Nao | Nao | Sim | Sim |
| Criar/gerenciar empresas | Nao | Nao | Nao | Sim |

## Decisoes deste ciclo

- Configuracoes: Gerente continua vendo a tela por enquanto, mas sem acoes administrativas sensiveis.
- Importar contas: restrito a Admin/Master porque importacao altera dados financeiros em massa.
- Lixeira: restrita a Admin/Master porque permite restaurar itens e excluir definitivamente.
- Operador: nao ganhou acesso novo.
- Admin/Master: acessos administrativos preservados.

## Guardrails frontend aplicados

- Menu oculta itens nao permitidos para operador e gerente.
- Importar contas e Lixeira possuem guard de menu e guard de tela/view.
- `importarExcelParaContas` valida permissao antes de executar importacao.
- Restauracao na Lixeira valida permissao antes de executar.
- Exclusao definitiva na Lixeira segue permitida apenas para Admin/Master.
- Carregamento inicial de Lixeira nao e solicitado para Gerente.
- Acoes bloqueadas exibem mensagem simples: `Voce nao tem permissao para realizar esta acao.`

## Riscos residuais

- Guardrails frontend nao substituem RLS/backend.
- A validacao manual por perfil deve ser feita em homologacao sempre que houver mudanca em menu, rotas, paginas, botoes ou acoes.
- Novas acoes sensiveis devem receber guarda direta no ponto de execucao, nao apenas ocultacao visual.
- Novas exportacoes, importadores ou telas administrativas devem seguir esta matriz antes de serem liberadas.
- Qualquer regra que envolva dados cross-tenant deve continuar protegida por RLS, policies, backend ou Edge Function adequada.

## Checklist de validacao manual

### Operador

- Nao ve botoes de criar conta ou nota.
- Nao ve botoes de editar, excluir, pagar ou voltar para pendente.
- Nao ve exportacoes PDF, CSV ou Excel.
- Nao ve `Importar contas`.
- Nao ve `Lixeira`.
- Nao ve areas administrativas.
- Se tentar acao sensivel por caminho direto, recebe bloqueio de permissao.

### Gerente

- Cria e edita contas.
- Marca conta como paga.
- Volta conta para pendente.
- Cria, edita, conclui e exclui notas.
- Exporta dados.
- Acessa relatorios.
- Continua vendo Configuracoes sem edicao sensivel.
- Nao ve `Importar contas` no menu desktop/mobile.
- Nao acessa a tela `Importar contas` por navegacao direta interna.
- Nao ve `Lixeira` no menu desktop/mobile.
- Nao acessa a tela `Lixeira` por navegacao direta interna.
- Continua sem acessar Filiais/Unidades.
- Nao administra usuarios.
- Nao acessa plano comercial/Billing.

### Admin

- Opera financeiro completo.
- Importa e exporta dados.
- Administra usuarios, preservando protecao de master.
- Edita plano comercial/Billing.
- Gerencia Configuracoes, Filiais/Unidades e centro de custo.
- Acessa Lixeira.
- Restaura e exclui definitivamente.
- Nao acessa Empresas/Master se nao for master.

### Master

- Executa tudo que admin executa.
- Acessa Empresas/Master.
- Cria/gerencia empresas pelo fluxo seguro validado.
- Continua protegido contra alteracoes indevidas por admin comum.
