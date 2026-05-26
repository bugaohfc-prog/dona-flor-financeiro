# Gestão de Pessoas — Gestão de Férias — Estado Atual

## Objetivo

Este documento consolida o estado atual da Gestão de Férias no DNA Gestão.

A Gestão de Férias faz parte do módulo Gestão de Pessoas e controla dados trabalhistas estruturados de colaboradores. O escopo atual é operacional e interno, sem documentos, anexos, exportações, integração financeira ou automações.

Este documento é apenas documentação. Não cria banco, RLS, tela, rota, service, hook, menu, exportação ou integração.

## Estado Atual Consolidado

A Gestão de Férias já possui estrutura inicial completa para controle operacional por colaborador:

- banco criado e validado estruturalmente;
- service e hook criados;
- tela visual em Gestão de Pessoas;
- relatórios internos de férias;
- seleção de funcionário;
- ciclos de férias;
- períodos ou parcelas de férias;
- cálculo de datas;
- saldo por ciclo;
- arquivamento lógico;
- edição controlada;
- blocos expansíveis e recolhíveis;
- modularização visual das ações financeiras.

## Banco e Segurança

As tabelas criadas para férias são:

- `public.df_funcionarios_ferias_ciclos`;
- `public.df_funcionarios_ferias_periodos`.

Estado estrutural validado:

- RLS habilitada e forçada nas tabelas;
- sem policy `DELETE`;
- sem policy `ALL`;
- triggers principais presentes;
- arquivamento lógico como padrão;
- `empresa_id` imutável após `INSERT`;
- validações de vínculo entre empresa, funcionário e ciclo;
- proteção contra vínculo cruzado entre tenants;
- sem campos de documentos, anexos, arquivos ou informações médicas.

A Gestão de Férias segue a regra de não realizar DELETE físico pela interface. Remoção operacional deve usar arquivamento lógico.

## Service e Hook

Arquivos disponíveis:

- `src/services/funcionariosFeriasService.js`;
- `src/hooks/useFuncionariosFerias.js`.

A camada service/hook foi criada para operar ciclos e períodos de férias usando empresa ativa, respeitando RLS e sem usar service role.

Responsabilidades principais:

- listar ciclos;
- criar ciclos;
- atualizar ciclos;
- arquivar e reativar ciclos;
- listar períodos/parcelas;
- criar períodos/parcelas;
- atualizar períodos/parcelas;
- arquivar e reativar períodos/parcelas;
- calcular data fim das férias;
- calcular retorno ao trabalho;
- calcular saldo do ciclo;
- calcular status operacional do ciclo.

## Tela Férias

A tela Férias está disponível no menu:

- Gestão de Pessoas > Férias.

Regras de acesso atuais:

- Admin/Master acessam e operam;
- Operador/Gerente não acessam Gestão de Pessoas;
- a tela usa empresa ativa;
- a tela não exibe CPF;
- a tela não exibe observações sensíveis;
- a tela não cria exportação.

Funcionalidades atuais:

- seleção de funcionário;
- listagem de ciclos de férias;
- criação de ciclos de férias;
- listagem de períodos/parcelas;
- criação de períodos/parcelas;
- arquivamento e reativação de ciclos;
- arquivamento e reativação de períodos/parcelas;
- edição segura de ciclo;
- edição de parcela;
- blocos expansíveis e recolhíveis;
- KPIs/widgets reorganizados no resumo do ciclo selecionado.

## Relatórios de Férias

A Gestão de Férias possui uma tela inicial de relatórios internos:

- Gestão de Pessoas > Relatórios de Férias.
- rota/view `relatorios-ferias`.

Estado de validação:

- ciclo validado manualmente como APROVADO.
- Topbar esperado: Empresa ativa • Gestão de Pessoas.
- menu validado em Gestão de Pessoas.

Regras de acesso:

- Admin/Master acessam;
- Operador/Gerente não acessam;
- `peopleOnly` preservado no menu;
- permissões de Gestão de Pessoas preservadas.

Os relatórios são apenas visuais e internos, sem exportação, PDF, Excel, CSV, impressão, documentos, anexos ou integração financeira.

Relatórios atuais:

- cards de resumo;
- férias vencidas;
- férias a vencer;
- férias agendadas;
- férias concluídas;
- saldos por colaborador/ciclo.

Critérios usados:

- férias vencidas: ciclo ativo, com saldo restante maior que zero e `data_limite_gozo` anterior à data atual;
- férias a vencer: ciclo ativo, com saldo restante maior que zero e `data_limite_gozo` futura;
- atenção a partir de: `data_limite_gozo - 30 dias`;
- férias agendadas: período/parcela ativo com status `agendada` e retorno ao trabalho ainda não ultrapassado;
- férias concluídas: período/parcela com status `concluida` ou status visual "Concluída (calculado)";
- saldos: dias de direito, dias lançados, saldo restante e status calculado por ciclo.

O status "Concluída (calculado)" é apenas visual. A tela de relatórios não atualiza status no banco automaticamente, não cria job e não executa automação.

Os relatórios não exibem:

- CPF;
- observações sensíveis;
- dados médicos;
- documentos;
- anexos;
- uploads;
- valores financeiros;
- dados de pagamento;
- conta a pagar;
- vínculo financeiro.

Validação manual aprovada:

- cards de resumo aparecem corretamente;
- férias vencidas aparecem vazias quando não há dados;
- férias a vencer aparecem vazias quando não há dados;
- férias agendadas aparecem vazias quando não há dados;
- férias concluídas listam parcelas corretamente;
- saldos por colaborador mostram direito, lançado, saldo e status;
- CPF não aparece;
- observações não aparecem;
- não existe PDF, Excel, CSV ou exportação;
- não existe integração financeira;
- não existe conta a pagar;
- não há atualização automática de status no banco.

## Regras Funcionais Atuais

### Ciclo de férias

O período aquisitivo é sugerido automaticamente.

Para o primeiro ciclo:

- `periodo_aquisitivo_inicio = data_admissao`;
- `periodo_aquisitivo_fim = data_admissao + 1 ano - 1 dia`;
- `data_limite_gozo = periodo_aquisitivo_fim + 1 ano`.

Para ciclos seguintes:

- o sistema usa o histórico de ciclos do funcionário;
- localiza o ciclo mais recente;
- sugere o próximo início como o dia seguinte ao último `periodo_aquisitivo_fim`;
- calcula automaticamente o novo fim e a nova data limite de gozo.

Se o funcionário não tiver data de admissão, a tela orienta corrigir o cadastro antes de criar o ciclo.

### Data limite e alerta interno

A tela separa:

- limite de gozo;
- atenção a partir de.

Regra:

- `Atenção a partir de = data_limite_gozo - 30 dias`.

A data de atenção é apenas operacional e visual. Ela não substitui a data limite de gozo, não é persistida como novo campo, não gera automação e não envia e-mail.

### Parcelas de férias

O usuário informa:

- data de início;
- quantidade de dias.

O sistema calcula:

- data fim das férias;
- retorno ao trabalho.

Regra:

- `data_fim = data_inicio + quantidade_dias - 1 dia`;
- `data_retorno_trabalho = data_fim + 1 dia`.

Não existe select manual "integral/parcelada". O parcelamento é entendido pelo saldo e pela soma dos dias lançados.

### Saldo e status

O saldo do ciclo é calculado a partir de:

- dias de direito;
- soma dos períodos/parcelas ativos que consomem saldo.

Quando o saldo chega a zero, a tela bloqueia visualmente a criação de nova parcela.

O status "Concluída (calculado)" pode aparecer quando uma parcela está agendada e a data de retorno ao trabalho já passou. Esse status é apenas visual e não atualiza o banco automaticamente.

## Edição Controlada

### Edição segura de ciclo

A tela permite ajustar somente campos seguros:

- dias de direito;
- status.

O fluxo normal não permite edição manual de:

- período aquisitivo início;
- período aquisitivo fim;
- data limite de gozo;
- atenção a partir de.

Se `dias_direito` ficar menor que os dias já lançados, a tela deve bloquear ou orientar a correção.

### Edição de parcela

A tela permite corrigir:

- data de início;
- quantidade de dias;
- status.

Ao editar uma parcela, o sistema recalcula:

- data fim;
- retorno ao trabalho;
- saldo do ciclo.

O saldo disponível para edição considera os dias da própria parcela editada.

## Modularização Visual

As ações financeiras globais foram modularizadas.

Na Gestão de Pessoas, inclusive em Férias:

- o Assistente financeiro não aparece;
- o botão flutuante financeiro não aparece;
- ações como Nova conta e Nova nota não aparecem.

Essas ações rápidas aparecem somente no contexto da Gestão Financeira.

## Observações Não Bloqueantes

Pontos observados para melhoria futura, sem bloquear o estado atual:

- "Criar novo ciclo" poderia iniciar recolhido quando já existe ciclo;
- "Nova parcela" poderia ficar recolhida ou ainda mais compacta quando saldo = 0;
- quando houver muitos funcionários/ciclos, considerar filtros ou recolher seções vazias para reduzir rolagem;
- exportação/PDF ainda não existe;
- integração Férias → Financeiro ainda não foi implementada;
- faltas injustificadas ainda não cruzam com Fechamento de Folha;
- afastamentos INSS ainda não possuem tela/tabela própria.

## Fora do Escopo Atual

Não existe neste estado atual:

- exportação de férias;
- PDF;
- Excel;
- CSV;
- integração real com financeiro;
- geração de conta a pagar;
- valor previsto de férias;
- data de pagamento de férias;
- documento;
- anexo;
- upload;
- base64;
- link público;
- automação;
- alerta por e-mail;
- fechamento de folha;
- controle de vales;
- tabela de faltas;
- tabela de afastamentos.

## Roadmap Futuro Recomendado

### 1. Evolução dos Relatórios de Férias internos

Os Relatórios de Férias internos já existem. Melhorias futuras possíveis:

- filtros avançados se a base crescer;
- recolhimento automático de seções vazias;
- agrupamentos por loja/filial, se houver regra segura;
- ordenações adicionais por vencimento, saldo ou retorno;
- indicadores internos adicionais sem exportação.

### 2. Integração futura com Fechamento de Folha

Faltas injustificadas poderão futuramente cruzar com Fechamento de Folha.

Regras previstas:

- faltas podem reduzir dias de direito conforme regra trabalhista aplicável;
- cálculo deve ser auditável;
- cálculo deve ser validado com contabilidade;
- o sistema não deve aplicar redução automaticamente sem confirmação administrativa.

### 3. Afastamentos que podem impactar férias

Planejamento futuro:

- registrar afastamentos INSS em ciclo próprio;
- sinalizar quando a soma de afastamentos ultrapassar 6 meses no período aquisitivo;
- não reiniciar ciclo automaticamente sem confirmação administrativa ou contábil;
- evitar campos livres que possam guardar dados médicos;
- não guardar CID, diagnóstico, laudo, resultado, documento ou informação clínica.

### 4. Integração Férias → Financeiro

Integração futura planejada, mas ainda não implementada:

- informar valor previsto;
- informar data de pagamento;
- gerar conta a pagar somente com confirmação explícita;
- prevenir duplicidade;
- vincular origem ao período/parcela de férias;
- respeitar RLS e permissões da Gestão de Pessoas e da Gestão Financeira.

A conta financeira não deve ser criada automaticamente sem confirmação do usuário.

### 5. Exportações/PDF

Exportações e PDFs devem ficar para ciclo próprio futuro, com:

- controle de permissão;
- escopo de dados mínimo;
- validação LGPD;
- checagem de tenant;
- ausência de dados sensíveis desnecessários.

## Diretrizes de Segurança

Qualquer evolução futura da Gestão de Férias deve preservar:

- empresa ativa obrigatória;
- RLS como barreira real;
- isolamento multiempresa;
- Admin/Master como regra conservadora de operação;
- Operador/Gerente sem acesso, salvo decisão futura explícita;
- ausência de DELETE físico;
- arquivamento lógico;
- ausência de documentos/anexos/uploads;
- ausência de dados médicos;
- ausência de exportações sem ciclo próprio;
- ausência de integração financeira sem ciclo próprio.

Qualquer ciclo com banco, RLS, service, hook, frontend, exportação ou integração financeira deve ser tratado como ALTÍSSIMO risco.
