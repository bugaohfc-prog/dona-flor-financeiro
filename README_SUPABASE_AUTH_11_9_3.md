# 11.9.3 — Auth Users List Sync

Este hotfix corrige a criação manual quando o usuário é criado no Auth, mas não aparece na tela **Usuários**.

## O que mudou

- Nova Edge Function `listar-usuarios-empresa` para listar vínculos usando Service Role com validação de admin.
- Fallback automático: se a listagem direta via RLS vier vazia, o frontend usa a Edge Function.
- Usuário criado aparece imediatamente na lista, antes mesmo do refresh silencioso.
- Empty state não fica exibindo vazio indevido após criação.

## Deploy obrigatório

Depois de subir o ZIP no GitHub/Vercel, publique a nova function no Supabase:

```bat
cd "C:\Users\choco\Downloads\dona-flor-financeiro-main\dona-flor-financeiro-main"
.\supabase.exe functions deploy listar-usuarios-empresa
.\supabase.exe functions deploy criar-usuario-manual
```

A secret já configurada como `SERVICE_ROLE_KEY` continua valendo.

## Validação

1. Entrar como Admin.
2. Abrir **Usuários**.
3. Criar usuário com e-mail novo.
4. Confirmar que o usuário aparece na lista sem precisar recarregar.
5. Clicar em **Atualizar** e confirmar que continua aparecendo.
