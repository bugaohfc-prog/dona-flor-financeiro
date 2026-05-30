# Plano de Consolidação Pré-Expansão — DNA Gestão

## 1. Objetivo do plano

Este plano consolida o estado atual do DNA Gestão antes da expansão para novos módulos, com foco em reduzir retrabalho, risco técnico, consumo de créditos do Codex e inconsistências de UX/UI.

A diretriz central para os próximos ciclos é:

**Consolidar antes de expandir.**

O documento serve como mapa executivo para organizar prioridades, preservar o que já foi validado e separar diagnóstico, decisão e execução em microciclos seguros.

## 2. Estado atual validado

### Fechamento de Folha

- Banco/RLS núcleo aprovado.
- Validação estrutural aprovada.
- Validação real anon/auth aprovada.
- Service/hook aprovados.
- Tela inicial aprovada.
- Admin/Master acessam.
- Gerente/Operador bloqueados.
- Sem CPF em listagem, exportação, integração financeira, integração com férias, upload ou anexos.
- Documentado.

### Férias

- UX/acordeões/widgets agora APROVADA — OBSERVAÇÕES RESOLVIDAS.
- "Criar novo ciclo" compacto quando já há ciclo.
- "Nova parcela" compacta quando saldo é 0 ou limite atingido.
- Cálculos preservados.
- Sem SQL/RLS/service/hook/exportação/integração.

### Branding/Menu Geral

- Produto: DNA Gestão.
- Subtítulo institucional: Plataforma de gestão.
- Login: Acesso seguro à plataforma de gestão.
- Sidebar desktop validada.
- Menu mobile validado.
- Notas movido para Dashboard/Geral junto de Painel e Agenda.

### Alertas automáticos

- GitHub Actions enviou alerta para Choco Arte.
- E-mail chegou.
- Caiu em spam.
- Remetente com encoding quebrado: `DNA Gest??o`.
- Necessita ciclo futuro de e-mail/encoding/entregabilidade.

## 3. Achados técnicos via conectores

Os pontos abaixo registram achados confirmados via GitHub/Supabase para auditoria futura. Eles não devem ser tratados como correções já autorizadas.

### GitHub

- Notas já está no grupo Dashboard/Geral.
- Sidebar desktop mostra DNA Gestão / Plataforma de gestão.
- MobileMenu separa DNA Gestão de usuário/perfil.
- `Login.jsx` contém texto correto.
- Gestão de Pessoas ainda possui Relatórios e Relatórios de Férias separados.
- Topbar ainda mapeia dashboard, agenda e notas como Gestão Financeira.

### Supabase Advisors

Registrar como pontos que exigem auditoria controlada, sem corrigir agora:

- View `public.df_lembretes_hoje` apontada como Security Definer View.
- Funções com `search_path` mutável.
- Policy antiga em `public.contas` chamada "Permitir tudo" com `ALL/true`.
- Funções `SECURITY DEFINER` executáveis por `anon`.
- FKs sem índice em algumas tabelas.
- Policies com `auth.*` reavaliado por linha, podendo afetar performance em escala.

Importante: estes achados não significam, isoladamente, que todo o ambiente está vulnerável. Eles indicam pontos que exigem revisão técnica controlada, com rollback, checklist e validação anon/auth.

## 4. Diretrizes de governança para os próximos ciclos

- 1 ciclo = 1 objetivo.
- Codex só executa com prompt fechado.
- Planejamento e decisão ficam fora do Codex sempre que possível.
- Usar conectores para diagnóstico antes de gastar crédito.
- Gerar ZIP somente com arquivos alterados.
- Não ampliar escopo sem autorização.
- Não mexer em banco/RLS sem rollback e checklist.
- Não mexer em permissões sem matriz.
- Não alterar áreas validadas sem motivo claro.
- Sempre preservar LGPD.
- Evitar refatorações grandes.
- Manter 15% de crédito Codex reservado para correções.

## 5. Frentes de consolidação identificadas

### 5.1 Auditoria visual/UX geral

Objetivo: padronizar o app como produto único.

Itens a revisar:

- expandir/recolher;
- alinhamento dos blocos;
- botões;
- cards;
- tabelas;
- formulários;
- títulos;
- estados vazios;
- loading;
- erro;
- ações Editar/Arquivar/Reativar;
- caso específico de Contas/Recolher centralizado.

Critério: primeiro documentar padrões, depois corrigir por tela.

### 5.2 Dashboard/Painel principal

Objetivo: transformar o Painel em área de trabalho geral da empresa, não em painel financeiro pesado.

Conceito: o Painel responde "O que preciso olhar ou fazer agora?".

Deve manter:

- próximos vencimentos;
- notas urgentes;
- compromissos próximos;
- contas prioritárias;
- resumo operacional;
- alertas de pessoas;
- atalhos rápidos.

Mover para Análise Financeira:

- gráficos financeiros pesados;
- rankings;
- saúde financeira;
- comparativos;
- centros de custo;
- KPIs analíticos.

Nomenclatura planejada:

- Painel: Área de trabalho da empresa.
- Agenda: Compromissos e prazos.
- Notas: Pendências e histórico.
- Relatórios financeiros deve evoluir para Análise Financeira.

### 5.3 Agenda

Objetivo: Agenda deixar de ser apenas financeira e virar agenda de compromissos e prazos da empresa.

Nomenclatura lapidada:

- Menu: Agenda.
- Descrição: Compromissos e prazos.
- Bloco no Painel: Próximos compromissos.

Ela poderá reunir:

- vencimentos financeiros;
- notas com prazo;
- férias;
- exames;
- folha;
- aniversários/admissões;
- compromissos manuais.

### 5.4 Financeiro / Análise Financeira

Objetivo: reorganizar a tela atual de Relatórios Financeiros como Análise Financeira.

Nomenclatura aprovada:

- Relatórios → Análise Financeira.

Descrição:

- Indicadores e comparativos.

Função:

- Concentrar gráficos, KPIs, rankings, centros de custo e análises financeiras.

### 5.5 Relatórios de Gestão de Pessoas

Objetivo: evitar sidebar cheia.

Planejamento: unificar em uma única página:

- Gestão de Pessoas > Relatórios.

Com hub/cards internos para:

- Funcionários;
- Férias;
- Folha;
- Vales/Compras futuramente.

Não remover rotas antigas antes de validar o hub.

### 5.6 Configurações e legado Pipedream

Objetivo: revisar Configurações da empresa.

Itens:

- dados da empresa;
- CNPJ;
- telefone/e-mail;
- dados de envio;
- push mobile;
- legado Pipedream;
- GitHub Actions;
- destinatários de alerta;
- SMTP/secrets fora da visão do usuário;
- e-mails automáticos.

Estrutura futura planejada em abas:

- Perfil;
- Regras dos módulos;
- Destinatários.

### 5.7 Destinatários de alerta por empresa

Decisão: destinatários de alerta não devem obrigatoriamente ser usuários do sistema.

Usuários:

- têm login, perfil e permissão.

Destinatários:

- recebem e-mails de alerta/relatório;
- podem ser donos, contabilidade, financeiro, etc.

Futuro:

- GitHub Actions deve buscar destinatários ativos por empresa.

### 5.8 E-mail automático

Pontos:

- corrigir encoding do remetente `DNA Gest??o`;
- revisar UTF-8;
- revisar HTML;
- revisar subject/from;
- revisar `MAIL_FROM`;
- revisar spam;
- avaliar SPF/DKIM/DMARC;
- logs por empresa/destinatário.

### 5.9 Permissões/menu do Gerente

Achado: Gerente não acessa Fechamento de Folha, mas visualiza itens de Administração.

Itens a auditar:

- Usuários;
- Configurações;
- Plano comercial;
- Configuração inicial;
- Lixeira.

Não corrigir sem matriz de permissões.

### 5.10 Cadastro de empresa/CNPJ

Objetivo: adicionar pelo menos CNPJ ao cadastro da empresa.

Cuidados:

- CNPJ é dado acessório, não base de segurança.
- Segurança continua por `empresa_id` UUID.
- Planejar banco/RLS/rollback.
- CNPJ nullable inicialmente.
- Máscara e validação no frontend.
- Impacto futuro em relatórios, e-mails, billing e exportações.

### 5.11 CC / Centro de Custo assistido

Objetivo: reduzir confusão do preenchimento manual.

Ideias:

- sugestão por fornecedor;
- descrição;
- categoria;
- filial;
- última escolha;
- manter edição manual.

Não implementar sem planejamento, pois impacta Contas, relatórios, filtros e importações.

### 5.12 Controle de Vales/Compras

Objetivo: registrar compras individuais por colaboradora.

Regras:

- não armazenar só total;
- usar botão "+" para adicionar várias linhas;
- totalizar por colaboradora;
- gerar relatório individual de conferência;
- estados futuros: pendente, conferido, consolidado;
- integrar ao Fechamento de Folha só depois.

Provável estrutura futura:

- `df_folha_vales_compras` ou equivalente.

### 5.13 Auditoria Supabase/RLS legado

Objetivo: auditar pontos do Supabase Advisor.

Não corrigir tudo em um ciclo.

Prioridades:

- policy `public.contas` "Permitir tudo";
- funções `SECURITY DEFINER` executáveis por `anon`;
- `search_path` mutável;
- Security Definer View;
- FKs sem índice;
- policies com `auth.*` reavaliado por linha.

## 6. Ordem sugerida de execução

### Fazer primeiro

1. Plano de consolidação — este documento.
2. Auditoria visual/UX geral.
3. Auditoria Configurações/envios/Pipedream.
4. Auditoria Supabase/RLS legado.
5. Auditoria permissões/menu do Gerente.

### Fazer depois

6. Redesenho conceitual do Dashboard/Painel.
7. Renomear Relatórios Financeiros para Análise Financeira.
8. Unificar Relatórios de Gestão de Pessoas.
9. Corrigir encoding/spam dos e-mails.
10. Planejar CNPJ.

### Fazer com base pronta

11. Destinatários de alerta por empresa.
12. Controle de Vales/Compras.
13. CC assistido.
14. Exportações para contabilidade.
15. Integrações Folha/Férias/Financeiro.
16. RPC/Edge Function para fechamento em lote.

### Não mexer agora

- refatoração ampla do financeiro legado;
- importação CSV complexa;
- parcelamento automático de vales;
- RPC de folha sem existir fechamento em lote real;
- mudanças grandes em RLS sem validação anon/auth;
- mudanças em Vite/build;
- permissões sem matriz;
- excluir rotas antigas antes de validar nova navegação.

## 7. Estratégia de uso de créditos do Codex

- Usar ChatGPT para análise e prompt.
- Usar Gemini só como segunda opinião pontual.
- Usar conectores para confirmar estado real.
- Usar Codex apenas para execução.
- Nunca pedir para o Codex "pensar em tudo e implementar".
- Sempre fechar escopo antes.
- Reservar crédito para correções.
- Agrupar microajustes apenas quando forem da mesma tela.
- Evitar build em ciclos só Markdown.

## 8. Critérios de aceite para próximos ciclos

Todo ciclo deve informar:

- arquivos alterados;
- se houve alteração funcional;
- se houve SQL/RLS/migration;
- se houve service/hook;
- se houve frontend;
- se houve exportação;
- se houve integração;
- resultado do build quando aplicável;
- próximos passos recomendados;
- ZIP somente com arquivos alterados.

## 9. Próximo ciclo recomendado após este documento

Próximo ciclo recomendado:

- Auditoria Visual/UX Geral — DNA Gestão.

Também há opção de começar por:

- Configurações/envios/Pipedream;
- Supabase/RLS legado;
- Dashboard/Painel principal.

Este documento deve funcionar como mapa oficial de consolidação pré-expansão para os próximos ciclos do DNA Gestão.
