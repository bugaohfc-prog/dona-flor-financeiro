# Fase 2 - planejamento do PDF Compras Internas / Vales

Data: 2026-07-02

## Resumo executivo

Esta fase planeja tecnicamente o relatório `Compras Internas / Vales por Colaborador`, sem implementar endpoint, PDF, rota V2, UI ou alteração de banco.

Decisão obrigatória: o PDF deve ser gerado via backend/endpoint. O frontend deve apenas solicitar o relatório e receber o arquivo final. Não gerar PDF massivo no frontend.

## Objetivo da Fase 2

Criar, em ciclo futuro, um relatório PDF detalhado por colaborador com os itens de `compras_vales` de uma competência, preservando a V1 e usando os contratos reais já mapeados em `docs/gestao-pessoas/fase-0-5-contratos-api-json.md`.

## Escopo inicial

Relatório: `Compras Internas / Vales por Colaborador`.

Filtros:

- `empresa_id` obrigatório;
- `competencia` obrigatória no formato `YYYY-MM`;
- `colaborador_id` opcional;
- `incluir_arquivados` opcional, padrão `false`.

Dados incluídos:

- empresa;
- competência;
- data/hora de geração;
- colaboradores com itens de compras/vales;
- itens detalhados de compras/vales;
- total por colaborador;
- total geral;
- quantidade de colaboradores;
- quantidade de itens.

## Fora de escopo

- Implementar endpoint.
- Implementar PDF.
- Criar rota V2.
- Alterar UI.
- Alterar services/hooks.
- Alterar regra de folha.
- Alterar banco, migration, RLS, policies, functions ou grants.
- Incluir CPF no PDF inicial.
- Incluir comprovantes, anexos, base64, links, documentos ou dados sensíveis.
- Resolver fornecedor/estabelecimento sem campo formal.
- Recalcular ou corrigir dados antigos.

## Contrato de entrada

Contrato lógico recomendado para o endpoint futuro:

```json
{
  "empresa_id": "uuid",
  "competencia": "YYYY-MM",
  "colaborador_id": "uuid opcional",
  "incluir_arquivados": false
}
```

Regras:

- `empresa_id` deve vir da empresa ativa e ser validado contra o usuário autenticado.
- `competencia` deve resolver uma linha de `df_folha_competencias`.
- `colaborador_id`, quando informado, filtra `funcionario_id`.
- `incluir_arquivados` deve ser `false` por padrão.

## Contrato lógico de dados

Estrutura interna recomendada antes da renderização do PDF:

```json
{
  "empresa": {
    "id": "uuid",
    "nome": "texto",
    "cnpj": "texto mascarado opcional"
  },
  "competencia": "YYYY-MM",
  "data_hora_geracao": "timestamp ISO",
  "colaboradores": [
    {
      "funcionario_id": "uuid",
      "nome": "texto",
      "filial": "texto ou null",
      "itens": [
        {
          "lancamento_id": "uuid",
          "item_id": "uuid",
          "data_referencia": "YYYY-MM-DD ou null",
          "descricao": "texto",
          "quantidade": "numero ou null",
          "valor_unitario": "numero ou null",
          "valor_total": "numero",
          "observacao": "texto sanitizado opcional"
        }
      ],
      "total_colaborador": "numero"
    }
  ],
  "total_geral": "numero",
  "quantidade_colaboradores": "numero",
  "quantidade_itens": "numero"
}
```

Observações:

- `valor_unitario` não existe hoje como campo próprio. No PDF inicial deve ficar vazio, igual ao total do item quando fizer sentido visual, ou ser omitido se a decisão de layout preferir evitar ambiguidade.
- `cnpj` só deve entrar se já estiver disponível e permitido no backend; não é requisito de aceite inicial.
- `observacao` deve ser sanitizada, curta e opcional.

## Regra de filtros

1. Resolver a competência por `empresa_id` + `competencia`.
2. Buscar lançamentos de folha da competência com:
   - `categoria = 'compras_vales'`;
   - `natureza = 'desconto'`;
   - `arquivado = false`, salvo `incluir_arquivados = true`.
3. Buscar itens detalhados vinculados aos lançamentos encontrados em `df_folha_lancamento_itens` com:
   - mesmo `empresa_id`;
   - mesmo `competencia_id`;
   - mesma `categoria = 'compras_vales'`;
   - `arquivado = false`, salvo opção explícita.
4. Se `colaborador_id` vier preenchido, filtrar por `funcionario_id`.
5. Agrupar por `funcionario_id`.

## Regra de arquivados

Padrão inicial: excluir arquivados.

Regras:

- `incluir_arquivados` deve ser `false` quando ausente.
- Se no futuro for permitido incluir arquivados, o PDF deve exibir aviso claro no cabeçalho.
- Não misturar ativos e arquivados sem indicação visual.
- Lançamento arquivado não deve entrar por padrão.
- Item arquivado não deve entrar por padrão.

## Regra de CPF

Decisão preliminar: CPF fora do PDF inicial.

Motivo:

- CPF existe no detalhe de funcionário, mas não aparece nos relatórios atuais de Gestão de Pessoas.
- O PDF de vales não precisa de CPF para fechar total por colaborador.
- Incluir CPF aumenta risco LGPD e deve exigir decisão própria, mascaramento e justificativa.

Se futuramente autorizado:

- usar CPF mascarado;
- documentar finalidade;
- validar perfil de acesso;
- evitar armazenar cópia do PDF com CPF em local público.

## Regra de soma

Regra oficial para o PDF inicial:

- somar apenas `df_folha_lancamento_itens.valor` dos itens ativos vinculados a lançamentos de `compras_vales`;
- não somar `df_folha_lancamentos.valor` junto com os itens;
- o lançamento pai deve servir para filtro, vínculo e validação, não para duplicar total.

Justificativa:

- o banco recalcula `df_folha_lancamentos.valor` pela soma dos itens ativos;
- somar pai + itens causaria duplicidade;
- a comparação com a V1 deve validar que a soma dos itens bate com o valor consolidado esperado.

Fallback para lançamento sem itens:

- não implementar fallback sem validação operacional;
- documentar como pendência se aparecer lançamento `compras_vales` sem item detalhado;
- se a regra futura aceitar fallback, ele deve entrar com seção separada: `Lançamentos sem itens detalhados`, para não misturar com itens reais.

## Layout do PDF

### Cabeçalho

- DNA Gestão.
- Empresa.
- Competência.
- Título: `Compras Internas / Vales por Colaborador`.
- Data/hora de geração.
- Aviso de filtro se `incluir_arquivados = true`.

### Bloco por colaborador

Para cada colaborador:

- nome do colaborador;
- filial, se disponível;
- tabela de itens:
  - data;
  - descrição;
  - quantidade;
  - valor unitário, se disponível/definido;
  - total do item;
  - observação sanitizada, se disponível;
- total do colaborador.

### Rodapé

- total geral;
- quantidade de colaboradores;
- quantidade de itens;
- paginação, se viável na biblioteca/backend escolhido.

## Validações de segurança

Antes de gerar:

- exigir usuário autenticado;
- validar `empresa_id`;
- validar que o usuário tem acesso à empresa;
- validar `competencia`;
- validar que a competência pertence à empresa;
- validar `colaborador_id`, quando informado, pertence à empresa;
- bloquear retorno cross-tenant;
- excluir arquivados por padrão;
- não expor CPF no PDF inicial;
- não incluir payload completo, observações longas, anexos, links, base64, documentos ou dados médicos.

Validações de integridade:

- nenhum item deve entrar sem `lancamento_id`;
- item deve pertencer ao lançamento filtrado;
- item e lançamento devem compartilhar `empresa_id`, `competencia_id`, `funcionario_id`, `filial_id` e `categoria`;
- total geral deve ser calculado a partir dos itens filtrados;
- total por colaborador deve somar apenas os itens do colaborador.

## Critérios de aceite

- Gerar para 1 colaborador.
- Gerar para todos os colaboradores de uma competência pequena.
- Gerar para uma competência real controlada.
- Total do PDF deve bater com total esperado da V1.
- Arquivados devem ficar fora por padrão.
- Item sem descrição deve aparecer com fallback claro, sem quebrar PDF.
- Colaborador sem filial deve aparecer sem quebrar PDF.
- PDF não pode travar navegador.
- PDF não pode expor dados de outra empresa.
- PDF não pode expor CPF no escopo inicial.
- Nenhum dado do banco deve ser alterado.
- V1 deve permanecer acessível e intacta.

## Riscos

- Duplicidade de soma entre lançamento pai e itens.
- Lançamento sem item detalhado ficar invisível se não houver regra de fallback.
- Item sem descrição reduzir utilidade do relatório.
- Observação livre conter texto sensível.
- Competência grande gerar PDF pesado.
- Divergência entre total da V1 e total do PDF.
- Inclusão acidental de arquivados.
- Vazamento cross-tenant se o endpoint não validar empresa/usuário.
- Inclusão indevida de CPF ou dados pessoais desnecessários.

## Rollback

Rollback operacional futuro:

- ocultar botão/link do PDF novo;
- manter relatório legado acessível;
- manter V1 intacta;
- não remover relatórios antigos;
- não apagar PDFs já gerados sem decisão administrativa documentada.

Rollback documental:

```bash
git revert <commit>
```

## Checklist para implementação futura

- Confirmar biblioteca/ambiente backend de geração PDF.
- Definir endpoint e método HTTP.
- Definir autenticação e autorização do endpoint.
- Resolver empresa e competência no backend.
- Buscar lançamentos `compras_vales`.
- Buscar itens detalhados vinculados.
- Resolver nomes de colaboradores e filiais.
- Montar totais por colaborador.
- Montar total geral.
- Comparar total com V1.
- Sanitizar observações.
- Excluir CPF.
- Excluir arquivados por padrão.
- Testar 1 colaborador.
- Testar competência pequena.
- Testar competência real controlada.
- Garantir rollback por ocultar link/botão.
