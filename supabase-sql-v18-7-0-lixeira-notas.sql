-- V18.7.0 - Campos para lixeira de notas
-- Rode apenas se a lixeira não funcionar por falta de coluna.
alter table public.df_notas add column if not exists deletado boolean default false;
alter table public.df_notas add column if not exists data_exclusao timestamp;
