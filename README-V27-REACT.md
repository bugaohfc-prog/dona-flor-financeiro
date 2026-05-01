# Dona Flor V27 React Base

Esta é a nova base do app em React + Vite.

## Por que esta versão existe

A versão antiga estava acumulando JavaScript dentro do `index.html`, causando:
- código aparecendo no fim da página;
- PDF imprimindo código;
- conflitos entre versões antigas;
- dificuldade de manutenção pelo celular.

A V27 separa tudo em componentes React.

## Arquivos principais

- `src/App.jsx` — estado principal do sistema
- `src/components/Login.jsx`
- `src/components/Dashboard.jsx`
- `src/components/Notas.jsx`
- `src/components/Contas.jsx`
- `src/components/Relatorios.jsx`
- `src/lib/supabase.js`
- `src/styles.css`

## Importante

Não usa service-worker. Isso evita cache quebrado no celular.

## Configuração

No Vercel, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

A URL já está no `.env.example`. A chave deve ser a chave pública do Supabase.

## Deploy

1. Suba todos estes arquivos no GitHub.
2. No Vercel, ele detecta Vite automaticamente.
3. Build command: `npm run build`
4. Output directory: `dist`

