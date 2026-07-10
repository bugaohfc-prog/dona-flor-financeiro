# Dona Flor Financeiro

Sistema web de controle financeiro para empresas, com contas, notas, filiais, centros de custo, usuarios, permissoes, billing e dashboards operacionais.

## Requisitos

- Node.js 24
- npm
- Projeto Supabase configurado

## Configuracao local

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` com base no `.env.example`:

   ```bash
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
   ```

3. Rode o app em desenvolvimento:

   ```bash
   npm run dev
   ```

4. Gere o build de producao:

   ```bash
   npm run build
   ```

## Deploy

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: 24.x

O projeto usa `_redirects` para manter rotas de SPA funcionando em hospedagens como Netlify. Em Vercel, mantenha o preset Vite e configure as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do projeto.

## Estrutura

- `src/components`: componentes reutilizaveis de layout, dashboard, modais e feedback.
- `src/hooks`: regras de estado e operacoes de contas/notas.
- `src/pages`: telas principais da aplicacao.
- `src/services`: integracoes e acesso ao Supabase.
- `src/utils`: formatacao, datas e recorrencia.
- `supabase`: SQL e edge functions relacionadas ao backend.
- `docs/archive/implementation-history`: historico tecnico das fases antigas do projeto.

## Observacoes de producao

- Nao versionar `.env`, `node_modules` ou `dist`.
- Usar apenas chaves anonimas/publicas no frontend.
- Manter `SUPABASE_SERVICE_ROLE_KEY` somente em ambientes seguros de backend/edge functions.
