# df_funcionarios - Validacao RLS Mini RH

Data: 2026-05-24

## Contexto

O Mini RH e um modulo do DNA Gestao iniciado pelo cadastro de funcionarios/colaboradores. A tabela `public.df_funcionarios` envolve dados pessoais e operacionais, portanto qualquer ciclo com banco, RLS, policies, services, logs, exportacoes ou frontend real deve ser tratado como ALTISSIMO risco.

A aplicacao foi feita no Supabase principal, pois nao ha branch ou ambiente de homologacao separado disponivel no plano atual. A aplicacao ocorreu com seguranca controlada e rollback preparado.

Rollback principal:

- `docs/security/rollback/rollback_df_funcionarios_20260524.sql`

Rollback especifico das correcoes de policy master:

- `docs/security/rollback/rollback_fix_df_funcionarios_master_policy_20260524.sql`

## Escopo da tabela

`df_funcionarios` guarda apenas dados cadastrais e operacionais basicos de colaboradores.

Incluido no escopo:

- nome;
- CPF opcional;
- cargo;
- telefone;
- email;
- data de nascimento;
- data de admissao;
- status funcional;
- observacoes;
- empresa;
- filial opcional;
- arquivamento.

Fora do escopo:

- documentos;
- holerites;
- informes de rendimento;
- contratos;
- anexos;
- base64;
- storage;
- URLs publicas de documentos;
- folha de pagamento completa.

Documentos, holerites, informes, contratos e anexos sensiveis permanecem fora do Supabase e devem continuar no OneDrive oficial da empresa ate existir politica propria de acesso, retencao e exclusao.

## Objetos criados

Tabela:

- `public.df_funcionarios`

Triggers validados:

- `trg_df_funcionarios_bloquear_alteracao_empresa`;
- `trg_df_funcionarios_bloquear_delete`;
- `trg_df_funcionarios_set_timestamps`;
- `trg_df_funcionarios_validar_filial_empresa`.

Funcao especifica de escrita:

- `public.df_funcionarios_pode_escrever(uuid)`

Policies:

- SELECT para matriz inicial de RH;
- INSERT para perfis autorizados;
- UPDATE para perfis autorizados;
- nenhuma policy DELETE;
- nenhuma policy ALL.

Script de validacao real:

- `scripts/validar-rls-df-funcionarios.mjs`

## Protecoes validadas

- RLS habilitada.
- FORCE ROW LEVEL SECURITY habilitado.
- `empresa_id` obrigatorio.
- `filial_id` opcional.
- `filial_id` rejeitado quando pertence a outra empresa.
- CPF opcional validado como 11 digitos quando informado.
- `status` limitado a `ativo`, `afastado` e `desligado`.
- DELETE fisico bloqueado por trigger.
- Nao ha policy DELETE/ALL.
- `empresa_id` imutavel apos INSERT.
- Arquivamento previsto por `arquivado` e `arquivado_em`.
- Arquivamento por UPDATE funcionando.
- Operador sem acesso.
- Gerente com leitura conforme matriz, sem escrita.
- Admin com escrita conforme empresa.
- Master com escrita conforme regra final validada.

## Historico resumido

1. A migration inicial criou `df_funcionarios`, indices, constraints, RLS, triggers e policies iniciais.
2. O rollback principal foi criado antes da validacao operacional.
3. A validacao estrutural confirmou DELETE bloqueado, `empresa_id` imutavel, filial cross-tenant rejeitada e arquivamento por UPDATE.
4. O script real de validacao RLS foi criado usando anon/auth, sem service role.
5. A primeira validacao real mostrou falha no perfil master durante INSERT.
6. O diagnostico seguro mostrou que `rpc is_master` retornava `false` no contexto anon/auth.
7. Foi adotada a funcao especifica `public.df_funcionarios_pode_escrever(uuid)` para a escrita de `df_funcionarios`.
8. O diagnostico confirmou `rpc df_funcionarios_pode_escrever: true` para o master.
9. Alem da funcao de escrita, foi necessario incluir `master`, `owner`, `superadmin` e `super_admin` na policy SELECT `df_funcionarios_select_rh_inicial`.
10. Motivo: INSERT com retorno precisa conseguir SELECT do registro criado.
11. A validacao final real retornou APROVADO.

## Resultado final do script

Script:

- `scripts/validar-rls-df-funcionarios.mjs`

Caracteristicas:

- usa anon/auth;
- nao usa service role;
- nao imprime tokens;
- nao imprime dados pessoais;
- valida perfis reais de teste;
- valida empresa propria e outra empresa;
- valida bloqueios negativos.

Resultado final:

- Operador: OK.
- Gerente: OK.
- Admin: OK.
- Master: OK.
- Status final: APROVADO.

Matriz validada:

- Operador: sem acesso.
- Gerente: leitura permitida conforme matriz, sem escrita.
- Admin: cria, edita e arquiva conforme empresa.
- Master: opera conforme regra final validada.
- DELETE fisico bloqueado.
- `empresa_id` imutavel.
- Filial cross-tenant bloqueada.
- Arquivamento por UPDATE funcionando.

## Observacoes importantes

- `rpc is_master` ainda retorna `false` no contexto do script.
- Esse resultado nao bloqueia mais `df_funcionarios`, pois a escrita final passa por `public.df_funcionarios_pode_escrever(uuid)`.
- A evidencia principal de RLS por perfil e o script real com anon/auth.
- SQL Editor pode usar role privilegiada ou contexto que bypassa RLS; portanto, nao deve ser usado como prova final por perfil.
- Service role nao deve ser usada para validar RLS.
- O frontend do Mini RH ainda nao foi iniciado.
- Services/hooks do Mini RH ainda nao foram criados.
- Exportacoes de RH ainda nao foram criadas.
- Documentos e anexos continuam fora do Supabase.

## Cuidados LGPD

- CPF, telefone, email, data de nascimento, data de admissao e observacoes sao dados pessoais.
- Logs nao devem expor CPF, telefone, email, salario, ferias, dados trabalhistas ou observacoes sensiveis.
- Exportacoes futuras exigem permissao explicita.
- Exclusao fisica deve continuar bloqueada no inicio.
- Arquivamento deve ser o caminho operacional padrao.
- Documentos sensiveis nao devem ser armazenados no Supabase sem politica propria de acesso, retencao e exclusao.
- Qualquer ciclo futuro que leia ou escreva dados reais de colaboradores deve permanecer classificado como ALTISSIMO.

## Proximo passo recomendado

Proximo ciclo minimo:

- iniciar service/hook do Mini RH para `df_funcionarios`;
- manter filtros obrigatorios por empresa ativa;
- nao criar exportacoes;
- nao criar documentos/anexos;
- nao liberar operador;
- nao usar service role no frontend;
- manter Codex recomendado ALTISSIMO.

Depois do service/hook, iniciar frontend apenas pelo cadastro basico de funcionarios, respeitando a matriz validada:

- operador sem acesso;
- gerente leitura;
- admin escrita;
- master conforme regra validada.
