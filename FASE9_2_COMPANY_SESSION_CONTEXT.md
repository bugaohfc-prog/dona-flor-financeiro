# FASE 9.2 — Company Session Context

Objetivo: preparar o app para trabalhar com empresa ativa global sem alterar o visual validado.

Alterações:
- `AppContext` agora guarda `empresaAtiva` em contexto global.
- Persistência segura em `localStorage` com a chave `df_empresa_ativa`.
- Limpeza automática da empresa ativa no logout/sessão expirada.
- `tenantService` carrega o vínculo em `df_usuarios_empresas` e busca o nome em `df_empresas` sem depender de relacionamento FK implícito.
- `App.jsx` sincroniza a empresa ativa assim que a sessão do usuário é validada.

Sem SQL obrigatório nesta fase.

Validação recomendada:
1. Login.
2. Dashboard.
3. Nome do usuário.
4. Contas.
5. Notas.
6. Centros de custo.
7. Logout e novo login.

Observação:
Esta fase não ativa RLS e não muda o Topbar. Ela apenas cria a base para troca de empresa, filtros automáticos e isolamento futuro.
