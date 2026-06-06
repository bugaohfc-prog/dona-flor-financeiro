-- Hardening minimo da tabela public.df_push_tokens.
-- Contexto:
-- - Push nao esta configurado no produto atual;
-- - nao foi localizado uso direto da tabela no frontend/services/hooks;
-- - a tabela esta vazia no ambiente remoto validado;
-- - a coluna token e potencialmente sensivel;
-- - anon/authenticated tinham grants amplos e policies com role public.

begin;

alter table public.df_push_tokens enable row level security;
alter table public.df_push_tokens force row level security;

drop policy if exists df_push_tokens_delete on public.df_push_tokens;
drop policy if exists df_push_tokens_insert on public.df_push_tokens;
drop policy if exists df_push_tokens_select on public.df_push_tokens;
drop policy if exists df_push_tokens_update on public.df_push_tokens;

revoke all privileges on table public.df_push_tokens from anon;
revoke all privileges on table public.df_push_tokens from authenticated;

commit;
