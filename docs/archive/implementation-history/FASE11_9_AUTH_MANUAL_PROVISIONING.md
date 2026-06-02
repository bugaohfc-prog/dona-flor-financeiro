# Fase 11.9 — Auth Manual Provisioning

## Objetivo

Criar fluxo de criação manual de usuários com e-mail + senha provisória, sem depender de envio de convite por e-mail.

## Implementado

- Campo de senha provisória na gestão de usuários.
- Botão “Criar acesso manual”.
- Edge Function `criar-usuario-manual` usando Service Role somente no servidor.
- Criação do usuário no Supabase Auth com `email_confirm: true`.
- Vínculo automático em `df_usuarios_empresas`.
- Upsert em `profiles` com nome do usuário.
- Fallback antigo de envio de link preservado como botão “Enviar link”.

## Segurança

A chave Service Role não é exposta no frontend. A criação administrativa ocorre exclusivamente via Edge Function e valida usuário autenticado + RPC `is_admin`.

## Observação operacional

Após criar o usuário, o administrador deve entregar e-mail e senha provisória por canal seguro. O usuário pode trocar a senha na área “Minha conta”.
