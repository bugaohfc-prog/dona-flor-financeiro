# Resultado remoto - LGPD/Security catalog - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Modo: diagnostico read-only, somente consultas SELECT.

## Resumo executivo

O diagnostico remoto confirmou que nao ha tabelas publicas com RLS desabilitada no schema public. O principal risco esta em configuracoes antigas de grants e policies: existem tabelas com RLS habilitada sem FORCE RLS, grants amplos para anon/authenticated e policies com role public, ALL, DELETE ou expressoes true.

As tabelas recentes de Gestao de Pessoas e Folha aparecem com controles melhores, incluindo tenant por empresa_id, arquivamento logico e triggers de bloqueio/validacao. O risco maior parece concentrado em tabelas legadas ou de base administrativa/financeira.

## Achados por severidade

### Critico

1. Grants amplos para anon em tabelas publicas antigas.
   - Evidencia: anon possui SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES e TRIGGER em 16 tabelas: contas, df_assinaturas, df_centros_custo, df_configuracoes, df_configuracoes_alertas, df_contas_recorrentes, df_empresas, df_filiais, df_lembretes_hoje, df_planos, df_push_tokens, df_usuarios, df_usuarios_empresas, df_usuarios_filiais, df_usuarios_master e profiles.
   - Impacto: mesmo com RLS, grants amplos aumentam a superficie da API e podem permitir operacoes perigosas se alguma policy estiver permissiva.
   - Classificacao: risco real.

2. Policy totalmente permissiva em public.contas.
   - Evidencia: policy "Permitir tudo", comando ALL, roles {public}, using true, with check true.
   - Impacto: risco de leitura/escrita sem isolamento adequado caso a tabela esteja exposta ou usada por cliente.
   - Classificacao: risco real.

### Alto

1. Grants DELETE/TRUNCATE/TRIGGER para authenticated em tabelas publicas.
   - Evidencia: authenticated possui DELETE em 18 tabelas e TRUNCATE/TRIGGER em 22 tabelas.
   - Impacto: RLS pode mitigar parte do acesso, mas grants amplos contrariam o principio de menor privilegio e ampliam blast radius de policy incorreta.
   - Classificacao: risco real.

2. Policies com comando ALL ou DELETE em tabelas operacionais.
   - Evidencia: df_centros_custo possui policy ALL e DELETE; df_contas_recorrentes possui policy ALL; df_configuracoes, df_empresas, df_filiais, df_push_tokens, df_usuarios e df_usuarios_master possuem policies DELETE com role public.
   - Impacto: exclusao fisica ou permissoes amplas podem conflitar com padrao atual de inativacao/arquivamento logico.
   - Classificacao: risco real.

3. Funcoes SECURITY DEFINER em schema public com EXECUTE amplo.
   - Evidencia: funcoes como criar_usuario, login_usuario, handle_new_user, get_empresa_usuario, is_admin, is_master e varias funcoes de trigger possuem EXECUTE para PUBLIC, anon e/ou authenticated.
   - Impacto: funcoes privilegiadas expostas aumentam risco se houver parametros manipulaveis ou search_path incompleto.
   - Classificacao: risco real para funcoes invocaveis diretamente; ponto de atencao para funcoes usadas apenas por trigger.

### Medio

1. RLS habilitada sem FORCE RLS em 17 tabelas.
   - Evidencia: contas, df_assinaturas, df_centros_custo, df_configuracoes, df_configuracoes_alertas, df_contas, df_contas_recorrentes, df_empresas, df_filiais, df_notas, df_planos, df_push_tokens, df_usuarios, df_usuarios_empresas, df_usuarios_filiais, df_usuarios_master e profiles.
   - Impacto: owners e funcoes privilegiadas podem contornar RLS; FORCE RLS e recomendado para hardening de tabelas expostas.
   - Classificacao: ponto de atencao com risco real em tabelas sensiveis.

2. Policies com role {public}.
   - Evidencia: 43 policies publicas foram classificadas com public_or_anon_role.
   - Impacto: pode ser aceitavel quando a expressao restringe por auth.uid(), mas deve ser revisado para roles explicitas anon/authenticated e menor privilegio.
   - Classificacao: ponto de atencao.

3. Funcoes SECURITY DEFINER sem search_path configurado.
   - Evidencia: criar_usuario, handle_new_user e login_usuario aparecem com function_config vazio.
   - Impacto: funcoes SECURITY DEFINER sem search_path fixo sao mais sensiveis a riscos de resolucao de objeto.
   - Classificacao: risco real se as funcoes forem usadas.

### Baixo

1. Tabelas sem coluna tenant direta.
   - Evidencia: df_empresas e df_planos nao possuem empresa_id ou user_id.
   - Impacto: pode ser esperado para tabela raiz de empresas e catalogo de planos, mas exige policies especificas.
   - Classificacao: sem risco imediato para df_planos se for catalogo publico; ponto de atencao para df_empresas.

2. Auditoria com SELECT para authenticated.
   - Evidencia: df_auditoria_admin possui grant SELECT para authenticated.
   - Impacto: depende das policies e da tela consumidora; logs podem conter emails ou dados administrativos.
   - Classificacao: ponto de atencao.

### Ponto de atencao

1. Triggers de protecao existem em tabelas recentes.
   - Evidencia: df_folha_lancamento_itens, df_folha_lancamentos, df_funcionarios, ferias, exames e destinatarios possuem triggers de bloqueio de delete, bloqueio de alteracao de empresa, timestamps e validacao.
   - Impacto: bom sinal defensivo, mas os grants de EXECUTE amplos das funcoes de trigger devem ser revisados em ciclo proprio.
   - Classificacao: sem risco imediato nas tabelas recentes, com hardening pendente.

## Resultados objetivos

- Tabelas publicas com RLS desabilitada: nenhuma.
- Tabelas publicas com RLS sem FORCE: 17.
- Policies com using true: 2.
- Policies com with check true: 1.
- Policies com comando ALL: 3.
- Policies com role public/anon aparente: 43.
- Grants anon amplos em public: 16 tabelas com SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER.
- Grants authenticated amplos em public: DELETE em 18 tabelas; TRUNCATE/TRIGGER em 22 tabelas.
- Funcoes SECURITY DEFINER em public: 22.
- Tabelas sem tenant direto: df_empresas, df_planos.

## Recomendacoes

### Agora

1. Abrir ciclo especifico de hardening de grants/policies legadas, com rollback e diagnostico.
2. Priorizar public.contas por ter policy ALL, role public, using true e with check true.
3. Remover grants de TRUNCATE, REFERENCES e TRIGGER de anon/authenticated onde nao forem estritamente necessarios.
4. Revisar grants DELETE em tabelas com padrao de arquivamento/inativacao logica.

### Depois

1. Avaliar FORCE RLS nas 17 tabelas publicas listadas.
2. Trocar policies com role public por roles explicitas e comandos separados por SELECT/INSERT/UPDATE quando seguro.
3. Revisar funcoes SECURITY DEFINER em public, especialmente criar_usuario, login_usuario e handle_new_user.
4. Validar se df_auditoria_admin deve expor SELECT para authenticated ou apenas para perfis administrativos.

### Nao mexer agora

1. Nao alterar tabelas recentes de Folha/Pessoas sem necessidade, pois ja possuem controles especificos.
2. Nao mexer em Financeiro/Contas junto com RH no mesmo ciclo, porque o risco e dominio sao diferentes.
3. Nao aplicar revogacoes amplas sem testar fluxos de login, empresa ativa, configuracoes, notas e financeiro.

## Proximo ciclo mais seguro

Criar ciclo pequeno de banco/RLS para diagnosticar e corrigir somente public.contas e grants anon/authenticated mais perigosos, com rollback, diagnostico antes/depois e teste de login/empresa ativa. Nao misturar com frontend.
