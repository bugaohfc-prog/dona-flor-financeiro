-- Hardening controlado de public.df_notas.
-- A tabela esta ativa no modulo Notas/Lixeira.
-- Mantem grants e policies atuais porque a exclusao definitiva ainda usa DELETE fisico
-- restrito a Admin/Master pela policy df_notas_delete_admin_master.

begin;

alter table public.df_notas enable row level security;
alter table public.df_notas force row level security;

commit;
