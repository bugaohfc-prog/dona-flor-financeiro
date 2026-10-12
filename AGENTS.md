# AGENTS.md — DNA Gestão / Dona Flor Financeiro

Estas regras são obrigatórias para qualquer trabalho neste repositório.

## 1. Princípios de execução

- Trabalhar somente no escopo solicitado.
- Fazer a menor alteração capaz de resolver a causa real.
- Não ampliar um lote sem necessidade técnica comprovada.
- Não criar abstrações, telas, serviços ou estruturas sem uso real.
- Preservar funcionalidades já aprovadas.
- Não transformar ausência de evidência em PASS.
- Classificar como NOT PROVEN tudo que não puder ser comprovado.

## 2. Fluxo Git

- Trabalhar somente na branch explicitamente informada.
- Nunca fazer push direto na main.
- Um commit por lote correlato.
- Promoções devem usar PR e merge normal.

Nunca usar:
- git clean
- reset destrutivo
- reset --hard
- amend
- rebase
- force push
- git add .
- git add -A

Sempre:
- preservar stash;
- preservar arquivos não rastreados;
- adicionar ao commit somente arquivos do lote.

## 3. /DEBUG antes de corrigir

Quando houver erro, inconsistência ou comportamento inesperado:

1. reproduzir o problema;
2. identificar a causa técnica;
3. reunir evidência suficiente;
4. localizar somente os arquivos diretamente envolvidos;
5. separar causa de sintoma.

Não alterar código com base apenas em hipótese.

Se a causa ainda não estiver comprovada, continuar em /DEBUG.

Não fazer varredura completa do repositório quando o escopo já estiver conhecido.

## 4. /REFACTOR e implementação

Depois de comprovada a causa:

- fazer mudança pequena e correlata;
- corrigir a causa, não apenas o sintoma;
- reutilizar estruturas existentes quando adequadas;
- não reconstruir módulos já funcionais;
- não misturar demandas independentes no mesmo lote.

Se a solução exigir mudança estrutural fora do escopo autorizado:
- parar;
- explicar a necessidade;
- aguardar autorização.

## 5. Checkpoint e rollback

Antes de operação de risco, registrar o estado estável relevante:

- branch;
- SHA;
- git status;
- ambiente;
- estado funcional conhecido.

Operações de risco incluem:
- migration;
- alteração estrutural de banco;
- mutation de dados relevantes;
- merge;
- deploy;
- mudança de configuração.

Sempre que aplicável, definir previamente um caminho de rollback reversível.

Se houver quebra:

1. parar novas alterações;
2. identificar o impacto;
3. verificar se houve mutação;
4. restaurar o último estado estável por método não destrutivo;
5. comprovar a restauração;
6. relatar a causa antes de continuar.

Não empilhar correções sobre um estado já quebrado.

## 6. Segurança e ambientes

- Produção só pode ser alterada com autorização explícita do usuário para aquele lote.
- Não alterar Supabase, migrations, Edge Functions, variáveis ou dados de produção sem autorização.
- Confirmar explicitamente o ambiente/project ref antes de qualquer escrita.
- Validar mudanças funcionais ou de banco primeiro em staging.
- Nunca solicitar, registrar ou exibir senhas ou segredos.
- Não usar mocks como comprovação final de funcionalidade conectada a dados reais.

## 7. Banco de dados

Antes de criar nova tabela, coluna, RPC ou migration:

- verificar se a estrutura existente já resolve o problema;
- preferir reutilização segura;
- preservar tenant, RLS, histórico e auditoria.

Não:
- afrouxar RLS sem necessidade comprovada;
- remover proteção existente para facilitar teste;
- fazer DELETE físico quando o domínio usa arquivamento lógico;
- usar SQL manual como atalho para uma funcionalidade que exige fluxo oficial.

Migration não autorizada:
- parar e pedir autorização.

## 8. Arquitetura

Mobile, tablet e desktop devem compartilhar:
- mesmo DOM;
- mesmos componentes;
- mesmo comportamento;
- mesmo conteúdo;
- mesmas permissões.

Breakpoints podem alterar distribuição visual, não regras funcionais.

Componentes compartilhados:
- não devem conhecer classes internas de páginas.

CSS:
- compartilhado deve usar classes próprias;
- CSS de domínio deve permanecer escopado à página ou feature;
- evitar estilos inline para layout estático e responsividade;
- evitar !important;
- evitar posicionamento absoluto estrutural;
- evitar seletores globais frágeis.

## 9. Organização dos lotes

- Agrupar alterações pela causa técnica.
- Antes de editar, identificar os arquivos diretamente envolvidos.
- Evitar varreduras desnecessárias.
- Não misturar correções independentes.
- Não revalidar funcionalidades já aprovadas sem motivo técnico.

## 10. Economia de validação

Regra principal:

Não repetir checkpoint já aprovado se não houve novo diff capaz de afetá-lo.

Durante o lote:
- executar testes focados;
- executar git diff --check.

No fechamento de alteração funcional relevante:
- executar suíte completa;
- executar build;
- validar somente os viewports afetados.

Se depois disso não houver novo diff:
- não repetir suíte;
- não repetir build;
- não repetir viewports;
- não repetir smoke já comprovado.

Se houver novo diff:
- revalidar somente o que ele pode impactar.

## 11. Critério de entrega funcional

Antes de declarar uma funcionalidade pronta, comprovar quando aplicável:

1. dados/serviços reais;
2. loading;
3. erro;
4. estado vazio;
5. ação funcionando ponta a ponta;
6. persistência após reload;
7. segurança/tenant;
8. ausência de regressão relevante.

Se algum item necessário não puder ser comprovado:
- marcar como NOT PROVEN;
- não inventar evidência.

## 12. Staging

Mudanças funcionais devem ser validadas em staging antes da promoção.

Usar fixture somente quando necessária.

Fixtures:
- devem ser seguras;
- devem ser identificáveis;
- devem ser encerradas por arquivamento lógico quando aplicável;
- não devem deixar dados ativos desnecessários.

Não criar fixture apenas para comprovar algo que pode ser validado sem mutação.

## 13. Promoção

Quando staging já estiver aprovado e não houver novo diff, usar somente três gates:

### Gate 1 — Git
- git fetch;
- verificar drift da main;
- avaliar somente drift relevante.

Se não houver impacto:
- não repetir staging.

### Gate 2 — PR
- abrir PR;
- aguardar checks;
- merge normal.

Não usar:
- squash;
- rebase;
- push direto na main.

### Gate 3 — Produção
- confirmar deployment do SHA correto;
- confirmar READY;
- confirmar HTTP 200;
- confirmar backend correto;
- executar smoke mínimo.

Preferir smoke de produção read-only.

Não criar dados de teste em produção sem necessidade e autorização explícita.

## 14. Regressões durante promoção

Se surgir erro sem novo diff da feature:

- diagnosticar primeiro;
- não repetir todo o ciclo automaticamente.

Se main tiver avançado:
- avaliar somente o diff novo e seu impacto.

Se houver conflito:
- resolver pela intenção funcional;
- não escolher ours/theirs para arquivo inteiro sem análise.

## 15. Relatório final

Relatórios devem ser curtos.

Informar somente:

- SHA inicial e final;
- arquivos alterados;
- causa comprovada;
- alteração realizada;
- testes executados;
- build quando aplicável;
- ambiente validado;
- mutações realizadas;
- PASS / FAIL / NOT PROVEN;
- pendências reais;
- preservações relevantes.

Não repetir toda a história do projeto.

## 16. Regra final

Priorizar, nesta ordem:

1. segurança;
2. causa comprovada;
3. alteração mínima;
4. validação proporcional ao diff;
5. economia de tempo e créditos.

Diagnosticar uma vez.
Corrigir uma vez.
Validar somente o necessário.
Não reabrir trabalho já aprovado sem nova evidência, regressão ou diff relevante.
