# Gestão de Pessoas — Planejamento de Fechamento de Folha

## Objetivo

Este documento planeja o futuro módulo de Fechamento de Folha dentro da Gestão de Pessoas do DNA Gestão.

O objetivo futuro é substituir gradualmente o controle em planilhas por um fluxo estruturado, seguro e auditável para consolidar lançamentos mensais de colaboradores, incluindo créditos, descontos, compras internas, horas extras, faltas, pensão alimentícia e informações necessárias para conferência administrativa e envio à contabilidade.

Este ciclo é apenas análise e documentação das planilhas reais usadas hoje. Não cria banco, RLS, migration, tela, rota, service, hook, menu, exportação, integração financeira ou automação.

## Planilhas Analisadas

Foram analisadas duas planilhas reais do processo atual, ambas referentes a abril de 2026:

- `Controle Vales ABRIL 2026.xlsx`;
- `Fechamento Folha ABRIL 2026.xlsx`.

Observação de nomenclatura: no processo atual, `Controle de Vales` deve ser entendido como controle de compras internas/vales dos colaboradores, normalmente originado do PDV e conferido antes de entrar no fechamento.

### Controle de Vales ABRIL 2026

Função da planilha:

- consolidar compras internas/vales por colaborador;
- separar os colaboradores por loja/unidade;
- permitir vários lançamentos de valor por colaborador;
- calcular total por colaborador com fórmula de soma horizontal;
- servir como base para a coluna de compras no Fechamento Folha.

Estrutura observada:

- uma aba chamada `DONA FLOR 1`;
- blocos por loja/unidade;
- cabeçalhos genéricos importados ou mantidos como `Coluna1`, `Coluna2`, `Coluna3` etc.;
- coluna de colaborador;
- várias colunas intermediárias com valores de compras internas/vales;
- coluna final de total por colaborador;
- fórmulas do tipo `=SUM(Cx:Lx)` para totalizar cada linha de colaborador;
- linhas vazias ou reservadas com fórmula de total mesmo sem colaborador preenchido.

Blocos de loja/unidade identificados:

- Dona Flor Andradina;
- Dona Flor Três Lagoas;
- Dona Flor Três Lagoas Modelos;
- Brilho Dourado;
- Dona Flor Paranaíba.

### Fechamento Folha ABRIL 2026

Função da planilha:

- consolidar o fechamento mensal por loja/unidade e colaborador;
- receber o valor de compras internas/vales;
- registrar descontos e créditos trabalhistas;
- registrar horas extras por percentual;
- registrar faltas e observações administrativas;
- preparar a informação para conferência e envio à contabilidade.

Estrutura observada:

- uma aba chamada `FECHAMENTO FOLHA`;
- blocos por loja/unidade;
- cabeçalho repetido em cada bloco;
- colaboradores listados por bloco;
- colunas para compras, plano de saúde, premiação, horas extras, faltas e observações;
- não foram identificadas fórmulas na planilha analisada;
- os valores parecem ser preenchidos ou consolidados manualmente a partir de outras fontes, incluindo o Controle de Vales.

Blocos de loja/unidade identificados:

- Dona Flor Três Lagoas;
- Dona Flor Andradina;
- Dona Flor Paranaíba;
- Brilho Dourado.

## Fluxo Operacional Atual

O fluxo atual pode ser entendido assim:

1. Os dados de compras internas/vales são coletados a partir do PDV ou controle operacional da loja.
2. As compras internas/vales são consolidadas por colaborador no Controle de Vales.
3. Os valores são agrupados por loja/unidade.
4. A loja confere os valores e valida com o colaborador, normalmente pelo WhatsApp da loja.
5. O total de compras internas/vales por colaborador entra no Fechamento Folha.
6. No Fechamento Folha são adicionados créditos, descontos, horas extras, faltas e observações administrativas.
7. O fechamento é conferido internamente.
8. As informações consolidadas são preparadas para envio ou conferência com a contabilidade.
9. No futuro, relatórios e exportações poderão ser gerados em ciclo próprio.

O fechamento mensal deve ser tratado como uma competência, por exemplo `2026-04` ou `2026-05`.

## Campos Identificados

### Controle de Vales / Compras Internas

Campos e estruturas observados:

- loja/unidade;
- colaborador;
- múltiplas colunas de valores de compras internas/vales;
- total por colaborador;
- linhas reservadas para preenchimento futuro;
- cabeçalhos genéricos como `Coluna1`, `Coluna2`, `Coluna3` etc.

Campos conceituais que a futura implementação deve considerar:

- `empresa_id`;
- competência;
- loja/filial;
- funcionário;
- data da compra ou data de referência, se disponível na origem;
- descrição ou origem do lançamento, se disponível na origem;
- valor;
- status de conferência;
- total por colaborador;
- total por loja/filial;
- observação administrativa, com cuidado de LGPD.

### Fechamento Folha

Campos observados:

- loja/unidade;
- colaborador;
- compras;
- plano de saúde;
- premiação;
- horas extras 50%;
- horas extras 60%;
- horas extras 100%;
- faltas;
- observações/dia da falta.

Campos conceituais que a futura implementação deve considerar:

- competência;
- empresa ativa;
- funcionário;
- loja/filial;
- categoria do lançamento;
- natureza do lançamento;
- valor;
- quantidade, quando aplicável;
- percentual, quando aplicável;
- data de referência, quando aplicável;
- observação administrativa;
- total de créditos;
- total de descontos;
- líquido ou resultado informativo para contabilidade, se validado futuramente;
- status do fechamento.

## Categorias de Lançamento

### Créditos

Valores positivos a favor do colaborador:

- premiação;
- horas extras 50%;
- horas extras 60%;
- horas extras 100%;
- outros créditos que venham a ser identificados em ciclos futuros.

### Descontos

Valores negativos ou contra o colaborador:

- compras internas/vales;
- plano de saúde;
- faltas;
- pensão alimentícia, já conhecida como necessidade funcional embora não tenha aparecido como coluna destacada na planilha analisada;
- outros descontos que venham a ser identificados em ciclos futuros.

### Informativos

Campos que ajudam na conferência, mas não devem necessariamente somar diretamente:

- loja/unidade;
- colaborador;
- competência;
- observações administrativas;
- dia/data da falta;
- status de conferência;
- status do fechamento;
- origem dos valores de compras internas/vales.

## Matriz Oficial Inicial de Categorias

Esta matriz é a referência inicial para os próximos ciclos do Fechamento de Folha. Ela organiza as categorias por natureza, indica a origem funcional e define cuidados mínimos antes de qualquer automação, banco, tela, exportação ou integração.

### Créditos

#### Premiação

- Nome amigável: Premiação.
- Chave técnica futura sugerida: `premiacao`.
- Natureza: `credito`.
- Origem: Planilha Fechamento Folha.
- Descrição: valor positivo lançado a favor do colaborador.
- Soma em totais: deve somar em total de créditos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: pode depender de conferência administrativa antes do fechamento.
- Validação humana antes de automação: sim.

#### Hora extra 50%

- Nome amigável: Hora extra 50%.
- Chave técnica futura sugerida: `hora_extra_50`.
- Natureza: `credito`.
- Origem: Planilha Fechamento Folha.
- Descrição: valor ou lançamento referente a horas extras com adicional de 50%.
- Soma em totais: deve somar em total de créditos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: não automatizar cálculo legal complexo sem validação contábil/trabalhista.
- Validação humana antes de automação: sim.

#### Hora extra 60%

- Nome amigável: Hora extra 60%.
- Chave técnica futura sugerida: `hora_extra_60`.
- Natureza: `credito`.
- Origem: Planilha Fechamento Folha.
- Descrição: valor ou lançamento referente a horas extras com adicional de 60%.
- Soma em totais: deve somar em total de créditos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: pode variar por cidade, loja, convenção ou regra operacional.
- Validação humana antes de automação: sim.

#### Hora extra 100%

- Nome amigável: Hora extra 100%.
- Chave técnica futura sugerida: `hora_extra_100`.
- Natureza: `credito`.
- Origem: Planilha Fechamento Folha.
- Descrição: valor ou lançamento referente a horas extras com adicional de 100%, normalmente ligado a feriado ou regra específica.
- Soma em totais: deve somar em total de créditos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: exige conferência antes de qualquer automação futura.
- Validação humana antes de automação: sim.

#### Outro crédito

- Nome amigável: Outro crédito.
- Chave técnica futura sugerida: `outro_credito`.
- Natureza: `credito`.
- Origem: categoria de segurança para expansão futura.
- Descrição: crédito eventual não classificado nas categorias principais.
- Soma em totais: deve somar em total de créditos quando tiver valor.
- Uso informativo: não deve ser apenas informativa.
- Atenção: deve exigir descrição obrigatória no futuro.
- Validação humana antes de automação: sim.

### Descontos

#### Compras internas / vales

- Nome amigável: Compras internas / vales.
- Chave técnica futura sugerida: `compras_vales`.
- Natureza: `desconto`.
- Origem: Controle de Vales e Fechamento Folha.
- Descrição: valor de compras internas ou vales do colaborador, consolidado por competência e usado como desconto no fechamento.
- Soma em totais: deve somar em total de descontos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: deve ter conferência humana antes de entrar no fechamento.
- Validação humana antes de automação: sim.

#### Plano de saúde

- Nome amigável: Plano de saúde.
- Chave técnica futura sugerida: `plano_saude`.
- Natureza: `desconto`.
- Origem: Planilha Fechamento Folha.
- Descrição: desconto relacionado ao plano de saúde do colaborador.
- Soma em totais: deve somar em total de descontos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: não registrar dados médicos, laudos, CID, diagnósticos ou informações clínicas.
- Validação humana antes de automação: sim.

#### Falta injustificada

- Nome amigável: Falta injustificada.
- Chave técnica futura sugerida: `falta_injustificada`.
- Natureza: `desconto`.
- Origem: Planilha Fechamento Folha e necessidade futura de integração com férias.
- Descrição: desconto ou registro relacionado a falta injustificada.
- Soma em totais: pode somar em total de descontos quando houver valor associado.
- Uso informativo: pode também exigir campos informativos de data/quantidade.
- Atenção: pode impactar férias futuramente, mas não deve alterar férias automaticamente sem confirmação administrativa/contábil.
- Validação humana antes de automação: sim.

#### Pensão alimentícia

- Nome amigável: Pensão alimentícia.
- Chave técnica futura sugerida: `pensao_alimenticia`.
- Natureza: `desconto`.
- Origem: necessidade funcional já conhecida.
- Descrição: desconto referente a pensão alimentícia.
- Soma em totais: deve somar em total de descontos.
- Uso informativo: não deve ser apenas informativa.
- Atenção: categoria sensível. Deve ter exposição mínima, controle de permissão e cuidado com relatórios/exportações.
- Validação humana antes de automação: sim.

#### Outro desconto

- Nome amigável: Outro desconto.
- Chave técnica futura sugerida: `outro_desconto`.
- Natureza: `desconto`.
- Origem: categoria de segurança para expansão futura.
- Descrição: desconto eventual não classificado nas categorias principais.
- Soma em totais: deve somar em total de descontos quando tiver valor.
- Uso informativo: não deve ser apenas informativa.
- Atenção: deve exigir descrição obrigatória no futuro.
- Validação humana antes de automação: sim.

### Informativos

#### Observação administrativa

- Nome amigável: Observação administrativa.
- Chave técnica futura sugerida: `observacao_administrativa`.
- Natureza: `informativo`.
- Origem: Planilha Fechamento Folha.
- Descrição: campo de apoio para conferência administrativa.
- Soma em totais: não deve somar diretamente.
- Uso informativo: sim.
- Atenção: não registrar dados médicos, CID, laudos, diagnósticos, documentos ou informações clínicas.
- Validação humana antes de automação: sim, especialmente para evitar uso indevido do campo livre.

#### Dia/data da falta

- Nome amigável: Dia/data da falta.
- Chave técnica futura sugerida: `data_falta`.
- Natureza: `informativo`.
- Origem: Planilha Fechamento Folha.
- Descrição: informação de referência para conferência de falta.
- Soma em totais: não deve somar diretamente.
- Uso informativo: sim.
- Atenção: pode ser usada futuramente para cruzamento com férias, mas sem automação silenciosa.
- Validação humana antes de automação: sim.

#### Status de conferência

- Nome amigável: Status de conferência.
- Chave técnica futura sugerida: `status_conferencia`.
- Natureza: `informativo`.
- Origem: necessidade funcional futura.
- Descrição: indica se o lançamento ou fechamento já foi conferido.
- Soma em totais: não deve somar diretamente.
- Uso informativo: sim.
- Atenção: deve apoiar auditoria operacional, sem substituir validação humana.
- Validação humana antes de automação: sim.

#### Origem do lançamento

- Nome amigável: Origem do lançamento.
- Chave técnica futura sugerida: `origem_lancamento`.
- Natureza: `informativo`.
- Origem: necessidade funcional futura.
- Descrição: identifica se o lançamento veio de Controle de Vales, lançamento manual, importação futura, férias ou outra origem.
- Soma em totais: não deve somar diretamente.
- Uso informativo: sim.
- Atenção: deve preservar rastreabilidade e ajudar a evitar duplicidade.
- Validação humana antes de automação: sim.

## Regras Gerais da Matriz de Categorias

- Créditos aumentam valores a favor do colaborador.
- Descontos reduzem valores ou representam valores contra o colaborador.
- Informativos não devem somar diretamente em totais financeiros.
- Categorias `outro_credito` e `outro_desconto` devem exigir descrição obrigatória futuramente.
- Categorias ligadas a faltas podem alimentar a Gestão de Férias futuramente, mas sem alteração automática de férias.
- Categorias ligadas a valores financeiros podem alimentar a Gestão Financeira futuramente, mas somente com confirmação explícita.
- Nenhuma categoria deve permitir dados médicos, CID, laudos, diagnósticos, documentos, anexos, uploads, base64 ou links públicos.
- Toda exportação futura deve respeitar permissão, LGPD, conferência prévia e escopo mínimo necessário.
- `empresa_id` e competência mensal serão obrigatórios em ciclos futuros de banco.
- Toda categoria com valor deve manter natureza clara para permitir totalização segura.
- Toda categoria de origem importada deve preservar rastreabilidade da fonte e evitar duplicidade.

## Cálculos Identificados

### Controle de Vales

Foram identificadas fórmulas de totalização por colaborador.

Padrão observado:

- total horizontal por linha de colaborador;
- fórmula no formato `=SUM(Cx:Lx)`;
- resultado usado como total de compras internas/vales daquele colaborador;
- algumas linhas vazias também mantêm a fórmula, provavelmente como espaço de preenchimento futuro.

Tipos de cálculo observados:

- cálculo simples de soma;
- soma por colaborador;
- consolidação operacional por loja/unidade por meio dos blocos da planilha.

Pontos de atenção:

- os cabeçalhos das colunas intermediárias são genéricos;
- a origem detalhada de cada coluna de valor não está explícita na própria planilha;
- a futura importação deve preservar rastreabilidade da origem dos dados do PDV;
- deve haver conferência humana antes de usar o valor no fechamento.

### Fechamento Folha

Não foram identificadas fórmulas na planilha analisada.

O comportamento observado indica:

- valores de compras/vales são consolidados a partir do Controle de Vales;
- plano de saúde, premiação, horas extras, faltas e observações parecem ser preenchidos ou conferidos manualmente;
- horas extras aparecem em colunas separadas por percentual, variando por loja/unidade;
- faltas possuem coluna própria e coluna de observação/dia da falta;
- não há cálculo automático de líquido/resultado visível na planilha analisada.

Tipos de cálculo que devem ser planejados futuramente:

- total de créditos por colaborador;
- total de descontos por colaborador;
- totalização por competência;
- totalização por loja/filial;
- cálculo de horas extras por percentual;
- cálculo de descontos por faltas;
- cálculo que depende de regra externa ou validação contábil;
- conferência antes de exportar para contabilidade.

## Estrutura Funcional Futura

O Fechamento de Folha deve ser organizado por competência mensal.

Exemplo de competência:

- `2026-05`.

Dados conceituais esperados:

- empresa ativa;
- competência;
- colaborador/funcionário;
- loja/filial, se aplicável;
- lançamentos do mês;
- totais positivos;
- totais negativos;
- saldo ou valor líquido informativo para contabilidade;
- status do fechamento.

Status futuros possíveis para uma competência:

- aberta;
- em conferência;
- validada;
- enviada à contabilidade;
- fechada;
- arquivada/cancelada, se necessário.

Status finais devem ser definidos no ciclo de banco/RLS.

## Sugestão Futura de Modelagem

Esta seção é apenas planejamento. Não criar SQL neste ciclo.

### Entidade — competências de folha

Nome conceitual:

- `fechamento_folha_competencias`.

Possível tabela futura:

- `public.df_folha_competencias`.

Campos possíveis:

- `id`;
- `empresa_id`;
- `competencia`;
- `status`;
- `fechado_em`;
- `criado_em`;
- `atualizado_em`.

### Entidade — lançamentos da folha

Nome conceitual:

- `fechamento_folha_lancamentos`.

Possível tabela futura:

- `public.df_folha_lancamentos`.

Campos possíveis:

- `id`;
- `empresa_id`;
- `competencia_id`;
- `funcionario_id`;
- `filial_id`;
- `tipo`;
- `categoria`;
- `descricao`;
- `data_referencia`;
- `quantidade`;
- `percentual`;
- `valor`;
- `natureza`;
- `observacao_administrativa`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Naturezas possíveis:

- `credito`;
- `desconto`;
- `informativo`.

Categorias possíveis:

- `vale_compra`;
- `premiacao`;
- `plano_saude`;
- `hora_extra_50`;
- `hora_extra_60`;
- `hora_extra_100`;
- `falta_injustificada`;
- `pensao_alimenticia`;
- `outro_credito`;
- `outro_desconto`;
- `informativo`.

### Entidade — vales/compras internas

Nome conceitual:

- `fechamento_folha_vales`.

Objetivo:

- manter histórico dos valores vindos do PDV ou lançados manualmente;
- permitir conferência por loja/filial;
- permitir validação antes de enviar ao fechamento;
- preservar vínculo com competência, empresa e funcionário.

Campos futuros possíveis:

- empresa;
- competência;
- filial/loja;
- funcionário;
- data de referência;
- descrição/origem;
- valor;
- status de conferência;
- conferido_em;
- conferido_por;
- observação administrativa;
- arquivado.

### Entidade — snapshot de colaboradores

Nome conceitual:

- `fechamento_folha_colaboradores_snapshot`.

Objetivo:

- preservar, na competência, dados mínimos necessários de conferência;
- evitar que alterações futuras no cadastro confundam fechamentos antigos;
- manter somente dados necessários.

Campos futuros possíveis:

- competência;
- funcionário;
- nome exibido na época;
- cargo exibido na época;
- filial/loja na época;
- status do funcionário na época.

Não deve incluir CPF por padrão em listagens ou relatórios internos.

### Entidade — conferências

Nome conceitual:

- `fechamento_folha_conferencias`.

Objetivo:

- registrar etapas de conferência operacional;
- controlar validação dos valores antes de fechar;
- registrar quem conferiu e quando, sem anexar documentos.

Campos futuros possíveis:

- competência;
- loja/filial;
- tipo de conferência;
- status;
- conferido_por;
- conferido_em;
- observação administrativa.

## Planejamento Técnico de Banco e RLS

Esta seção prepara a futura modelagem de banco e RLS do Fechamento de Folha, ainda sem SQL. A futura migration deve ser criada em ciclo próprio, com rollback explícito, validação estrutural e validação real com anon/auth.

### Princípios da Modelagem

- `empresa_id` deve ser obrigatório em todas as tabelas.
- Competência mensal deve ser obrigatória no fechamento.
- Lançamentos devem ter vínculo obrigatório com funcionário quando forem por colaborador.
- Loja/filial deve ser considerada desde o início, mesmo que nullable.
- O padrão deve ser arquivamento lógico, sem DELETE físico.
- Não criar anexos.
- Não criar documentos.
- Não criar uploads.
- Não criar base64.
- Não guardar dados médicos.
- Não guardar CID.
- Não guardar laudos.
- Não guardar informações clínicas.
- Não gerar conta financeira automaticamente.
- Não alterar férias automaticamente por causa de faltas.
- RLS deve ser habilitada e forçada em todas as tabelas futuras.
- Não criar policy DELETE.
- Não criar policy ALL.
- Validação futura com anon/auth será obrigatória após a migration.

### Tabela Futura de Competências

Nome sugerido:

- `public.df_folha_competencias`.

Objetivo:

- representar uma competência mensal de fechamento por empresa.

Campos sugeridos:

- `id`;
- `empresa_id`;
- `competencia`;
- `status`;
- `observacao_administrativa`;
- `fechado_em`;
- `fechado_por`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Regras sugeridas:

- `competencia` deve usar formato `YYYY-MM`;
- deve existir apenas uma competência ativa por empresa e mês;
- status inicial sugerido: `aberta`;
- status possíveis: `aberta`, `em_conferencia`, `validada`, `enviada_contabilidade`, `fechada`, `arquivada`;
- não permitir DELETE físico;
- arquivamento deve ocorrer por update.

Constraints futuras sugeridas:

- `empresa_id` obrigatório;
- `competencia` obrigatória;
- `status` obrigatório;
- unique parcial ou controle equivalente para evitar competência duplicada ativa por empresa/mês;
- check de status permitido;
- check de formato da competência, se viável.

### Tabela Futura de Lançamentos

Nome sugerido:

- `public.df_folha_lancamentos`.

Objetivo:

- registrar créditos, descontos e informativos por funcionário dentro de uma competência.

Campos sugeridos:

- `id`;
- `empresa_id`;
- `competencia_id`;
- `funcionario_id`;
- `filial_id`;
- `natureza`;
- `categoria`;
- `descricao`;
- `data_referencia`;
- `quantidade`;
- `percentual`;
- `valor`;
- `observacao_administrativa`;
- `origem_lancamento`;
- `origem_id`;
- `conferido`;
- `conferido_em`;
- `conferido_por`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Naturezas permitidas:

- `credito`;
- `desconto`;
- `informativo`.

Categorias permitidas conforme matriz oficial:

- `premiacao`;
- `hora_extra_50`;
- `hora_extra_60`;
- `hora_extra_100`;
- `outro_credito`;
- `compras_vales`;
- `plano_saude`;
- `falta_injustificada`;
- `pensao_alimenticia`;
- `outro_desconto`;
- `observacao_administrativa`;
- `data_falta`;
- `status_conferencia`;
- `origem_lancamento`.

Regras sugeridas:

- lançamentos financeiros devem ter valor;
- lançamentos informativos podem não ter valor;
- `outro_credito` e `outro_desconto` devem exigir descrição;
- `pensao_alimenticia` deve ter cuidado de permissão e exposição;
- `plano_saude` não pode armazenar dado médico;
- `falta_injustificada` pode ter `data_referencia`, `quantidade` e `valor`;
- horas extras podem ter `percentual`, `quantidade` e `valor`;
- `valor` não deve ser negativo; a natureza define se soma como crédito ou desconto;
- arquivamento lógico;
- sem DELETE físico.

Constraints futuras sugeridas:

- `empresa_id` obrigatório;
- `competencia_id` obrigatório;
- `funcionario_id` obrigatório para lançamentos por colaborador;
- `natureza` obrigatória;
- `categoria` obrigatória;
- check de natureza permitida;
- check de categoria permitida;
- check de `valor >= 0` quando valor não for nulo;
- check para exigir descrição em `outro_credito` e `outro_desconto`;
- vínculo coerente entre natureza e categoria.

### Tabela Futura de Vales/Compras Internas

Nome sugerido:

- `public.df_folha_vales_compras`.

Objetivo:

- registrar compras internas/vales antes de entrar no fechamento, preservando conferência e rastreabilidade.

Campos sugeridos:

- `id`;
- `empresa_id`;
- `competencia_id`;
- `funcionario_id`;
- `filial_id`;
- `data_referencia`;
- `descricao`;
- `valor`;
- `origem`;
- `status_conferencia`;
- `conferido_em`;
- `conferido_por`;
- `lancamento_folha_id`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Status de conferência sugeridos:

- `pendente`;
- `conferido`;
- `divergente`;
- `ignorado`.

Regras sugeridas:

- valor obrigatório;
- `empresa_id` obrigatório;
- competência obrigatória;
- funcionário obrigatório;
- pode existir antes do lançamento final na folha;
- pode ser vinculado posteriormente a um lançamento em `df_folha_lancamentos`;
- não gerar lançamento automaticamente sem confirmação;
- não importar dados sem ciclo próprio.

### Snapshot Futuro de Colaborador

Avaliar se será necessário desde o primeiro banco ou em ciclo posterior.

Nome sugerido:

- `public.df_folha_colaboradores_snapshot`.

Objetivo:

- preservar dados mínimos do colaborador na competência, evitando que mudanças futuras no cadastro alterem a leitura histórica.

Campos possíveis:

- `id`;
- `empresa_id`;
- `competencia_id`;
- `funcionario_id`;
- `nome_exibicao`;
- `cargo`;
- `filial_id`;
- `status_funcionario_na_epoca`;
- `criado_em`.

Regras:

- não incluir CPF por padrão;
- não incluir dados sensíveis desnecessários;
- usar somente se houver necessidade real no ciclo de banco;
- pode ficar como fase 2 se aumentar risco da primeira migration.

### Tabela Futura de Conferências

Avaliar se será necessária desde o primeiro banco ou em ciclo posterior.

Nome sugerido:

- `public.df_folha_conferencias`.

Objetivo:

- registrar etapas de conferência do fechamento.

Campos possíveis:

- `id`;
- `empresa_id`;
- `competencia_id`;
- `filial_id`;
- `tipo_conferencia`;
- `status`;
- `observacao_administrativa`;
- `conferido_por`;
- `conferido_em`;
- `criado_em`;
- `atualizado_em`.

Regras:

- sem anexos;
- sem documentos;
- apenas registro textual administrativo seguro;
- pode ficar como fase 2 se aumentar risco da primeira migration.

### RLS Futura

Regras futuras em linguagem natural:

- RLS deve ser habilitada e forçada em todas as tabelas.
- Usuário só pode acessar dados da empresa permitida ao seu perfil/vínculo.
- Admin/Master podem operar Fechamento de Folha inicialmente.
- Operador/Gerente não devem acessar inicialmente.
- Master deve respeitar as regras já existentes do projeto para multiempresa.
- SELECT deve ser restrito por empresa.
- INSERT deve ser permitido somente para perfis autorizados.
- UPDATE deve ser permitido somente para perfis autorizados e respeitando `empresa_id` imutável.
- DELETE físico deve ser bloqueado.
- Arquivamento deve ocorrer por update.
- Nenhuma policy ALL deve ser criada.
- Nenhuma policy DELETE deve ser criada.
- Validar com anon/auth depois da migration.

### Funções Auxiliares Futuras

Possíveis funções, apenas como planejamento:

- `df_folha_pode_ler`;
- `df_folha_pode_escrever`;
- `df_folha_pode_conferir`;
- `df_folha_pode_exportar`.

Regras:

- seguir padrão já usado em `df_funcionarios`;
- considerar Admin/Master inicialmente;
- não ampliar para Operador/Gerente no primeiro ciclo;
- função de exportação pode ficar para ciclo futuro.

### Índices Futuros Sugeridos

Índices a avaliar na futura migration:

- `empresa_id`;
- `competencia_id`;
- `funcionario_id`;
- `filial_id`;
- `categoria`;
- `natureza`;
- `arquivado`;
- competência + `empresa_id`;
- `status`;
- `data_referencia`.

Evitar índices excessivos na primeira migration. Priorizar consultas por empresa, competência, funcionário e status/arquivamento.

### Rollback Futuro

Plano conceitual de rollback para a futura migration:

- rollback deve remover apenas objetos criados pelo ciclo;
- remover tabelas na ordem correta de dependência;
- remover funções auxiliares criadas no ciclo, se houver;
- remover triggers criados no ciclo, se houver;
- não tocar em `df_funcionarios`;
- não tocar em Gestão de Férias;
- não tocar em Gestão Financeira;
- avisar perda dos dados das tabelas de folha caso rollback seja executado;
- rollback deve ser entregue junto com a migration real no ciclo futuro.

### Estratégia de Primeira Migration

Abordagem conservadora recomendada:

- criar `df_folha_competencias`;
- criar `df_folha_lancamentos`;
- avaliar se `df_folha_vales_compras` é essencial já na primeira migration.

Deixar para ciclos posteriores, se aumentar risco:

- snapshot de colaborador;
- conferências detalhadas;
- exportações;
- integrações;
- automações;
- cálculos trabalhistas complexos.

Atualização em 2026-05-26: a primeira migration real do núcleo foi preparada seguindo a abordagem conservadora, criando somente `public.df_folha_competencias` e `public.df_folha_lancamentos`, com rollback explícito. As tabelas `df_folha_vales_compras`, `df_folha_colaboradores_snapshot` e `df_folha_conferencias` permanecem fora do escopo e devem ser tratadas em ciclos próprios.

### Validação Futura Obrigatória

Checklist obrigatório para o ciclo real de banco/RLS:

- validação estrutural das tabelas;
- RLS habilitada;
- RLS forçada;
- ausência de policy DELETE;
- ausência de policy ALL;
- triggers de `atualizado_em`;
- `empresa_id` imutável;
- INSERT/SELECT/UPDATE por perfil;
- bloqueio de DELETE;
- bloqueio cross-tenant;
- validação com anon/auth;
- validação Master;
- validação Admin;
- validação Gerente e Operador sem acesso, se essa for a regra inicial.

### Estado Final Validado do Núcleo Banco/RLS

Atualização em 2026-05-26: a primeira migration real do núcleo do Fechamento de Folha foi aplicada manualmente no Supabase principal e validada.

Tabelas criadas:

- `public.df_folha_competencias`;
- `public.df_folha_lancamentos`.

Tabelas não criadas neste ciclo:

- `public.df_folha_vales_compras`;
- `public.df_folha_colaboradores_snapshot`;
- `public.df_folha_conferencias`.

Validação estrutural aprovada:

- tabelas criadas;
- constraints principais criadas;
- triggers criados;
- RLS habilitada;
- RLS forçada;
- sem policy DELETE;
- sem policy ALL;
- DELETE físico bloqueado;
- `empresa_id` protegido contra alteração;
- validação de vínculo entre competência, funcionário, filial e empresa.

Validação real anon/auth via PowerShell aprovada, primeira rodada sem filial.

Resultado validado para Admin:

- login OK;
- operou Choco Arte;
- criou competência própria;
- listou competência própria;
- atualizou competência própria;
- alteração de `empresa_id` bloqueada;
- criou lançamento próprio sem filial;
- listou lançamento próprio;
- atualizou lançamento próprio;
- arquivou lançamento próprio;
- DELETE físico bloqueado;
- alteração de `empresa_id` do lançamento bloqueada;
- funcionário de outra empresa bloqueado.

Resultado validado para Master:

- login OK;
- operou Dona Flor;
- criou competência própria;
- listou competência própria;
- atualizou competência própria;
- alteração de `empresa_id` bloqueada;
- criou lançamento próprio sem filial;
- listou lançamento próprio;
- atualizou lançamento próprio;
- DELETE físico bloqueado;
- alteração de `empresa_id` do lançamento bloqueada;
- funcionário de outra empresa bloqueado.

Resultado validado para Gerente:

- login OK;
- sem acesso inicial;
- SELECT sem dados/bloqueado;
- INSERT bloqueado;
- UPDATE sem dados/bloqueado.

Resultado validado para Operador:

- login OK;
- sem acesso inicial;
- SELECT sem dados/bloqueado;
- INSERT bloqueado;
- UPDATE sem dados/bloqueado.

Observação sobre a validação: houve um falso erro inicial na primeira rodada porque os IDs dos funcionários de Choco Arte e Dona Flor estavam invertidos no script local. Após corrigir os IDs, a validação passou.

IDs corretos usados na validação:

- Funcionário Dona Flor: `1be2dff2-dc19-461d-8915-ea744768a48e`;
- Funcionário Choco Arte: `aff2f4ae-0145-4908-b4ab-6a102b6e39be`.

Status final:

- Fechamento de Folha — Núcleo Banco/RLS: APROVADO.

Alerta de segurança: senhas de usuários de teste foram expostas durante a validação manual e devem ser trocadas.

## Sugestão Futura de Telas

Telas conceituais futuras, sem implementação neste ciclo:

- tela de competências;
- tela de fechamento por competência;
- tela de lançamentos por colaborador;
- tela de importação/conferência de vales/compras internas;
- tela de resumo mensal por loja/filial;
- tela de conferência antes de exportar;
- tela de histórico de fechamentos;
- tela de divergências ou pendências de conferência.

Fluxo visual futuro recomendado:

1. selecionar competência;
2. selecionar empresa ativa automaticamente;
3. visualizar lojas/filiais envolvidas;
4. importar ou lançar compras internas/vales em ciclo próprio;
5. conferir valores por colaborador;
6. lançar créditos e descontos;
7. revisar totais;
8. validar fechamento;
9. exportar para contabilidade apenas em ciclo próprio.

## Controle de Vales e Compras Internas

O módulo deve futuramente permitir controlar compras internas e vales por colaborador.

Funcionalidades futuras possíveis:

- importar ou lançar compras internas/vales por colaborador;
- agrupar compras internas/vales por competência;
- agrupar por loja/filial;
- manter histórico por colaborador;
- marcar itens como conferidos;
- registrar validação operacional com o colaborador;
- gerar visão de conferência antes do fechamento;
- gerar relatório futuro para conferência.

Regras de segurança:

- não misturar dados entre empresas;
- usar empresa ativa obrigatória;
- respeitar RLS;
- não importar dados sem ciclo próprio;
- não criar exportação sem ciclo próprio;
- não guardar documentos/anexos neste primeiro desenho.

Neste ciclo não há importação, tela ou banco.

## Horas Extras

Horas extras devem ser modeladas com cuidado, porque podem variar conforme cidade, loja, convenção, feriado ou regra operacional.

Dados futuros possíveis:

- quantidade de horas;
- percentual aplicado;
- categoria: 50%, 60% ou 100%;
- cidade/loja/convenção, se necessário;
- data de referência;
- valor calculado ou informado;
- observação administrativa.

Regras:

- o cálculo deve ser auditável;
- regras legais complexas não devem ser automatizadas sem validação;
- diferenças por cidade/convenção devem ser planejadas antes de virar banco ou tela;
- o sistema pode sugerir valores, mas a conferência administrativa deve ser preservada no início.

Não implementar regra legal automática complexa neste ciclo.

## Faltas Injustificadas

Faltas devem ser tratadas como lançamentos trabalhistas com impacto potencial em folha e férias.

Dados futuros possíveis:

- data da falta;
- quantidade de dias ou horas;
- tipo da falta, começando por `injustificada`;
- competência;
- funcionário;
- empresa;
- loja/filial, se aplicável;
- observação administrativa.

Regras:

- faltas injustificadas podem gerar desconto no fechamento de folha;
- faltas injustificadas devem futuramente alimentar a Gestão de Férias;
- a redução de dias de direito deve seguir regras trabalhistas;
- o cálculo deve ser auditável;
- o sistema deve sugerir impacto, mas não aplicar automaticamente sem conferência administrativa ou contábil no início.

Observações não devem ser usadas para registrar dados médicos, CID, laudos, diagnósticos ou informações clínicas.

## Relação Futura com Gestão de Férias

As faltas injustificadas registradas no Fechamento de Folha deverão futuramente ser consideradas pela Gestão de Férias.

Objetivo da integração:

- identificar faltas injustificadas dentro do período aquisitivo;
- sugerir redução de dias de direito do ciclo;
- manter cálculo auditável;
- permitir validação administrativa/contábil antes de aplicar.

Exemplo futuro:

- período aquisitivo: `02/09/2024` a `01/09/2025`;
- faltas injustificadas no período: `6`;
- sistema sugere redução dos dias de direito;
- usuário ou contabilidade valida antes de fechar o ciclo.

Regras:

- não alterar ciclo de férias automaticamente sem confirmação;
- não reduzir dias de direito silenciosamente;
- preservar histórico da origem do cálculo;
- respeitar RLS e empresa ativa;
- não criar integração neste ciclo.

## Relação Futura com Gestão Financeira

O Fechamento de Folha pode futuramente gerar contas a pagar na Gestão Financeira, sempre mediante confirmação explícita.

Exemplos de possíveis origens:

- folha mensal;
- férias;
- rescisões;
- adiantamentos;
- outros compromissos trabalhistas.

Regras futuras:

- não gerar conta sem confirmação explícita;
- não gerar conta sem valor;
- não gerar conta sem data de vencimento/pagamento;
- evitar duplicidade;
- vincular origem do lançamento;
- respeitar empresa ativa;
- respeitar permissões da Gestão de Pessoas;
- respeitar permissões da Gestão Financeira;
- não excluir ou alterar conta financeira automaticamente sem confirmação.

Não implementar integração financeira neste ciclo.

## Exportação Futura para Contabilidade

O fechamento mensal deve futuramente gerar saídas para a contabilidade.

Exportações futuras possíveis:

- Excel;
- PDF;
- relatório consolidado;
- relatório por colaborador;
- relatório por loja/filial;
- relatório de conferência;
- relatório final para contabilidade.

Regras para ciclo futuro:

- exportação deve ter ciclo próprio;
- layout deve ser validado com o usuário;
- permissões devem ser controladas;
- escopo de dados deve ser mínimo e necessário;
- LGPD deve ser considerada;
- deve haver conferência prévia antes da geração;
- exportação não deve ser criada neste ciclo.

## Permissões Futuras

Regra conservadora inicial:

- Admin/Master acessam e operam;
- Operador/Gerente não acessam inicialmente;
- permissões mais específicas podem ser planejadas futuramente.

Não ampliar acesso sem ciclo próprio de permissão.

## Segurança e LGPD

A futura implementação deve:

- usar empresa ativa obrigatória;
- respeitar RLS;
- impedir vazamento entre empresas;
- não usar service role;
- não usar secrets no frontend;
- não expor CPF em listagens, salvo necessidade justificada futura;
- não expor dados sensíveis desnecessários;
- não armazenar documentos/anexos neste primeiro momento;
- não criar upload;
- não criar base64;
- não criar links públicos;
- não criar exportação sem controle;
- não criar integração financeira automática sem confirmação;
- não alterar férias automaticamente por causa de faltas;
- não gerar conta financeira automaticamente;
- não registrar dados médicos em observações;
- não registrar CID, diagnóstico, laudo ou informação clínica;
- não logar dados pessoais ou payloads completos.

Qualquer ciclo futuro com banco, RLS, frontend, service/hook, exportação ou integração financeira deve ser tratado como ALTÍSSIMO risco.

## Fora do Escopo Neste Ciclo

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
- exportação;
- PDF;
- Excel;
- CSV;
- integração financeira;
- conta a pagar;
- importação;
- upload;
- documento;
- anexo;
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
- Gestão de Férias;
- Gestão Financeira.

## Pendências para Validação com o Usuário

Antes de transformar este planejamento em banco, RLS, service/hook ou tela, validar:

- As categorias acima cobrem todos os lançamentos atuais?
- Pensão alimentícia deve ficar como categoria fixa desde o primeiro banco?
- Compras e vales devem ser uma categoria única ou categorias separadas?
- Plano de saúde sempre será desconto simples ou poderá ter subdivisões?
- Horas extras serão lançadas como valor pronto ou calculadas por quantidade de horas?
- Horas extras devem guardar percentual, quantidade de horas e valor separadamente?
- Faltas serão lançadas por valor, por dia, por hora ou combinação desses campos?
- Será necessário separar por loja/filial no fechamento?
- A exportação para contabilidade precisa seguir o layout atual da planilha?
- O Controle de Vales virá sempre do PDV ou também poderá receber lançamento manual?
- Quais etapas de conferência precisam ficar registradas antes do fechamento?
- Quais perfis poderão visualizar pensão alimentícia e outros descontos sensíveis?

## Próximos Ciclos Recomendados

Ordem segura sugerida:

1. Não avançar frontend ainda.
2. Não avançar service/hook sem ciclo próprio.
3. Criar service/hook do Fechamento de Folha em próximo ciclo, quando houver cota disponível.
4. Depois criar a primeira tela de Fechamento de Folha.
5. Criar Controle de Vales/compras internas em ciclo próprio.
6. Criar exportações para contabilidade somente em ciclo próprio.
7. Criar integrações futuras com Gestão de Férias e Gestão Financeira somente depois.

Antes de qualquer implementação, validar o layout esperado das planilhas atuais, as categorias de lançamento, o fluxo real de conferência com loja/colaborador/contabilidade e os limites de exposição de dados pessoais.
