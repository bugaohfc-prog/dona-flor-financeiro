-- Rollback do hardening minimo da tabela legada public.contas.
-- Recria o estado remoto observado antes da migration de 2026-06-06.
-- Usar somente se algum consumidor legado depender explicitamente de public.contas.

begin;

alter table public.contas enable row level security;
alter table public.contas no force row level security;

grant select, insert, update, delete, truncate, references, trigger
on table public.contas
to anon;

grant select, insert, update, delete, truncate, references, trigger
on table public.contas
to authenticated;

drop policy if exists "Permitir tudo" on public.contas;

create policy "Permitir tudo"
on public.contas
as permissive
for all
to public
using (true)
with check (true);

commit;
