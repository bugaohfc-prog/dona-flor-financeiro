# Auditoria e proposta de redesenho - Fechamento de Folha

Data: 2026-07-02

## Resumo executivo

A tela de Fechamento de Folha concentrou criação de competência, resumo, lançamento manual, conferência geral, edição de lançamentos e itens detalhados no mesmo componente e no mesmo fluxo visual. As correções pontuais em compras internas/vales não resolveram a operação porque tentaram ajustar sintomas locais, enquanto o problema real está na ausência de modos explícitos de trabalho.

Neste ciclo, a última correção problemática foi revertida por ter filtrado a tela para o colaborador ativo sem oferecer uma saída clara para voltar a todos os colaboradores. Não houve redesign implementado.

Referência complementar: o mapeamento de contratos API/JSON para a futura V2 de Gestão de Pessoas foi documentado em `docs/gestao-pessoas/fase-0-5-contratos-api-json.md`. Qualquer próxima fase V2 deve preservar a V1 em Parallel Run e consumir os contratos reais de `funcionariosService`, `funcionariosFeriasService` e `folhaService`.

## Por que os remendos anteriores não funcionaram

- `6a48ed95ee4fc9e1a026f28f1d4c87b3af7819ea`: manteve o formulário de item aberto e evitou apagar rascunho ao clicar novamente em `+ item`, mas não resolveu a perda de contexto operacional.
- `077a1a58ed12a3654d0a387995213c36e83172bc`: tentou reposicionar a tela por scroll/âncora após salvar, mas scroll não é estado de aplicação e não garante continuidade do fluxo.
- `72b490767c663f6cdf5132c355eb6d3f4cf2c153`: filtrou a renderização para o colaborador do lançamento aberto, mas criou um novo problema: a tela ficou presa no colaborador ativo sem botão claro para voltar à lista geral.

Conclusão: o fluxo precisa de redesenho controlado, com modo explícito de conferência geral e modo explícito de edição do colaborador.

## Problemas funcionais

- O usuário lança item para uma pessoa específica, mas a tela continua organizada como lista geral.
- Após salvar item, o recarregamento de lançamentos/itens muda o contexto visual e confunde a continuidade.
- Não existe fluxo claro para "continuar lançando itens para esta pessoa".
- O painel de itens depende da renderização da lista de lançamentos.
- O estado de edição de item é compartilhado globalmente por `formItem`, `itemFormularioAbertoId` e `itemEditandoId`.
- A ação `+ itens` abre/fecha o painel, mas não muda a tela para um modo operacional de edição.
- Validação de item incompleto acontece no mesmo formulário, mas a experiência ainda fica acoplada à lista geral.

## Problemas visuais

- A tela está pesada por combinar muitas responsabilidades.
- Há textos auxiliares longos e repetidos em áreas operacionais.
- A conferência em tabela exige muita varredura visual.
- Ações como `+ lançamento`, `+ itens`, `Editar lançamento` e `Arquivar lançamento` ficam próximas e competem por atenção.
- O formulário de lançamento manual ocupa muito espaço mesmo quando o usuário está apenas conferindo ou adicionando itens.
- Campos travados ou derivados têm textos explicativos extensos.
- O painel de itens aparece dentro da tabela/lista, o que torna a continuidade de lançamento pouco clara.

## Problemas de estado

Estados principais atuais em `src/pages/FechamentoFolhaPage.jsx`:

- `competenciaSelecionadaId`
- `formCompetencia`
- `formLancamento`
- `lancamentoEditandoId`
- `lancamentoItensAbertoId`
- `itemFormularioAbertoId`
- `itemEditandoId`
- `formItem`
- `mostrarArquivadas`
- `mostrarLancamentosArquivados`
- `secoesAbertas`
- `secoesFormularioLancamento`

Problemas:

- Lista geral e edição de item compartilham a mesma superfície visual.
- Não existe `colaboradorEmEdicaoId` explícito.
- Não existe `modoTela` para separar conferência e edição.
- `lancamentoItensAbertoId` indica painel aberto, mas não representa sozinho o modo de trabalho do usuário.
- O hook `useFolha` recarrega lançamentos e itens após salvar para refletir o recálculo do banco; esse reload é correto, mas a tela não reaplica uma experiência de edição estável.
- As keys atuais usam IDs estáveis (`grupo.funcionarioId`, `lancamento.id`, `item.id`), mas isso não resolve falta de modo de tela.

## Proposta de nova experiência

Separar a tela em dois modos explícitos.

### Modo 1 - Conferência geral

Objetivo: navegar e comparar colaboradores da competência.

Conteúdo:

- lista de colaboradores;
- busca por colaborador;
- filtro de arquivados;
- resumo por colaborador;
- ações agrupadas:
  - `+ lançamento`;
  - `Ver/editar itens`;
  - `Editar lançamento`;
  - `Arquivar`.

Regra:

- clicar em `Ver/editar itens` entra no modo de edição do colaborador.

### Modo 2 - Edição do colaborador

Objetivo: lançar e revisar itens de uma pessoa sem perder contexto.

Conteúdo:

- cabeçalho com "Editando lançamentos de: Nome do colaborador";
- botão claro `Voltar para todos os colaboradores`;
- lista de lançamentos daquele colaborador;
- painel de itens com lista visível;
- formulário de item abaixo da lista;
- formulário de novo lançamento quando necessário.

Depois de adicionar item:

- permanece no mesmo colaborador;
- mantém o lançamento ativo;
- mostra o item salvo;
- limpa apenas os campos do próximo item;
- não volta sozinho para a lista geral.

Saída do modo:

- somente por ação explícita: `Voltar para todos os colaboradores`, `Fechar`, `Cancelar` ou equivalente.

## Layout sugerido

Reduzir ou remover:

- textos auxiliares óbvios;
- descrições longas em campos travados;
- blocos explicativos dentro do fluxo repetitivo;
- campos grandes sem necessidade.

Compactar:

- Dados principais;
- Valores;
- Descrição;
- Itens.

Adicionar:

- busca por colaborador na conferência;
- indicador de modo ativo;
- botão `Voltar para todos`;
- painel de itens com lista e formulário próximos;
- ações agrupadas por intenção.

Texto sugerido para filial automática:

- `Filial automática pelo cadastro`

## Componentes sugeridos

Dividir futuramente `FechamentoFolhaPage` em:

- `FechamentoFolhaPage`
- `ConferenciaLancamentos`
- `LinhaColaboradorFolha`
- `PainelColaboradorFolha`
- `FormLancamentoFolha`
- `FormItemFolha`
- `ListaItensFolha`

Essa divisão deve vir depois da estabilização do fluxo, não como primeiro passo.

## Estados sugeridos

Estados futuros recomendados:

- `modoTela: 'conferencia' | 'edicao_colaborador'`
- `colaboradorEmEdicaoId`
- `lancamentoEmEdicaoId`
- `itemDraft`
- `buscaColaborador`
- `mostrarArquivados`

Evitar:

- depender de índice;
- depender de scroll/âncora como solução de estado;
- esconder lista geral sem botão explícito de volta;
- resetar contexto após reload;
- usar objeto antigo como fonte de verdade após recarregar dados.

## Regras que não podem mudar

- Não alterar cálculo da folha.
- Não alterar valor, status, competência, funcionário, filial, categoria ou natureza enviados ao banco.
- Não alterar tabelas, RLS, policies, functions ou grants.
- Não criar migration.
- Não misturar com Logs/Auditoria, Contas ou Performance Supabase.

## Plano de implementação em fases

### Fase A - Busca por colaborador

Baixo risco.

- adicionar `buscaColaborador` na conferência;
- filtrar visualmente grupos por nome/cargo;
- sem alterar salvamento.

Status em 2026-07-02: implementada em `src/pages/FechamentoFolhaPage.jsx` e documentada em `docs/folha/fase-a-busca-colaborador-conferencia.md`.

Escopo entregue:

- campo `Buscar colaborador...` na seção `Conferência / Lançamentos da competência`;
- filtro local em memória sobre os lançamentos já carregados;
- busca case-insensitive e sem acentos;
- mensagem para busca sem resultado;
- sem alteração de services/hooks, banco ou regra de folha.

### Fase B - Modo Edição do colaborador

Risco médio.

- adicionar `modoTela`;
- adicionar `colaboradorEmEdicaoId`;
- abrir edição do colaborador por ação explícita;
- adicionar `Voltar para todos os colaboradores`;
- manter o contexto após salvar item.

Status em 2026-07-02: implementada em `src/pages/FechamentoFolhaPage.jsx` e documentada em `docs/folha/fase-b-modo-edicao-colaborador.md`.

Escopo entregue:

- modo explícito `conferencia`;
- modo explícito `edicao_colaborador`;
- entrada no modo de edição ao abrir `+ itens`;
- cabeçalho compacto com o colaborador em edição;
- botão `Voltar para todos os colaboradores`;
- renderização restrita ao colaborador em edição sem depender de scroll ou âncora;
- busca preservada para retorno à conferência geral;
- sem alteração de services/hooks, banco ou regra de folha.

### Fase C - Formulários mais compactos

Risco médio.

- reduzir textos auxiliares;
- agrupar dados principais, valores, descrição e itens;
- deixar a área de itens mais direta.

### Fase D - Componentização

Risco maior.

- separar componentes após fluxo estabilizado;
- manter testes manuais por fase;
- evitar reescrever regras de negócio.

## Riscos

- Sem homologação, qualquer mudança visual ampla pode afetar a operação de folha em produção.
- Componentizar antes de estabilizar o fluxo pode aumentar o risco.
- Misturar redesenho com alteração de regra de cálculo dificultaria rollback.
- A tela atual já tem múltiplos estados acoplados; mudanças devem ser pequenas e verificáveis por fase.

## Rollback

Rollback Git do ciclo atual:

```bash
git revert <commit>
```

Rollback funcional recomendado em fases futuras:

- manter cada fase em commit próprio;
- se a experiência piorar, reverter a fase inteira;
- não fazer rollback via banco, pois o redesenho proposto deve ser apenas frontend/documentação.
