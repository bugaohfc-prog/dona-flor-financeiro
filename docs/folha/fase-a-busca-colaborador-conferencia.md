# Fase A - busca por colaborador na conferência da folha

Data: 2026-07-02

## Problema operacional

Na seção `Conferência / Lançamentos da competência`, a lista de colaboradores e lançamentos pode ficar extensa. Antes desta fase, o usuário precisava percorrer visualmente toda a lista para localizar uma pessoa e acionar `+ lançamento`, `+ itens`, editar ou arquivar.

## Solução implementada

Foi adicionado um campo de busca local por colaborador acima da lista/tabela de lançamentos.

Características:

- placeholder: `Buscar colaborador...`;
- filtro em memória, sem nova consulta ao banco;
- busca por nome/cargo do colaborador;
- comparação case-insensitive;
- comparação sem acentos;
- respeita a lista já carregada pela regra atual de `Mostrar arquivados`;
- mantém as ações existentes na lista filtrada.

## Comportamento antes

- A conferência sempre mostrava todos os grupos carregados.
- Não havia busca por colaborador.
- Para continuar uma operação, o usuário precisava localizar manualmente o colaborador na lista.

## Comportamento depois

- O usuário digita parte do nome do colaborador.
- A tela filtra os grupos já carregados.
- Ao limpar a busca, a lista completa volta.
- Se não houver resultado, a tela mostra: `Nenhum colaborador encontrado para essa busca.`
- As ações `+ lançamento`, `+ itens`, `Editar lançamento` e `Arquivar lançamento` continuam disponíveis no resultado filtrado.

## Arquivos alterados

- `src/pages/FechamentoFolhaPage.jsx`
- `docs/folha/auditoria-redesenho-fechamento-folha.md`
- `docs/folha/fase-a-busca-colaborador-conferencia.md`

## Checklist manual

1. Abrir `Folha / Fechamento`.
2. Ir em `Conferência / Lançamentos da competência`.
3. Digitar o nome de um colaborador.
4. Confirmar que a lista filtra corretamente.
5. Limpar a busca.
6. Confirmar que a lista completa volta.
7. Testar uma busca sem resultado.
8. Confirmar a mensagem `Nenhum colaborador encontrado para essa busca.`
9. Testar com `Mostrar arquivados` desligado.
10. Testar com `Mostrar arquivados` ligado.
11. Confirmar que `+ lançamento` funciona na lista filtrada.
12. Confirmar que `+ itens` funciona na lista filtrada.
13. Confirmar que editar/arquivar lançamento continuam funcionando.

## Confirmações

- Banco: não alterado.
- RLS/policies/functions/grants: não alterados.
- Migration: não criada.
- Services/hooks: não alterados.
- Regra de cálculo da folha: não alterada.
- Valores, status, competência, funcionário, filial, categoria e natureza: não alterados.

## Próximo passo recomendado

Implementar a Fase B em ciclo separado: modo explícito `Edição do colaborador`, com botão claro `Voltar para todos os colaboradores`.
