# Resultado remoto - LGPD/Security storage - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Modo: diagnostico read-only, somente consultas SELECT.

## Resumo executivo

O diagnostico remoto nao encontrou buckets cadastrados no Supabase Storage e tambem nao encontrou objetos recentes. Portanto, nao ha exposicao imediata de anexos, documentos, laudos ou arquivos pessoais por buckets publicos neste momento.

Apesar disso, os grants de storage.buckets e storage.objects aparecem amplos para anon e authenticated. Como nao ha buckets nem policies de storage, o risco pratico atual e baixo, mas a configuracao deve ser revisada antes de qualquer funcionalidade futura de anexos.

## Achados por severidade

### Critico

Nenhum achado critico em Storage no estado atual, porque nao ha buckets nem objetos.

### Alto

Nenhum achado alto confirmado em Storage no estado atual.

### Medio

1. Grants amplos em storage.buckets e storage.objects.
   - Evidencia: anon e authenticated possuem SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES e TRIGGER em storage.buckets e storage.objects.
   - Impacto: sem buckets/policies/objetos o risco imediato e limitado, mas a superficie ficaria perigosa se um bucket fosse criado sem ciclo de RLS/policies.
   - Classificacao: ponto de atencao com risco futuro real.

### Baixo

1. Nenhum bucket cadastrado.
   - Evidencia: consulta storage.buckets retornou vazio.
   - Impacto: nao ha bucket publico nem privado a auditar neste momento.
   - Classificacao: sem risco imediato.

2. Nenhuma policy em storage.buckets ou storage.objects.
   - Evidencia: consulta pg_policies para schema storage retornou vazio.
   - Impacto: sem buckets, isso nao gera exposicao atual; para anexos futuros, sera obrigatorio criar policies especificas.
   - Classificacao: sem risco imediato, ponto de atencao para evolucao.

3. Nenhum objeto recente.
   - Evidencia: consulta storage.objects retornou vazio.
   - Impacto: nao ha indicio de documentos, laudos, anexos ou arquivos pessoais armazenados no Storage.
   - Classificacao: sem risco imediato.

## Resultados objetivos

- Buckets: nenhum.
- Buckets publicos: nenhum.
- Policies de storage.buckets/storage.objects: nenhuma.
- Objetos recentes: nenhum.
- Grants anon/authenticated em storage: amplos em buckets e objects.

## Recomendacoes

### Agora

1. Nao corrigir Storage neste ciclo, pois nao ha bucket nem dado exposto.
2. Registrar que qualquer funcionalidade futura de anexos deve abrir ciclo proprio de Storage/RLS.

### Depois

1. Antes de criar buckets, definir modelo privado por empresa_id/tenant e policies por usuario/empresa.
2. Revogar grants desnecessarios em storage.buckets/storage.objects no mesmo ciclo em que policies reais forem definidas.
3. Proibir anexos medicos, laudos, CID, diagnosticos e documentos pessoais em fluxos que nao tenham base legal e politica clara.

### Nao mexer agora

1. Nao criar bucket.
2. Nao criar policy de Storage.
3. Nao alterar grants de Storage isoladamente sem testar funcionalidades futuras que dependam do Storage.

## Proximo ciclo mais seguro

Manter Storage fora do proximo ciclo imediato. O proximo ciclo mais seguro deve focar no hardening de grants/policies legadas do schema public, especialmente public.contas e grants anon/authenticated amplos.
