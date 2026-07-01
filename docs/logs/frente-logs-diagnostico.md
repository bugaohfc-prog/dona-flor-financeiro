# Frente Logs / Auditoria - diagnostico

Data: 2026-07-01

## Resumo executivo

O sistema ja possui uma base inicial de auditoria persistente em `public.df_auditoria_admin`, mas ela cobre apenas eventos administrativos especificos: destinatarios de alertas e lixeira/restauracao de contas e notas. Tambem existem logs operacionais em `console.log/warn/error` em scripts, Edge Functions e frontend, porem esses logs nao formam uma trilha de auditoria consultavel por empresa, usuario, entidade e acao.

Este ciclo foi somente leitura/documentacao. Foram revisados documentos, migrations, codigo e catalogo Supabase por consultas `SELECT`. Nao houve alteracao de banco, dados, schema, RLS, policies, funcoes, grants, frontend, services/hooks ou scripts.

Recomendacao: organizar a frente em ciclos curtos. Primeiro consolidar o modelo de eventos e a taxonomia da auditoria; depois ampliar a captura para eventos P1 em Contas e Administracao sem misturar com RLS/grants ou mudancas funcionais.

Status em 2026-07-01: taxonomia e data dictionary P1 definidos em `docs/logs/auditoria-taxonomia-data-dictionary.md`. A recomendação preliminar é preparar uma futura `public.df_auditoria_eventos` para novos eventos operacionais, preservando `public.df_auditoria_admin` como trilha administrativa já existente até decisão de banco em ciclo próprio.

## Fontes revisadas

Documentacao e migrations principais:

- `docs/security/auditoria-admin-fase-1.md`
- `docs/security/diagnostics/diagnostico_df_auditoria_admin_20260601.sql`
- `docs/security/diagnostics/diagnostico_audit_lixeira_financeira_20260602.sql`
- `docs/security/diagnostics/resultado-lgpd-security-catalog-20260606.md`
- `docs/contas/retomada-frente-contas-diagnostico.md`
- `docs/rh/gestao-pessoas-funcionarios-estado-atual.md`
- `docs/operacional/contas-consolidacao-inss-cp-segur-receitas-1082-1099.md`
- `docs/operacional/contas-revisao-pendentes-inss-cp-segur-1099.md`
- `supabase/migrations/20260601210000_create_df_auditoria_admin.sql`
- `supabase/migrations/20260602103000_audit_lixeira_financeira.sql`

Codigo revisado por busca textual:

- `src`
- `supabase/functions`
- `scripts`
- `supabase/migrations`
- `docs`

Termos usados na varredura:

- `auditoria`, `audit`, `log`, `logs`, `historico`, `history`
- `df_auditoria`, `df_auditoria_admin`
- `registrar`, `rastrear`
- `created_by`, `updated_by`, `deleted_by`
- `oculto`, `cancelado`, `motivo`, `usuario`, `empresa_id`

## Estado atual no Supabase

Consulta remota somente leitura no projeto `contas-donaflor` confirmou:

- tabelas relacionadas a auditoria/log:
  - `auth.audit_log_entries`
  - `public.df_auditoria_admin`
- `public.df_auditoria_admin` possui 223 registros no momento do diagnostico.
- primeiro log observado: `2026-06-02 01:06:34.260706+00`.
- ultimo log observado: `2026-07-01 18:21:53.842409+00`.

### Estrutura de `public.df_auditoria_admin`

Campos atuais:

- `id uuid`
- `empresa_id uuid`
- `user_id uuid`
- `acao text`
- `recurso text`
- `registro_id uuid`
- `origem text`, default `database_trigger`
- `detalhes jsonb`
- `criado_em timestamptz`

Uso atual esperado:

- registrar metadados sanitizados;
- nao registrar conteudo completo do registro;
- nao registrar e-mail em texto claro, CPF, salario, dados medicos, laudos, anexos, secrets, senha ou token.

### RLS e permissao documentada

Estado documentado e confirmado por catalogo:

- RLS habilitada e forcada em `df_auditoria_admin`;
- policy unica para leitura:
  - `df_auditoria_admin_select_admin_master`
  - role `{authenticated}`
  - comando `SELECT`
  - condicao: usuario autenticado e `is_master()` ou `df_usuario_eh_admin(empresa_id)`;
- sem policy `ALL`, `INSERT`, `UPDATE` ou `DELETE` para usuarios;
- logs imutaveis por triggers contra `UPDATE` e `DELETE`;
- inserts sao feitos por triggers `SECURITY DEFINER`.

## Funcoes e triggers existentes

Funcoes relacionadas encontradas:

- `public.df_auditoria_admin_bloquear_update_delete()`
  - `plpgsql`
  - nao `SECURITY DEFINER`
  - `search_path=public`
  - bloqueia `UPDATE` e `DELETE` na tabela de auditoria.
- `public.df_auditoria_admin_sanitize_destinatario_alerta()`
  - `plpgsql`
  - `SECURITY DEFINER`
  - `search_path=public`
  - registra alteracoes sanitizadas de destinatarios de alertas.
- `public.df_auditoria_admin_sanitize_lixeira_financeira()`
  - `plpgsql`
  - `SECURITY DEFINER`
  - `search_path=public`
  - registra lixeira/restauracao de contas e notas.

Triggers relacionados encontrados:

- `trg_df_auditoria_admin_bloquear_update`
  - tabela: `public.df_auditoria_admin`
  - evento: `BEFORE UPDATE`
  - funcao: `df_auditoria_admin_bloquear_update_delete()`
- `trg_df_auditoria_admin_bloquear_delete`
  - tabela: `public.df_auditoria_admin`
  - evento: `BEFORE DELETE`
  - funcao: `df_auditoria_admin_bloquear_update_delete()`
- `trg_df_destinatarios_alertas_auditoria_admin`
  - tabela: `public.df_destinatarios_alertas`
  - eventos: `AFTER INSERT OR UPDATE`
  - funcao: `df_auditoria_admin_sanitize_destinatario_alerta()`
- `trg_df_contas_auditoria_lixeira`
  - tabela: `public.df_contas`
  - eventos: `AFTER UPDATE OR DELETE`
  - funcao: `df_auditoria_admin_sanitize_lixeira_financeira()`
- `trg_df_notas_auditoria_lixeira`
  - tabela: `public.df_notas`
  - eventos: `AFTER UPDATE OR DELETE`
  - funcao: `df_auditoria_admin_sanitize_lixeira_financeira()`

Tambem existem triggers operacionais em Contas e destinatarios que nao sao logs de auditoria, como calculo de baixa, validacao de pagamento parcial, timestamps, bloqueio de alteracao de vinculo e bloqueio de delete.

## Uso atual no app, Edge Functions e scripts

### Frontend e services

Nao foi encontrada tela de auditoria/historico consultando `public.df_auditoria_admin`.

Nao foi encontrado service/hook do app gravando diretamente em `df_auditoria_admin`. A auditoria persistente atual depende dos triggers no banco.

Pontos de mutacao relevantes encontrados no app:

- `src/hooks/useContas.js`
  - criar/editar contas;
  - baixa;
  - correcao de pagamento;
  - pagamento parcial;
  - estorno parcial;
  - quitação por parciais;
  - estorno de baixa;
  - recorrencia;
  - parcelamento;
  - cancelamento/ocultacao de parcelamento.
- `src/services/contasService.js`
  - pagamentos parciais em `df_contas_pagamentos`;
  - arquivamento logico de pagamento parcial;
  - ocultacao/lixeira de contas;
  - regras defensivas contra alterar contas ocultas/excluidas/deletadas.
- `src/services/notasService.js`
  - envio e restauracao de notas da lixeira por `excluido/excluido_em`.
- `src/services/usuariosService.js`
  - criacao de usuario via Edge Function;
  - convite;
  - alteracao de perfil;
  - remocao de vinculo;
  - atualizacao de perfil/profile;
  - vinculacao de filiais.
- `src/services/empresasService.js`
  - criacao de empresa via Edge Function;
  - atualizacao de nome da empresa.
- `src/services/funcionariosService.js`
  - criacao, edicao, arquivamento e reativacao de funcionarios.
- `src/services/funcionariosFeriasService.js`
  - criacao, edicao, arquivamento e reativacao de ciclos e periodos.
- `src/services/funcionariosExamesPeriodicosService.js`
  - criacao, edicao, arquivamento e reativacao de datas de exames periodicos.
- `src/services/folhaService.js`
  - competencias, lancamentos e itens com arquivamento logico.

### Edge Functions

Foram encontrados logs de execucao em `console.warn/error`, mas nao escrita persistente em `df_auditoria_admin`:

- `supabase/functions/convidar-usuario/index.ts`
  - valida sessao;
  - verifica permissao Master/Admin;
  - envia convite ou reset autorizado;
  - registra falhas em console;
  - fluxo deveria gerar auditoria persistente futura por ser acao sensivel.
- `supabase/functions/criar-usuario-manual/index.ts`
  - cria usuario;
  - atualiza `profiles`;
  - insere vinculo em `df_usuarios_empresas`;
  - fluxo critico para auditoria futura.
- `supabase/functions/criar-empresa-master/index.ts`
  - cria empresa;
  - cria vinculo inicial;
  - tenta rollback da empresa se o vinculo falhar;
  - fluxo critico para auditoria futura.
- `supabase/functions/listar-usuarios-empresa/index.ts`
  - leitura administrativa;
  - logs apenas de falhas.

### Scripts e automacoes

Foram encontrados logs de execucao em console:

- `scripts/envio-automatico-dona-flor.mjs`
  - logs estruturados de inicio/fim, empresa processada, envio cancelado e avisos;
  - usa mascara/resumo em alguns pontos;
  - nao grava auditoria persistente.
- `scripts/validar-rls-df-funcionarios.mjs`
  - logs de diagnostico RLS;
  - evita imprimir tokens;
  - nao e trilha de auditoria de uso do sistema.
- `scripts/importar_simples_inss_contas.mjs`
  - gera relatorio/SQL de importacao;
  - nao e auditoria persistente.
- `scripts/importar_fgts_contas.mjs`
  - gera relatorio/SQL de importacao;
  - nao e auditoria persistente.
- `scripts/gerar_conferencia_impostos.mjs`
  - gera conferencia operacional;
  - nao e auditoria persistente.

## Eventos que deveriam gerar log

### A. Contas / Financeiro

Eventos P1:

- criar conta;
- editar conta;
- pagar conta;
- corrigir baixa;
- registrar pagamento parcial;
- estornar pagamento parcial;
- quitar conta com parciais;
- estornar baixa;
- cancelar/ocultar conta;
- reativar/reexibir conta;
- enviar conta para lixeira;
- restaurar conta da lixeira;
- consolidar/importar impostos.

Eventos P2:

- criar recorrencia;
- alterar recorrencia;
- desativar recorrencia;
- gerar conta recorrente automaticamente;
- criar parcelamento;
- cancelar parcelamento;
- reexibir parcelamento;
- alterar dados de parcela.

### B. Usuarios / Empresas / Permissoes

Eventos P1:

- criar usuario;
- enviar convite;
- reset autorizado no fluxo de convite;
- vincular usuario a empresa;
- alterar perfil;
- remover vinculo;
- vincular/desvincular filial;
- trocar empresa ativa, se isso passar a ter impacto operacional auditavel.

Eventos P2:

- criar empresa;
- renomear empresa;
- criar filial;
- renomear filial;
- ativar/inativar filial;
- tentativa bloqueada por falta de permissao.

### C. Funcionarios / RH

Eventos P1:

- criar funcionario;
- editar funcionario;
- arquivar funcionario;
- reativar funcionario;
- criar exame periodico por data;
- editar exame periodico;
- arquivar/reativar exame periodico;
- criar/editar/arquivar/reativar ferias.

Cuidados:

- nao registrar CPF em texto claro;
- nao registrar observacoes completas;
- nao registrar laudos, resultados, CID, documentos, anexos ou dados medicos;
- logs devem guardar metadados e alteracoes sanitizadas.

### D. Administracao / Seguranca

Eventos P1:

- acao Master/Admin sensivel;
- tentativa bloqueada por permissao;
- tentativa de acesso cross-tenant;
- tentativa de alteracao de `empresa_id`;
- tentativa de DELETE fisico bloqueada;
- execucao de Edge Function sensivel com sucesso/falha;
- alteracao em destinatarios de alertas.

Eventos P2/P3:

- login/logout somente se houver plano proprio de Auth e privacidade;
- erro de renderizacao/tela branca agrupado por sessao sem dados sensiveis;
- anomalias repetidas por usuario/empresa.

## O que ja existe por evento

| Evento | Persistencia atual | Origem | Tabela/recurso | Dados gravados |
| --- | --- | --- | --- | --- |
| Criar destinatario de alerta | Sim | Trigger | `df_auditoria_admin` / `df_destinatarios_alertas` | `empresa_id`, `user_id`, `acao`, `recurso`, `registro_id`, `origem`, preferencias booleanas, `email_hash` |
| Atualizar destinatario de alerta | Sim | Trigger | `df_auditoria_admin` / `df_destinatarios_alertas` | antes/depois apenas de preferencias/status/e-mail hash |
| Inativar/reativar destinatario | Sim | Trigger | `df_auditoria_admin` / `df_destinatarios_alertas` | status antes/depois e metadados |
| Enviar conta para lixeira/restaurar | Sim | Trigger | `df_auditoria_admin` / `df_contas` | `excluido` e presenca de `excluido_em` antes/depois |
| Enviar nota para lixeira/restaurar | Sim | Trigger | `df_auditoria_admin` / `df_notas` | `excluido` e presenca de `excluido_em` antes/depois |
| DELETE fisico de conta/nota | Previsto por trigger, mas nao deve ser testado sem autorizacao | Trigger | `df_auditoria_admin` | marcador de exclusao definitiva |
| Criacao/edicao/baixa/parcial/estorno de conta | Parcialmente nao | App/services | `df_contas`, `df_contas_pagamentos` | estado operacional na tabela, sem log persistente dedicado |
| Criacao/convite/perfil/remocao de usuario | Nao persistente como auditoria | App/Edge Function | `df_usuarios_empresas`, `profiles`, Auth | console em falhas, sem trilha unificada |
| Criacao/edicao/arquivamento de funcionarios | Nao persistente como auditoria | App/services | tabelas de RH | estado operacional, sem log unificado |
| Scripts de importacao/conferencia/envio | Nao persistente como auditoria | Script/GitHub Actions | stdout/log do job | logs efemeros do processo |

## Lacunas encontradas

- Nao existe tela de auditoria para Admin/Master.
- Nao existe historico por registro no app.
- `df_auditoria_admin` cobre poucos recursos.
- Eventos financeiros relevantes ainda nao possuem log persistente de antes/depois sanitizado.
- Pagamentos parciais, estornos e quitacao nao possuem trilha consultavel unificada.
- Criacao/convite/alteracao de perfil/remocao de usuario nao possuem auditoria persistente.
- Edge Functions sensiveis registram falhas no console, mas nao em tabela de auditoria.
- Scripts operacionais registram stdout, nao evento persistente por empresa/registro.
- Nem todo log guarda `empresa_id`, `user_id`, entidade, severidade, origem e status de forma padronizada.
- Antes/depois nao existe para a maioria dos eventos.
- Console logs podem ser uteis para debug, mas sao dificeis de consultar por empresa, usuario ou registro.
- Existe risco de expor dado sensivel se a auditoria futura gravar payload completo.
- Nao ha politica documentada de retencao/arquivamento de logs.
- Nao ha correlacao padronizada entre acao de app, Edge Function, script e trigger.

## Riscos

- Ampliar auditoria sem mascaramento pode expor dados pessoais, financeiros ou medicos.
- Registrar payload completo de Contas pode expor observacoes, valores e detalhes financeiros acima do necessario.
- Registrar payload completo de RH pode violar LGPD, especialmente CPF, observacoes e informacoes de exames.
- Logs de usuario/permissao podem expor e-mail ou perfil se nao houver mascaramento e RLS correta.
- Misturar auditoria com grants/RLS/security definer aumenta risco operacional.
- Tela de auditoria sem filtros e RLS fortes pode vazar eventos cross-tenant.
- Criar triggers amplos sem testes pode afetar performance em tabelas movimentadas.

## Proposta de arquitetura futura

### Caminho recomendado

Usar `public.df_auditoria_admin` como base inicial somente se o desenho futuro confirmar que ela comporta auditoria operacional mais ampla. Se a frente crescer para eventos de usuario, financeiro, RH e seguranca, avaliar uma tabela dedicada `public.df_auditoria_eventos` em ciclo de banco proprio, com migration, RLS e rollback.

Nao decidir isso por implementacao direta. Primeiro criar data dictionary e taxonomia de eventos.

### Campos minimos recomendados

- `id uuid`
- `empresa_id uuid not null`
- `user_id uuid null`
- `ator_tipo text`
  - `usuario`, `edge_function`, `script`, `database_trigger`, `sistema`
- `ator_email_hash text null`
- `modulo text`
  - `financeiro`, `usuarios`, `empresas`, `rh`, `seguranca`, `automacao`
- `entidade_tipo text`
  - exemplo: `df_contas`, `df_contas_pagamentos`, `df_usuarios_empresas`
- `entidade_id uuid null`
- `acao text`
  - padrao: `modulo.entidade.acao`
- `severidade text`
  - `info`, `warning`, `critical`
- `origem text`
  - `app`, `edge_function`, `database_trigger`, `script`, `manual`
- `status text`
  - `sucesso`, `falha`, `bloqueado`
- `motivo text null`
- `dados_antes jsonb`
- `dados_depois jsonb`
- `metadados jsonb`
- `correlation_id uuid/text null`
- `criado_em timestamptz`

### Padrao de eventos

Exemplos:

- `financeiro.conta.criada`
- `financeiro.conta.editada`
- `financeiro.conta.baixada`
- `financeiro.conta.baixa_estornada`
- `financeiro.pagamento_parcial.criado`
- `financeiro.pagamento_parcial.estornado`
- `financeiro.parcelamento.criado`
- `financeiro.imposto.importado`
- `usuarios.vinculo.criado`
- `usuarios.vinculo.perfil_alterado`
- `usuarios.convite.enviado`
- `empresas.empresa.criada`
- `rh.funcionario.criado`
- `rh.funcionario.arquivado`
- `seguranca.acao.bloqueada`
- `seguranca.cross_tenant.bloqueado`

### Mascaramento e minimizacao

Nao registrar:

- senha, hash de senha, token, secret;
- CPF em texto claro;
- e-mail em texto claro quando hash for suficiente;
- laudo, resultado de exame, CID, diagnostico ou dado medico;
- observacoes completas de funcionario;
- anexos, documentos, base64 ou links sensiveis;
- payload completo de requests.

Registrar preferencialmente:

- campos booleanos alterados;
- IDs;
- valores monetarios somente quando necessario para auditoria financeira;
- hashes de e-mail;
- contagem de itens;
- status antes/depois;
- motivo operacional curto e sanitizado.

### Visualizacao

Regra inicial sugerida:

- Master: consulta ampla, com cuidado para multiempresa.
- Admin: consulta logs da propria empresa.
- Gerente: sem acesso inicial; avaliar depois apenas logs operacionais nao sensiveis.
- Operador: sem acesso.

Filtros minimos para uma tela futura:

- periodo;
- empresa;
- modulo;
- acao;
- entidade;
- usuario;
- severidade;
- status.

### Retencao

Retencao deve ser definida em ciclo proprio. Caminho conservador:

- manter logs recentes consultaveis;
- arquivar logs antigos por janela definida;
- nunca usar limpeza automatica sem decisao explicita;
- nao apagar logs administrativos sensiveis sem procedimento documentado.

## Prioridades sugeridas

### P1 essencial

1. Definir taxonomia e data dictionary da auditoria.
   - Decidir se a evolucao usa `df_auditoria_admin` ou nova tabela.
   - Listar eventos P1 com payload permitido por evento.

2. Auditar eventos financeiros criticos.
   - Baixa, estorno, parcial, quitacao por parciais, lixeira/restauracao e ocultacao.
   - Nao misturar com alteracao de regra de pagamento.

3. Auditar usuarios/permissoes sensiveis.
   - Criacao, convite, alteracao de perfil, remocao de vinculo e vinculacao de filial.
   - Nao misturar com grants/RLS/security definer.

4. Definir mascaramento obrigatorio.
   - E-mail por hash quando possivel.
   - CPF, senha, token, dados medicos e observacoes sensiveis proibidos.

### P2 importante

5. Criar tela de auditoria somente leitura para Admin/Master.
   - Filtros por data, modulo, acao, usuario e registro.
   - Sem exportacao inicial.

6. Criar historico por registro.
   - Comecar por Conta ou Usuario, nao ambos no mesmo ciclo.

7. Padronizar logs de Edge Functions.
   - Registrar eventos de sucesso/falha em tabela apenas depois de modelo aprovado.
   - Manter console logs sanitizados.

8. Integrar automacoes.
   - Registrar execucao de envio automatico e importacoes como eventos resumidos.
   - Nao registrar destinatarios em texto claro.

### P3 futuro

9. Retencao/arquivamento de logs.
10. Exportacao administrativa controlada.
11. Alertas de anomalia.
12. Dashboard de seguranca.
13. Correlacao com erro de renderizacao/tela branca sem dados sensiveis.

## Primeiro ciclo de implementacao recomendado

Criar um ciclo de modelagem tecnica, ainda sem alterar dados reais:

1. Definir data dictionary da auditoria.
2. Escolher tabela alvo: evoluir `df_auditoria_admin` ou criar `df_auditoria_eventos`.
3. Especificar eventos P1 de Contas e Usuarios com payload permitido.
4. Especificar RLS e perfis de leitura.
5. Preparar migration, rollback e diagnostico, mas aplicar somente em ciclo de banco separado com autorizacao explicita.

Se a prioridade for entregar valor visual rapido, o primeiro ciclo funcional futuro deve ser uma tela somente leitura para os logs ja existentes em `df_auditoria_admin`, restrita a Admin/Master, sem criar novos eventos ainda.

## Confirmacoes deste ciclo

- Banco: nao alterado.
- Dados: nao alterados.
- Schema/migration: nao alterados.
- RLS/policies/grants/functions Supabase: nao alterados.
- Frontend: nao alterado.
- Services/hooks: nao alterados.
- Scripts: nao alterados.
- GitHub Actions/secrets/envio real: nao alterados.
- Correcoes INSS / CP-SEGUR: nao alteradas.
- Frente SECURITY DEFINER: nao alterada.
