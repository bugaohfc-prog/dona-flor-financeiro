# FASE 10.1 — RLS Ready Preparation

Esta fase prepara o banco e o app para RLS, sem ativar RLS ainda.

## O que entrou

- Função `df_usuario_is_master()` para identificar usuário master.
- Função `df_usuario_tem_empresa(empresa_id)` para policies futuras.
- Índices tenant-aware para performance.
- Foreign keys `NOT VALID` para criar guardrails sem quebrar dados legados.
- Auditoria para detectar registros sem `empresa_id`.
- Limpeza dos duplicados mortos fora de `src/` reaplicada.

## O que NÃO entrou

- RLS não foi ativado.
- Policies não foram criadas.
- Visual não foi alterado.
- Fluxos de CRUD não foram reescritos.

## Validação no app

Validar:
- login;
- dashboard;
- contas;
- notas;
- centros de custo;
- usuários;
- configurações;
- console sem erros.

## Validação no SQL

Ao rodar o script SQL, o bloco final deve retornar `total_sem_empresa = 0` nas tabelas principais.
Se aparecer valor maior que zero, corrigir antes de ativar RLS em fase futura.
