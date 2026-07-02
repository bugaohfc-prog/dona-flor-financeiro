# Fase B - modo edição do colaborador na folha

Data: 2026-07-02

## Problema resolvido

O fluxo de compras internas/vales exigia lançar vários itens para a mesma pessoa, mas a tela trabalhava sempre como uma lista geral. O usuário precisava procurar a colaboradora novamente após operações, ou ficava preso em soluções pontuais sem saída clara.

## Novo modo Conferência geral

O modo `conferencia` permanece como visão principal:

- mostra todos os colaboradores/lançamentos conforme busca e filtro de arquivados;
- mantém a busca por colaborador criada na Fase A;
- mantém as ações existentes:
  - `+ lançamento`;
  - `+ itens`;
  - editar lançamento;
  - arquivar lançamento.

## Novo modo Edição do colaborador

Ao acionar `+ itens` em um lançamento, a tela entra em `edicao_colaborador`.

Nesse modo:

- aparece o cabeçalho `Editando lançamentos de: [nome]`;
- aparece o botão `Voltar para todos os colaboradores`;
- a lista mostra somente o colaborador selecionado;
- os lançamentos e itens daquele colaborador permanecem no contexto;
- adicionar item não retorna automaticamente para a lista geral;
- item incompleto mantém a validação no mesmo contexto.

## Comportamento antes

- A tela misturava conferência geral e edição de itens.
- `+ itens` abria painel, mas não criava modo explícito.
- Após reload de itens/lançamentos, o usuário podia se perder na lista geral.
- A tentativa anterior de filtrar colaborador ativo não tinha botão claro de retorno.

## Comportamento depois

- `+ itens` entra em modo de edição do colaborador.
- O colaborador permanece ativo até o usuário clicar em `Voltar para todos os colaboradores`.
- Salvar item limpa somente o formulário do próximo item.
- A busca por colaborador continua preservada para a conferência geral.
- Trocar empresa ou competência limpa o modo de edição para evitar contexto antigo.

## Estado criado/ajustado

Estados adicionados:

- `modoTelaFolha`
  - `conferencia`
  - `edicao_colaborador`
- `colaboradorEmEdicaoId`

Estados preservados:

- `buscaColaborador`
- `lancamentoItensAbertoId`
- `itemFormularioAbertoId`
- `formItem`

Renderização:

- no modo conferência, usa `gruposLancamentosFiltrados`;
- no modo edição, usa o grupo do `colaboradorEmEdicaoId`.

## Arquivos alterados

- `src/pages/FechamentoFolhaPage.jsx`
- `docs/folha/auditoria-redesenho-fechamento-folha.md`
- `docs/folha/fase-b-modo-edicao-colaborador.md`

## Checklist manual

1. Abrir `Folha / Fechamento`.
2. Ir em `Conferência / Lançamentos da competência`.
3. Buscar uma colaboradora.
4. Clicar em `+ itens`.
5. Confirmar que entra em modo `Edição do colaborador`.
6. Confirmar cabeçalho com nome da colaboradora.
7. Confirmar botão `Voltar para todos os colaboradores`.
8. Adicionar item.
9. Confirmar que permanece na colaboradora.
10. Adicionar segundo item.
11. Confirmar que ambos aparecem.
12. Clicar em `Voltar para todos os colaboradores`.
13. Confirmar que volta para a lista geral.
14. Testar busca depois de voltar.
15. Testar item incompleto.
16. Confirmar que não sai do modo edição indevidamente.

## Confirmações de segurança

- Banco: não alterado.
- RLS/policies/functions/grants: não alterados.
- Migration: não criada.
- Services/hooks: não alterados.
- Regra de cálculo da folha: não alterada.
- Valores, status, competência, funcionário, filial, categoria e natureza: não alterados.

## Próximo passo recomendado

Implementar a Fase C em ciclo separado: compactar visualmente os formulários de lançamento e itens sem alterar regras de cálculo.
