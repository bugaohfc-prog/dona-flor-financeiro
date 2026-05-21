# Dona Flor Financeiro — Registro de Homologação e Produção RLS

**Data:** 2026-05-19  
**Atualização:** 2026-05-20  
**Status:** RLS principal aplicada e validada em homologação e produção  
**Ambientes:** Supabase de homologação e produção  
**Produção:** Aplicada e validada  

---

## 1. Contexto

Este documento registra a fase de saneamento e validação de Row Level Security (RLS) do projeto **Dona Flor Financeiro**.

A base frontend atual já havia sido validada e subida ao Git antes da aplicação da RLS em homologação. A etapa de RLS foi tratada como fase separada de segurança, sem alteração de frontend, CSS, autenticação, rotas, automações, importador CSV ou regras de negócio.

Após validação em homologação, a RLS principal foi aplicada e validada também em produção. Em seguida, houve saneamento complementar específico de `df_usuarios_empresas`, igualmente aplicado e validado em homologação e produção.

---

## 2. Estado da aplicação antes da RLS

Antes da aplicação da migration RLS em homologação, a versão validada continha:

- Base limpa pré-RLS restaurada;
- Menu lateral corrigido;
- Página Plano Comercial/Billing corrigida;
- Configurações e topo preservados;
- Proteção frontend contra admin comum remover/editar usuário master;
- Build validado;
- Pipedream e envio automático de e-mail validados;
- RLS ainda não aplicada em produção naquele momento.

---

## 3. Escopo da migration RLS homologada e aplicada

A migration validada teve como objetivo sanear policies permissivas reais do Supabase, principalmente nas tabelas:

- `df_notas`
- `df_assinaturas`
- `df_usuarios_filiais`
- `df_usuarios_empresas`

A migration também criou o helper seguro:

```sql
public.df_usuario_alvo_eh_master(
  p_user_id uuid,
  p_email text,
  p_usuario_id uuid
)
```

O helper foi criado como `SECURITY DEFINER` com `search_path` seguro, para validar se um usuário-alvo é master sem depender da visibilidade direta da tabela `df_usuarios_master` dentro das próprias policies.

---

## 4. Regras de segurança confirmadas

A migration final foi revisada e validada com os seguintes critérios:

- Não usa `TO anon`;
- Não cria policy real com `USING true`;
- Não cria policy real com `WITH CHECK true`;
- Não usa `is_admin()` como condição real em novas policies;
- Não usa `get_empresa_usuario()` como condição real em novas policies;
- Preserva a função legada `is_admin()`;
- Usa `public.is_master()`;
- Usa `public.df_usuario_eh_admin(empresa_id)`;
- Cria `public.df_usuario_alvo_eh_master(...)`;
- Protege `df_usuarios_empresas` contra `INSERT`, `UPDATE` e `DELETE` indevidos envolvendo usuário master;
- Protege `df_usuarios_filiais` contra alteração de permissões/filiais do master por admin comum;
- Remove a policy permissiva `permitir tudo notas` de `df_notas`;
- Saneia policies permissivas de `df_assinaturas`;
- Saneia policies abertas de `df_usuarios_filiais`;
- Remove dependência de policies antigas baseadas em `is_admin()` global e `get_empresa_usuario()`.

---

## 5. Observação sobre erro encontrado e correção

Durante a primeira tentativa de aplicação da migration, ocorreu erro porque a migration assumia a existência da coluna:

```sql
df_usuarios_empresas.status
```

O banco real não possuía essa coluna. A migration foi ajustada para não depender de `ue.status`.

Após o ajuste, a versão corrigida sem dependência de `ue.status` foi aplicada e validada em homologação. A mesma versão corrigida foi posteriormente aplicada e validada em produção.

---

## 6. Conferências SQL realizadas

Antes da aplicação foram salvos os resultados de:

1. Listagem das policies atuais das tabelas-alvo;
2. SQL de rollback das policies existentes;
3. Conferência dos helpers existentes:
   - `is_master`
   - `df_usuario_eh_admin`

Após a aplicação, foram executadas conferências para validar:

- Policies atuais após saneamento;
- Criação do helper `df_usuario_alvo_eh_master`;
- Ausência de policies perigosas.

A conferência negativa final retornou sucesso, sem ocorrência de:

- `TO anon`;
- `USING true`;
- `WITH CHECK true`;
- uso real de `is_admin()`;
- uso real de `get_empresa_usuario()`.

Os SQLs e documentos versionados da etapa RLS ficam em `docs/security/rls`. O índice geral está em `docs/security/rls/README.md`, e o pacote complementar de `df_usuarios_empresas` está em `docs/security/rls/2026-05-19-df-usuarios-empresas/`.

---

## 7. Saneamento complementar de df_usuarios_empresas

Após a RLS principal, foi executado saneamento complementar específico de `public.df_usuarios_empresas`.

Objetivo do complemento:

- Remover policies antigas de escrita que poderiam contornar a proteção contra alteração/remoção de usuário master;
- Recriar policies saneadas de `SELECT`, `INSERT`, `UPDATE` e `DELETE`;
- Validar ausência de policies perigosas remanescentes;
- Manter rollback emergencial documentado.

Status do complemento:

- Homologação: aplicado e validado;
- Produção: aplicado e validado.

Documentos do complemento:

- `docs/security/rls/2026-05-19-df-usuarios-empresas/README.md`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/01_backup_df_usuarios_empresas.sql`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/02_migration_df_usuarios_empresas_cleanup.sql`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/03_conferencia_df_usuarios_empresas.sql`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/04_conferencia_negativa_df_usuarios_empresas.sql`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/05_rollback_df_usuarios_empresas.sql`
- `docs/security/rls/2026-05-19-df-usuarios-empresas/relatorio_impacto_rls_df_usuarios_empresas.md`

---

## 8. Testes funcionais validados

Após a aplicação da RLS, os seguintes testes foram validados em homologação e produção:

### Usuário admin Dona Flor

- Não remove usuário master Hindeburg;
- Não altera perfil do master;
- Não altera filiais/permissões do master;
- Continua conseguindo gerenciar usuário comum.

### Usuário master Hindeburg

- Continua administrando normalmente;
- Mantém acesso esperado às funções administrativas.

### Notas

- Listagem validada;
- Criação validada;
- Edição validada;
- Exclusão validada dentro da própria empresa.

### Billing / Plano Comercial

- Acesso validado;
- Fluxo de plano validado conforme regra atual.

### Filiais e permissões

- Admin gerencia usuários comuns;
- Master permanece protegido contra alteração por admin comum.

### Relatórios

- Relatórios continuam carregando dados da empresa corretamente.

### Acesso cruzado

- Acesso cruzado entre empresas validado conforme esperado;
- Usuário/admin de outra empresa não deve ler nem alterar dados da Dona Flor.

---

## 9. Status final

A fase de RLS foi considerada **validada em homologação e produção**.

Estado final registrado:

- Frontend atual no Git;
- Build validado;
- Menu, Billing e Configurações funcionando;
- Proteção master frontend validada;
- Pipedream/e-mail validado;
- Migration RLS principal corrigida, sem dependência de `ue.status`, aplicada em homologação;
- Migration RLS principal corrigida, sem dependência de `ue.status`, aplicada em produção;
- Saneamento complementar de `df_usuarios_empresas` aplicado e validado em homologação;
- Saneamento complementar de `df_usuarios_empresas` aplicado e validado em produção;
- Conferências SQL aprovadas;
- Testes funcionais RLS aprovados.

---

## 10. Produção

A etapa de produção foi concluída.

Registro de produção:

1. Backup e conferências foram tratados antes da aplicação;
2. A migration RLS final corrigida, sem `ue.status`, foi aplicada;
3. As conferências negativas foram executadas;
4. Os fluxos de admin, master e usuário comum foram testados;
5. Notas, billing, filiais e relatórios foram validados;
6. Acesso cruzado entre empresas foi validado;
7. O saneamento complementar de `df_usuarios_empresas` foi aplicado e validado.

---

## 11. Observações finais

A draft RLS antiga foi superada pela versão final corrigida sem dependência de `df_usuarios_empresas.status` / `ue.status`.

Os SQLs, conferências, relatórios e rollbacks versionados da etapa RLS devem permanecer em `docs/security/rls`.

Rollbacks são apenas emergenciais. Eles devem ser usados somente após análise explícita do risco, pois podem restaurar permissões antigas já saneadas.

Este documento deve ser versionado no Git como registro de auditoria, homologação e produção da etapa RLS.
