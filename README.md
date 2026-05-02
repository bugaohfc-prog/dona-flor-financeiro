# Dona Flor Financeiro - Correção Deploy Vercel

Este pacote foi ajustado para corrigir falhas de instalação/build no Vercel.

## Correções incluídas

- Node fixado em `20.x`
- NPM fixado em `10.x`
- `.nvmrc` criado
- `.npmrc` criado para evitar auditoria/fund no build
- `vercel.json` criado com build Vite
- Estrutura React + Vite mínima validada
- Supabase preparado via variáveis de ambiente

## Variáveis necessárias na Vercel

Configure em Project Settings > Environment Variables:

```text
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

## Comandos locais

```bash
npm install
npm run dev
npm run build
```

## Importante no Vercel

Ao fazer novo deploy, use:

- Redeploy
- Clear build cache

