# Gestão de Pessoas - Funcionários: estado atual

Data: 2026-05-25

## Visão geral

Gestão de Pessoas é o módulo do DNA Gestão voltado ao cadastro e ao controle operacional básico de colaboradores por empresa ativa.

Nesta fase inicial, o módulo contempla a tela de Funcionários e relatórios internos visuais de pessoas. O objetivo é organizar dados estruturados de colaboradores com isolamento multiempresa, RLS validada e cuidado LGPD. A nomenclatura de produto/interface é Gestão de Pessoas; a expressão Mini RH fica apenas como referência histórica em documentação técnica anterior.

Empresas/tenants atuais:

- Dona Flor Financeiro;
- Choco Arte.

## Estado atual da tela Funcionários

Implementado e validado:

- menu Gestão de Pessoas > Funcionários;
- Topbar exibindo `Empresa ativa • Gestão de Pessoas`;
- listagem sempre baseada na empresa ativa;
- cadastro de funcionário;
- edição de funcionário;
- arquivamento lógico;
- reativação;
- checkbox/filtro de arquivados;
- limpeza visual ao trocar empresa ativa;
- nome e cargo normalizados/capitalizados;
- CPF fora da listagem principal;
- data do exame admissional como data opcional;
- seção de exames periódicos realizados no formulário de funcionário;
- cadastro, edição, arquivamento e reativação de datas de exames periódicos;
- relatórios internos visuais sem exportação;
- ausência de PDF, Excel, CSV, documentos, anexos e uploads.

Arquivos funcionais relacionados:

- `src/services/funcionariosService.js`;
- `src/hooks/useFuncionarios.js`;
- `src/services/funcionariosExamesPeriodicosService.js`;
- `src/hooks/useFuncionariosExamesPeriodicos.js`;
- `src/pages/FuncionariosPage.jsx`.
- `src/pages/RelatoriosPessoasPage.jsx`.

## Campos atuais controlados

Tabela principal:

- `public.df_funcionarios`.

Campos principais:

- `id`;
- `empresa_id`;
- `filial_id`;
- `nome`;
- `cpf`;
- `cargo`;
- `telefone`;
- `email`;
- `data_nascimento`;
- `data_admissao`;
- `data_exame_admissional`;
- `status`;
- `observacoes`;
- `arquivado`;
- `arquivado_em`;
- `created_at`;
- `updated_at`.

Observações:

- `empresa_id` é obrigatório.
- `filial_id` é opcional e deve pertencer à mesma empresa.
- `cpf` é opcional e não aparece na listagem.
- `data_exame_admissional` é `date`, opcional, sem default.
- `arquivado` e `arquivado_em` sustentam arquivamento lógico.

Tabela de exames periódicos:

- `public.df_funcionarios_exames_periodicos`.

Campos principais:

- `id`;
- `empresa_id`;
- `funcionario_id`;
- `data_exame`;
- `arquivado`;
- `arquivado_em`;
- `criado_em`;
- `atualizado_em`.

Observações:

- `data_exame` guarda somente a data do exame periódico realizado.
- `funcionario_id` deve pertencer à mesma `empresa_id`.
- não existe campo de laudo, resultado, documento, anexo, upload, link público, observação médica ou dado clínico.
- não existe `data_proximo_periodico` persistida.

## Permissões atuais

Regra conservadora validada:

- Admin: acessa e opera Funcionários na empresa ativa.
- Master: acessa e opera Funcionários conforme regra validada.
- Operador: não acessa Gestão de Pessoas neste momento.
- Gerente: não acessa Gestão de Pessoas neste momento.

Não ampliar acesso sem ciclo próprio de segurança, validação por perfil e revisão de LGPD.

## Segurança e LGPD

Regras atuais:

- empresa ativa é obrigatória;
- RLS é a barreira real de segurança;
- frontend não contorna RLS;
- não usar service role no frontend;
- não usar secrets no frontend;
- não logar dados pessoais;
- não logar payload completo de funcionário;
- CPF não deve aparecer na listagem principal;
- DELETE físico não é usado;
- arquivamento é feito por UPDATE;
- dados não podem cruzar tenants;
- troca de empresa deve limpar/recarregar a lista para evitar vazamento visual.

Dados pessoais envolvidos:

- CPF;
- telefone;
- e-mail;
- data de nascimento;
- data de admissão;
- data do exame admissional;
- observações.

## Uso seguro do campo Observações

O campo `observacoes` existe apenas para registros administrativos simples. Ele não deve ser usado para guardar dados sensíveis, documentos, laudos, resultados de exames ou informações clínicas.

Texto orientativo exibido na tela Funcionários:

> Use apenas observações administrativas. Não registre laudos, diagnósticos, resultados de exames, documentos ou informações clínicas.

Permitido em observações:

- informação administrativa simples;
- referência operacional não sensível;
- observação de cadastro;
- dado interno de rotina que não envolva saúde, documento ou informação sensível.

Exemplos permitidos:

- "Preferência de contato pelo WhatsApp."
- "Cadastro revisado em maio/2026."
- "Atua principalmente na loja X."

Proibido em observações:

- doenças;
- diagnósticos;
- CID;
- motivo médico de afastamento;
- resultado de exame;
- laudo;
- dados de saúde;
- documento pessoal;
- foto ou documento digitalizado;
- link de arquivo;
- informação trabalhista sensível detalhada;
- informações discriminatórias;
- qualquer informação clínica.

Regra específica para exames ocupacionais:

- exame admissional é controlado somente por data;
- não registrar laudo, resultado, diagnóstico, condição médica ou observação médica em `observacoes`;
- não anexar documentos;
- não criar links para documentos externos.

## RLS e isolamento multiempresa

Estado validado:

- RLS habilitada e forçada em `public.df_funcionarios`;
- policies SELECT/INSERT/UPDATE criadas;
- nenhuma policy DELETE/ALL;
- DELETE físico bloqueado por trigger;
- `empresa_id` imutável após INSERT;
- filial cross-tenant bloqueada;
- arquivamento por UPDATE funcionando;
- validação real com anon/auth aprovada.

Resultado final da validação RLS real:

- Operador: OK;
- Gerente: OK;
- Admin: OK;
- Master: OK;
- DELETE físico bloqueado;
- `empresa_id` imutável;
- filial cross-tenant bloqueada;
- arquivamento funcionando;
- status final: APROVADO.

Observação técnica:

- `rpc is_master` ainda retorna `false` no contexto do script;
- isso não bloqueia `df_funcionarios`, pois a escrita final passa por `public.df_funcionarios_pode_escrever(uuid)`;
- a evidência principal de RLS por perfil é o script real com anon/auth, não o SQL Editor.

## Arquivamento lógico

Funcionários não devem ser excluídos fisicamente nesta fase.

Fluxo validado:

- funcionário ativo aparece na lista principal;
- ao arquivar, sai da lista principal;
- ao marcar o filtro de arquivados, o funcionário arquivado aparece;
- ao reativar, volta para a lista principal;
- DELETE físico permanece bloqueado.

## Relatórios internos de Pessoas

A tela `Relatórios de Pessoas` foi adicionada como consulta visual interna, sem exportação de dados.

Implementado:

- menu `Gestão de Pessoas > Relatórios`;
- Topbar mantendo `Empresa ativa • Gestão de Pessoas`;
- uso obrigatório da empresa ativa;
- uso do hook `useFuncionarios` com RLS validada;
- resumo de funcionários por status;
- contagem de arquivados;
- aniversariantes do mês;
- admissões do mês;
- exames admissionais cadastrados;
- próximo periódico previsto apenas como cálculo visual.

Regras de exposição dos relatórios:

- CPF não aparece;
- observações não aparecem;
- dados médicos, laudos, resultados, documentos e anexos não aparecem;
- não há PDF;
- não há Excel;
- não há CSV;
- não há botão de exportação;
- não há impressão;
- não há automação ou alerta.

O próximo periódico previsto é calculado visualmente a partir de `data_exame_admissional + 1 ano`. Esse valor não é persistido no banco.

## Exame admissional

Regra oficial: o DNA Gestão controla exames ocupacionais somente por datas.

Implementado:

- `data_exame_admissional`;
- tipo `date`;
- opcional;
- sem default;
- exibido e editado na tela Funcionários;
- salva somente a data.

Permitido futuramente, em ciclo próprio:

- data do último exame periódico;
- previsão do próximo periódico;
- cálculo visual de próximo periódico, preferencialmente não persistido inicialmente.

Proibido:

- laudo;
- resultado;
- documento;
- anexo;
- upload;
- base64;
- link público;
- observação médica;
- condição de saúde;
- informação clínica.

## Fora do escopo atual

Não existe nesta fase:

- documentos de colaboradores;
- holerites;
- informes de rendimento;
- contratos;
- laudos;
- resultados;
- anexos;
- uploads;
- links públicos;
- exportação de Funcionários;
- relatório externo de pessoas;
- relatório externo de exames;
- PDF;
- Excel;
- CSV;
- fechamento de folha;
- controle de vales;
- férias;
- automações de RH.

Documentos sensíveis devem permanecer fora do Supabase, no OneDrive oficial da empresa, até existir política própria de acesso, retenção e exclusão.

## Fechamento de folha - contexto futuro

O usuário utiliza atualmente dois Excel como referência operacional:

- Controle Vales;
- Fechamento Folha.

Fluxo futuro previsto:

1. Controle de vales/compras por loja.
2. Validação dos valores com colaboradores via WhatsApp da loja.
3. Fechamento mensal da folha.
4. Exportação Excel para contabilidade.
5. PDF/relatório para donos.

Natureza dos valores futuros:

- a favor do colaborador: premiação, horas extras 50% ou 60%, horas extras 100%;
- descontos/negativos: compras/vales, plano de saúde, faltas, pensão alimentícia.

Importante:

- nada disso foi implementado nesta fase;
- fechamento de folha exige ciclos próprios para banco, RLS, rollback, service/hook, tela, validação e exportação;
- não deve ser apresentado como folha de pagamento completa sem desenho específico.

## Relatórios futuros

Possíveis próximos relatórios, todos dependentes de ciclos próprios:

- aniversariantes;
- admissões;
- férias;
- exames a vencer;
- fechamento mensal;
- PDF para donos;
- Excel para contabilidade.

Os relatórios internos visuais atuais não substituem relatórios formais, PDF para donos ou Excel para contabilidade.

## Validações realizadas

Validações funcionais:

- cadastro/edição funcionando;
- arquivar/reativar funcionando;
- filtro de arquivados funcionando;
- capitalização de nome/cargo validada;
- CPF fora da listagem;
- data do exame admissional validada;
- relatórios internos visuais criados sem CPF e sem observações;
- ausência de exportação/PDF/Excel/CSV nos relatórios de pessoas;
- troca de empresa sem manter lista anterior visível.

Validações de segurança:

- RLS real com anon/auth aprovada;
- operador e gerente sem acesso ao módulo;
- admin e master com acesso;
- DELETE físico bloqueado;
- `empresa_id` imutável;
- filial cross-tenant bloqueada;
- ausência de policy DELETE/ALL;
- sem documentos, anexos, uploads ou exportações.

## Riscos residuais

- Dados de colaboradores seguem sendo dados pessoais sob LGPD.
- Qualquer exportação futura precisa de permissão explícita e revisão de escopo.
- Observações continuam sendo campo livre e dependem de orientação operacional contínua para evitar conteúdo sensível.
- Fechamento de folha envolve dados financeiros/trabalhistas e deve ser tratado como ALTÍSSIMO risco.
- Exames ocupacionais devem permanecer restritos a datas; qualquer dado clínico é proibido.

## Próximos ciclos recomendados

Ordem segura sugerida:

1. Validar periodicamente o uso correto do campo `observacoes`.
2. Planejar férias em ciclo próprio de banco/RLS antes de qualquer tela.
3. Evoluir relatórios de pessoas apenas em ciclos próprios, sem exportação automática.
4. Planejar controle de vales e fechamento mensal com modelagem dedicada.
5. Avaliar exportações apenas depois de permissão explícita, auditoria de dados e validação LGPD.

Codex recomendado para ciclos que envolvam dados reais, banco, RLS, services, frontend, logs ou exportações de Gestão de Pessoas: ALTÍSSIMO.

## O que não implementar sem ciclo próprio

- nova tabela;
- nova migration;
- nova policy;
- novo trigger;
- exportação CSV/XLSX/PDF;
- importação;
- relatório;
- alerta automático;
- upload;
- anexo;
- documento;
- laudo;
- resultado;
- link público;
- base64;
- informações clínicas;
- ampliação de acesso para operador ou gerente;
- fechamento de folha;
- controle de vales;
- férias.
