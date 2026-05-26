# Gestão de Pessoas — Planejamento de Férias

## Objetivo

A Gestão de Férias será uma evolução do módulo Gestão de Pessoas do DNA Gestão para apoiar pequenos negócios no controle operacional das férias dos colaboradores.

O objetivo é organizar ciclos de férias, parcelas gozadas, saldos, datas de retorno ao trabalho e situações pendentes ou vencidas, sempre respeitando empresa ativa, RLS, LGPD e isolamento multiempresa.

Este documento é apenas planejamento técnico e funcional. Não cria banco, tela, rota, service, hook, menu, relatório, exportação ou automação.

## Regras funcionais principais

A futura Gestão de Férias deve considerar:

- funcionário;
- empresa ativa;
- data de admissão;
- período aquisitivo;
- período concessivo;
- data limite para tirar férias;
- férias agendadas;
- férias concluídas ou gozadas;
- férias parceladas;
- saldo de dias;
- data de retorno ao trabalho;
- status da situação.

Conceito inicial de cálculo:

- o primeiro período aquisitivo começa na data de admissão;
- o período aquisitivo termina após 12 meses;
- o período concessivo ocorre após o fim do período aquisitivo;
- a data limite para tirar férias deve ser calculada a partir do fim do período aquisitivo;
- o sistema deve indicar férias pendentes, parciais, agendadas, vencidas ou concluídas.

Não implementar validações legais complexas sem ciclo próprio. Regras trabalhistas específicas devem ser tratadas em planejamento dedicado antes de virarem banco, RLS ou frontend.

## Sugestão automática de ciclo

A criação de ciclos de férias deve evitar digitação manual das datas críticas no fluxo normal.

Para o primeiro ciclo do funcionário:

- `periodo_aquisitivo_inicio = data_admissao`;
- `periodo_aquisitivo_fim = data_admissao + 1 ano - 1 dia`;
- `data_limite_gozo = periodo_aquisitivo_fim + 1 ano`.

Para ciclos seguintes:

- usar o histórico de ciclos já cadastrados;
- localizar o ciclo mais recente pelo `periodo_aquisitivo_fim`;
- sugerir `periodo_aquisitivo_inicio = dia seguinte ao último periodo_aquisitivo_fim`;
- calcular `periodo_aquisitivo_fim = novo início + 1 ano - 1 dia`;
- calcular `data_limite_gozo = periodo_aquisitivo_fim + 1 ano`.

Exemplo:

- data de admissão: `02/09/2024`;
- período aquisitivo início: `02/09/2024`;
- período aquisitivo fim: `01/09/2025`;
- data limite de gozo: `01/09/2026`.

Se o funcionário não tiver data de admissão, a tela deve orientar o usuário a corrigir o cadastro antes de criar o ciclo. Não criar ciclo com datas vazias.

O sistema também deve evitar, no frontend, criar ciclo com o mesmo `periodo_aquisitivo_inicio` e `periodo_aquisitivo_fim` já existente para o funcionário. Essa proteção visual não substitui validações futuras de banco, caso sejam necessárias.

## Cálculo de fim e retorno

Na futura tela de férias, o usuário não deve informar manualmente a data final nem a data de retorno ao trabalho.

O usuário informa:

- data de início das férias;
- quantidade de dias que o colaborador vai tirar.

O sistema calcula:

- `data_fim = data_inicio + quantidade_dias - 1 dia`;
- `data_retorno_trabalho = data_fim + 1 dia`.

Exemplo:

- início: `01/07/2026`;
- quantidade de dias: `14`;
- fim das férias: `14/07/2026`;
- retorno ao trabalho: `15/07/2026`.

A preferência inicial é que o cálculo seja automático a partir de `data_inicio` e `quantidade_dias`. Em ciclo futuro de banco, deve ser avaliado se `data_fim_calculada` e `data_retorno_trabalho` serão persistidas para auditoria operacional ou calculadas visualmente pela aplicação.

## Férias parceladas

A Gestão de Férias deve suportar férias parceladas sem exigir um campo manual obrigatório como "férias integrais ou parceladas".

O sistema deve entender a situação pelo número de dias lançados dentro do ciclo:

- se o colaborador tirar 30 dias de uma vez, o ciclo fica concluído;
- se tirar menos de 30 dias, o ciclo fica parcial, com saldo pendente;
- cada novo lançamento de férias dentro do mesmo ciclo consome parte do saldo;
- quando a soma dos períodos atingir 30 dias, o ciclo fica concluído;
- o sistema deve manter histórico de todas as parcelas.

Exemplo conceitual:

### Ciclo 2025/2026

Direito: 30 dias.

Parcela 1:

- início: `01/07/2026`;
- dias: `14`;
- fim calculado: `14/07/2026`;
- retorno calculado: `15/07/2026`;
- saldo restante: `16` dias;
- status do ciclo: parcial.

Parcela 2:

- início: `10/10/2026`;
- dias: `8`;
- fim calculado: `17/10/2026`;
- retorno calculado: `18/10/2026`;
- saldo restante: `8` dias;
- status do ciclo: parcial.

Parcela 3:

- início: `05/01/2027`;
- dias: `8`;
- fim calculado: `12/01/2027`;
- retorno calculado: `13/01/2027`;
- saldo restante: `0`;
- status do ciclo: concluído.

## Histórico de ciclos

A futura modelagem não deve ser apenas um campo único em `df_funcionarios`.

Deve existir histórico de ciclos e períodos gozados:

```text
Funcionário
├── Data de admissão
├── Ciclos de férias
│   ├── Ciclo 2025/2026
│   │   ├── período aquisitivo
│   │   ├── data limite de gozo
│   │   ├── saldo
│   │   ├── status
│   │   └── parcelas/períodos gozados
│   └── Ciclo 2026/2027
```

Esse histórico é importante para preservar rastreabilidade, permitir férias parceladas e evitar perda de informações ao longo dos anos.

## Dados necessários

Dados mínimos esperados para cálculo e operação:

- `empresa_id`;
- `funcionario_id`;
- `data_admissao`, a partir de `df_funcionarios`;
- período aquisitivo de cada ciclo;
- data limite de gozo;
- dias de direito;
- períodos ou parcelas de férias;
- quantidade de dias de cada parcela;
- status do ciclo;
- status da parcela;
- campos de arquivamento lógico.

Não guardar documentos, anexos, uploads, arquivos, laudos, informações médicas ou campos livres sensíveis nesta modelagem.

## Sugestão futura de status do ciclo

Status possíveis para ciclos de férias:

- `pendente`;
- `parcial`;
- `agendada`;
- `concluida`;
- `vencida`;
- `arquivada` ou `cancelada`, se necessário.

A nomenclatura final deve ser definida no ciclo de banco/RLS e refletida no frontend sem ampliar permissões.

## Sugestão futura de status do período

Status possíveis para períodos ou parcelas:

- `agendada`;
- `concluida`;
- `arquivada` ou `cancelada`, se necessário.

O status do período deve alimentar o status do ciclo e o saldo restante, sem depender de edição manual ampla.

## Sugestão futura de modelo de banco

Não implementar neste ciclo.

### Tabela 1 — ciclos de férias

Nome sugerido:

- `public.df_funcionarios_ferias_ciclos`

Campos possíveis:

- `id`;
- `empresa_id`;
- `funcionario_id`;
- `periodo_aquisitivo_inicio`;
- `periodo_aquisitivo_fim`;
- `data_limite_gozo`;
- `dias_direito`;
- `status`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

### Tabela 2 — períodos/parcelas de férias

Nome sugerido:

- `public.df_funcionarios_ferias_periodos`

Campos possíveis:

- `id`;
- `empresa_id`;
- `ciclo_ferias_id`;
- `funcionario_id`;
- `data_inicio`;
- `quantidade_dias`;
- `data_fim_calculada`;
- `data_retorno_trabalho`;
- `numero_parcela`;
- `status`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Observação:

- `data_fim_calculada` e `data_retorno_trabalho` podem ser calculadas pela aplicação.
- No ciclo de banco, avaliar se esses campos devem ser persistidos para auditoria operacional.
- A preferência inicial é que a aplicação sempre calcule automaticamente a partir de `data_inicio + quantidade_dias`.

## Regras de parcelamento

A implementação futura deve validar:

- não permitir somar mais de 30 dias no mesmo ciclo;
- controlar máximo de parcelas, se aplicável;
- controlar saldo restante;
- indicar quando o ciclo estiver parcial;
- indicar quando o ciclo estiver concluído;
- calcular número da parcela automaticamente;
- impedir lançamento sem empresa ativa;
- impedir lançamento sem funcionário;
- impedir lançamento fora do ciclo, se a regra futura exigir.

Não implementar validações legais complexas sem ciclo próprio de análise.

## Roadmap futuro: faltas e afastamentos

Faltas injustificadas e afastamentos pelo INSS devem ser tratados em ciclos próprios, porque podem impactar regras trabalhistas e exigem validação administrativa cuidadosa.

### Faltas injustificadas

Planejamento futuro:

- cruzar faltas injustificadas com o módulo futuro de Fechamento de Folha;
- permitir que o sistema sugira redução dos dias de direito do ciclo conforme regra trabalhista aplicável;
- manter cálculo auditável e revisável;
- não alterar automaticamente a data-base do período aquisitivo;
- não aplicar redução sem confirmação administrativa.

As faltas não devem ser implementadas como campo livre dentro do ciclo de férias. O desenho futuro deve considerar origem, competência, empresa ativa, funcionário, permissões, RLS e vínculo com fechamento de folha.

### Afastamentos pelo INSS

Planejamento futuro:

- registrar afastamentos apenas em ciclo próprio de banco/RLS/tela, se aprovado;
- considerar que afastamentos pelo INSS que somem mais de 6 meses dentro do período aquisitivo podem reiniciar o ciclo de férias;
- não reiniciar ciclo automaticamente sem confirmação administrativa ou orientação da contabilidade;
- evitar um seletor simples do tipo "altera ciclo: sim/não", pois isso pode induzir uso incorreto;
- preferir um bloco futuro chamado "Afastamentos que podem impactar férias".

Status futuro sugerido para análise:

- `sem_afastamento_registrado`;
- `em_analise_contabilidade`;
- `confirmado_reinicia_ciclo`;
- `confirmado_nao_altera_ciclo`.

Essas regras não devem criar documentos, laudos, anexos, informações médicas, CID, condição de saúde ou qualquer dado clínico. A implementação futura deve guardar somente dados trabalhistas estritamente necessários e seguir LGPD/RLS.

## Segurança e LGPD

A futura implementação deve:

- usar empresa ativa obrigatória;
- respeitar RLS;
- impedir vazamento entre empresas;
- validar que `funcionario_id` pertence à mesma `empresa_id`;
- não usar service role;
- não usar secrets no frontend;
- não guardar documentos;
- não guardar anexos;
- não guardar arquivos;
- não guardar informações médicas;
- não criar exportação sem ciclo próprio;
- não expor dados para Operador/Gerente sem permissão futura explícita;
- manter Admin/Master como regra conservadora inicial;
- não fazer DELETE físico;
- usar arquivamento lógico.

Qualquer ciclo futuro com banco, RLS, policies, service, hook, frontend, logs ou exportações de férias deve ser classificado como ALTÍSSIMO.

## Permissões

Regra conservadora inicial recomendada:

- Operador: sem acesso à Gestão de Férias;
- Gerente: sem acesso inicial, salvo decisão futura explícita;
- Admin: acesso e operação dentro da empresa ativa;
- Master: acesso e operação conforme regra já validada, sem cruzamento de tenants.

Não criar nova regra de permissão sem ciclo próprio. Não ampliar acesso por conveniência visual.

## Relatórios futuros

Relatórios futuros possíveis:

- férias vencidas;
- férias a vencer;
- férias agendadas;
- férias concluídas;
- férias parciais;
- saldo de dias por funcionário;
- retorno ao trabalho;
- próximos vencimentos;
- histórico de férias por colaborador.

Exportações, PDF, Excel ou CSV devem ficar para ciclo próprio futuro, com controle de permissão, validação LGPD e escopo de dados bem definido.

## Integração futura: Férias → Financeiro

A Gestão de Férias poderá futuramente se integrar à Gestão Financeira para gerar contas a pagar relacionadas ao pagamento previsto das férias ou de uma parcela de férias.

Essa integração deve ser planejada em ciclo próprio porque envolve dois módulos sensíveis:

- dados trabalhistas de colaboradores;
- contas financeiras da empresa;
- RLS e permissões da Gestão de Pessoas;
- RLS e permissões da Gestão Financeira;
- risco de duplicidade;
- risco de lançamento financeiro indevido.

Regra futura aprovada:

1. ao agendar férias ou uma parcela de férias, o sistema poderá permitir informar valor previsto de pagamento;
2. o sistema poderá permitir informar data prevista de pagamento;
3. o usuário poderá optar por gerar uma conta a pagar no financeiro;
4. a conta gerada deverá ficar vinculada ao registro de férias, período ou parcela;
5. o sistema deve evitar duplicidade;
6. a conta financeira nunca deve ser criada automaticamente sem confirmação explícita.

Fluxo futuro desejado:

1. usuário agenda férias ou parcela;
2. sistema calcula data fim e retorno ao trabalho;
3. usuário informa valor previsto e data de pagamento;
4. usuário marca/confirma "Gerar conta a pagar no financeiro";
5. sistema cria conta a pagar;
6. sistema vincula a conta ao registro de férias;
7. sistema mostra se a conta está pendente ou paga, conforme integração futura.

Exemplo funcional futuro:

Férias:

- funcionário: Maria da Silva;
- parcela: 1;
- início: `01/07/2026`;
- dias: `14`;
- fim calculado: `14/07/2026`;
- retorno calculado: `15/07/2026`.

Pagamento:

- valor previsto: `R$ 2.500,00`;
- data de pagamento: `28/06/2026`;
- gerar conta a pagar: sim, mediante confirmação.

Conta gerada:

- descrição: `Férias - Maria da Silva - Parcela 1`;
- vencimento: `28/06/2026`;
- valor: `R$ 2.500,00`;
- empresa: empresa ativa;
- status: pendente;
- origem: Gestão de Pessoas / Férias.

Regras de segurança futuras:

- usar empresa ativa obrigatória;
- respeitar RLS da Gestão de Pessoas;
- respeitar RLS da Gestão Financeira;
- respeitar permissões dos dois módulos;
- não gerar conta duplicada;
- não gerar conta sem valor;
- não gerar conta sem data de pagamento;
- não gerar conta sem confirmação explícita;
- não excluir conta financeira automaticamente ao alterar ou arquivar férias;
- não alterar conta financeira automaticamente sem confirmação;
- preservar rastreabilidade do vínculo;
- não expor dados pessoais além do necessário;
- não criar exportação neste fluxo sem ciclo próprio.

Sugestão de vínculo futuro, sem implementação neste ciclo:

- `origem_modulo = 'gestao_pessoas'`;
- `origem_tipo = 'ferias'`;
- `origem_id = id do período/parcela de férias`.

Ou estrutura equivalente conforme o padrão futuro do financeiro.

Essa estrutura não deve ser criada agora. O desenho final deve considerar as tabelas reais de contas, RLS existente, permissões de financeiro, prevenção de duplicidade e rollback específico.

## Fora de escopo neste ciclo

Não criar:

- SQL;
- migration;
- rollback;
- tabela;
- RLS;
- policy;
- trigger;
- frontend;
- service;
- hook;
- menu;
- rota;
- conta financeira;
- integração real com financeiro;
- exportação;
- PDF;
- Excel;
- documento;
- anexo;
- upload;
- automação;
- alerta.

Não alterar:

- `src/`;
- `supabase/`;
- `scripts/`;
- GitHub Actions;
- secrets;
- automações;
- envio automático;
- Billing;
- módulo financeiro;
- módulo de funcionários;
- fechamento de folha;
- controle de vales.

## Próximos ciclos recomendados

Ordem segura sugerida:

1. Banco/migration para tabelas de férias com rollback explícito.
2. Validação estrutural e RLS.
3. Validação real com anon/auth.
4. Service/hook de férias.
5. Tela Gestão de Férias.
6. Integração com Relatórios de Pessoas.
7. Planejamento técnico específico para integração Férias → Financeiro.
8. Integração Férias → Financeiro somente após validação de banco, RLS, permissões e prevenção de duplicidade.
9. Exportações somente depois, em ciclo próprio.

Antes de qualquer implementação visual, o modelo de dados e a matriz RLS devem estar definidos e validados.
