-- DONA FLOR V16 ALERTAS - SUPABASE
-- Rode no Supabase SQL Editor.
-- Se aparecer aviso, clique em "Executar sem RLS".

drop table if exists public.df_notas cascade;
drop table if exists public.df_contas cascade;
drop table if exists public.df_usuarios cascade;

drop function if exists public.login_usuario(text, text);
drop function if exists public.criar_usuario(text, text, text, text, text, boolean);

create extension if not exists pgcrypto;

create table public.df_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text not null unique,
  email text,
  senha_hash text not null,
  tipo text default 'admin',
  loja text,
  pode_pagar boolean default true,
  ativo boolean default true,
  criado_em timestamp default now()
);

create table public.df_contas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric not null,
  vencimento date not null,
  centro text not null,
  status text default 'Aberto',
  observacao text,
  criado_por text,
  criado_em timestamp default now()
);

create table public.df_notas (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  texto text,
  data_lembrete date,
  prioridade text default 'Normal',
  loja text,
  criado_por text,
  criado_em timestamp default now()
);

-- Função segura de login: compara senha com hash e NÃO retorna senha_hash
create or replace function public.login_usuario(p_usuario text, p_senha text)
returns table (
  id uuid,
  nome text,
  usuario text,
  email text,
  tipo text,
  loja text,
  pode_pagar boolean,
  ativo boolean
)
language sql
security definer
as $$
  select 
    u.id,
    u.nome,
    u.usuario,
    u.email,
    u.tipo,
    u.loja,
    u.pode_pagar,
    u.ativo
  from public.df_usuarios u
  where lower(u.usuario) = lower(p_usuario)
    and u.ativo = true
    and u.senha_hash = crypt(p_senha, u.senha_hash)
  limit 1;
$$;

-- Função para criar usuários com senha criptografada
create or replace function public.criar_usuario(
  p_nome text,
  p_usuario text,
  p_senha text,
  p_email text default null,
  p_tipo text default 'gerente',
  p_loja text default null,
  p_pode_pagar boolean default true
)
returns table (
  id uuid,
  nome text,
  usuario text,
  email text,
  tipo text,
  loja text,
  pode_pagar boolean,
  ativo boolean
)
language plpgsql
security definer
as $$
begin
  return query
  insert into public.df_usuarios (
    nome, usuario, email, senha_hash, tipo, loja, pode_pagar, ativo
  )
  values (
    p_nome,
    lower(p_usuario),
    p_email,
    crypt(p_senha, gen_salt('bf')),
    p_tipo,
    p_loja,
    p_pode_pagar,
    true
  )
  returning 
    df_usuarios.id,
    df_usuarios.nome,
    df_usuarios.usuario,
    df_usuarios.email,
    df_usuarios.tipo,
    df_usuarios.loja,
    df_usuarios.pode_pagar,
    df_usuarios.ativo;
end;
$$;

alter table public.df_usuarios disable row level security;
alter table public.df_contas disable row level security;
alter table public.df_notas disable row level security;

-- Usuários iniciais com senha criptografada
insert into public.df_usuarios (nome, usuario, email, senha_hash, tipo, loja, pode_pagar, ativo)
values 
('Administrador', 'admin', 'admin@donaflor.com', crypt('admin123', gen_salt('bf')), 'admin', null, true, true),
('Hindeburg', 'hindeburg', 'hindeburg@donaflor.com', crypt('123456', gen_salt('bf')), 'admin', null, true, true);

-- Teste visual: não mostra senha
select nome, usuario, email, tipo, loja, pode_pagar, ativo from public.df_usuarios;
