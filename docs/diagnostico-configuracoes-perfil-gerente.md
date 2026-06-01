# Diagnóstico de Configurações por Perfil — DNA Gestão

## 1. Objetivo

Registrar o diagnóstico da área Configurações e avaliar se o perfil Gerente deve continuar visualizando essa área.

Este documento não altera código, menu, permissões, banco, RLS, services, hooks, Edge Functions ou automações.

## 2. Contexto

No ciclo anterior, o menu Administração foi ajustado visualmente para o perfil Gerente.

Estado validado:

- Gerente não vê mais Usuários;
- Gerente não vê mais Plano comercial;
- Gerente não vê mais Configuração inicial;
- Gerente continua vendo Configurações;
- Gerente continua vendo Lixeira, para restauração;
- Gerente continua vendo Importar contas, se a regra atual já permitia.

A pendência deste ciclo é entender se Configurações deve continuar visível para Gerente ou se precisa ser separada em áreas operacionais e administrativas.

## 3. Arquivos consultados

| Arquivo | Função no diagnóstico |
| --- | --- |
| `src/App.jsx` | Renderização atual da tela Configurações, regras de acesso, carregamento e salvamento das configurações. |
| `src/config/menuSections.js` | Item de menu Configurações e contexto Administração no Topbar. |
| `src/pages/FiliaisPage.jsx` | Destino do atalho Gerenciar filiais exibido dentro de Configurações. |
| `src/services/filiaisService.js` | Service usado pela tela Filiais/Unidades. |
| `scripts/envio-automatico-dona-flor.mjs` | Script atual do envio automático por GitHub Actions. |
| `.github/workflows/envio-automatico-dona-flor.yml` | Workflow atual de envio automático no GitHub Actions. |
| `docs/automation/envio-automatico-dona-flor.md` | Documento do estado oficial da migração de Pipedream para GitHub Actions. |
| `docs/security/permissoes-frontend.md` | Matriz atual de permissões por perfil. |

Arquivos esperados que não foram localizados:

- `src/pages/ConfiguracoesPage.jsx`

Observação: a tela Configurações está renderizada diretamente em `src/App.jsx`.

Não foram localizadas migrations com definição explícita de `df_configuracoes` ou `df_configuracoes_alertas` durante a busca local por esses nomes.

## 4. Como Configurações aparece no menu

No menu, Configurações está definida em `src/config/menuSections.js` dentro do grupo Administração:

| Campo | Valor atual |
| --- | --- |
| Grupo | Administração |
| Tela/view | `configuracoes` |
| Label | Configurações |
| Descrição | Preferências da empresa |
| Contexto do Topbar | Administração |

A regra visual atual em `src/App.jsx` mantém `configuracoes` dependendo de `podeAcessarConfiguracoes()`.

`podeAcessarConfiguracoes()` retorna verdadeiro para:

- usuários com `canAccessSettings`;
- perfil Admin;
- perfil Gerente;
- Master, pelo comportamento de `temPermissao`.

Com isso, Gerente continua visualizando Configurações no menu e pode acessar a tela.

## 5. O que existe dentro de Configurações

### 5.1 Bloco Notificações

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Notificações ativas | Liga/desliga geral dos disparos automáticos da empresa. | Sensível | Sim | Sim | Sim | Não diretamente | Sim | Ver: sim. Editar: não recomendado. |
| Dias de alerta de contas | Define janela de aviso para contas. | Operacional com impacto sensível | Sim | Sim | Sim | Pode afetar fluxos antigos e atuais | Sim | Ver: sim. Editar: somente após decisão. |
| Notificar contas vencidas | Define destaque/notificação para contas em atraso. | Operacional | Sim | Sim | Sim | Pode afetar fluxo antigo | Parcialmente relacionado | Ver: sim. Editar: somente após decisão. |
| Destacar contas críticas | Define prioridade visual para contas vencidas ou próximas. | Operacional | Sim | Não necessariamente | Não necessariamente | Não | Não identificado no script atual | Ver: sim. Editar: pode ser operacional. |
| Dias de alerta de notas | Define janela para notas pendentes. | Operacional com impacto sensível | Sim | Sim | Sim | Pode afetar fluxos antigos e atuais | Sim | Ver: sim. Editar: somente após decisão. |
| Destacar notas urgentes | Mantém notas urgentes/críticas no topo. | Operacional | Sim | Não necessariamente | Não necessariamente | Não | Não identificado no script atual | Ver: sim. Editar: pode ser operacional. |
| Resumo de canais preparados | Exibe estado de WhatsApp, E-mail e Push. | Informativo/sensível | Sim | Sim | Sim | Sim | E-mail é usado; WhatsApp/Push não foram confirmados no GitHub Actions | Ver: sim, com revisão textual futura. |

Tabelas envolvidas:

- `df_configuracoes`
- `df_configuracoes_alertas`

### 5.2 Bloco Dados do negócio

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nome da empresa | Nome usado em configurações e fallback de envio. | Sensível | Sim | Sim | Sim | Não diretamente | Sim, como fallback no script | Ver: sim. Editar: Admin/Master. |
| WhatsApp padrão | Telefone/canal padrão. | Sensível/possivelmente legado | Sim | Possível | Possível | Sim | Não identificado como usado no script atual | Ver: questionável. Editar: não recomendado. |
| E-mail padrão | E-mail fallback para alertas. | Sensível | Sim | Sim | Sim | Sim | Sim, usado como fallback de destinatário | Ver: questionável. Editar: Admin/Master. |

### 5.3 Bloco Recorrências

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Texto explicativo de recorrências | Informa que recorrências são cadastradas em Nova Conta/Editar Conta. | Operacional | Não | Não | Sim, geração de contas recorrentes | Não | Não relacionado ao envio automático | Sim. |
| Padrão atual | Informa frequência mensal, dia de vencimento configurável e geração automática no mês vigente. | Operacional | Não | Não | Sim | Não | Não relacionado ao envio automático | Sim. |

Não há campos editáveis nesse bloco.

### 5.4 Bloco Centros de custo

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Total de centros | Mostra quantidade de centros cadastrados. | Operacional | Sim | Não | Não | Não | Não | Sim. |
| Uso nos filtros e relatórios | Informa finalidade dos centros de custo. | Operacional | Sim | Não | Não | Não | Não | Sim. |
| Botão Gerenciar centros | Abre gestão de centros de custo. | Sensível operacional | Sim | Não | Não | Não | Não | Não aparece para Gerente, porque depende de `podeGerenciarCentroCusto()`, restrito a Admin. |

### 5.5 Bloco Filiais / Unidades

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Resumo de organização por empresa, filial, centro e conta | Explica estrutura operacional. | Operacional | Sim | Não | Não | Não | Não | Sim. |
| Botão Gerenciar filiais | Navega para `filiais`. | Sensível operacional | Sim | Não | Não | Não | Não | Sim, pela regra atual. Requer revisão. |

Risco identificado: a tela `FiliaisPage.jsx` permite criar filial, renomear filial e ativar/desativar filial. O acesso à rota `filiais` usa `podeAcessarConfiguracoes()`, então Gerente aparenta conseguir operar Filiais/Unidades. Esse ponto é mais sensível do que a visualização passiva de Configurações.

### 5.6 Bloco Como o sistema vai usar

| Campo/bloco | Finalidade | Classificação | Dados da empresa | Alertas/e-mails | Automação | WhatsApp/Pipedream legado | GitHub Actions | Visível para Gerente? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Texto sobre envio automático | Explica que o envio seguirá regras globais da empresa. | Informativo | Sim | Sim | Sim | Sim, se texto não diferenciar legado | Sim | Sim. |
| Resumo Geral/WhatsApp/E-mail/Push | Exibe o estado dos canais. | Informativo/sensível | Sim | Sim | Sim | Sim | E-mail é usado; WhatsApp/Push precisam revisão | Sim, mas precisa revisão textual. |

### 5.7 Botão Salvar configurações

O botão Salvar configurações só aparece quando `podeEditarConfiguracoes()` retorna verdadeiro.

`podeEditarConfiguracoes()` aceita apenas `admin`, com Master coberto pelo comportamento de `temPermissao`.

Conclusão: Gerente vê a tela e pode interagir localmente com inputs, mas não vê o botão de salvar configurações principais. A visualização ainda expõe campos sensíveis e o atalho de Filiais pode permitir alterações reais em outra tela.

## 6. Itens possivelmente legados

| Item | Evidência | Classificação | Recomendação |
| --- | --- | --- | --- |
| WhatsApp padrão | Campo existe em Configurações, mas o script de GitHub Actions não consulta `whatsapp_padrao`. | Possivelmente legado | Revisar e decidir se será removido, ocultado ou reservado para futura arquitetura de WhatsApp. |
| Canal WhatsApp ligado/desligado | Campo `enviar_whatsapp` aparece na tela e em contas, mas o script atual de GitHub Actions usa envio por e-mail. | Possivelmente legado/parcial | Migrar para nova arquitetura de alertas ou deixar claro que não afeta o envio atual por GitHub Actions. |
| Push ligado/desligado | Campo `enviar_push` aparece na tela, mas não foi identificado fluxo atual de push no GitHub Actions. | Possivelmente legado | Revisar/remover futuramente ou documentar como recurso não ativo. |
| Telefone de envio | Representado pelo WhatsApp padrão. | Possivelmente legado | Revisar antes de permitir edição por Gerente. |
| E-mail padrão | O script atual usa `email_padrao` como fallback quando não encontra destinatários em usuários da empresa. | Manter com cuidado | Manter, mas tratar como sensível e editar apenas por Admin/Master. |
| Dias de alerta de contas | O script atual usa `df_configuracoes_alertas.dias_alerta_contas`. | Manter | Manter; decidir se Gerente pode editar em uma futura área operacional. |
| Dias de alerta de notas | O script atual usa `df_configuracoes_alertas.dias_alerta_notas`. | Manter | Manter; decidir se Gerente pode editar em uma futura área operacional. |
| Texto de envio automático | Tela fala em disparos automáticos e canais preparados. | Revisar | Atualizar futuramente para explicitar GitHub Actions e evitar impressão de WhatsApp/Push ativos se não houver fluxo real. |

## 7. Configurações operacionais vs sensíveis

### Operacionais

Itens que podem fazer sentido em uma futura área operacional, desde que com edição controlada:

- dias de alerta de contas;
- notificar contas vencidas;
- destacar contas críticas;
- dias de alerta de notas;
- destacar notas urgentes;
- informações de recorrências;
- resumo de centros de custo;
- explicação de organização por filiais.

### Sensíveis

Itens que devem ficar em área administrativa/sensível:

- notificações ativas como chave geral da empresa;
- nome da empresa;
- e-mail padrão de alertas;
- WhatsApp padrão;
- canais de envio WhatsApp, E-mail e Push;
- configurações usadas por automação;
- destinatários oficiais ou fallback de alertas;
- Filiais/Unidades com criação, renomeação, ativação ou desativação;
- parâmetros globais que afetam todas as contas/notas da empresa.

## 8. Recomendação para o perfil Gerente

Gerente pode continuar vendo Configurações temporariamente, porque:

- o botão Salvar configurações principais já é restrito a Admin/Master;
- alguns blocos são informativos ou operacionais;
- a decisão anterior preservou Configurações para Gerente até diagnóstico específico.

Mas não é recomendado manter o fluxo atual como estado final, porque:

- a tela mistura informações operacionais com campos sensíveis;
- campos como e-mail padrão e WhatsApp padrão são dados de alerta/destinatário;
- canais WhatsApp/Push podem ser legado ou não refletir o envio atual por GitHub Actions;
- o botão Gerenciar filiais leva a uma tela que permite criar, renomear e ativar/desativar filiais usando a mesma permissão ampla.

Recomendação final:

- manter Configurações para Gerente apenas de forma temporária;
- não permitir que Gerente edite campos sensíveis;
- revisar com prioridade o acesso de Gerente a Filiais/Unidades;
- planejar a separação futura entre Configurações operacionais e Configurações administrativas/sensíveis.

## 9. Riscos encontrados

| Risco | Severidade | Descrição |
| --- | --- | --- |
| Gerente alterar Filiais/Unidades | Alta | O atalho de Configurações leva a `FiliaisPage.jsx`, que permite criar, renomear e ativar/desativar filiais. |
| Gerente visualizar e-mail padrão | Média/alta | O e-mail padrão pode ser fallback de envio automático e destinatário sensível. |
| Gerente visualizar WhatsApp padrão | Média | Pode representar telefone/canal oficial da empresa, e parece não estar alinhado ao fluxo atual de GitHub Actions. |
| Campos WhatsApp/Push confundirem o usuário | Média | GitHub Actions usa envio por e-mail; WhatsApp/Push podem transmitir impressão de automações ativas não confirmadas. |
| Configurações antigas do Pipedream continuarem visíveis | Média | A documentação indica Pipedream desligado; campos legados podem gerar ruído operacional. |
| Mistura de configuração operacional e sensível | Média/alta | A tela reúne alertas, dados do negócio, filiais, centros de custo e canais de automação. |
| Inconsistência entre tela e GitHub Actions | Média | A tela mostra canais preparados de WhatsApp, E-mail e Push, mas o workflow validado é de e-mail. |
| Dados da empresa incompletos ou divergentes | Média | `nome_empresa` em configurações pode divergir de `df_empresas.nome`, usado pelo script como fonte preferencial. |

## 10. Matriz recomendada

| Item de Configurações | Operador | Gerente | Admin | Master | Recomendação |
| --- | --- | --- | --- | --- | --- |
| Acessar Configurações | Não | Sim temporário | Sim | Sim | Manter temporariamente até separação ou revisão dos campos. |
| Notificações ativas | Não | Ver apenas | Edita | Edita | Tratar como sensível. |
| Dias de alerta de contas | Não | A decidir | Edita | Edita | Candidato a configuração operacional futura. |
| Notificar contas vencidas | Não | A decidir | Edita | Edita | Candidato a configuração operacional futura. |
| Destacar contas críticas | Não | A decidir | Edita | Edita | Candidato a configuração operacional futura. |
| Dias de alerta de notas | Não | A decidir | Edita | Edita | Candidato a configuração operacional futura. |
| Destacar notas urgentes | Não | A decidir | Edita | Edita | Candidato a configuração operacional futura. |
| Nome da empresa | Não | Ver apenas ou ocultar | Edita | Edita | Sensível; manter Admin/Master. |
| WhatsApp padrão | Não | Ocultar ou ver apenas | Edita | Edita | Revisar legado antes de manter. |
| E-mail padrão | Não | Ocultar ou ver apenas | Edita | Edita | Sensível; usado como fallback no GitHub Actions. |
| Recorrências informativas | Não | Ver | Ver | Ver | Pode permanecer como informação operacional. |
| Centros de custo informativo | Não | Ver | Ver | Ver | Pode permanecer como informação operacional. |
| Gerenciar centros | Não | Não | Sim | Sim | Já parece restrito a Admin/Master. |
| Filiais/Unidades informativo | Não | Ver | Ver | Ver | Informação pode permanecer. |
| Gerenciar filiais | Não | Não recomendado | Sim | Sim | Revisar em ciclo próprio; hoje aparenta estar liberado ao Gerente. |
| Resumo de canais preparados | Não | Ver com texto revisado | Ver | Ver | Revisar para refletir GitHub Actions e remover ruído de WhatsApp/Push. |
| Salvar configurações | Não | Não | Sim | Sim | Manter restrito. |

## 11. Próximo ciclo recomendado

Opção mais segura: 3. Separar Configurações em operacional e administrativa.

Justificativa:

- remover Configurações totalmente do Gerente pode bloquear informações operacionais úteis;
- manter como está preserva riscos, especialmente Filiais/Unidades e campos de automação;
- revisar apenas Pipedream/WhatsApp/Push não resolve o problema de permissões;
- a tela já contém itens de naturezas diferentes e precisa de uma divisão conceitual antes de uma correção definitiva.

Microciclo técnico recomendado antes da separação visual:

1. Corrigir ou restringir o acesso de Gerente a `filiais`, porque esse é o risco funcional mais claro encontrado.
2. Planejar a divisão entre Configurações operacionais e Configurações administrativas.
3. Revisar campos legados de WhatsApp/Push e texto de envio automático para alinhar ao GitHub Actions.

## 12. Checklist para correção futura

- Desktop e mobile continuam consistentes.
- Gerente não vê campo sensível indevido.
- Gerente não consegue editar Filiais/Unidades sem decisão explícita.
- Admin mantém acesso a Configurações.
- Master mantém acesso a Configurações.
- Campos legados de WhatsApp/Push estão identificados.
- Alertas/e-mails estão mapeados.
- GitHub Actions continua como fluxo oficial de envio automático.
- Pipedream continua desligado.
- `email_padrao` é tratado como dado sensível.
- `whatsapp_padrao` é revisado antes de permanecer visível.
- Nenhuma alteração de banco/RLS é feita sem ciclo próprio.
- Nenhuma migration é criada sem ciclo próprio.
- Build é executado quando houver alteração em `src/`.
- Validação manual é feita com Gerente, Admin e Master.
