# Resultado - Hardening controlado de public.df_notas - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Modo: hardening minimo com diagnostico antes/depois.

## Resumo executivo

`public.df_notas` e uma tabela ativa do modulo Notas. O diagnostico confirmou que o fluxo de Lixeira usa arquivamento/restauracao logica por `UPDATE`, mas a exclusao definitiva ainda usa `DELETE` fisico via `excluirNotaPermanentemente`.

Por isso, o ciclo nao removeu `DELETE`. A policy `df_notas_delete_admin_master` foi preservada porque ja esta restrita a `authenticated` com Admin/Master/perfis equivalentes e e necessaria para manter a exclusao definitiva da Lixeira.

O hardening aplicado foi minimo: manter RLS habilitada e habilitar `FORCE RLS`.

## Diagnostico antes

- Registros: 5.
- Registros sem `empresa_id`: 0.
- Registros excluidos logicamente: 3.
- Empresas distintas: 2.
- RLS: habilitada.
- FORCE RLS: desabilitado.
- Grants para `anon`: nenhum.
- Grants para `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Grants extras perigosos para `authenticated`: nenhum `TRUNCATE`, `REFERENCES` ou `TRIGGER`.
- Policies `ALL`: 0.
- Policies com role `public`/`anon`: 0.
- Policies `using true` / `with check true`: 0.
- Policy `DELETE`: 1, restrita a Admin/Master/perfis equivalentes.
- Trigger preservado: `trg_df_notas_auditoria_lixeira` em `UPDATE` e `DELETE`.

## Uso funcional confirmado no codigo

- Listagem ativa: `src/services/notasService.js` usa `df_notas` com `empresa_id` e `excluido = false`.
- Lixeira: `listarNotasLixeira` usa `excluido = true`.
- Envio para Lixeira: `enviarNotaParaLixeira` usa `UPDATE` logico.
- Restauracao: `restaurarNotaDaLixeira` usa `UPDATE` logico.
- Exclusao definitiva: `excluirNotaPermanentemente` usa `DELETE` fisico por `id` e `empresa_id`.
- UI da Lixeira: `src/App.jsx` chama exclusao definitiva somente pelo fluxo de Lixeira.

## Migration aplicada

Arquivo: `supabase/migrations/20260606133000_force_rls_df_notas.sql`

Acao aplicada:

```sql
alter table public.df_notas enable row level security;
alter table public.df_notas force row level security;
```

## Resultado depois

- RLS: habilitada.
- FORCE RLS: habilitado.
- Grants para `anon`: nenhum.
- Grants para `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Grants extras perigosos para `authenticated`: nenhum `TRUNCATE`, `REFERENCES` ou `TRIGGER`.
- Policies `ALL`: 0.
- Policies com role `public`/`anon`: 0.
- Policies `using true` / `with check true`: 0.
- Policy `DELETE`: mantida e restrita para preservar exclusao definitiva.
- Trigger de auditoria/lixeira: preservado.

## Observacao operacional

Durante a validacao do conector Supabase, uma chamada de conectividade com `SELECT 1` foi feita pela ferramenta de migration e ficou registrada no historico remoto como `diagnostic_noop_should_not_run`. Essa chamada nao alterou schema, dados, grants, policies, triggers ou RLS. Nao foi criado arquivo local para esse no-op e nenhum ajuste foi feito no historico remoto neste ciclo.

## Decisao sobre DELETE

`DELETE` foi mantido porque a exclusao definitiva da Lixeira ainda depende de DELETE fisico no service atual. A remocao quebraria o fluxo funcional de Admin/Master. O risco e mitigado por:

- ausencia de grant para `anon`;
- grant `DELETE` apenas para `authenticated`;
- policy `DELETE` sem role `public`;
- policy restrita a Admin/Master/perfis equivalentes;
- filtro funcional por `empresa_id`;
- trigger de auditoria/lixeira preservado.

## Riscos residuais

- `df_notas` contem campos livres (`titulo`, `texto`, `conteudo`) e pode receber informacao sensivel se o usuario registrar dados indevidos. Esse risco e de uso/payload, nao foi alterado neste ciclo.
- Exclusao definitiva fisica continua existindo por requisito funcional da Lixeira. Se futuramente o produto migrar para exclusao exclusivamente logica, abrir ciclo proprio para remover grant/policy DELETE.

## Rollback

Rollback disponivel em:

- `docs/security/rollback/rollback_df_notas_hardening_20260606.sql`

O rollback reverte apenas `FORCE RLS` e preserva RLS habilitada.
