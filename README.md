# Dona Flor Financeiro

Correção aplicada para estabilizar deploy na Vercel.

## Importante

Este pacote remove a tentativa de forçar pnpm, porque o Vercel apresentou erro:

- ERR_INVALID_THIS
- ERR_PNPM_META_FETCH_FAIL

Agora o projeto volta para o fluxo padrão com npm, Node 18 e `.npmrc` com retries.

## Configuração na Vercel

Em Project Settings:

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Node.js Version: 18.x

Depois faça:

- Deployments
- Redeploy
- Marcar Clear Build Cache

## Arquivos que NÃO devem voltar

Não suba:

- vercel.json
- package-lock.json
- pnpm-lock.yaml
- node_modules
- dist
