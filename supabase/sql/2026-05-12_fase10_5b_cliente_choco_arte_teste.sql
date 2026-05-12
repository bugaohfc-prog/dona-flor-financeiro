-- FASE 10.5B — CLIENTE TESTE CHOCO ARTE
-- Execute depois de criar o usuário no Supabase Auth.
-- Substitua o e-mail se usar outro usuário de teste.

-- 1) Conferir empresa Choco Arte
select id, nome
from public.df_empresas
where nome ilike 'Choco Arte';

-- 2) Conferir usuário criado no Auth
select id, email
from auth.users
where email = 'chocoarte@outlook.com';

-- 3) Vincular usuário APENAS à Choco Arte
insert into public.df_usuarios_empresas (
  user_id,
  empresa_id,
  perfil,
  email,
  nome
)
select
  u.id,
  e.id,
  'admin',
  u.email,
  'Administrador Choco Arte'
from auth.users u
cross join public.df_empresas e
where u.email = 'chocoarte@outlook.com'
  and e.nome ilike 'Choco Arte'
  and not exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.user_id = u.id
      and ue.empresa_id = e.id
  );

-- 4) Garantir que ele NÃO é master
-- Se houver registro, remova.
delete from public.df_usuarios_master
where lower(email) = lower('chocoarte@outlook.com');

-- 5) Validar acesso
select
  ue.email,
  ue.nome,
  ue.perfil,
  e.nome as empresa
from public.df_usuarios_empresas ue
join public.df_empresas e on e.id = ue.empresa_id
where lower(ue.email) = lower('chocoarte@outlook.com');
