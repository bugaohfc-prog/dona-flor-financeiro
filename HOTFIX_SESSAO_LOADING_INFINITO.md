# Hotfix — Sessão e Loading Infinito

## Objetivo
Corrigir o travamento em `Carregando...` quando a sessão expira, fica inválida ou o Supabase demora para responder.

## Ajustes
- Validação de sessão com fallback de segurança.
- Tratamento de erro em `getSession()`.
- Limpeza completa de estado quando não existe sessão.
- Logout por inatividade agora limpa estados e volta para login.
- `carregandoAuth` sempre finaliza, mesmo com erro.

## Validação
- Build Vite executado com sucesso.
- Core financeiro, Auth, menu e notas preservados.
