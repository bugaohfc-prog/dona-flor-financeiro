# Edge Function criar-empresa-master

Data: 2026-05-22

## Status

Correcao aplicada, deployada e validada no Supabase para o fluxo Master > Empresas.

Arquivos funcionais alterados no ciclo da correcao:

- `src/services/empresasService.js`
- `supabase/functions/criar-empresa-master/index.ts`

Este registro e apenas documentacao. Nao houve alteracao de SQL, RLS, policies, CSS/layout, Pipedream, importador CSV, centro de custo, `convidar-usuario`, billing/plano comercial ou menu lateral neste ciclo de documentacao.

## Motivo da criacao

O fluxo antigo tentava criar empresas diretamente pelo frontend usando o cliente Supabase do usuario autenticado.

Com RLS ativa em `public.df_empresas`, esse fluxo ficou fragil porque a policy de `SELECT` da tabela permite visualizar uma empresa apenas quando ja existe vinculo correspondente em `public.df_usuarios_empresas`.

Na pratica, o `INSERT` em `df_empresas` podia ser permitido, mas uma chamada como `insert(...).select().single()` dependia de ler a empresa recem-criada antes de existir o vinculo inicial. Sem esse `id`, o frontend nao conseguia criar o vinculo em `df_usuarios_empresas`, e a tela exibia erro generico ao criar empresa.

## Fluxo atual

O frontend nao cria mais a empresa diretamente em `df_empresas`.

O service `criarEmpresaMaster()` chama:

```text
supabase.functions.invoke('criar-empresa-master', ...)
```

A Edge Function centraliza a operacao em servidor:

1. Le o header `Authorization`.
2. Extrai o access token do `Bearer`.
3. Valida a sessao com `auth.getUser(accessToken)`.
4. Obtem `user.id` e `user.email` a partir do JWT validado.
5. Valida se o usuario autenticado e master.
6. Valida e normaliza o nome da empresa.
7. Verifica duplicidade por nome.
8. Cria o registro em `public.df_empresas`.
9. Cria o vinculo inicial em `public.df_usuarios_empresas`.
10. Retorna sucesso ao frontend.

## Validacao master

Esta funcao nao usa `rpc('is_master')` nem `public.is_master()`.

A decisao foi validar master diretamente em `public.df_usuarios_empresas`, usando o `user.id` obtido de um JWT previamente validado por `auth.getUser(accessToken)`.

Consulta logica usada pela funcao:

```text
df_usuarios_empresas
where user_id = user.id
and perfil = 'master'
limit 1
```

Motivo: dentro de Edge Functions, funcoes SQL que dependem de `auth.uid()` podem perder ou nao receber o contexto esperado do usuario chamador, dependendo do client Supabase usado. A validacao direta evita depender desse contexto implicito e usa um identificador ja validado pelo Auth.

## Uso de service role

A chave de service role e inicializada somente depois de:

- existir `Authorization Bearer`;
- o access token ser validado com `auth.getUser(accessToken)`.

A consulta de autorizacao master em `df_usuarios_empresas` usa service role intencionalmente, filtrando pelo `user.id` obtido do JWT validado. Essa escolha evita depender de `auth.uid()` dentro de RPC/SQL no contexto da Edge Function.

Depois que o usuario e confirmado como master, a service role e usada para:

- verificar duplicidade em `df_empresas`;
- inserir a nova empresa em `df_empresas`;
- inserir o vinculo inicial em `df_usuarios_empresas`;
- executar rollback se a criacao do vinculo falhar.

## Vinculo inicial

A funcao cria o primeiro vinculo da nova empresa em `public.df_usuarios_empresas` com:

- `empresa_id`: id da empresa criada;
- `user_id`: id do usuario master autenticado;
- `email`: e-mail do usuario autenticado, quando disponivel;
- `nome`: nome enviado pelo frontend ou nome derivado dos metadados/e-mail;
- `perfil`: `admin`.

A funcao nao insere coluna `status`.

Esse ponto e intencional porque o estado validado da tabela nao deve depender de coluna `status` para este fluxo.

## Rollback

Se a empresa for criada em `df_empresas`, mas a criacao do vinculo inicial em `df_usuarios_empresas` falhar, a funcao tenta apagar a empresa recem-criada.

Objetivo: evitar empresa orfa, sem administrador vinculado.

Os logs registram:

- erro ao criar vinculo;
- tentativa de rollback;
- rollback realizado ou falho.

O frontend continua recebendo mensagem generica.

## CORS e respostas

A funcao deve manter CORS em todas as respostas:

- `OPTIONS`;
- sucesso;
- `400`;
- `401`;
- `403`;
- `500`.

Resposta de erro ao frontend:

```json
{ "ok": false, "message": "Nao foi possivel criar a empresa." }
```

Detalhes tecnicos ficam apenas nos logs da Edge Function.

## Deploy

Esta Edge Function exige deploy explicito no Supabase sempre que o arquivo for alterado:

```powershell
npx.cmd supabase functions deploy criar-empresa-master
```

Funcao esperada no Supabase:

```text
criar-empresa-master
```

## Validacao real registrada

Fluxo validado no app apos deploy:

- Empresa `Choco Arte` criada com sucesso.
- Registro criado em `public.df_empresas`.
- Vinculo inicial criado em `public.df_usuarios_empresas`.
- Vinculo inicial criado com `perfil = 'admin'`.

Usuario master usado na validacao:

```text
user_id: c25b3f23-84cf-4651-9162-4ba8a07947e5
email: bugaohfc@gmail.com
```

## Checklist de regressao

- Usuario master consegue criar empresa.
- Usuario sem perfil master recebe `403`.
- Nome vazio nao cria empresa.
- Nome duplicado nao cria empresa.
- Empresa criada aparece em `df_empresas`.
- Vinculo inicial aparece em `df_usuarios_empresas`.
- Vinculo inicial fica com `perfil = 'admin'`.
- Falha no vinculo nao deixa empresa orfa.
- CORS continua funcionando.
- Frontend exibe mensagem segura e generica em caso de erro.
