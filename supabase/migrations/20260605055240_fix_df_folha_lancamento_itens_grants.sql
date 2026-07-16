-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Fechamento de Folha: hardening de grants dos itens
--
-- Contexto:
-- - A migration inicial criou a tabela e concedeu SELECT/INSERT/UPDATE.
-- - No ambiente remoto, authenticated manteve grants extras herdados.
-- - Este ajuste remove grants indevidos e reaplica apenas o permitido.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_folha_lancamento_itens') is null then
    raise exception 'public.df_folha_lancamento_itens must exist before grant hardening';
  end if;
end $$;

revoke all on public.df_folha_lancamento_itens from public;
revoke all on public.df_folha_lancamento_itens from anon;
revoke all on public.df_folha_lancamento_itens from authenticated;
grant select, insert, update on public.df_folha_lancamento_itens to authenticated;

do $$
declare
  unexpected_grants text;
begin
  select string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type)
    into unexpected_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_folha_lancamento_itens'
    and (
      grantee = 'anon'
      or (
        grantee = 'authenticated'
        and privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
      )
    );

  if unexpected_grants is not null then
    raise exception 'Unexpected grants on df_folha_lancamento_itens: %', unexpected_grants;
  end if;
end $$;

commit;;
