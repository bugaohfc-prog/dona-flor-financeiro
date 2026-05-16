# Dona Flor Financeiro — Auth Manual Provisioning 11.9.1

Este pacote corrige o fluxo de criação manual de usuários com e-mail + senha provisória.

## O que vem pronto

- `supabase/functions/criar-usuario-manual/index.ts`
- `supabase/functions/convidar-usuario/index.ts`
- `supabase/migrations/20260516011900_auth_manual_provisioning.sql`
- `supabase/config.toml`
- scripts de deploy em `scripts/`

## Você já rodou o SQL pelo Supabase SQL Editor?

Ótimo. Mesmo assim, a migration ficou versionada no ZIP para próximas instalações.

## Para publicar as Edge Functions

Abra o terminal dentro da pasta do projeto e rode um dos scripts:

### Windows PowerShell

```powershell
.\scripts\deploy-supabase-auth.ps1
```

### Windows CMD

```bat
scripts\deploy-supabase-auth.bat
```

## Informações necessárias

### PROJECT REF

Supabase > Project Settings > General > Reference ID

Ou pegue pela URL do projeto.

### SERVICE_ROLE_KEY

Supabase > Project Settings > API > service_role key

Nunca coloque essa chave no frontend nem no GitHub público.
Ela só será salva como secret da Edge Function no Supabase.

## Teste após deploy

1. Atualize o sistema no navegador.
2. Vá em Usuários.
3. Informe nome, e-mail, senha provisória e perfil.
4. Clique em Criar acesso manual.
5. Abra aba anônima e entre com e-mail + senha provisória.

## Se aparecer erro

- `Failed to send a request to the Edge Function`: a function ainda não foi publicada ou o projeto não foi linkado corretamente.
- `SUPABASE_SERVICE_ROLE_KEY`: a secret não foi configurada.
- `Apenas administradores...`: o usuário logado não está com perfil admin/master.
