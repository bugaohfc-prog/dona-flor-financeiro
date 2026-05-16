# Fase 11.5.2 — Hotfix Supabase Schema + PDF Toast

## Objetivo
Corrigir os únicos pontos detectados no teste pós-deploy da 11.5.1:

- Erro ao salvar recorrência por ausência de `filial_id` em `df_contas_recorrentes` no schema cache do Supabase.
- Erro ao salvar nota por ausência de `filial_id` em `df_notas` no schema cache do Supabase.
- Toast falso de erro no PDF, apesar da tela de impressão abrir corretamente.

## Alterações aplicadas

### Supabase
Adicionado script idempotente:

`supabase/sql/2026-05-16_fase11_5_2_filial_schema_hotfix.sql`

O script adiciona `filial_id`, foreign keys e índices em:

- `df_notas`
- `df_contas_recorrentes`
- `df_contas`

Também limpa referências inválidas entre empresa e filial.

### Fallback defensivo no app
Mesmo antes da migration ser aplicada, o app agora tenta salvar novamente sem `filial_id` quando o Supabase retornar erro de coluna ausente/schema cache em:

- criação/edição de notas
- criação/edição de recorrências

### PDF
A impressão agora aguarda a renderização do iframe e evita disparar erro cedo demais. O erro só aparece se o documento realmente não renderizar ou a janela de impressão estiver indisponível.

## Validação recomendada

1. Rodar o SQL no Supabase.
2. Fazer deploy da versão 11.5.2.
3. Criar/editar uma nota com filial.
4. Criar/editar uma conta recorrente com filial.
5. Abrir PDF de relatório e confirmar que não aparece toast falso.
