# Dona Flor Financeiro — Registro de Homologação RLS

**Data:** 2026-05-19  
**Status:** Homologação RLS validada  
**Ambiente:** Supabase de homologação  
**Produção:** Não aplicada ainda  

---

## 1. Contexto

Este documento registra a fase de saneamento e validação de Row Level Security (RLS) do projeto **Dona Flor Financeiro**.

A base frontend atual já havia sido validada e subida ao Git antes da aplicação da RLS em homologação. A etapa de RLS foi tratada como fase separada de segurança, sem alteração de frontend, CSS, autenticação, rotas, automações, importador CSV ou regras de negócio.

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
- RLS ainda não aplicada em produção.

---

## 3. Escopo da migration RLS homologada

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

Após o ajuste, a versão corrigida da migration foi aplicada em homologação com sucesso.

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

---

## 7. Testes funcionais validados

Após a aplicação da RLS em homologação, os seguintes testes foram validados:

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

## 8. Status final da homologação

A fase de RLS em homologação foi considerada **validada**.

Estado final registrado:

- Frontend atual no Git;
- Build validado;
- Menu, Billing e Configurações funcionando;
- Proteção master frontend validada;
- Pipedream/e-mail validado;
- Migration RLS aplicada em homologação;
- Conferências SQL aprovadas;
- Testes funcionais RLS aprovados.

---

## 9. Produção

Esta homologação **não significa aplicação automática em produção**.

Para produção, seguir obrigatoriamente esta ordem:

1. Fazer backup do Supabase produção;
2. Salvar policies atuais de produção;
3. Gerar e salvar SQL de rollback;
4. Confirmar helpers existentes;
5. Aplicar a migration RLS final corrigida;
6. Rodar conferência negativa;
7. Testar admin, master e usuário comum;
8. Testar notas, billing, filiais e relatórios;
9. Validar acesso cruzado entre empresas;
10. Registrar evidências.

---

## 10. Observações finais

A draft RLS antiga foi superada pela versão final corrigida sem dependência de `df_usuarios_empresas.status`.

O SQL final aplicado em homologação deve ser preservado junto com o rollback gerado antes da aplicação.

Este documento deve ser versionado no Git como registro de auditoria e homologação da etapa RLS.
