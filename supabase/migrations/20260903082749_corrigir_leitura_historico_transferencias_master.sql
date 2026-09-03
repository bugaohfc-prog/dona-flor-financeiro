begin;

drop policy if exists "df_func_transferencias_select_rh"
  on public.df_funcionarios_transferencias_filiais;

create policy "df_func_transferencias_select_rh"
on public.df_funcionarios_transferencias_filiais
for select
to authenticated
using (
  public.df_funcionarios_pode_escrever(empresa_id)
  or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
);

drop policy if exists "df_func_transferencias_retificacoes_select_rh"
  on public.df_funcionarios_transferencias_filiais_retificacoes;

create policy "df_func_transferencias_retificacoes_select_rh"
on public.df_funcionarios_transferencias_filiais_retificacoes
for select
to authenticated
using (
  public.df_funcionarios_pode_escrever(empresa_id)
  or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
);

commit;
