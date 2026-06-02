# Auditoria Visual/UX Geral — DNA Gestão

## 1. Objetivo

Esta auditoria tem como objetivo padronizar o DNA Gestão como uma plataforma única, reduzindo divergências visuais e de experiência criadas por ciclos rápidos de evolução.

Diretriz:

**Consolidar antes de expandir.**

Este documento é somente diagnóstico e planejamento. Não autoriza implementação, alteração funcional, rota, menu, permissão, banco, RLS, service, hook, exportação ou integração.

Nota de estado atual validado em 2026-06-02:

- Gerente continua vendo Configurações.
- Gerente não acessa Lixeira.
- Gerente não acessa Importar contas.
- Gerente não acessa Filiais/Unidades.
- Admin/Master preservados.
- Operador sem acesso novo.

As menções antigas a Lixeira para Gerente neste documento devem ser lidas como achados históricos, anteriores aos ciclos corretivos de permissão.

## 2. Escopo auditado

### Layout geral

Arquivos analisados:

- `src/config/menuSections.js`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`
- `src/components/layout/Topbar.jsx`
- `src/App.jsx`
- `src/styles.css`
- `src/components/ui/HeaderExpansivel.jsx`

Achados:

- Sidebar desktop exibe `DNA Gestão` e `Plataforma de gestão`.
- MobileMenu exibe `DNA Gestão` separado do usuário/perfil.
- `menuSections.js` já agrupou Painel, Agenda e Notas em `Dashboard`.
- O texto do grupo ainda usa `Dashboard`; avaliar se deve evoluir para `Geral`.
- `MODULOS_TOPBAR` não tem contexto geral; `dashboard`, `agenda` e `notas` ainda resolvem como `Gestão Financeira`.
- `HeaderExpansivel.jsx` centraliza o padrão técnico de expandir/recolher, mas usa `+`/`−` e extrai ícone do título textual, o que exige padronização visual futura.

### Dashboard/Geral

Arquivos analisados:

- `src/pages/DashboardPage.jsx`
- `src/components/dashboard/DashboardHome.jsx`
- `src/pages/NotasPage.jsx`
- Trecho de Agenda dentro de `src/App.jsx`

Achados:

- Dashboard ainda tem forte carga financeira: KPIs de pago/pendente/vencido, ranking de unidades, fluxo financeiro, centros de custo e gráficos.
- O widget de agenda ainda aparece como `Agenda financeira`.
- Agenda ainda é renderizada em `App.jsx` como `Agenda Financeira`, baseada em vencimentos de contas.
- Notas já está como página própria, com texto de separação do painel financeiro.

### Financeiro

Arquivos analisados:

- `src/pages/ContasPage.jsx`
- `src/pages/Relatorios.jsx`

Achados:

- Contas usa `HeaderExpansivel` para o bloco `Contas`.
- Contas tem filtros, ações de PDF/CSV, tabs de status e ações por item.
- Contas ainda usa ação textual `Excluir`, embora a confirmação indique mover para lixeira/quarentena.
- Relatórios já contém várias estruturas de análise financeira, exportação PDF/CSV/XLSX, DRE, rankings, centros de custo e saúde financeira.
- A nomenclatura visual principal ainda aparece como `Relatório Financeiro Gerencial`, embora o conteúdo já seja de análise financeira.

### Gestão de Pessoas

Arquivos analisados:

- `src/pages/FuncionariosPage.jsx`
- `src/pages/FeriasPage.jsx`
- `src/pages/RelatoriosPessoasPage.jsx`
- `src/pages/RelatoriosFeriasPage.jsx`
- `src/pages/FechamentoFolhaPage.jsx`

Achados:

- Funcionários tem cabeçalho com kicker `Gestão de Pessoas`, título, subtítulo, botão `← Painel`, listagem e modal.
- Funcionários possui CPF opcional no formulário, mas a listagem não evidencia CPF no trecho analisado.
- Funcionários inclui exames periódicos; por LGPD, qualquer ampliação de dados deve ser tratada com alto cuidado.
- Férias tem seções com comportamento validado, incluindo `Criar novo ciclo` e `Nova parcela`, mensagens de saldo/limite e ações `Editar`, `Arquivar`, `Reativar`.
- Férias explicita que CPF e observações não aparecem na tela.
- Relatórios de Pessoas e Relatórios de Férias seguem separados.
- Relatórios de Férias declara ausência de PDF, Excel, CSV, impressão, anexos, documentos, valores financeiros e integração financeira.
- Fechamento de Folha tem aviso LGPD, blocos de competências, resumo, lançamento manual e lançamentos sem CPF/exportação/documentos/integração financeira.

### Administração/Configurações

Arquivos analisados:

- `src/App.jsx`
- `src/pages/BillingPage.jsx`
- `src/pages/OnboardingPage.jsx`
- `src/pages/UsuariosPage.jsx`
- `src/pages/MasterPanelPage.jsx`

Arquivos previstos, mas não localizados:

- `src/pages/ConfiguracoesPage.jsx`
- `src/pages/LixeiraPage.jsx`

Achados:

- Configurações e Agenda são renderizadas diretamente em `App.jsx`, não como páginas separadas.
- `podeAcessarConfiguracoes()` permite `admin` e `gerente`.
- Menu de Administração inclui Usuários, Configurações, Plano comercial, Configuração inicial e Lixeira para perfis filtrados pelas permissões atuais.
- No diagnóstico histórico, Lixeira permitia gerenciamento por `admin` e `gerente`; no estado atual validado, Lixeira está restrita a Admin/Master.
- Billing e Onboarding têm cabeçalhos e cards próprios, com padrões visuais diferentes das páginas de Pessoas.

### Conta

Arquivos analisados:

- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`
- `src/components/modals/ProfileModal.jsx` foi localizado, mas não foi necessário detalhar nesta auditoria visual geral.

Achados:

- Conta aparece separada no fim da Sidebar e do MobileMenu.
- Ações principais: `Meu perfil` e `Sair`.

### Documentação consultada

Arquivos analisados:

- `docs/plano-consolidacao-pre-expansao-dna-gestao.md`
- `docs/branding/dna-gestao-branding.md`
- `docs/rh/gestao-pessoas-ferias-estado-atual.md`
- `docs/rh/gestao-pessoas-fechamento-folha-planejamento.md`

Arquivos previstos, mas não localizados exatamente com esse nome:

- `docs/branding.md`

## 3. Diagnóstico executivo

### O que está consistente

- Branding principal está aplicado em Sidebar, MobileMenu e Topbar: DNA Gestão.
- Subtítulo institucional aparece como Plataforma de gestão.
- Notas já foi retirada do bloco financeiro pesado e ganhou página própria.
- Férias está madura como referência de accordions/seções compactas.
- Fechamento de Folha tem mensagens explícitas de LGPD e limitações de escopo.
- Ações `Editar`, `Arquivar` e `Reativar` aparecem de forma recorrente em Pessoas, Férias e Folha.

### O que está parcialmente consistente

- O menu agrupou Painel, Agenda e Notas em `Dashboard`, mas o contexto da Topbar ainda classifica essas telas como `Gestão Financeira`.
- Agenda ainda é financeira no título, dados e resumo.
- Relatórios já tem conteúdo de análise financeira, mas o nome principal ainda é Relatórios/Relatório Financeiro.
- Estados vazios usam `empty-state-card` em várias telas, mas nem todas as telas usam o mesmo componente ou microcopy.
- Botões usam mistura de estilos globais (`styles.btnCinza`, `styles.btnSalvar`, `styles.btnExcluir`) e classes locais por tela.

### O que precisa padronização

- Nome do grupo `Dashboard` versus conceito futuro `Geral`.
- Contexto da Topbar para Dashboard/Geral.
- Títulos de Agenda e Relatórios.
- Posição e linguagem de Expandir/Recolher.
- Botão `Excluir` em telas onde a ação real é mover para lixeira.
- Cabeçalhos com emoji, kicker, subtítulo e botão Voltar em padrões diferentes.
- Cards de resumo entre Dashboard, Relatórios, Pessoas, Férias e Folha.
- Tabelas/listagens e alinhamento de ações.
- Estados de loading, erro, vazio e sem empresa ativa.

### O que deve ser evitado agora

- Refatoração visual ampla de múltiplas telas.
- Mudanças em permissões/menu sem matriz.
- Alterações em banco/RLS.
- Remoção de rotas antigas de relatórios.
- Mudanças funcionais em Férias, Funcionários ou Folha.
- Alteração de exportações financeiras sem ciclo próprio.

## 4. Padrões visuais recomendados

### 4.1 Cabeçalhos de página

Padrão recomendado:

- Kicker opcional indicando módulo, por exemplo `Gestão de Pessoas`.
- Título à esquerda, sem centralização.
- Subtítulo logo abaixo, explicando função da tela.
- Ações principais à direita em desktop.
- Ações abaixo do cabeçalho em mobile.
- Botão de voltar com nome consistente: `Voltar` ou `Painel`, não alternar sem critério.
- Evitar emoji no título quando houver ícone consistente no menu.

### 4.2 Cards e blocos

Padrão recomendado:

- Cards de resumo com label, valor e detalhe curto.
- Cards operacionais com ação clara e sempre no mesmo canto.
- Blocos de formulário separados de listagens.
- Blocos de relatório separados de blocos de ação.
- Cards com densidade moderada; evitar misturar ranking, gráfico, alerta e ação no mesmo bloco.

### 4.3 Expandir/Recolher

Padrão recomendado:

- Usar um único componente/padrão para blocos recolhíveis.
- Botão no cabeçalho do bloco, alinhado à direita.
- Texto acessível: `Expandir`/`Recolher`; ícone pode ser chevron.
- Evitar depender de `+`/`−` como único sinal visual.
- Blocos críticos iniciam abertos.
- Blocos auxiliares, filtros avançados e formulários condicionais podem iniciar fechados.

Referência validada:

- Férias: `Criar novo ciclo` compacto quando há ciclo.
- Férias: `Nova parcela` compacta quando saldo é 0 ou limite atingido.

### 4.4 Botões

Categorias recomendadas:

- Ação principal: `Salvar`, `Criar`, `Confirmar`.
- Ação secundária: `Cancelar`, `Limpar`, `Voltar`, `Mostrar arquivados`.
- Edição: `Editar`.
- Arquivamento lógico: `Arquivar`, `Reativar`.
- Lixeira: `Mover para lixeira`, quando a ação não é exclusão definitiva.
- Destrutiva real: usar apenas quando houver exclusão definitiva autorizada.

Regras:

- Evitar estilos diferentes para a mesma ação.
- Não chamar de `Excluir` quando o comportamento real é arquivar ou mover para lixeira.
- Não misturar ação destrutiva com ação neutra.
- Preservar arquivamento lógico.

### 4.5 Tabelas

Padrão recomendado:

- Texto, nomes e descrições à esquerda.
- Valores monetários à direita.
- Percentuais à direita.
- Datas em coluna consistente.
- Status com chip/selo.
- Ações na última coluna.
- Quebra de texto para descrições longas.
- Rolagem horizontal em mobile quando necessário.
- Não exibir CPF em listagens salvo pedido explícito.

### 4.6 Formulários

Padrão recomendado:

- Campos obrigatórios identificados.
- Erros próximos ao campo quando possível.
- Estado `Salvando...` em botões.
- Botão principal à direita no fim do formulário.
- Cancelar/Limpar como ação secundária.
- Texto LGPD em telas de pessoas, folha e dados sensíveis.
- Não adicionar dados médicos, CID, laudos, diagnósticos, anexos ou uploads sem escopo explícito.

### 4.7 Estados vazios, loading e erro

Padrão recomendado:

- Lista vazia: título objetivo, descrição e próxima ação segura.
- Loading: texto curto ou skeleton, sem deslocar layout.
- Erro: mensagem segura e botão `Tentar novamente` quando aplicável.
- Sem empresa ativa: bloquear ações e explicar seleção de empresa.
- Sem competência selecionada: orientar seleção antes de exibir lançamentos.
- Sem funcionário selecionado: manter estado neutro sem dados sensíveis.

### 4.8 Ações padrão

Nomes recomendados:

- `Editar`
- `Arquivar`
- `Reativar`
- `Salvar`
- `Cancelar`
- `Limpar`
- `Ver detalhes`
- `Voltar`
- `Mostrar arquivados`
- `Mover para lixeira`

## 5. Mapa de divergências por tela

### 5.1 Dashboard/Painel

Achado:

- Dashboard ainda concentra KPIs e análises financeiras pesadas: pago/pendente/vencido, ranking de unidades, fluxo atual, centros de custo e gráficos.

Recomendação:

- Painel deve virar área de trabalho da empresa.
- Deve focar em ações do dia, próximos vencimentos, notas, agenda, alertas e resumo operacional.
- Gráficos financeiros pesados devem migrar para Análise Financeira.

Nomenclaturas planejadas:

- Painel: Área de trabalho da empresa.
- Agenda: Compromissos e prazos.
- Notas: Pendências e histórico.
- Relatórios Financeiros: Análise Financeira.

### 5.2 Agenda

Achado:

- Agenda ainda é `Agenda Financeira`.
- Dados são baseados em contas vencidas, hoje, 7 dias e mês.
- Cards exibem valores financeiros como métrica central.

Recomendação:

- Evoluir para Agenda de compromissos e prazos da empresa.
- Futuramente reunir financeiro, notas, pessoas, férias, folha e compromissos manuais.

Não implementar agora.

### 5.3 Notas

Achado:

- Página tem título `Notas` e texto coerente com central de notas e lembretes.
- Usa cards de notas, badges de prioridade e ações `Concluir/Reabrir`, `Editar`, `Excluir`.

Recomendação:

- Trocar `Excluir` por `Mover para lixeira` em ciclo futuro, se o comportamento continuar sendo quarentena.
- Manter Notas no grupo Dashboard/Geral.
- Padronizar cards e estados vazios com o restante do app.

### 5.4 Contas

Achado:

- Usa `HeaderExpansivel` no bloco principal.
- Tem filtros recolhíveis, exportação PDF/CSV, tabs de status e ações por conta.
- Ação `Excluir` abre confirmação de mover para lixeira por 60 dias.

Recomendação:

- Priorizar padronização de Recolher/Expandir e alinhamento.
- Padronizar filtros e ações de exportação.
- Renomear ação visual `Excluir` para `Mover para lixeira`, se mantido o comportamento atual.
- Revisar densidade de filtros/cards.

Classificação:

- Prioridade alta para microciclo visual futuro.

### 5.5 Relatórios / Análise Financeira

Achado:

- Tela já contém análise financeira robusta: DRE, rankings, saúde financeira, centros de custo, PDF/CSV/XLSX e narrativas.
- Nome visual ainda usa `Relatório Financeiro Gerencial`.

Recomendação:

- Planejar evolução de nomenclatura para Análise Financeira.
- Receber widgets financeiros removidos do Dashboard.
- Não alterar exportações sem ciclo específico.

### 5.6 Funcionários

Achado:

- Cabeçalho e listagem estão organizados.
- Usa `Novo funcionário`, `Editar`, `Arquivar`, `Reativar`.
- CPF existe no formulário como opcional.
- Exames periódicos estão presentes no modal.

Recomendação:

- Garantir que CPF não apareça em listagens.
- Padronizar botões e estados com Férias/Folha.
- Manter LGPD explícita.
- Tratar exames com cautela em qualquer ciclo futuro.

### 5.7 Férias

Achado:

- Tela validada e com observações resolvidas.
- Usa mensagens de bloqueio por saldo/limite.
- Explicita que CPF e observações não aparecem.
- Usa ações `Editar`, `Arquivar`, `Reativar`.

Recomendação:

- Usar como referência para accordions e compactação condicional.
- Não mexer em cálculos ou regras neste ciclo.

### 5.8 Relatórios de Pessoas e Relatórios de Férias

Achado:

- Relatórios permanecem separados no menu e em páginas distintas.
- Relatórios de Férias tem boa explicitação de limites: sem exportação, anexos, documentos, valores financeiros ou integração.

Recomendação:

- Planejar hub único em `Gestão de Pessoas > Relatórios`.
- Usar cards internos para Funcionários, Férias, Folha e Vales/Compras futuramente.
- Não remover rotas antigas antes de validar o hub.

### 5.9 Fechamento de Folha

Achado:

- Tela inicial validada.
- Contém aviso LGPD.
- Lista interna declara ausência de CPF, exportação, documentos ou integração financeira.
- Tem blocos de competências, resumo, lançamento manual e tabela.

Recomendação:

- Reaproveitar padrão de aviso LGPD em outras telas sensíveis.
- Padronizar ações de tabela com Funcionários e Férias.
- Não adicionar exportação, integração, upload ou anexos sem escopo explícito.

### 5.10 Configurações

Achado:

- Não existe `ConfiguracoesPage.jsx`; a tela de configurações está embutida em `App.jsx`.
- `App.jsx` concentra lógica e renderização de configurações, alertas e lixeira.
- Há dados de `df_configuracoes` e `df_configuracoes_alertas`.

Recomendação:

- Criar ciclo próprio de auditoria funcional/visual de Configurações.
- Revisar legado de envios/Pipedream, notificações, e-mail/telefone e destinatários.
- Não refatorar Configurações junto de auditoria visual ampla.

### 5.11 Administração

Achado:

- `admin` e `gerente` acessam Configurações pelo estado atual validado.
- Lixeira não é acessada pelo Gerente no estado atual validado; permanece restrita a Admin/Master.
- Usuários, Configurações, Plano comercial, Configuração inicial e Lixeira aparecem no grupo Administração conforme permissões.

Recomendação:

- Auditar com matriz de permissões antes de qualquer mudança.
- Não alterar menu/permissões neste documento.

## 6. Prioridades visuais

### Crítico visual/operacional

- Topbar classificar Painel, Agenda e Notas como Gestão Financeira.
- Agenda ainda aparecer como Agenda Financeira.
- Botão `Excluir` quando a ação real é mover para lixeira/quarentena.
- Contas/Recolher/alinhamento, por ser ponto já observado.
- Qualquer exibição indevida de CPF ou dado sensível em listagens.

### Importante

- Dashboard pesado com análises financeiras.
- Relatórios com conteúdo de Análise Financeira, mas nomenclatura antiga.
- Relatórios de Pessoas e Férias separados.
- Padrões mistos de cabeçalho, cards, botões e estados vazios.
- Configurações embutida em `App.jsx`, exigindo ciclo próprio.

### Melhoria futura

- Harmonizar ícones/emoji.
- Padronizar chips/status.
- Revisar espaçamentos.
- Melhorar skeleton/loading.
- Revisar responsividade mobile com prints.

### Não mexer agora

- Banco/RLS/migrations/policies.
- Permissões sem matriz.
- Rotas antigas antes do hub validado.
- Exportações financeiras.
- Fechamento de Folha em lote.
- Uploads, anexos, dados médicos, CID, laudos ou diagnósticos.

## 7. Ordem recomendada de microciclos

1. Padronização de Contas/Recolher/alinhamento.
   - Risco: baixo a médio.
   - Arquivos prováveis: `src/pages/ContasPage.jsx`, `src/components/ui/HeaderExpansivel.jsx`, `src/styles.css`.
   - Exige build: sim.
   - Exige validação manual: sim, desktop e mobile.

2. Redesenho conceitual do Dashboard/Painel, ainda sem código.
   - Risco: baixo.
   - Arquivos prováveis: novo documento em `docs/`.
   - Exige build: não.
   - Exige validação manual: não, apenas revisão.

3. Renomear Relatórios Financeiros para Análise Financeira, com planejamento.
   - Risco: médio.
   - Arquivos prováveis: `src/config/menuSections.js`, `src/pages/Relatorios.jsx`, `src/App.jsx`, layouts.
   - Exige build: sim se implementar.
   - Exige validação manual: sim.

4. Hub de Relatórios de Gestão de Pessoas.
   - Risco: médio.
   - Arquivos prováveis: `src/pages/RelatoriosPessoasPage.jsx`, `src/pages/RelatoriosFeriasPage.jsx`, `src/config/menuSections.js`, `src/App.jsx`.
   - Exige build: sim.
   - Exige validação manual: sim, com rotas antigas preservadas.

5. Padronização visual de Configurações.
   - Risco: médio.
   - Arquivos prováveis: `src/App.jsx`, possíveis componentes futuros.
   - Exige build: sim.
   - Exige validação manual: sim.

6. Padronização de tabelas e botões entre Funcionários, Férias e Folha.
   - Risco: médio a alto por envolver dados de pessoas.
   - Arquivos prováveis: `src/pages/FuncionariosPage.jsx`, `src/pages/FeriasPage.jsx`, `src/pages/FechamentoFolhaPage.jsx`.
   - Exige build: sim.
   - Exige validação manual: sim, com checklist LGPD.

7. Estados vazios/loading/erro padronizados.
   - Risco: baixo a médio.
   - Arquivos prováveis: `src/components/feedback/Skeletons.jsx`, `src/components/feedback/GlobalLoader.jsx`, páginas principais.
   - Exige build: sim.
   - Exige validação manual: sim.

8. Revisão mobile geral.
   - Risco: médio.
   - Arquivos prováveis: `src/components/layout/MobileMenu.jsx`, `src/styles.css`, `src/App.jsx`, páginas principais.
   - Exige build: sim.
   - Exige validação manual: sim, com prints mobile.

## 8. Checklist de validação visual por tela

- Título claro.
- Subtítulo claro.
- Contexto correto na Topbar.
- Ações principais visíveis.
- Alinhamento correto.
- Cards consistentes.
- Botões consistentes.
- Tabela/listagem legível.
- Mobile aceitável.
- Loading/erro/vazio tratados.
- Sem CPF indevido.
- Sem dados médicos.
- Sem ações destrutivas indevidas.
- Arquivamento lógico preservado.
- Build passou quando aplicável.
- Validação manual feita.

## 9. Recomendações finais

- Não fazer refatoração visual ampla de uma vez.
- Corrigir por tela.
- Manter microciclos com escopo fechado.
- Validar manualmente com prints.
- Usar conectores GitHub/Supabase para confirmar estado real quando disponíveis.
- Usar Codex apenas para execução.
- Em ciclos com alteração em `src/`, rodar `npm.cmd run build`.
- Em ciclos apenas Markdown, não rodar build.

Próximo ciclo recomendado:

- Padronização de Contas/Recolher/alinhamento.

Alternativas seguras:

- Redesenho conceitual do Dashboard/Painel em documento.
- Auditoria funcional/visual de Configurações/envios/Pipedream.
- Matriz de permissões/menu do Gerente.
