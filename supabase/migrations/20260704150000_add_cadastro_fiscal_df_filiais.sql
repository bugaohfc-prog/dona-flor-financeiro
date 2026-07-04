alter table public.df_filiais
  add column if not exists razao_social text,
  add column if not exists nome_fantasia text,
  add column if not exists cnpj text,
  add column if not exists inscricao_estadual text,
  add column if not exists endereco text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists uf text,
  add column if not exists cep text,
  add column if not exists telefone text,
  add column if not exists email text,
  add column if not exists updated_at timestamptz;

comment on column public.df_filiais.razao_social is 'Razao social da unidade fiscal/operacional.';
comment on column public.df_filiais.nome_fantasia is 'Nome fantasia da unidade fiscal/operacional.';
comment on column public.df_filiais.cnpj is 'CNPJ da unidade fiscal/operacional.';
comment on column public.df_filiais.inscricao_estadual is 'Inscricao estadual da unidade fiscal/operacional.';
comment on column public.df_filiais.endereco is 'Logradouro da unidade fiscal/operacional.';
comment on column public.df_filiais.numero is 'Numero do endereco da unidade fiscal/operacional.';
comment on column public.df_filiais.complemento is 'Complemento do endereco da unidade fiscal/operacional.';
comment on column public.df_filiais.bairro is 'Bairro da unidade fiscal/operacional.';
comment on column public.df_filiais.cidade is 'Cidade da unidade fiscal/operacional.';
comment on column public.df_filiais.uf is 'UF da unidade fiscal/operacional.';
comment on column public.df_filiais.cep is 'CEP da unidade fiscal/operacional.';
comment on column public.df_filiais.telefone is 'Telefone institucional da unidade fiscal/operacional.';
comment on column public.df_filiais.email is 'E-mail institucional da unidade fiscal/operacional.';
comment on column public.df_filiais.updated_at is 'Data da ultima atualizacao cadastral da filial.';
