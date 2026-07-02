# Checklist de backup Supabase pré-V2

Data do checklist: 2026-07-02

## Projeto Supabase

Projeto identificado na documentação histórica:

- Nome operacional: `contas-donaflor`
- Project ref: `vyhjjtzdvofoqoericak`

Confirmar no Dashboard antes de qualquer dump real.

## Escopo que precisa ser salvo

- Schema completo.
- Dados das tabelas.
- RLS e policies.
- Functions SQL.
- Triggers.
- Grants.
- Edge Functions.
- Storage, se estiver em uso.
- Variáveis/secrets, sem expor valores.
- Configurações de Auth relevantes.
- Configurações de API exposta, se aplicável.

## Regra de segurança

Backups reais do banco não devem ser commitados no Git. Dumps podem conter dados financeiros, pessoais, e-mails, chaves indiretas, observações e informações sensíveis.

Guardar backups reais em local seguro fora do repositório, com acesso controlado.

## Opções de backup

### A) Dashboard Supabase

Uso recomendado para operador sem CLI configurada.

Checklist:

- abrir Supabase Dashboard;
- confirmar o project ref;
- localizar backups nativos disponíveis;
- gerar/exportar backup conforme recurso contratado;
- salvar arquivo fora do Git;
- registrar data/hora, responsável e local seguro do backup.

### B) Supabase CLI

Neste ciclo, `supabase --version` não respondeu no timeout e `where.exe supabase` não localizou a CLI no ambiente local. Portanto, disponibilidade local não confirmada.

Comando sugerido para ambiente com CLI autenticada, sem executar neste ciclo:

```bash
supabase db dump --project-ref vyhjjtzdvofoqoericak --file backups/supabase-pre-v2-2026-07-02.sql
```

O arquivo `backups/*.sql` deve ficar fora do Git ou em pasta ignorada, nunca commitado.

### C) pg_dump

Opção para acesso PostgreSQL seguro.

Comando conceitual, sem expor senha:

```bash
pg_dump "<DATABASE_URL_SEGURO>" --format=custom --file "supabase-pre-v2-2026-07-02.dump"
```

Usar apenas em máquina confiável e com credenciais tratadas como secret.

## Checklist de validação do backup

- Confirmar que o arquivo foi criado.
- Confirmar tamanho compatível com a base.
- Confirmar data/hora do backup.
- Confirmar que schema e dados foram incluídos.
- Confirmar que RLS, policies, functions, triggers e grants estão presentes.
- Confirmar Edge Functions separadamente no repositório ou via Dashboard.
- Confirmar que Storage foi tratado se existir.
- Confirmar que secrets foram inventariados sem revelar valores.
- Fazer teste de restauração em ambiente separado antes de depender do backup.

## Restauração em emergência

1. Pausar novas alterações.
2. Identificar commit Git correspondente ao backup.
3. Restaurar banco em ambiente seguro ou projeto novo.
4. Validar tabelas, RLS, funções, grants e dados.
5. Só apontar produção para restore após validação e autorização explícita.

## Riscos de backup incompleto

- Perda de dados financeiros reais.
- Perda de policies/RLS e abertura indevida de dados.
- Edge Functions sem secrets equivalentes.
- Storage fora do dump.
- Diferença entre schema restaurado e código em produção.
- Impossibilidade de reproduzir estado pré-V2.
