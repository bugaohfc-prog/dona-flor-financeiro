# Mini RH - Plano tecnico inicial

Data: 2026-05-24

## Objetivo

O Mini RH sera um modulo do DNA Gestao para apoiar pequenos negocios na organizacao de dados basicos de funcionarios, ferias, fechamento mensal e comunicacoes internas.

O modulo deve manter a separacao conceitual ja adotada no produto:

- Produto/sistema: DNA Gestao.
- Empresa/tenant: Dona Flor Financeiro, Choco Arte ou outra empresa ativa.
- Dados de RH: sempre vinculados a empresa ativa e protegidos por permissao e RLS.

## Escopo inicial

A primeira fase funcional deve comecar apenas com cadastro de funcionarios.

Classificacao de risco:

- Este ciclo de documentacao/escopo permanece sem alteracao de codigo, SQL, RLS ou frontend.
- Qualquer ciclo futuro que envolva modelagem, banco, RLS, policies, permissoes, services, logs, exportacoes ou frontend com dados reais de funcionarios deve ser classificado como ALTISSIMO.
- Dados de funcionarios exigem protecao mais rigida que dados financeiros comuns, por envolverem dados pessoais e potencialmente sensiveis sob LGPD.

Fora do escopo inicial:

- folha de pagamento completa;
- substituicao de obrigacoes contabeis, fiscais ou trabalhistas;
- armazenamento de documentos sensiveis sem politica propria;
- envio automatico de informes;
- rotinas trabalhistas complexas;
- acesso de operador.

O Mini RH deve apoiar consultas internas simples e reduzir dependencia da contabilidade para informacoes basicas, sem assumir papel de sistema contábil ou folha oficial.

## Entidades futuras

### Funcionarios

Tabela sugerida: `df_funcionarios`

Campos propostos:

- `id`;
- `empresa_id`;
- `filial_id` opcional;
- `nome`;
- `cpf` opcional e sensivel;
- `cargo`;
- `telefone`;
- `email`;
- `data_nascimento`;
- `data_admissao`;
- `status`: `ativo`, `afastado`, `desligado`;
- `observacoes`;
- `created_at`;
- `updated_at`;
- `arquivado` ou `excluido`;
- `arquivado_em` ou `excluido_em`.

Observacoes:

- `empresa_id` deve ser obrigatorio.
- `filial_id` deve ser validado contra a mesma empresa quando informado.
- CPF deve ser opcional no inicio, pois e dado pessoal sensivel para operacao.
- Arquivamento deve ser preferido a exclusao fisica.

### Ferias

Tabela sugerida: `df_funcionarios_ferias`

Campos propostos:

- `id`;
- `empresa_id`;
- `funcionario_id`;
- `periodo_aquisitivo_inicio`;
- `periodo_aquisitivo_fim`;
- `data_limite`;
- `dias_disponiveis`;
- `dias_utilizados`;
- `status`: `pendente`, `programada`, `gozada`, `vencida`;
- `observacoes`;
- `created_at`;
- `updated_at`.

Observacoes:

- `funcionario_id` deve pertencer a mesma `empresa_id`.
- O calculo de periodo aquisitivo pode ser automatizado em fase futura, mas a primeira versao pode aceitar preenchimento manual validado.

### Fechamento mensal

Tabela sugerida: `df_funcionarios_fechamentos`

Campos propostos:

- `id`;
- `empresa_id`;
- `funcionario_id`;
- `mes`;
- `salario_base`;
- `adicionais`;
- `descontos`;
- `valor_total`;
- `status`: `aberto`, `fechado`, `revisado`;
- `observacoes`;
- `created_at`;
- `updated_at`.

Observacoes:

- O fechamento mensal deve ser entendido como controle interno simples.
- Nao deve ser apresentado como folha de pagamento completa.
- Valores financeiros de RH exigem permissao e cuidado adicional.

### Documentos e comunicacoes

Deixar para fase posterior.

Possiveis tabelas futuras:

- `df_funcionarios_documentos`;
- `df_funcionarios_comunicacoes`.

Observacoes:

- Documentos podem conter dados sensiveis.
- Antes de armazenar documentos, definir politica de acesso, retencao, exclusao e auditoria.

## Permissoes propostas

### Operador

- Sem acesso inicial ao Mini RH.
- Nao visualiza menu.
- Nao consulta, cria, edita, exporta ou exclui dados de RH.

### Gerente

- Acessa Mini RH.
- Visualiza funcionarios.
- Cria e edita dados basicos.
- Nao exclui definitivamente.
- Pode arquivar apenas se a politica futura permitir.
- Pode exportar somente se liberado em fase futura.

### Admin

- Acesso completo aos dados de RH dentro da empresa ativa.
- Cria, edita e arquiva funcionarios.
- Gerencia ferias e fechamento mensal.
- Controla exclusoes conforme politica definida.
- Pode exportar dados quando a funcionalidade existir.

### Master

- Tudo que admin pode fazer.
- Pode trocar empresa ativa.
- Continua respeitando escopo por empresa ativa.
- Nao deve acessar dados cruzados sem filtro de tenant.

## Multiempresa

Regras obrigatorias:

- Todas as tabelas devem ter `empresa_id` obrigatorio.
- `filial_id` deve ser opcional e usado apenas quando fizer sentido.
- Toda consulta deve filtrar por empresa ativa.
- Todo INSERT deve gravar `empresa_id`.
- Todo UPDATE, arquivamento ou DELETE deve filtrar por `id` e `empresa_id`.
- Master pode trocar empresa, mas dados nao podem cruzar tenants.
- Services devem seguir o padrao dos helpers existentes, como `selecionarPorEmpresa`, `inserirComEmpresa` e `atualizarPorEmpresa`.
- Validacoes de filial devem garantir que a filial pertence a mesma empresa.

## RLS futura

RLS e obrigatoria antes de liberar qualquer UI do Mini RH.

Atualizacao em 2026-05-24: a primeira tabela do Mini RH, `df_funcionarios`, ja foi criada e teve RLS validada com script real usando anon/auth. A validacao final esta documentada em `docs/security/rls/df_funcionarios_rls_validacao_20260524.md`.

Diretrizes:

- Nenhuma tabela de RH deve ser criada sem RLS completa.
- Nenhuma tela de RH deve ser liberada antes da validacao de RLS.
- Policies devem impedir leitura cruzada entre empresas.
- SELECT deve limitar registros por `empresa_id` vinculado ao usuario.
- INSERT deve validar que o usuario pode inserir naquela `empresa_id`.
- UPDATE deve validar `empresa_id` e permissao do perfil.
- DELETE fisico deve ser evitado no inicio.
- Arquivamento deve validar `empresa_id` e permissao.
- Operador nao deve ter acesso inicial.
- Gerente, admin e master devem seguir politica definida.
- Admin comum nao deve ganhar poderes globais.
- Master deve continuar sendo validado pelo mecanismo global existente.

Recomendacao: criar SQL e policies em ciclo separado, com conferencia positiva e negativa, antes de qualquer tela.

## LGPD e dados pessoais

Dados pessoais envolvidos:

- CPF;
- data de nascimento;
- telefone;
- e-mail;
- dados salariais;
- observacoes internas.

Cuidados obrigatorios:

- evitar logs com dados sensiveis;
- logs nunca devem expor CPF, telefone, e-mail, salario, dados de ferias ou informacoes trabalhistas;
- limitar acesso por perfil;
- preferir arquivamento a exclusao fisica;
- evitar exclusao fisica no inicio, usando arquivamento/status;
- nao armazenar documentos sensiveis no inicio;
- documentos sensiveis nao devem ser armazenados ate existir politica propria de acesso, retencao e exclusao;
- nao expor CPF em listas quando nao for necessario;
- avaliar mascaramento de CPF em UI futura;
- exportacoes futuras devem ter permissao explicita;
- registrar claramente que o modulo apoia gestao interna e nao substitui contabilidade.

Regra de seguranca para ciclos futuros:

- qualquer alteracao futura em SQL, RLS, services ou frontend do Mini RH deve ser tratada como risco ALTISSIMO;
- todo dado deve permanecer obrigatoriamente isolado por `empresa_id`;
- operador nao deve acessar o Mini RH inicialmente;
- validacoes de multiempresa e RLS devem ser comprovadas antes de homologacao funcional.

## Fases de implementacao

### Fase RH 0 - documentacao e escopo

- Consolidar objetivo do Mini RH.
- Definir entidades.
- Definir campos.
- Definir matriz de permissao.
- Definir riscos LGPD.
- Definir proposta de RLS.

### Fase RH 1 - banco e RLS para funcionarios

- Criar tabela `df_funcionarios`.
- Criar indices por `empresa_id`, `filial_id`, `status` e campos de busca necessarios.
- Aplicar RLS.
- Criar policies.
- Validar isolamento multiempresa.
- Criar rollback/conferencia.

Estado em 2026-05-24: fase de banco/RLS de `df_funcionarios` aplicada e validada no Supabase principal com seguranca controlada. Resultado final do script anon/auth: APROVADO. O frontend ainda nao foi iniciado.

### Fase RH 2 - frontend cadastro de funcionarios

- Criar service de funcionarios.
- Criar pagina Mini RH inicial.
- Listar funcionarios por empresa ativa.
- Criar, editar e arquivar funcionario.
- Filtrar por nome, status e filial.
- Respeitar permissoes por perfil.

### Fase RH 3 - ferias

- Criar tabela de ferias.
- Relacionar ferias a funcionario e empresa.
- Controlar periodo aquisitivo, data limite, dias e status.
- Criar alertas visuais de ferias vencendo/vencidas.

### Fase RH 4 - fechamento mensal

- Criar tabela de fechamentos.
- Registrar mes, base, adicionais, descontos e status.
- Evitar promessa de folha completa.
- Preparar exportacao simples, se necessario.

### Fase RH 5 - alertas e relatorios

- Alertas de aniversarios.
- Alertas de ferias vencendo.
- Relatorios simples por empresa ativa.
- Exportacoes com cuidado por perfil.
- Possivel integracao futura com comunicacoes internas.

## O que nao fazer agora

- Nao criar SQL sem matriz de RLS.
- Nao criar tela antes do modelo de dados.
- Nao misturar RH com contas/notas.
- Nao liberar operador.
- Nao implementar folha de pagamento completa.
- Nao armazenar documentos sensiveis sem politica propria.
- Nao criar Edge Functions antes de confirmar necessidade.
- Nao reaproveitar envio automatico financeiro para alertas de RH sem desenho especifico.

## Proximo ciclo recomendado

Proximo ciclo minimo recomendado: iniciar service/hook do Mini RH apenas para `df_funcionarios`, usando a RLS ja validada como base e sem criar exportacoes, documentos/anexos ou acesso de operador.

Escopo sugerido:

- criar service/hook com filtro obrigatorio por empresa ativa;
- usar somente anon/auth no cliente;
- respeitar matriz validada: operador sem acesso, gerente leitura, admin escrita, master conforme regra validada;
- manter arquivamento por UPDATE;
- nao criar exportacao;
- nao criar documentos, anexos, base64 ou storage;
- nao expor dados pessoais em logs;
- iniciar UI somente depois do service/hook revisado.

Codex recomendado para o proximo ciclo de service/hook/frontend inicial: ALTISSIMO.

Atualizacao de classificacao: por envolver dados pessoais e potencialmente sensiveis de funcionarios, o Codex recomendado para qualquer ciclo de banco, RLS, policies, services, logs, exportacoes ou frontend do Mini RH e ALTISSIMO.
