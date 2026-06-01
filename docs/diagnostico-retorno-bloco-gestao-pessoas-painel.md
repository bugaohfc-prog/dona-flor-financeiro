# Diagnóstico de Retorno do Bloco Gestão de Pessoas no Painel — DNA Gestão

## 1. Objetivo

Registrar se o bloco de Gestão de Pessoas do Painel está preparado para exibir corretamente os dados agregados já previstos pelo hook `useResumoGestaoPessoasPainel`, sem alterar código, banco, permissões, hooks ou services.

Este diagnóstico verifica principalmente:

- férias próximas;
- férias vencidas;
- aniversários;
- folha em aberto ou em revisão;
- funcionários ativos;
- comportamento de priorização e limite de itens no Painel.

Diretriz aplicada: consolidar antes de expandir.

## 2. Escopo do diagnóstico

Este ciclo foi apenas de consulta e documentação.

Não houve alteração em:

- frontend `src/`;
- hooks;
- services;
- banco de dados;
- RLS;
- permissões;
- rotas;
- menus;
- interface visual.

Também não foram criados dados simulados, SQL, migrations, policies, telas, rotas ou integrações.

## 3. Arquivos consultados

Foram consultados arquivos ligados ao hook, à renderização do Painel, aos services e às telas já existentes de Gestão de Pessoas:

- `src/hooks/useResumoGestaoPessoasPainel.js`;
- `src/components/dashboard/DashboardHome.jsx`;
- `src/services/funcionariosService.js`;
- `src/services/funcionariosFeriasService.js`;
- `src/services/folhaService.js`;
- `src/hooks/useFuncionarios.js`;
- `src/hooks/useFuncionariosFerias.js`;
- `src/hooks/useFolha.js`;
- `src/pages/FeriasPage.jsx`;
- `src/pages/RelatoriosFeriasPage.jsx`;
- `src/pages/RelatoriosPessoasPage.jsx`;
- `docs/contrato-use-resumo-gestao-pessoas-painel-v1.md`;
- `docs/diagnostico-dados-gestao-pessoas-painel.md`.

## 4. Contrato observado no hook

O hook `useResumoGestaoPessoasPainel` retorna a estrutura esperada para uso futuro ou atual no Painel:

```js
{
  loading,
  erro,
  podeVisualizar,
  resumo,
  alertas
}
```

O resumo vazio mantém formato estável:

```js
{
  funcionariosAtivos: 0,
  feriasProximas: 0,
  feriasVencidas: 0,
  folhaEmAberto: null,
  aniversariosSemana: 0
}
```

O hook retorna somente dados agregados e alertas resumidos. Não foi identificado retorno de CPF, salário, valores de folha, laudos, resultados de exames, documentos, anexos ou lista completa de funcionários.

## 5. Férias próximas

### Como o dado é identificado

O hook percorre funcionários ativos, consulta ciclos de férias e períodos relacionados, calcula o saldo disponível e usa `data_limite_gozo` para classificar ciclos com prazo próximo.

Uma férias próxima é considerada quando:

- o funcionário está ativo;
- o ciclo não está arquivado;
- existe saldo de dias;
- existe `data_limite_gozo`;
- o limite de gozo ainda não venceu;
- o limite está dentro da janela de até 30 dias.

### Fonte provável

- `funcionariosFeriasService.listarCiclosFerias`;
- `funcionariosFeriasService.listarPeriodosFerias`;
- `funcionariosFeriasService.calcularSaldoDiasFerias`.

### Conclusão

Férias próximas devem aparecer no bloco quando houver dados reais que atendam a essas condições.

Classificação: pronto com ressalva.

Ressalva: a V1 ainda pode fazer consultas por funcionário e ciclo. Isso é aceitável para a primeira versão, mas pode exigir otimização futura se a base crescer.

## 6. Férias vencidas

### Como o dado é identificado

O hook usa a mesma base de ciclos e períodos de férias. Um ciclo entra como férias vencidas quando:

- o funcionário está ativo;
- o ciclo não está arquivado;
- existe saldo de dias;
- existe `data_limite_gozo`;
- `data_limite_gozo` é anterior à data atual.

### Fonte provável

- `funcionariosFeriasService.listarCiclosFerias`;
- `funcionariosFeriasService.listarPeriodosFerias`;
- `funcionariosFeriasService.calcularSaldoDiasFerias`.

### Conclusão

Férias vencidas devem aparecer quando houver ciclo real vencido com saldo pendente.

Classificação: pronto.

Observação: se houver férias vencidas e férias próximas ao mesmo tempo, o Painel pode exibir apenas um item de férias por causa da deduplicação visual por tipo em `DashboardHome.jsx`. Isso evita excesso visual, mas pode ser revisto em ciclo futuro se o produto quiser separar férias vencidas e próximas como duas linhas simultâneas.

## 7. Aniversários

### Como o dado é identificado

O hook consulta funcionários ativos com `data_nascimento` e calcula a distância até o próximo aniversário.

O funcionário entra no contador de aniversários quando:

- está ativo;
- não está arquivado;
- possui `data_nascimento`;
- o aniversário ocorre hoje ou nos próximos 7 dias.

A regra considera a virada de ano, pois recalcula o aniversário no ano atual e avança para o ano seguinte quando a data já passou.

### Fonte provável

- consulta mínima de funcionários no hook, com `id`, `status`, `arquivado` e `data_nascimento`.

### Conclusão

Aniversários da semana devem aparecer quando houver funcionário ativo com aniversário hoje ou nos próximos 7 dias.

Classificação: pronto.

Risco LGPD: baixo a médio, desde que o Painel continue exibindo apenas contador agregado. O hook não retorna nome, CPF nem lista individual de aniversariantes.

## 8. Folha em aberto ou em revisão

### Como o dado é identificado

O hook consulta competências de folha e procura a primeira competência não arquivada com status operacional aberto.

Status considerados:

- `aberta`;
- `em_conferencia`.

O retorno esperado é agregado, com competência, status e rota de destino. Não há consulta de lançamentos individuais, valores, descontos, compras, vales, faltas ou pensão.

### Fonte provável

- tabela de competências de folha consultada pelo hook;
- `folhaService` confirma os status existentes usados pelo módulo.

### Conclusão

Folha em aberto ou em revisão deve aparecer quando houver competência real com status `aberta` ou `em_conferencia`.

Classificação: pronto.

Risco LGPD: controlado, pois o Painel não deve exibir valores nem detalhes por colaborador.

## 9. Funcionários ativos

### Como o dado é identificado

O hook conta funcionários ativos a partir de registros não arquivados com status `ativo`.

O dado é retornado apenas como número agregado.

### Fonte provável

- consulta mínima de funcionários no hook;
- lógica compatível com o módulo de funcionários.

### Conclusão

Funcionários ativos devem aparecer quando houver pelo menos um funcionário ativo e quando não forem substituídos por alertas mais prioritários no limite visual do bloco.

Classificação: pronto.

Observação: no Painel, funcionários ativos é informativo e tem prioridade menor que folha, férias e aniversários. Portanto, pode não aparecer se já houver três itens mais importantes.

## 10. Priorização e limite no Painel

O `DashboardHome.jsx` aplica uma camada visual própria sobre os alertas do hook.

Comportamentos observados:

- o bloco limita a exibição a até 3 itens;
- folha tem prioridade visual alta;
- férias aparecem antes de aniversários e funcionários;
- aniversários aparecem antes de funcionários ativos;
- funcionários ativos funciona como resumo informativo de baixa prioridade;
- há deduplicação por tipo para evitar excesso de linhas.

Essa regra está alinhada ao objetivo de manter o Painel compacto e operacional.

## 11. Pontos de atenção

1. A lógica de férias funciona, mas pode gerar consultas em cadeia por funcionário e ciclo.
2. A deduplicação visual por tipo impede que duas linhas de férias apareçam simultaneamente.
3. A validação definitiva depende de dados reais cadastrados pelos fluxos existentes do app.
4. O hook retorna dados agregados, mas qualquer evolução futura deve preservar o bloqueio de dados sensíveis.
5. O bloco não deve passar a exibir nomes, CPF, salários, laudos, documentos ou detalhes individuais sem novo planejamento.

## 12. Conclusão geral

O retorno atual está preparado para exibir os principais dados reais de Gestão de Pessoas no Painel:

- férias próximas;
- férias vencidas;
- aniversários da semana;
- folha em aberto ou em revisão;
- funcionários ativos.

Não foi identificado impedimento técnico direto para esses dados aparecerem quando existirem registros reais compatíveis.

O comportamento atual prioriza alertas e limita a exibição, o que preserva a proposta do Painel como Área de trabalho compacta.

## 13. Próximo passo recomendado

Próximo microciclo recomendado: criar dados reais de teste manualmente pelos fluxos existentes do app e validar visualmente o bloco.

Essa é a opção mais segura porque:

- não exige SQL;
- não cria dados simulados artificiais no código;
- valida o comportamento real do hook;
- confirma permissões e filtros com dados do próprio sistema;
- permite verificar se férias próximas, férias vencidas, aniversários, folha e funcionários ativos aparecem conforme esperado.

Após essa validação, se necessário, planejar um microciclo específico para ajustar a priorização visual ou otimizar a performance das consultas de férias.
