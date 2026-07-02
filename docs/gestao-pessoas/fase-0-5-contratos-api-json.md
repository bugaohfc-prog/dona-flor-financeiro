# Fase 0.5 - contratos API/JSON da Gestão de Pessoas

Data: 2026-07-02

## Resumo executivo

Esta Fase 0.5 mapeia os contratos reais usados hoje pela V1 de Gestão de Pessoas, Férias e Fechamento de Folha antes de qualquer implementação V2. A decisão oficial é seguir com Parallel Run: telas V2 futuras devem nascer em paralelo, com a V1 intacta, consumindo os mesmos formatos de dados e enviando payloads compatíveis com os serviços atuais.

Este ciclo foi somente diagnóstico e documentação. Não houve alteração funcional, banco, migration, RLS, policies, functions, grants, services, hooks ou regras de folha/férias.

Nota V2: esta frente passa a fazer parte do plano de virada controlada V2 documentado em `docs/projeto/plano-macro-v2-dna-gestao.md`. A V1 deve permanecer preservada enquanto a V2 nasce em paralelo.

## Motivo da Fase 0.5

A V2 não deve ser criada por suposição visual. O mapeamento evita:

- mockups desconectados dos dados reais;
- payloads incompatíveis com `folhaService`, `funcionariosService` e `funcionariosFeriasService`;
- divergência entre V1 e V2 durante Parallel Run;
- erro operacional em folha, especialmente horas extras, vales/compras e itens detalhados;
- PDF detalhado pesado sendo gerado no frontend.

## Referência externa - Revisão crítica Gemini

Arquivo lido: `C:\Users\choco\Downloads\Revisao_Critica_Plano_DNA_Gestao.md`.

Decisões incorporadas:

- a Fase 0.5 foi criada a partir da recomendação da revisão crítica anexada;
- não criar V2 por suposição;
- mapear contratos JSON antes de implementar;
- manter V1 intacta;
- usar Parallel Run;
- PDF detalhado deve ser backend/endpoint;
- escrita V2 só depois de leitura validada;
- Fase 4 deve ser dividida em 4a e 4b;
- rollback padrão deve ser ocultar link/feature toggle da V2.

## Documentos base

Documentos solicitados e encontrados:

- `docs/folha/auditoria-redesenho-fechamento-folha.md`

Documentos solicitados e não encontrados no repositório atual:

- `docs/gestao-pessoas/plano-implementacao-tecnico-funcional.md`
- `docs/gestao-pessoas/especificacao-consolidada-gestao-pessoas.md`
- `docs/gestao-pessoas/especificacao-visual-ux-gestao-pessoas.md`
- `docs/gestao-pessoas/fase-1-workspace-lancamentos-datagrid.md`

Documentos equivalentes consultados por existirem no histórico do projeto:

- `docs/rh/gestao-pessoas-funcionarios-estado-atual.md`
- `docs/rh/gestao-pessoas-ferias-estado-atual.md`
- `docs/rh/gestao-pessoas-ferias-planejamento.md`
- `docs/rh/gestao-pessoas-fechamento-folha-planejamento.md`
- `docs/rh/fechamento-folha-itens-detalhados.md`

## Arquivos auditados

Código:

- `src/services/funcionariosService.js`
- `src/services/funcionariosFeriasService.js`
- `src/services/funcionariosExamesPeriodicosService.js`
- `src/services/folhaService.js`
- `src/hooks/useFuncionarios.js`
- `src/hooks/useFuncionariosFerias.js`
- `src/hooks/useFuncionariosExamesPeriodicos.js`
- `src/hooks/useFolha.js`
- `src/pages/FuncionariosPage.jsx`
- `src/pages/FeriasPage.jsx`
- `src/pages/FechamentoFolhaPage.jsx`
- `src/pages/RelatoriosGestaoPessoasPage.jsx`
- `src/pages/RelatoriosPessoasPage.jsx`
- `src/pages/RelatoriosFeriasPage.jsx`

Schema versionado consultado somente por leitura:

- `supabase/migrations/20260524190000_create_df_funcionarios.sql`
- `supabase/migrations/20260525123000_create_df_funcionarios_ferias.sql`
- `supabase/migrations/20260526_create_df_folha_nucleo.sql`
- `supabase/migrations/20260605130000_create_df_folha_lancamento_itens.sql`

## Fluxos mapeados

- Funcionários: listar, obter detalhe, criar, editar, arquivar, reativar.
- Férias: listar ciclos, criar/editar/arquivar/reativar ciclo, listar períodos, criar/editar/arquivar/reativar período.
- Folha: listar competências, criar/editar/arquivar/reativar competência, listar lançamentos, listar itens, criar/editar/arquivar lançamento, criar/editar/arquivar item detalhado.
- Fechamento de Folha: agrupa lançamentos por funcionário, calcula resumo por colaborador, abre painel de itens e salva itens detalhados.
- Relatórios atuais: relatórios visuais internos de pessoas, férias e folha; sem PDF/Excel/CSV nesses relatórios de Gestão de Pessoas.

## Contratos de leitura atuais

### Funcionários

Arquivo/função:

- `src/services/funcionariosService.js`
- `listarFuncionarios`
- `obterFuncionarioPorId`

Origem:

- `public.df_funcionarios`

Campos de lista:

- `id`
- `empresa_id`
- `filial_id`
- `nome`
- `cargo`
- `data_nascimento`
- `data_admissao`
- `data_exame_admissional`
- `status`
- `arquivado`
- `arquivado_em`

Campos de detalhe:

- todos os campos de lista;
- `cpf`
- `telefone`
- `email`
- `observacoes`
- `created_at`
- `updated_at`

Filtros:

- sempre por `empresa_id`;
- `arquivado = false` quando `incluirArquivados` não está ativo;
- ordenação por `nome`.

Status:

- `ativo`
- `afastado`
- `desligado`

Campos usados na tela:

- nome, cargo, filial, status, datas, arquivamento e dados de contato quando em detalhe/formulário.

Campos necessários para relatórios futuros:

- manter `filial_id`, `cargo`, `status`, `data_admissao`, `data_exame_admissional` e `arquivado`;
- CPF, telefone, e-mail e observações exigem regra LGPD e mascaramento quando forem para relatórios/exportações.

### Férias

Arquivo/função:

- `src/services/funcionariosFeriasService.js`
- `listarCiclosFerias`
- `listarPeriodosFerias`
- `listarPeriodosFeriasAgenda`

Origens:

- `public.df_funcionarios_ferias_ciclos`
- `public.df_funcionarios_ferias_periodos`

Campos de ciclo:

- `id`
- `empresa_id`
- `funcionario_id`
- `periodo_aquisitivo_inicio`
- `periodo_aquisitivo_fim`
- `data_limite_gozo`
- `dias_direito`
- `status`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`

Campos de período:

- `id`
- `empresa_id`
- `ciclo_ferias_id`
- `funcionario_id`
- `data_inicio`
- `quantidade_dias`
- `data_fim_calculada`
- `data_retorno_trabalho`
- `numero_parcela`
- `status`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`

Status de ciclo:

- `pendente`
- `parcial`
- `agendada`
- `concluida`
- `vencida`
- `cancelada`

Status de período:

- `agendada`
- `concluida`
- `cancelada`

Campos necessários para relatório de férias:

- funcionário, ciclo, períodos ativos, saldo calculado, dias lançados, status calculado e data limite de gozo.

### Folha / Fechamento

Arquivo/função:

- `src/services/folhaService.js`
- `listarCompetenciasFolha`
- `listarLancamentosFolha`
- `listarItensLancamentosFolha`
- `calcularResumoFolhaCompetencia`

Origens:

- `public.df_folha_competencias`
- `public.df_folha_lancamentos`
- `public.df_folha_lancamento_itens`

Campos de competência:

- `id`
- `empresa_id`
- `competencia`
- `status`
- `observacao_administrativa`
- `fechado_em`
- `fechado_por`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`

Campos de lançamento:

- `id`
- `empresa_id`
- `competencia_id`
- `funcionario_id`
- `filial_id`
- `natureza`
- `categoria`
- `descricao`
- `data_referencia`
- `quantidade`
- `percentual`
- `valor`
- `observacao_administrativa`
- `origem_lancamento`
- `origem_id`
- `conferido`
- `conferido_em`
- `conferido_por`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`

Status de competência:

- `aberta`
- `em_conferencia`
- `validada`
- `enviada_contabilidade`
- `fechada`
- `arquivada`

Naturezas:

- `credito`
- `desconto`
- `informativo`

Categorias de crédito:

- `premiacao`
- `hora_extra_50`
- `hora_extra_60`
- `hora_extra_100`
- `outro_credito`

Categorias de desconto:

- `compras_vales`
- `plano_saude`
- `falta_injustificada`
- `pensao_alimenticia`
- `outro_desconto`

Categorias informativas:

- `observacao_administrativa`
- `data_falta`
- `status_conferencia`
- `origem_lancamento`

Totais/KPIs atuais:

- total de créditos ativos;
- total de descontos ativos;
- saldo informativo;
- quantidade de lançamentos;
- quantidade de arquivados;
- quantidade de itens detalhados em relatórios.

### Itens detalhados

Arquivo/função:

- `src/services/folhaService.js`
- `listarItensLancamentosFolha`

Origem:

- `public.df_folha_lancamento_itens`

Campos:

- `id`
- `empresa_id`
- `competencia_id`
- `lancamento_id`
- `funcionario_id`
- `filial_id`
- `categoria`
- `descricao`
- `data_referencia`
- `quantidade`
- `percentual`
- `valor_base`
- `valor`
- `observacao_administrativa`
- `origem_item`
- `conferido`
- `conferido_em`
- `conferido_por`
- `arquivado`
- `arquivado_em`
- `criado_em`
- `atualizado_em`

Vínculo:

- item pertence a um lançamento por `lancamento_id`;
- trigger versionado valida mesma `empresa_id`, `competencia_id`, `funcionario_id`, `filial_id` e `categoria`;
- soma de itens ativos recalcula `df_folha_lancamentos.valor`.

### Compras Internas / Vales

Identificação atual:

- categoria `compras_vales`;
- natureza `desconto`;
- valor obrigatório;
- pode ter itens detalhados;
- lançamento pai fica consolidado pelo valor recalculado dos itens.

Campos disponíveis:

- no lançamento: competência, funcionário, filial, descrição, data de referência, valor, observação administrativa;
- no item: descrição, data de referência, quantidade, valor, observação administrativa, origem.

Campos faltantes para PDF detalhado:

- não há campo específico de fornecedor/estabelecimento;
- não há tipo formal de vale/compra;
- observação existe, mas não deve ser usada como contrato principal sem sanitização;
- não há campo de comprovante/anexo e isso deve permanecer fora do PDF inicial.

Total atual:

- total por lançamento vem de `valor`;
- quando há itens detalhados, o banco recalcula o lançamento pela soma dos itens ativos.

### Horas Extras

Identificação atual:

- `hora_extra_50`
- `hora_extra_60`
- `hora_extra_100`

Contrato atual:

- natureza `credito`;
- itens detalhados aceitam `quantidade` e `percentual`;
- percentual esperado: 50, 60 ou 100 conforme categoria;
- `valor` do item é zerado no serviço atual para horas extras;
- `quantidade` é normalizada como número decimal não negativo.

Lacuna para parser futuro:

- a V1 aceita número, mas não define contrato textual para `4h20`, `4:20`, `0420` ou decimal;
- risco de interpretar `4.2` como 4,2 horas em vez de 4h20.

### Faltas

Identificação atual:

- categoria `falta_injustificada`;
- natureza `desconto`;
- também existe categoria informativa `data_falta`.

Contrato atual de item:

- exige `data_referencia`;
- exige `quantidade > 0`;
- zera `valor`;
- não há campos formais separados para data inicial/final, motivo ou justificativa.

### Feriados / horários especiais

Contrato atual:

- não foi encontrada categoria formal específica de feriado no contrato de folha atual;
- horários especiais não têm entidade própria nos services auditados;
- podem estar sendo tratados hoje como observação, outro crédito/desconto ou lançamento manual, o que não é contrato suficiente para V2.

### Premiações / outros créditos

Identificação:

- `premiacao`;
- `outro_credito`.

Contrato atual:

- natureza `credito`;
- `premiacao` pode calcular valor a partir de `valor_base * percentual / 100` nos itens;
- lançamento também aceita `valor`, `percentual`, `quantidade`, descrição e observação.

### Relatórios atuais

Relatórios de Gestão de Pessoas:

- `src/pages/RelatoriosGestaoPessoasPage.jsx`
- usa `useFuncionarios`, `useFolha`, `listarCiclosFerias`, `listarPeriodosFerias`, `listarExamesPeriodicos`;
- possui abas de visão geral, pessoas, férias e folha;
- folha carrega competências, lançamentos e itens ativos da competência selecionada;
- filtros locais: colaborador, categoria, natureza;
- sem exportação formal.

Relatórios de Pessoas:

- `src/pages/RelatoriosPessoasPage.jsx`
- usa `useFuncionarios` e `listarExamesPeriodicos`;
- consulta visual interna;
- sem PDF, Excel, CSV, impressão, anexos, laudos ou documentos.

Relatórios de Férias:

- `src/pages/RelatoriosFeriasPage.jsx`
- usa `useFuncionarios`, `listarCiclosFerias`, `listarPeriodosFerias`;
- calcula vencidas, a vencer, agendadas, concluídas e saldos;
- consulta visual interna;
- sem PDF, Excel, CSV, impressão ou integração financeira.

Exportações existentes fora de Gestão de Pessoas:

- Financeiro/Contas possui exportação e impressão via frontend em `src/utils/relatoriosContasExport.js` e `src/services/export/reportExportService.js`.
- Esse padrão não deve ser copiado para PDF detalhado de vales se o relatório puder ficar pesado.

## Contratos de escrita atuais

### Criar lançamento de folha

Fluxo:

- `FechamentoFolhaPage.salvarLancamento`
- `useFolha.criarLancamento`
- `folhaService.criarLancamentoFolha`
- `insert` em `df_folha_lancamentos`

Payload V1:

```json
{
  "competencia_id": "uuid",
  "funcionario_id": "uuid",
  "filial_id": "uuid ou null",
  "natureza": "credito|desconto|informativo",
  "categoria": "premiacao|hora_extra_50|hora_extra_60|hora_extra_100|outro_credito|compras_vales|plano_saude|falta_injustificada|pensao_alimenticia|outro_desconto|observacao_administrativa|data_falta|status_conferencia|origem_lancamento",
  "descricao": "texto ou null",
  "data_referencia": "YYYY-MM-DD ou null",
  "quantidade": "numero ou null",
  "percentual": "numero ou null",
  "valor": "numero ou null",
  "observacao_administrativa": "texto ou null"
}
```

Campos adicionados pelo service:

- `empresa_id`
- `conferido: false`
- `conferido_em: null`
- `arquivado: false`
- `arquivado_em: null`

Validações identificadas:

- empresa ativa obrigatória;
- competência obrigatória;
- funcionário obrigatório;
- natureza coerente com categoria;
- valor obrigatório para categorias financeiras;
- descrição obrigatória para `outro_credito` e `outro_desconto`;
- campos sensíveis proibidos no payload de folha.

Resposta:

- registro criado com `LANCAMENTO_SELECT`.

### Editar lançamento

Fluxo:

- `FechamentoFolhaPage.salvarLancamento`
- `useFolha.atualizarLancamento`
- `folhaService.atualizarLancamentoFolha`
- `update` em `df_folha_lancamentos` filtrado por `id` e `empresa_id`

Payload permitido:

- `natureza`
- `categoria`
- `descricao`
- `data_referencia`
- `quantidade`
- `percentual`
- `valor`
- `observacao_administrativa`
- `origem_lancamento`
- `origem_id`
- `conferido`
- `conferido_em`
- `arquivado`
- `arquivado_em`

Resposta:

- registro atualizado com `LANCAMENTO_SELECT`.

### Arquivar/remover lançamento

Fluxo:

- `useFolha.arquivarLancamento`
- `folhaService.arquivarLancamentoFolha`

Contrato:

```json
{
  "arquivado": true,
  "arquivado_em": "timestamp ISO"
}
```

É soft delete/archive. DELETE físico não é usado pela V1.

### Criar item detalhado

Fluxo:

- `FechamentoFolhaPage.salvarItemLancamento`
- `useFolha.criarItemLancamento`
- `folhaService.criarItemLancamentoFolha`
- `insert` em `df_folha_lancamento_itens`

Payload V1:

```json
{
  "competencia_id": "uuid",
  "lancamento_id": "uuid",
  "funcionario_id": "uuid",
  "filial_id": "uuid ou null",
  "categoria": "compras_vales|falta_injustificada|hora_extra_50|hora_extra_60|hora_extra_100|premiacao",
  "descricao": "texto ou null",
  "data_referencia": "YYYY-MM-DD ou null",
  "quantidade": "numero ou null",
  "percentual": "numero ou null",
  "valor_base": "numero ou null",
  "valor": "numero",
  "observacao_administrativa": "texto ou null",
  "origem_item": "texto ou null"
}
```

Campos adicionados pelo service:

- `empresa_id`
- `conferido: false`
- `conferido_em: null`
- `arquivado: false`
- `arquivado_em: null`

Regras por categoria:

- `compras_vales`: exige `valor > 0`; zera `percentual` e `valor_base`;
- `falta_injustificada`: exige `data_referencia` e `quantidade > 0`; zera `valor`;
- `hora_extra_*`: exige `quantidade > 0` e percentual esperado; zera `valor`;
- `premiacao`: exige `valor_base > 0` e `percentual > 0`; calcula `valor`.

Resposta:

- item criado com `LANCAMENTO_ITEM_SELECT`;
- hook recarrega lançamentos e itens.

### Editar/remover item detalhado

Editar:

- `useFolha.atualizarItemLancamento`
- `folhaService.atualizarItemLancamentoFolha`
- `update` filtrado por `id` e `empresa_id`

Arquivar:

```json
{
  "arquivado": true,
  "arquivado_em": "timestamp ISO"
}
```

É soft delete/archive. DELETE físico não é usado pela V1.

### Férias

Criar ciclo:

```json
{
  "periodo_aquisitivo_inicio": "YYYY-MM-DD",
  "periodo_aquisitivo_fim": "YYYY-MM-DD",
  "data_limite_gozo": "YYYY-MM-DD",
  "dias_direito": 30,
  "status": "pendente"
}
```

Campos adicionados:

- `empresa_id`
- `funcionario_id`
- `arquivado: false`
- `arquivado_em: null`

Criar período:

```json
{
  "data_inicio": "YYYY-MM-DD",
  "quantidade_dias": 10,
  "data_fim_calculada": "YYYY-MM-DD",
  "data_retorno_trabalho": "YYYY-MM-DD",
  "numero_parcela": 1,
  "status": "agendada"
}
```

Campos adicionados:

- `empresa_id`
- `ciclo_ferias_id`
- `funcionario_id`
- `arquivado: false`
- `arquivado_em: null`

Validações:

- datas obrigatórias e válidas;
- quantidade de dias positiva;
- parcela entre 1 e 3;
- saldo de férias validado contra períodos ativos;
- edição recalcula fim e retorno.

### Funcionários

Criar funcionário:

```json
{
  "nome": "texto obrigatório",
  "cpf": "11 dígitos ou null",
  "cargo": "texto ou null",
  "telefone": "texto ou null",
  "email": "email normalizado ou null",
  "data_nascimento": "YYYY-MM-DD ou null",
  "data_admissao": "YYYY-MM-DD ou null",
  "data_exame_admissional": "YYYY-MM-DD ou null",
  "status": "ativo|afastado|desligado",
  "observacoes": "texto ou null",
  "filial_id": "uuid ou null"
}
```

Campos adicionados:

- `empresa_id`
- `arquivado: false`
- `arquivado_em: null`

Editar funcionário:

- aceita subconjunto dos campos acima;
- não aceita `empresa_id` no payload.

Arquivar/reativar:

- atualiza `arquivado` e `arquivado_em`.

## Contratos necessários para V2

### Fase 1 - Central de Relatórios V2

Dados necessários:

- empresas/empresa ativa;
- competências de folha;
- colaboradores ativos e, opcionalmente, arquivados;
- tipos de relatório;
- filtros por competência, colaborador, filial, categoria e natureza;
- chamada inicial a relatórios legados visuais sem desligar V1.

Parâmetros mínimos:

```json
{
  "empresa_id": "uuid",
  "competencia_id": "uuid opcional",
  "colaborador_id": "uuid opcional",
  "tipo_relatorio": "folha_sintetica|itens_analiticos|ferias|pessoas",
  "incluir_arquivados": false
}
```

Critério: Fase 1 deve ser read-only e pode chamar dados atuais por hooks/services existentes.

### Fase 2 - PDF Compras Internas / Vales por Colaborador

Contrato de entrada sugerido:

```json
{
  "empresa_id": "uuid",
  "competencia": "YYYY-MM",
  "colaborador_id": "uuid opcional",
  "incluir_arquivados": false
}
```

Contrato de saída/dados:

```json
{
  "empresa": { "id": "uuid", "nome": "texto" },
  "competencia": "YYYY-MM",
  "colaboradores": [
    {
      "funcionario_id": "uuid",
      "nome": "texto",
      "cargo": "texto ou null",
      "filial_id": "uuid ou null",
      "filial_nome": "texto ou null",
      "itens": [
        {
          "lancamento_id": "uuid",
          "item_id": "uuid",
          "descricao": "texto",
          "data_referencia": "YYYY-MM-DD ou null",
          "valor": 0,
          "observacao_sanitizada": "texto curto opcional"
        }
      ],
      "total_colaborador": 0
    }
  ],
  "total_geral": 0,
  "gerado_em": "timestamp ISO"
}
```

Obrigatório: o PDF detalhado deve ser gerado via backend/endpoint. O frontend deve apenas solicitar e receber o arquivo final.

#### Checklist de prontidão - PDF Compras Internas / Vales

| Item | Classificação | Decisão/observação |
| --- | --- | --- |
| Identificação de compras/vales | Pronto | Usar `categoria = 'compras_vales'` e `natureza = 'desconto'` em `df_folha_lancamentos`; itens detalhados usam a mesma categoria em `df_folha_lancamento_itens`. |
| Origem dos itens | Pronto | A origem versionada é `public.df_folha_lancamento_itens`, lida por `listarItensLancamentosFolha`. |
| Vínculo item/lançamento | Pronto | Usar `lancamento_id`; trigger versionado valida `empresa_id`, `competencia_id`, `funcionario_id`, `filial_id` e `categoria` iguais ao lançamento pai. |
| Filtro por competência | Pronto | Usar `competencia_id` da competência selecionada ou resolver `competencia = YYYY-MM` para o respectivo registro de `df_folha_competencias`. |
| Filtro por colaborador | Pronto | Opcional por `funcionario_id`; quando ausente, agrupar todos os colaboradores da competência. |
| Arquivados | Precisa confirmar | Padrão recomendado: `incluir_arquivados = false`; incluir arquivados apenas se houver opção explícita e rótulo claro no PDF. |
| Empresa | Pronto | `empresa_id` é obrigatório no contrato; nome da empresa deve vir do contexto/consulta de empresas no backend. |
| Colaborador | Pronto | `funcionario_id` existe no lançamento e no item; nome/cargo vêm de `df_funcionarios`. |
| Cargo | Pronto | Campo `cargo` existe em `df_funcionarios` e já é usado em relatórios visuais. |
| CPF | Precisa confirmar | Campo existe no detalhe de funcionário, mas não aparece nos relatórios atuais. Recomendação inicial: não incluir CPF no PDF; se for obrigatório, mascarar e aprovar regra LGPD antes. |
| Filial | Pronto com complemento | `filial_id` existe no lançamento e item; `filial_nome` precisa ser resolvido via cadastro de filiais ou contexto equivalente. |
| Descrição do item | Pronto | Campo `descricao` existe no item. Se vazio, usar fallback visual controlado, sem inventar descrição fiscal. |
| Data do lançamento/item | Pronto | Usar `data_referencia` do item; se nula, pode exibir "Não informada" e opcionalmente mostrar data do lançamento pai como fallback, desde que documentado. |
| Quantidade | Pronto parcial | Campo `quantidade` existe, mas em `compras_vales` pode ser nulo. PDF deve aceitar vazio/1 implícito apenas como apresentação, sem alterar dado. |
| Valor unitário | Lacuna | Não há campo `valor_unitario`; para compras/vales o contrato atual guarda `valor` como total do item. Se `quantidade` for usada futuramente, será necessário definir regra de valor unitário. |
| Total do item | Pronto | Usar `df_folha_lancamento_itens.valor` para itens ativos de `compras_vales`. |
| Total por colaborador | Pronto com regra | Calcular pela soma de `valor` dos itens ativos de `compras_vales` do colaborador. Não somar também o valor do lançamento pai. |
| Total geral | Pronto com regra | Somar os totais por colaborador. Deve bater com a soma dos itens ativos e ser comparado com a V1. |
| Data/hora de geração | Pronto | Gerar no backend no momento de emissão. |
| Observação | Precisa confirmar | `observacao_administrativa` existe, mas deve ser sanitizada e, por padrão, não ser usada como campo principal do PDF. |
| Comprovantes/anexos | Fora do escopo inicial | Não há contrato atual e não devem entrar no PDF inicial. |
| Geração backend/endpoint | Pronto como decisão | Obrigatório para evitar travamento/memória no frontend. |

#### Lacunas específicas do PDF de vales

- Não existe `valor_unitario`; existe apenas `valor` total do item.
- Não existe tipo formal de compra/vale nem fornecedor/estabelecimento.
- `quantidade` pode não ser preenchida em compras/vales, então não pode ser requisito para total.
- `filial_nome` e nome da empresa não vêm diretamente do item e precisam ser resolvidos no backend.
- CPF existe no cadastro detalhado de funcionário, mas não é usado nos relatórios atuais e deve ficar fora do PDF inicial salvo decisão LGPD explícita.
- Observação administrativa pode conter texto livre; se entrar no PDF, precisa sanitização e limite de tamanho.

#### Riscos específicos do PDF de vales

- Duplicidade de soma se o relatório somar `df_folha_lancamentos.valor` e também os itens detalhados vinculados.
- Item sem descrição deixando o PDF pouco útil; usar fallback de categoria sem alterar o dado.
- Colaborador sem vínculo ou funcionário arquivado dificultando nome/cargo; backend deve tratar fallback e não quebrar geração.
- Lançamento ou item arquivado incluído indevidamente; padrão deve excluir arquivados.
- PDF pesado se gerado no frontend ou se uma competência grande for processada sem paginação/streaming no backend.
- Divergência entre total da V1 e total do PDF se a V2 usar regra diferente da soma de itens ativos.

#### Decisão preliminar de prontidão da Fase 2

A Fase 2 pode começar quando:

- origem dos itens estiver confirmada em `df_folha_lancamento_itens`;
- vínculo lançamento/item estiver confirmado por `lancamento_id`;
- filtro de compras/vales estiver confirmado por `categoria = 'compras_vales'` e `natureza = 'desconto'`;
- totais do PDF baterem com a V1 para uma competência pequena e uma competência real;
- regra de arquivados estiver definida, com padrão `incluir_arquivados = false`;
- geração estiver planejada em backend/endpoint, não no frontend;
- CPF estiver explicitamente fora do PDF inicial ou aprovado com mascaramento e regra LGPD.

Planejamento técnico da Fase 2: `docs/gestao-pessoas/fase-2-planejamento-pdf-vales.md`.

### Fase 3 - Workspace Read-Only

Abas e campos:

- Vales: funcionário, filial, lançamento, item, descrição, data, valor, status/arquivado.
- Faltas: funcionário, data, quantidade, descrição, status, vínculo com lançamento.
- Horas Extras: funcionário, categoria 50/60/100, quantidade, percentual, data, observação.
- Feriados: contrato ainda insuficiente; precisa definir categoria/campo formal antes de V2 robusta.
- Premiações: funcionário, valor base, percentual, valor calculado, descrição e data.

Comparação V1 x V2:

- total por competência;
- total por colaborador;
- total por categoria;
- quantidade de itens;
- saldo crédito - desconto.

### Fase 4a - Edição Inline Vales/Compras sem gravar

Estado local necessário:

- `linhaId`
- `lancamentoId`
- `funcionarioId`
- `draft.descricao`
- `draft.data_referencia`
- `draft.valor`
- `draft.observacao_administrativa`
- `statusValidacao`
- `dirty`

Sem chamada de gravação. A simulação deve validar localmente e comparar totais sem alterar banco.

### Fase 4b - Edição Inline Vales/Compras com API

Payload ideal de criação:

```json
{
  "competencia_id": "uuid",
  "lancamento_id": "uuid",
  "funcionario_id": "uuid",
  "filial_id": "uuid ou null",
  "categoria": "compras_vales",
  "descricao": "texto curto",
  "data_referencia": "YYYY-MM-DD ou null",
  "valor": 0,
  "observacao_administrativa": "texto curto ou null",
  "origem_item": "workspace_v2"
}
```

Payload ideal de edição:

```json
{
  "categoria": "compras_vales",
  "descricao": "texto curto",
  "data_referencia": "YYYY-MM-DD ou null",
  "valor": 0,
  "observacao_administrativa": "texto curto ou null",
  "origem_item": "workspace_v2"
}
```

Remoção/arquivamento:

```json
{
  "arquivado": true,
  "arquivado_em": "timestamp ISO"
}
```

Validações obrigatórias:

- bloquear duplo clique;
- validar empresa/competência/funcionário/lancamento;
- valor maior que zero;
- resposta deve retornar item atualizado e total refletido na V1.

### Fase 5 - Parser Horas Extras

Formatos visuais aceitos propostos:

- `4h20`
- `4:20`
- `4.5`
- `0420`
- `4,20`, se adotado com regra explícita

Formato normalizado recomendado:

- armazenar `quantidade` em decimal de horas somente após conversão inequívoca;
- exibir após salvo como `HH:MM` ou padrão escolhido.

Risco principal:

- gravar `4.2` como 4,2 horas quando a intenção era 4h20.

Obrigatório:

- validação frontend;
- validação backend futura;
- testes com entradas ambíguas.

## Lacunas encontradas

- PDF de vales precisa de filial nome, empresa nome e talvez cargo; esses dados não vêm diretamente no item.
- Compras/vales não têm fornecedor/tipo formal; usar observação como fonte primária é frágil.
- Feriados/horários especiais não têm categoria/entidade clara no contrato atual.
- Faltas não têm data inicial/final nem justificativa formal.
- Horas extras aceitam número, mas não têm contrato textual para formatos humanos.
- Relatórios de Gestão de Pessoas atuais são visuais e não têm contrato de exportação.
- Payloads de escrita estão no service, mas parte do pré-processamento ainda acontece na página.
- A soma de itens recalcula lançamento no banco; V2 deve tratar isso como regra existente e não recalcular de forma divergente.
- Campos sensíveis existem em funcionários e não devem entrar em PDF/exports sem política específica.

## Riscos

- Divergência entre V1 e V2 durante Parallel Run.
- Usuário editar V1 e V2 ao mesmo tempo.
- Duplo clique criando item duplicado.
- Decimal de hora extra interpretado errado.
- PDF pesado travando se gerado no frontend.
- Query pesada no banco para PDF com muitos itens.
- Inconsistência de totais financeiros se V2 recalcular diferente do banco.
- Manutenção dupla prolongada entre V1 e V2.
- Mockups V2 inúteis por falta de contrato real.

## Proteções recomendadas

- Feature toggle/link ocultável para V2.
- Read-only antes de escrita.
- Backend/endpoint para PDF detalhado.
- Validação duplicada frontend + backend em hora extra.
- Loading/disable em ações de salvar.
- Idempotência ou proteção contra duplo clique nas escritas futuras.
- Comparar totais V1 x V2 em toda fase read-only.
- Não desligar V1 antes de um ciclo mensal completo validado.
- Zero UPDATE/DELETE para adequar dados antigos.
- Não remover código legado antes da Fase 10.
- Fase 4 obrigatoriamente dividida em 4a e 4b.

## Critérios para liberar Fase 1

- Documento de contratos revisado.
- Central V2 read-only usando hooks/services existentes ou wrappers compatíveis.
- Nenhuma escrita.
- Nenhuma migration.
- V1 intacta.
- Link V2 ocultável por configuração/menu.
- Totais de relatórios legados comparáveis com V1.

## Critérios para liberar Fase 2

- Contrato backend/endpoint definido para PDF de vales.
- Dados necessários confirmados: empresa, competência, colaborador, filial, itens e totais.
- Identificação confirmada por `categoria = 'compras_vales'` e `natureza = 'desconto'`.
- Origem confirmada em `df_folha_lancamento_itens` com vínculo por `lancamento_id`.
- Total por colaborador calculado somente pela soma dos itens ativos, sem duplicar o lançamento pai.
- Regra de arquivados definida; padrão recomendado: excluir arquivados.
- Geração no backend, não no frontend.
- Sem payload sensível.
- CPF fora do PDF inicial, salvo aprovação explícita com mascaramento e justificativa LGPD.
- Teste com competência pequena antes de competência cheia.
- Comparação obrigatória entre total V1 e total do PDF antes de liberar para uso operacional.
- Rollback por ocultar link/ação da V2.

## Critérios para liberar fases de escrita

- Fase 3 read-only validada com totais V1 x V2.
- Fase 4a validada sem gravar.
- Payload 4b compatível com `criarItemLancamentoFolha` e `atualizarItemLancamentoFolha`.
- Bloqueio de duplo clique.
- Tratamento de concorrência entre V1 e V2 definido.
- Validação backend para horas extras antes de aceitar parser amplo.
- Plano de rollback por feature toggle e preservação dos dados já gravados.

## Rollback

Rollback documental:

```bash
git revert <commit>
```

Rollback operacional futuro da V2:

- ocultar link/feature toggle da V2;
- manter V1 ativa;
- não remover dados nem alterar contratos legados;
- não executar UPDATE/DELETE para adaptar histórico.
