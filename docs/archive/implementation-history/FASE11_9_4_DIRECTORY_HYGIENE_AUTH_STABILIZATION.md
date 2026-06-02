# Fase 11.9.4 — Directory Hygiene + Auth Stabilization

## Objetivo
Limpar duplicidades criadas na raiz do projeto e manter a arquitetura do Dona Flor Financeiro organizada para evolução fullstack.

## Mantido como fonte oficial
- `src/` para aplicação React/Vite
- `src/services/` para serviços frontend
- `src/services/ai/` para engines IA
- `src/services/export/` para exportações
- `src/components/` para componentes
- `public/` para ícones/assets públicos
- `supabase/functions/` para Edge Functions
- `supabase/migrations/` e `supabase/sql/` para banco
- `scripts/` para deploy helper

## Removido da raiz
Foram removidas cópias antigas de componentes, serviços, CSS, SQL e assets que já existiam em suas pastas corretas. Isso evita confusão no Codex, manutenção e deploy.

## Auth
A listagem de usuários depende da Edge Function `listar-usuarios-empresa`. Após deploy desta versão, publicar:

```bat
.\supabase.exe functions deploy listar-usuarios-empresa
```

Ou usar:

```bat
scripts\deploy-supabase-auth.bat
```

## Secret usada
A Edge Function usa `SERVICE_ROLE_KEY`, pois a CLI atual não aceita secrets iniciadas com `SUPABASE_`.
