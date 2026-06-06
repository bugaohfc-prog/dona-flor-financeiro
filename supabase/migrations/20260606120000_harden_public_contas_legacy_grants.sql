-- Hardening minimo da tabela legada public.contas.
-- Contexto:
-- - public.contas nao e consumida pelo frontend atual;
-- - a tabela esta vazia no ambiente remoto validado;
-- - a policy anterior era ALL/true para public;
-- - anon/authenticated tinham grants amplos, incluindo DELETE/TRUNCATE/TRIGGER.

begin;

alter table public.contas enable row level security;
alter table public.contas force row level security;

drop policy if exists "Permitir tudo" on public.contas;

revoke all privileges on table public.contas from anon;
revoke all privileges on table public.contas from authenticated;

commit;
