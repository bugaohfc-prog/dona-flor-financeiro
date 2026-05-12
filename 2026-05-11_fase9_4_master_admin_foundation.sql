-- =========================================
-- FASE 9.4 — MASTER ADMIN FOUNDATION
-- Dona Flor Financeiro
-- =========================================
-- OPCIONAL / SEGURO: rode apenas se quiser garantir colunas mínimas
-- na tabela df_usuarios_master já existente.

alter table df_usuarios_master
add column if not exists email text;

alter table df_usuarios_master
add column if not exists user_id uuid;

alter table df_usuarios_master
add column if not exists perfil text default 'master';

alter table df_usuarios_master
add column if not exists ativo boolean default true;

create index if not exists idx_df_usuarios_master_email
on df_usuarios_master(lower(email));

create index if not exists idx_df_usuarios_master_user_id
on df_usuarios_master(user_id);

-- Para transformar um usuário em master, use UM dos modelos abaixo:
-- update df_usuarios_master set ativo = true where email = 'email@exemplo.com';
-- insert into df_usuarios_master (email, perfil, ativo)
-- values ('email@exemplo.com', 'master', true);
