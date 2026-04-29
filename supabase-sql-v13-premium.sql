-- DONA FLOR V13 PREMIUM - SUPABASE
-- Rode no Supabase SQL Editor. Se aparecer aviso, clique em "Executar sem RLS".

drop table if exists public.df_notas cascade;
drop table if exists public.df_contas cascade;
drop table if exists public.df_usuarios cascade;

create extension if not exists pgcrypto;

create table public.df_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text not null unique,
  senha text not null,
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

alter table public.df_usuarios disable row level security;
alter table public.df_contas disable row level security;
alter table public.df_notas disable row level security;

insert into public.df_usuarios (nome, usuario, senha, tipo, loja, pode_pagar, ativo)
values 
('Administrador', 'admin', 'admin123', 'admin', null, true, true),
('Hindeburg', 'hindeburg', '123456', 'admin', null, true, true);

select nome, usuario, senha, tipo, loja, pode_pagar, ativo from public.df_usuarios;
