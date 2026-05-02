# Dona Flor Financeiro

Projeto React + Vite configurado para deploy na Vercel.

## Correção aplicada

- Forçado Node 20 via `.nvmrc` e `engines`
- Forçado pnpm via `packageManager`
- Forçado pnpm na Vercel via `vercel.json`
- Removido lock do npm (`package-lock.json`)
- Output configurado como `dist`

## Vercel

Depois de subir no Git:

1. Vá em Deployments
2. Clique em Redeploy
3. Marque Clear Build Cache

## Variáveis necessárias

Configure no Vercel:

```text
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

## Comandos locais

```bash
corepack enable
pnpm install
pnpm run build
```
