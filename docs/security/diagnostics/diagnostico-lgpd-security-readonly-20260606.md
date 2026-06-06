# Diagnostico read-only LGPD e seguranca - 2026-06-06

## Resumo executivo

Auditoria defensiva read-only realizada sobre codigo, migrations, scripts, workflow e documentacao local do projeto DNA Gestao. Nenhum codigo funcional, banco, RLS, migration, workflow, script ou secret foi alterado.

Foram criados dois SQLs de diagnostico somente com `SELECT` para execucao futura controlada no Supabase:

- `docs/security/diagnostics/diagnostico_lgpd_security_readonly_catalog_20260606.sql`
- `docs/security/diagnostics/diagnostico_lgpd_security_readonly_storage_20260606.sql`

Conclusao geral: nao foi identificado secret real hardcoded em `src/`, nem uso de Supabase Storage no frontend. Os maiores riscos reais sao payload excessivo de funcionarios em telas/listagens que nao exibem todos os dados carregados, `select('*')` em pontos administrativos/financeiros e pontos de RLS/grants que precisam ser validados no banco remoto com o SQL de diagnostico.

## Achados por severidade

### Critico

Nenhum achado critico confirmado apenas pela analise local.

Pontos que podem virar criticos se confirmados pelo SQL no Supabase:

- tabela publica exposta sem RLS;
- grants para `anon` em tabelas sensiveis;
- policy `USING true`/`WITH CHECK true` em tabela com dados de cliente;
- funcao `SECURITY DEFINER` executavel por `anon` com definicao insegura;
- bucket publico contendo documento, anexo, laudo ou arquivo pessoal.

### Alto

#### A1. Payload excessivo de funcionarios em hook/listagens

Evidencia:

- `src/services/funcionariosService.js`: `FUNCIONARIO_SELECT` inclui `cpf`, `telefone`, `email`, `data_nascimento`, `data_exame_admissional` e `observacoes`.
- `src/hooks/useFuncionarios.js`: armazena o retorno completo em `funcionarios`.
- `src/pages/RelatoriosPessoasPage.jsx`: usa `useFuncionarios({ incluirArquivados: true })` para relatorios que exibem apenas totais, nome, cargo, aniversarios, admissoes e previsao de exame.
- `src/pages/RelatoriosFeriasPage.jsx`: usa `useFuncionarios({ incluirArquivados: false })` para relatorio que exibe nome/cargo e dados de ferias.

Impacto LGPD:

Dados pessoais como CPF, telefone, e-mail e observacoes ficam no payload/estado de paginas que nao precisam deles para listagem ou relatorio. Mesmo sem exibicao visual, isso aumenta superficie de exposicao por DevTools, erro de componente ou futura exportacao acidental.

Recomendacao:

Criar ciclo frontend/payload para separar selects resumidos e detalhados de funcionarios. Listagens e relatorios devem usar select minimo. Modal/formulario de edicao pode continuar carregando dados completos sob demanda.

#### A2. RLS/grants de `df_contas` e `df_notas` precisam de validacao remota

Evidencia:

- `supabase/migrations/20260602170000_hardening_rls_df_contas_df_notas.sql`: aplica `alter table public.df_contas no force row level security` e `alter table public.df_notas no force row level security`.
- A mesma migration concede `select, insert, update, delete` para `authenticated` em `df_contas` e `df_notas`.
- Ha rollback documentando grants ainda mais amplos para `anon` e `authenticated`, o que reforca a necessidade de validar estado real remoto.

Impacto LGPD/seguranca:

Sem `FORCE RLS`, donos de tabela/funcoes privilegiadas podem bypassar RLS em cenarios especificos. Grants de `DELETE` aumentam risco operacional, especialmente em tabelas financeiras. O risco real depende das policies e triggers atuais no banco.

Recomendacao:

Executar o diagnostico SQL de catalogo no Supabase e abrir ciclo proprio de banco/RLS para decidir `FORCE RLS`, grants minimos e exclusao logica. Nao misturar com frontend.

#### A3. Funcoes `SECURITY DEFINER` em schema `public`

Evidencia:

- Migrations de RH e auditoria criam funcoes `SECURITY DEFINER` em `public`, por exemplo:
  - `public.df_usuario_tem_perfil_empresa`
  - `public.df_funcionarios_validar_filial_empresa`
  - `public.df_funcionarios_ferias_*_validar_*`
  - `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa`
  - `public.df_folha_lancamentos_validar_vinculos`
  - `public.df_folha_lancamento_itens_*`
  - `public.df_auditoria_admin_sanitize_*`
- Algumas funcoes de helper possuem `GRANT EXECUTE` para `authenticated`, como `df_usuario_tem_perfil_empresa` e `is_admin`.

Impacto LGPD/seguranca:

`SECURITY DEFINER` em schema exposto exige search_path fixo, owner correto e grants minimos. O projeto ja endureceu funcoes recentes de folha, mas o conjunto completo precisa ser auditado no banco real.

Recomendacao:

Executar o SQL de funcoes e grants. Abrir ciclo proprio para revisar owner, `search_path`, permissao `EXECUTE` e se helpers devem permanecer em `public` ou migrar futuramente para schema privado.

### Medio

#### M1. Uso de `select('*')` em pontos administrativos/financeiros

Evidencia:

- `src/App.jsx`: `df_configuracoes_alertas`, `df_configuracoes`, `df_centros_custo` e insert de centro usam `select('*')`.
- `src/services/usuariosService.js`: insert em `df_usuarios_empresas` retorna `select('*')`.
- `src/services/permissoesService.js`: consulta `df_usuarios_master` com `select('*')`.
- `src/services/billingService.js`: `df_assinaturas` usa `select('*')`.
- `src/pages/Relatorios.jsx`: `df_centros_custo` e `df_filiais` usam `select('*')`.
- Edge Functions `criar-usuario-manual` e `listar-usuarios-empresa` tambem usam `select('*')`.

Impacto LGPD:

Risco de carregar colunas que nao sao usadas pela tela ou que podem ser adicionadas no futuro com dados sensiveis. Em areas administrativas isso e especialmente relevante.

Recomendacao:

Ciclo proprio de frontend/payload para trocar `select('*')` por allowlists, com testes de build e verificacao visual. Nao misturar com RLS.

#### M2. Observacoes livres dependem principalmente de orientacao visual

Evidencia:

- `src/pages/FechamentoFolhaPage.jsx`: placeholders e textos orientam nao registrar dados medicos, documentos, diagnosticos ou informacoes sensiveis.
- `src/services/folhaService.js`: bloqueia campos proibidos como `cid`, `laudo`, `diagnostico`, `documento`, `anexo`, mas nao sanitiza conteudo textual livre.
- `src/services/funcionariosService.js`: `observacoes` aceita texto normalizado.

Impacto LGPD:

Usuarios podem digitar dado sensivel em campo livre apesar do aviso. O risco e menor onde a tela reforca orientacao, mas ainda real.

Recomendacao:

Depois, criar ciclo pequeno para avaliacao de sanitizacao/alerta em campos livres mais sensiveis. Evitar bloqueio agressivo sem desenho de UX.

#### M3. Exportacoes genericas podem exportar dados sensiveis se chamadas com payload inadequado

Evidencia:

- `src/services/export/reportExportService.js` exporta CSV/XLSX/HTML com `headers` e `rows` recebidos, sem classificacao LGPD.
- Relatorios de Pessoas/Ferias atuais nao implementam exportacao.
- `src/pages/Relatorios.jsx` financeiro possui exportacoes e relatorios completos, fora da frente RH.

Impacto LGPD:

Nao ha risco confirmado nos relatorios de RH atuais, mas futuras exportacoes de Pessoas/Ferias/Folha precisam de allowlist e classificacao por perfil.

Recomendacao:

Exportacoes de RH devem ser ciclo proprio, com matriz de campos permitidos, perfil autorizado, descarte de observacoes sensiveis por padrao e sem CPF/documentos/laudos.

#### M4. E-mail automatico tem travas, mas fallback exige governanca de rollout

Evidencia:

- `.github/workflows/envio-automatico-dona-flor.yml`: agendamento existe, usa `secrets.DRY_RUN` e inputs manuais.
- `scripts/envio-automatico-dona-flor.mjs`: `validarTravasOperacionais()` bloqueia envio real sem `MODO_TESTE`, `EMPRESA_ID_TESTE`, limite e confirmacao textual.
- Logs usam `maskEmail`.
- `fallbackDestinatarios()` usa `email_padrao` ou `MAIL_TO_FALLBACK` em dry-run.
- O script usa `SUPABASE_SERVICE_ROLE_KEY`, mas apenas em workflow/script, nao em `src/`.

Impacto LGPD:

Risco controlado hoje, desde que `DRY_RUN` permaneça true para agendado. Fallback pode enviar resumo para e-mail padrao se liberado em rollout sem revisao.

Recomendacao:

Manter envio amplo em dry-run. Qualquer mudanca de `DRY_RUN`, fallback ou conteudo deve ser ciclo proprio de e-mail/workflow.

### Baixo

#### B1. `localStorage` guarda empresa ativa e metadados de sessao segura

Evidencia:

- `src/context/AppContext.jsx`: `localStorage` guarda `df_empresa_ativa` com `id`, `nome` e `perfil`.
- `src/services/sessionSecurityService.js`: `localStorage` guarda `df_sessao_segura`.
- `src/App.jsx`: `sessionStorage` guarda tela de retorno de sessao.

Impacto LGPD:

Nao foi encontrado armazenamento de CPF, salario, laudo ou documento. Ainda assim, nome/perfil da empresa e metadados de sessao sao informacoes locais persistentes.

Recomendacao:

Ponto de atencao. Em ciclo futuro, documentar exatamente o payload de `df_sessao_segura` e evitar expandir esse storage com dados pessoais.

#### B2. Exames periodicos usam apenas datas, mas sao metadados ocupacionais

Evidencia:

- `src/services/funcionariosExamesPeriodicosService.js`: select inclui `data_exame`, `arquivado` e metadados.
- `src/pages/RelatoriosPessoasPage.jsx`: exibe ultimo periodico/admissional e proxima previsao.
- Nao ha laudos, resultados, CID, diagnosticos, documentos ou anexos.

Impacto LGPD:

Risco baixo no modelo atual, mas datas de exame ocupacional ainda merecem acesso restrito.

Recomendacao:

Manter sem resultados/laudos/anexos. Relatorios futuros devem continuar mostrando apenas datas/status.

### Ponto de atencao

#### P1. Storage/Buckets nao aparecem no frontend, mas devem ser validados no Supabase

Evidencia:

- Busca local nao encontrou uso de `supabase.storage.from`, `getPublicUrl`, `createSignedUrl`, `upload` ou `download` no `src/`.
- Foi criado SQL especifico para listar buckets, policies e grants de `storage.buckets` e `storage.objects`.

Impacto LGPD:

Sem uso no frontend, nao ha risco confirmado por codigo. Se existirem buckets publicos no projeto remoto, o risco depende do conteudo.

Recomendacao:

Rodar o SQL de storage antes de qualquer modulo de anexos/documentos.

#### P2. Edge Functions usam service role por desenho

Evidencia:

- `supabase/functions/criar-empresa-master`, `convidar-usuario`, `criar-usuario-manual` e `listar-usuarios-empresa` leem `SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` de `Deno.env`.
- Nao foi encontrado valor real da chave no repositorio.

Impacto LGPD/seguranca:

Uso de service role em backend/Edge Function e esperado quando ha validacao forte. O risco depende de validacao de autorizacao dentro de cada funcao e secrets bem protegidos.

Recomendacao:

Manter fora de `src/`. Revisar Edge Functions em ciclo proprio se houver nova frente de Usuarios/Auth.

## Separacao de recomendacoes

### Agora

- Rodar `diagnostico_lgpd_security_readonly_catalog_20260606.sql` no Supabase e salvar resultado.
- Rodar `diagnostico_lgpd_security_readonly_storage_20260606.sql` no Supabase e salvar resultado.
- Abrir ciclo pequeno de frontend/payload para reduzir `FUNCIONARIO_SELECT` em listagens/relatorios.

### Depois

- Revisar `select('*')` em App, Usuarios, Billing e Relatorios financeiros.
- Revisar funcoes `SECURITY DEFINER` em schema `public` com base no resultado SQL.
- Planejar exportacoes RH com allowlist e perfis.
- Avaliar sanitizacao leve/alerta para campos livres sensiveis.

### Nao mexer agora

- Nao alterar RLS sem resultado do SQL.
- Nao mexer em workflows/e-mail sem ciclo operacional.
- Nao criar exportacao de RH.
- Nao mexer em Storage/buckets sem necessidade funcional e diagnostico executado.
- Nao alterar Financeiro/Contas neste ciclo.

## Ciclos proprios necessarios

- Banco/RLS: validar RLS sem force, grants para `anon/authenticated`, policies perigosas, funcoes `SECURITY DEFINER`, triggers e audit logs.
- Frontend/payload: reduzir selects e criar hooks/services resumidos para relatorios/listagens.
- Exportacoes: desenhar matriz de campos permitidos para RH, especialmente Folha.
- E-mail/workflow: manter dry-run amplo, revisar fallback e conteudo antes de liberar envio real agendado.

## Proximo ciclo mais seguro recomendado

Executar e analisar o SQL de catalogo no Supabase, sem aplicar correcao. O resultado deve priorizar se existe algum problema real de RLS/grants antes de mexer no frontend.
