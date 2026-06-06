-- Rollback do hardening minimo da tabela public.df_push_tokens.
-- Recria o estado remoto observado antes da migration de 2026-06-06.
-- Usar somente se uma funcionalidade futura/legada de Push depender explicitamente desta tabela.

begin;

alter table public.df_push_tokens enable row level security;
alter table public.df_push_tokens no force row level security;

grant select, insert, update, delete, truncate, references, trigger
on table public.df_push_tokens
to anon;

grant select, insert, update, delete, truncate, references, trigger
on table public.df_push_tokens
to authenticated;

drop policy if exists df_push_tokens_delete on public.df_push_tokens;
drop policy if exists df_push_tokens_insert on public.df_push_tokens;
drop policy if exists df_push_tokens_select on public.df_push_tokens;
drop policy if exists df_push_tokens_update on public.df_push_tokens;

create policy df_push_tokens_delete
on public.df_push_tokens
as permissive
for delete
to public
using (user_id = auth.uid());

create policy df_push_tokens_insert
on public.df_push_tokens
as permissive
for insert
to public
with check (user_id = auth.uid());

create policy df_push_tokens_select
on public.df_push_tokens
as permissive
for select
to public
using (user_id = auth.uid());

create policy df_push_tokens_update
on public.df_push_tokens
as permissive
for update
to public
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
