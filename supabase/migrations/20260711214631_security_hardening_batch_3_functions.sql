begin;

alter function public.atualizar_data_modificacao() set search_path to 'public', 'pg_temp';
alter function public.login_usuario(text, text) set search_path to 'public', 'pg_temp';
alter function public.bloquear_exclusao_usuario_master() set search_path to 'public', 'pg_temp';
alter function public.df_contas_calcular_baixa_pagamento() set search_path to 'public', 'pg_temp';
alter function public.handle_new_user() set search_path to 'public', 'pg_temp';
alter function public.criar_usuario(text, text, text, text, text, text, boolean) set search_path to 'public', 'pg_temp';

revoke all on function public.bloquear_exclusao_usuario_master() from public, anon, authenticated;
revoke all on function public.df_contas_calcular_baixa_pagamento() from public, anon, authenticated;
revoke all on function public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa() from public, anon, authenticated;
revoke all on function public.df_funcionarios_ferias_periodos_validar_vinculos() from public, anon, authenticated;
revoke all on function public.df_funcionarios_validar_filial_empresa() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.atualizar_data_modificacao() from public, anon, authenticated;

revoke all on function public.login_usuario(text, text) from public, anon, authenticated;
revoke all on function public.df_empresas_do_usuario() from public, anon, authenticated;

commit;
