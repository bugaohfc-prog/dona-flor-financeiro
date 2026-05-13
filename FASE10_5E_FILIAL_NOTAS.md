# FASE 10.5E — FILIAL EM NOTAS

```sql
alter table public.df_notas
add column if not exists filial_id uuid references public.df_filiais(id) on delete set null;

create index if not exists idx_df_notas_filial_id
on public.df_notas(filial_id);
```
