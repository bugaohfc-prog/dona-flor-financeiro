-- V18.7.1 - Lixeira de Contas
-- Copie e rode no Supabase > SQL Editor antes/depois de subir a versão.

ALTER TABLE public.df_contas
ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT FALSE;

ALTER TABLE public.df_contas
ADD COLUMN IF NOT EXISTS data_exclusao TIMESTAMP;

-- Opcional: garantir campos da lixeira de notas, caso ainda não tenha rodado.
ALTER TABLE public.df_notas
ADD COLUMN IF NOT EXISTS deletado BOOLEAN DEFAULT FALSE;

ALTER TABLE public.df_notas
ADD COLUMN IF NOT EXISTS data_exclusao TIMESTAMP;

ALTER TABLE public.df_notas
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Normal';
