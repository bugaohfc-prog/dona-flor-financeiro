# Dona Flor Financeiro — Auth Hotfix 11.9.2

## O que foi corrigido

- Edge Function `criar-usuario-manual` agora lê `SERVICE_ROLE_KEY` e também aceita fallback `SUPABASE_SERVICE_ROLE_KEY`.
- Scripts de deploy agora usam `SERVICE_ROLE_KEY`, compatível com a regra atual da Supabase CLI.
- Tela de usuários estabilizada para evitar o flicker do estado “Nenhum usuário cadastrado” enquanto o formulário é digitado.
- Mensagens de erro da Edge Function ficaram mais diagnósticas.

## Depois de subir no GitHub/Vercel

Como a Edge Function já foi publicada antes, rode novamente apenas para atualizar a versão da função:

```bat
cd "C:\Users\choco\Downloads\dona-flor-financeiro-main\dona-flor-financeiro-main"
.\supabase.exe functions deploy criar-usuario-manual
```

A secret correta é:

```bat
.\supabase.exe secrets set SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
```

## Validação

1. Atualize o sistema.
2. Vá em **Usuários**.
3. Digite no formulário e confirme que o empty state não pisca.
4. Clique em **Criar acesso manual**.
5. O usuário deve ser criado sem e-mail de convite.
