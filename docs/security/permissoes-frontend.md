# Matriz de permissões frontend — Dona Flor Financeiro

Data: 2026-05-24

Estado: validado após aplicação das permissões operacionais frontend e build aprovado.

## Escopo

Esta documentação descreve os guardrails frontend por perfil no app Dona Flor Financeiro.

As regras abaixo controlam exibição de menus, botões e bloqueios diretos em ações sensíveis do frontend. Elas reduzem risco operacional e evitam que perfis sem autorização executem ações pela interface.

Importante: guardrails frontend não substituem RLS, policies, validações backend ou Edge Functions. Qualquer mudança futura em rotas, botões ou chamadas diretas deve respeitar esta matriz e continuar protegida por validações server-side quando aplicável.

## Perfis

### Operador

- Apenas visualiza.
- Não cria contas ou notas.
- Não edita contas ou notas.
- Não exclui contas ou notas.
- Não paga contas.
- Não volta conta para pendente.
- Não exporta PDF, CSV ou Excel.
- Não importa contas.
- Não acessa Lixeira.
- Não acessa áreas administrativas.

### Gerente

- Opera financeiro.
- Cria e edita contas.
- Marca contas como pagas.
- Volta contas para pendente.
- Cria, edita e conclui notas.
- Importa contas.
- Exporta dados.
- Acessa relatórios.
- Acessa Lixeira para restauração.
- Não exclui definitivamente na Lixeira.
- Não administra usuários.
- Não edita Billing/plano comercial.

### Admin

- Operação financeira completa.
- Importa e exporta dados.
- Acessa e administra usuários, respeitando proteção de master.
- Edita Billing/plano comercial.
- Acessa Configurações.
- Gerencia Filiais.
- Gerencia centro de custo.
- Acessa Lixeira completa.
- Pode excluir definitivamente.

### Master

- Tudo que admin pode fazer.
- Acesso adicional à área Empresas/Master.

## Matriz por área/tela

| Área/tela | Operador | Gerente | Admin | Master |
| --- | --- | --- | --- | --- |
| Painel | Visualiza | Visualiza e opera ações financeiras | Acesso completo | Acesso completo |
| Agenda | Visualiza | Pode marcar conta como paga | Acesso completo | Acesso completo |
| Notas | Visualiza | Cria, edita, conclui e exclui | Acesso completo | Acesso completo |
| Contas | Visualiza | Cria, edita, paga, volta para pendente e exclui | Acesso completo | Acesso completo |
| Relatórios | Visualiza | Visualiza e exporta | Acesso completo | Acesso completo |
| Exportações | Não acessa | PDF, CSV e Excel | PDF, CSV e Excel | PDF, CSV e Excel |
| Importar contas | Não acessa | Acessa e importa | Acessa e importa | Acessa e importa |
| Lixeira | Não acessa | Acessa e restaura | Acessa, restaura e exclui definitivamente | Acessa, restaura e exclui definitivamente |
| Configurações | Não acessa | Acessa conforme regra atual, sem edição sensível | Acessa e edita | Acessa e edita |
| Usuários | Não acessa | Acesso sem administração de usuários | Administra usuários com proteção de master | Administra usuários |
| Billing/plano comercial | Não acessa | Visualiza conforme regra atual, sem edição | Edita | Edita |
| Filiais | Não acessa | Acessa conforme regra atual | Gerencia | Gerencia |
| Empresas/Master | Não acessa | Não acessa | Não acessa | Acessa |

## Matriz por ação sensível

| Ação | Operador | Gerente | Admin | Master |
| --- | --- | --- | --- | --- |
| Criar conta/nota | Não | Sim | Sim | Sim |
| Editar conta/nota | Não | Sim | Sim | Sim |
| Excluir conta/nota | Não | Sim | Sim | Sim |
| Pagar conta | Não | Sim | Sim | Sim |
| Voltar conta para pendente | Não | Sim | Sim | Sim |
| Exportar PDF/CSV/Excel | Não | Sim | Sim | Sim |
| Importar contas | Não | Sim | Sim | Sim |
| Restaurar da lixeira | Não | Sim | Sim | Sim |
| Excluir definitivamente | Não | Não | Sim | Sim |
| Convidar usuário | Não | Não | Sim, com proteção de master | Sim |
| Administrar usuários | Não | Não | Sim, com proteção de master | Sim |
| Editar Billing/plano comercial | Não | Não | Sim | Sim |
| Gerenciar centro de custo | Não | Não | Sim | Sim |
| Criar/gerenciar empresas | Não | Não | Não | Sim |

## Guardrails frontend aplicados

- Menu oculta itens não permitidos para operador.
- Operador não vê ações de criar, editar, excluir, pagar, voltar para pendente, exportar, importar ou lixeira.
- Ações sensíveis possuem guarda direta antes de executar a operação.
- Exportações em contas e relatórios são ocultadas e bloqueadas para perfis sem permissão.
- Lixeira é bloqueada para operador.
- Restauração na lixeira é permitida para gerente, admin e master.
- Exclusão definitiva na lixeira é permitida apenas para admin e master.
- Ações bloqueadas exibem mensagem simples: `Você não tem permissão para realizar esta ação.`

## Riscos residuais

- Guardrails frontend não substituem RLS/backend.
- A validação manual por perfil deve ser feita em homologação sempre que houver mudança em menu, rotas, páginas, botões ou ações.
- Novas ações sensíveis devem receber guarda direta no ponto de execução, não apenas ocultação visual.
- Novas exportações, importadores ou telas administrativas devem seguir esta matriz antes de serem liberadas.
- Qualquer regra que envolva dados cross-tenant deve continuar protegida por RLS, policies, backend ou Edge Function adequada.

## Checklist de validação manual

### Operador

- Não vê botões de criar conta ou nota.
- Não vê botões de editar, excluir, pagar ou voltar para pendente.
- Não vê exportações PDF, CSV ou Excel.
- Não vê `Importar contas`.
- Não vê `Lixeira`.
- Não vê áreas administrativas: Configurações, Usuários, Billing, Filiais e Empresas/Master.
- Se tentar ação sensível por caminho direto, recebe bloqueio de permissão.

### Gerente

- Cria e edita contas.
- Marca conta como paga.
- Volta conta para pendente.
- Cria, edita, conclui e exclui notas.
- Importa contas.
- Exporta dados.
- Acessa relatórios.
- Acessa Lixeira e restaura itens.
- Não vê ou não executa exclusão definitiva.
- Não administra usuários.
- Não edita Billing/plano comercial.

### Admin

- Opera financeiro completo.
- Importa e exporta dados.
- Administra usuários, preservando proteção de master.
- Edita Billing/plano comercial.
- Gerencia Configurações, Filiais e centro de custo.
- Acessa Lixeira.
- Restaura e exclui definitivamente.
- Não acessa Empresas/Master se não for master.

### Master

- Executa tudo que admin executa.
- Acessa Empresas/Master.
- Cria/gerencia empresas pelo fluxo seguro validado.
- Continua protegido contra alterações indevidas por admin comum.
